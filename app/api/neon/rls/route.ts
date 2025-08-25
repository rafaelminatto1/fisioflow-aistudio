import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPrismaWithRLS, verifyRLSSetup, getAuditLogs } from '@/lib/rls-middleware';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/neon/rls
 * Get RLS configuration status and audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can access RLS configuration
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const rlsStatus = await verifyRLSSetup();
        return NextResponse.json({
          success: true,
          data: rlsStatus,
        });

      case 'audit':
        const userId = searchParams.get('userId') || undefined;
        const tableName = searchParams.get('tableName') || undefined;
        const operation = searchParams.get('operation') || undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const auditLogs = await getAuditLogs({
          userId,
          tableName,
          operation,
          limit,
          offset,
        });

        return NextResponse.json({
          success: true,
          data: auditLogs,
          pagination: {
            limit,
            offset,
            hasMore: auditLogs.length === limit,
          },
        });

      case 'policies':
        const prisma = createPrismaWithRLS();
        try {
          const policies = await prisma.$queryRaw`
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname
          `;

          return NextResponse.json({
            success: true,
            data: policies,
          });
        } finally {
          await prisma.$disconnect();
        }

      case 'stats':
        const statsQuery = `
          SELECT 
            user_role,
            table_name,
            operation,
            COUNT(*) as operation_count,
            MAX(timestamp) as last_access
          FROM "AuditLog"
          WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY user_role, table_name, operation
          ORDER BY operation_count DESC
          LIMIT 50
        `;

        const prismaStats = createPrismaWithRLS();
        try {
          const stats = await prismaStats.$queryRawUnsafe(statsQuery);
          return NextResponse.json({
            success: true,
            data: stats,
          });
        } finally {
          await prismaStats.$disconnect();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, audit, policies, or stats' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RLS API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neon/rls
 * Apply RLS configuration to the database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can modify RLS configuration
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, force = false } = body;

    switch (action) {
      case 'setup':
        // Check if RLS is already configured
        if (!force) {
          const currentStatus = await verifyRLSSetup();
          if (currentStatus.isConfigured) {
            return NextResponse.json({
              success: false,
              error: 'RLS is already configured. Use force=true to reconfigure.',
              data: currentStatus,
            });
          }
        }

        // Read and execute RLS setup script
        const scriptPath = path.join(process.cwd(), 'scripts', 'setup-rls.sql');
        
        if (!fs.existsSync(scriptPath)) {
          return NextResponse.json(
            { error: 'RLS setup script not found' },
            { status: 404 }
          );
        }

        const sqlScript = fs.readFileSync(scriptPath, 'utf-8');
        
        // Split script into individual statements
        const statements = sqlScript
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('PRINT'));

        const prisma = createPrismaWithRLS();
        const results = [];
        const errors = [];

        try {
          // Execute each statement
          for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
              await prisma.$executeRawUnsafe(statement);
              results.push({ statement: i + 1, status: 'success' });
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              errors.push({ 
                statement: i + 1, 
                error: errorMsg,
                sql: statement.substring(0, 100) + '...' 
              });
              
              // Continue with other statements unless it's a critical error
              if (!force && errorMsg.includes('already exists')) {
                continue;
              }
            }
          }

          // Verify setup after execution
          const finalStatus = await verifyRLSSetup();

          return NextResponse.json({
            success: errors.length === 0 || finalStatus.isConfigured,
            message: `RLS setup completed. ${results.length} statements executed successfully.`,
            data: {
              executed: results.length,
              errors: errors.length,
              finalStatus,
            },
            errors: errors.length > 0 ? errors : undefined,
          });
        } finally {
          await prisma.$disconnect();
        }

      case 'reset':
        // Reset RLS configuration (remove all policies)
        const resetPrisma = createPrismaWithRLS();
        try {
          // Get all policies
          const policies = await resetPrisma.$queryRaw`
            SELECT policyname, tablename 
            FROM pg_policies 
            WHERE schemaname = 'public'
          ` as { policyname: string; tablename: string }[];

          // Drop all policies
          for (const policy of policies) {
            await resetPrisma.$executeRawUnsafe(
              `DROP POLICY IF EXISTS "${policy.policyname}" ON "${policy.tablename}"`
            );
          }

          // Disable RLS on all tables
          const tables = ['User', 'Patient', 'Appointment', 'PainPoint', 'MetricResult', 'SoapNote', 'AuditLog'];
          for (const table of tables) {
            await resetPrisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
          }

          // Drop utility functions
          await resetPrisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS set_current_user(text, text)');
          await resetPrisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS clear_current_user()');
          await resetPrisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS get_current_user_role()');
          await resetPrisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS audit_trigger_function()');

          // Drop audit table
          await resetPrisma.$executeRawUnsafe('DROP TABLE IF EXISTS "AuditLog"');

          return NextResponse.json({
            success: true,
            message: 'RLS configuration reset successfully',
            data: {
              policiesRemoved: policies.length,
              tablesUpdated: tables.length,
            },
          });
        } finally {
          await resetPrisma.$disconnect();
        }

      case 'test':
        // Test RLS configuration with sample operations
        const testPrisma = createPrismaWithRLS();
        try {
          const testResults = [];

          // Test 1: Set user context
          try {
            await testPrisma.setUserContext({ userId: 'test-user-123', userEmail: 'test@example.com' });
            testResults.push({ test: 'Set user context', status: 'success' });
          } catch (error) {
            testResults.push({ test: 'Set user context', status: 'failed', error: error instanceof Error ? error.message : String(error) });
          }

          // Test 2: Check current user
          try {
            const currentUser = await testPrisma.$queryRaw`SELECT current_setting('app.current_user_id', true) as user_id`;
            testResults.push({ test: 'Get current user', status: 'success', data: currentUser });
          } catch (error) {
            testResults.push({ test: 'Get current user', status: 'failed', error: error instanceof Error ? error.message : String(error) });
          }

          // Test 3: Clear user context
          try {
            await testPrisma.clearUserContext();
            testResults.push({ test: 'Clear user context', status: 'success' });
          } catch (error) {
            testResults.push({ test: 'Clear user context', status: 'failed', error: error instanceof Error ? error.message : String(error) });
          }

          return NextResponse.json({
            success: true,
            message: 'RLS tests completed',
            data: testResults,
          });
        } finally {
          await testPrisma.$disconnect();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: setup, reset, or test' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RLS Setup Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/neon/rls
 * Clean up audit logs
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can clean up audit logs
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const prisma = createPrismaWithRLS();
    try {
      const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "AuditLog" WHERE timestamp < CURRENT_DATE - INTERVAL '${days} days'`
      );

      return NextResponse.json({
        success: true,
        message: `Audit logs older than ${days} days have been cleaned up`,
        data: {
          deletedRecords: result,
          retentionDays: days,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Audit Cleanup Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}