import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rlsSecurityManager, securityUtils } from '@/lib/security/rls-config';
import { z } from 'zod';

// Validation schemas
const securityActionSchema = z.object({
  action: z.enum([
    'enable_rls',
    'disable_rls',
    'check_permissions',
    'log_event',
  ]),
  tableName: z.string().optional(),
  recordId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/security
 * Get security metrics, policies, and audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !securityUtils.isAdmin(session.user.role)) {
      await rlsSecurityManager.logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'security_api',
        undefined,
        { endpoint: '/api/security', method: 'GET' },
        request
      );

      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (type) {
      case 'metrics':
        const metrics = await rlsSecurityManager.getSecurityMetrics();
        return NextResponse.json({ metrics });

      case 'policies':
        const policies = await rlsSecurityManager.getSecurityPolicies();
        return NextResponse.json({ policies });

      case 'rls-status':
        const rlsStatus = await rlsSecurityManager.checkRLSStatus();
        return NextResponse.json({ rlsStatus });

      case 'audit-logs':
        const auditLogs = await rlsSecurityManager.getAuditLogs(limit);
        return NextResponse.json({ auditLogs });

      case 'all':
      default:
        const [allMetrics, allPolicies, allRlsStatus, allAuditLogs] =
          await Promise.all([
            rlsSecurityManager.getSecurityMetrics(),
            rlsSecurityManager.getSecurityPolicies(),
            rlsSecurityManager.checkRLSStatus(),
            rlsSecurityManager.getAuditLogs(50),
          ]);

        return NextResponse.json({
          metrics: allMetrics,
          policies: allPolicies,
          rlsStatus: allRlsStatus,
          auditLogs: allAuditLogs,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Security API GET error:', error);

    await rlsSecurityManager.logSecurityEvent(
      'API_ERROR',
      'security_api',
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/security',
        method: 'GET',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security
 * Perform security actions like enabling/disabling RLS, logging events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !securityUtils.isAdmin(session.user.role)) {
      await rlsSecurityManager.logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'security_api',
        undefined,
        { endpoint: '/api/security', method: 'POST' },
        request
      );

      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = securityActionSchema.parse(body);
    const { action, tableName, recordId, metadata } = validatedData;

    switch (action) {
      case 'enable_rls':
        if (!tableName) {
          return NextResponse.json(
            { error: 'Table name is required for enable_rls action' },
            { status: 400 }
          );
        }

        const enableResult =
          await rlsSecurityManager.enableRLSForTable(tableName);

        if (enableResult) {
          return NextResponse.json({
            success: true,
            message: `RLS enabled for table ${tableName}`,
            tableName,
          });
        } else {
          return NextResponse.json(
            { error: `Failed to enable RLS for table ${tableName}` },
            { status: 500 }
          );
        }

      case 'disable_rls':
        if (!tableName) {
          return NextResponse.json(
            { error: 'Table name is required for disable_rls action' },
            { status: 400 }
          );
        }

        const disableResult =
          await rlsSecurityManager.disableRLSForTable(tableName);

        if (disableResult) {
          return NextResponse.json({
            success: true,
            message: `RLS disabled for table ${tableName}`,
            tableName,
            warning: 'RLS disabled - this may pose security risks',
          });
        } else {
          return NextResponse.json(
            { error: `Failed to disable RLS for table ${tableName}` },
            { status: 500 }
          );
        }

      case 'check_permissions':
        if (!tableName || !recordId) {
          return NextResponse.json(
            {
              error:
                'Table name and record ID are required for check_permissions action',
            },
            { status: 400 }
          );
        }

        const hasPermission = await rlsSecurityManager.validateUserPermission(
          session.user.id,
          'SELECT',
          tableName,
          recordId
        );

        return NextResponse.json({
          hasPermission,
          userId: session.user.id,
          tableName,
          recordId,
        });

      case 'log_event':
        await rlsSecurityManager.logSecurityEvent(
          metadata?.eventType || 'MANUAL_LOG',
          tableName,
          recordId,
          {
            ...metadata,
            triggeredBy: session.user.id,
            triggeredAt: new Date().toISOString(),
          },
          request
        );

        return NextResponse.json({
          success: true,
          message: 'Security event logged successfully',
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security API POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    await rlsSecurityManager.logSecurityEvent(
      'API_ERROR',
      'security_api',
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/security',
        method: 'POST',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security
 * Update security configurations
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !securityUtils.isAdmin(session.user.role)) {
      await rlsSecurityManager.logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'security_api',
        undefined,
        { endpoint: '/api/security', method: 'PUT' },
        request
      );

      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tables, enableRLS } = body;

    if (!Array.isArray(tables)) {
      return NextResponse.json(
        { error: 'Tables must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const tableName of tables) {
      try {
        let result;
        if (enableRLS) {
          result = await rlsSecurityManager.enableRLSForTable(tableName);
        } else {
          result = await rlsSecurityManager.disableRLSForTable(tableName);
        }

        results.push({
          tableName,
          success: result,
          action: enableRLS ? 'enabled' : 'disabled',
        });
      } catch (error) {
        results.push({
          tableName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          action: enableRLS ? 'enable_failed' : 'disable_failed',
        });
      }
    }

    await rlsSecurityManager.logSecurityEvent(
      'BULK_RLS_UPDATE',
      undefined,
      undefined,
      {
        tables,
        enableRLS,
        results,
        triggeredBy: session.user.id,
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: `Bulk RLS ${enableRLS ? 'enable' : 'disable'} completed`,
      results,
    });
  } catch (error) {
    console.error('Security API PUT error:', error);

    await rlsSecurityManager.logSecurityEvent(
      'API_ERROR',
      'security_api',
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/security',
        method: 'PUT',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/security
 * Clear audit logs (with retention policy)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !securityUtils.isAdmin(session.user.role)) {
      await rlsSecurityManager.logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'security_api',
        undefined,
        { endpoint: '/api/security', method: 'DELETE' },
        request
      );

      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const days = parseInt(searchParams.get('days') || '30');

    if (action === 'clear_old_logs') {
      // Clear audit logs older than specified days
      const result = await rlsSecurityManager.clearOldAuditLogs(days);

      await rlsSecurityManager.logSecurityEvent(
        'AUDIT_LOG_CLEANUP',
        'SecurityAuditLog',
        undefined,
        {
          daysRetention: days,
          deletedRecords: result,
          triggeredBy: session.user.id,
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: `Cleared audit logs older than ${days} days`,
        deletedRecords: result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=clear_old_logs' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Security API DELETE error:', error);

    await rlsSecurityManager.logSecurityEvent(
      'API_ERROR',
      'security_api',
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        endpoint: '/api/security',
        method: 'DELETE',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
