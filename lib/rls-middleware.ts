/**
 * Row Level Security (RLS) Middleware for Prisma
 * Automatically sets user context for database operations
 */

import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Types for user context
export interface UserContext {
  userId: string;
  userEmail?: string;
  userRole?: string;
}

// Extended Prisma client with RLS support
export interface PrismaWithRLS extends PrismaClient {
  setUserContext(context: UserContext): Promise<void>;
  clearUserContext(): Promise<void>;
  withUserContext<T>(context: UserContext, operation: () => Promise<T>): Promise<T>;
}

/**
 * Creates a Prisma client with RLS middleware
 */
export function createPrismaWithRLS(): PrismaWithRLS {
  const prisma = new PrismaClient() as PrismaWithRLS;

  // Add RLS middleware
  prisma.$use(async (params, next) => {
    // Skip RLS for certain operations or tables
    const skipRLS = [
      'AuditLog', // Audit logs are handled separately
      '_prisma_migrations', // Migration table
    ];

    if (skipRLS.includes(params.model || '')) {
      return next(params);
    }

    // For operations that require user context, ensure it's set
    const operations = ['create', 'update', 'delete', 'findMany', 'findFirst', 'findUnique'];
    
    if (operations.includes(params.action)) {
      // Check if user context is set
      try {
        const result = await prisma.$queryRaw`SELECT current_setting('app.current_user_id', true) as user_id`;
        const userContext = result as any;
        
        if (!userContext[0]?.user_id || userContext[0].user_id === '') {
          console.warn(`RLS Warning: No user context set for ${params.action} on ${params.model}`);
          // In development, we might want to allow this, but log it
          if (process.env.NODE_ENV === 'production') {
            throw new Error('User context required for database operations');
          }
        }
      } catch (error) {
        console.error('RLS Context Check Error:', error);
      }
    }

    return next(params);
  });

  // Add utility methods
  prisma.setUserContext = async function(context: UserContext) {
    await this.$executeRaw`SELECT set_current_user(${context.userId}, ${context.userEmail || null})`;
  };

  prisma.clearUserContext = async function() {
    await this.$executeRaw`SELECT clear_current_user()`;
  };

  prisma.withUserContext = async function<T>(
    context: UserContext, 
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      await this.setUserContext(context);
      return await operation();
    } finally {
      await this.clearUserContext();
    }
  };

  return prisma;
}

/**
 * Get user context from Next.js session
 */
export async function getUserContextFromSession(): Promise<UserContext | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    return {
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role || undefined,
    };
  } catch (error) {
    console.error('Error getting user context from session:', error);
    return null;
  }
}

/**
 * Get user context from API request headers
 */
export function getUserContextFromRequest(request: NextRequest): UserContext | null {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role');

  if (!userId) {
    return null;
  }

  return {
    userId,
    userEmail: userEmail || undefined,
    userRole: userRole || undefined,
  };
}

/**
 * Higher-order function to wrap API handlers with RLS context
 */
export function withRLS<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const prisma = createPrismaWithRLS();
    
    try {
      // Try to get user context from session first
      let userContext = await getUserContextFromSession();
      
      // If no session, try to get from request headers (for API routes)
      if (!userContext && args[0] && typeof args[0] === 'object' && 'headers' in args[0]) {
        userContext = getUserContextFromRequest(args[0] as NextRequest);
      }

      if (userContext) {
        return await prisma.withUserContext(userContext, () => handler(...args));
      } else {
        // No user context available - proceed without RLS (might be public endpoint)
        console.warn('No user context available for RLS');
        return await handler(...args);
      }
    } finally {
      await prisma.$disconnect();
    }
  };
}

/**
 * Middleware for API routes to automatically set RLS context
 */
export async function rlsMiddleware(
  request: NextRequest,
  response: Response,
  next: () => Promise<Response>
): Promise<Response> {
  const prisma = createPrismaWithRLS();
  
  try {
    // Get user context from session or headers
    let userContext = await getUserContextFromSession();
    
    if (!userContext) {
      userContext = getUserContextFromRequest(request);
    }

    if (userContext) {
      await prisma.setUserContext(userContext);
    }

    return await next();
  } catch (error) {
    console.error('RLS Middleware Error:', error);
    throw error;
  } finally {
    await prisma.clearUserContext();
    await prisma.$disconnect();
  }
}

/**
 * React hook for client-side RLS context (for API calls)
 */
export function useRLSHeaders() {
  const getHeaders = () => {
    // In a real implementation, you'd get this from your auth context
    // This is a placeholder for the client-side implementation
    return {
      'x-user-id': '', // Get from auth context
      'x-user-email': '', // Get from auth context
      'x-user-role': '', // Get from auth context
    };
  };

  return { getHeaders };
}

/**
 * Utility to check if RLS is properly configured
 */
export async function verifyRLSSetup(): Promise<{
  tablesWithRLS: string[];
  policiesCount: number;
  isConfigured: boolean;
}> {
  const prisma = createPrismaWithRLS();
  
  try {
    // Check which tables have RLS enabled
    const tablesWithRLS = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true
      ORDER BY tablename
    ` as { tablename: string }[];

    // Count total policies
    const policiesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_policies 
      WHERE schemaname = 'public'
    ` as { count: bigint }[];

    const expectedTables = ['User', 'Patient', 'Appointment', 'PainPoint', 'MetricResult', 'SoapNote'];
    const configuredTables = tablesWithRLS.map(t => t.tablename);
    const isConfigured = expectedTables.every(table => configuredTables.includes(table));

    return {
      tablesWithRLS: configuredTables,
      policiesCount: Number(policiesCount[0]?.count || 0),
      isConfigured,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get audit log entries for security monitoring
 */
export async function getAuditLogs(options: {
  userId?: string;
  tableName?: string;
  operation?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const prisma = createPrismaWithRLS();
  
  try {
    const { userId, tableName, operation, limit = 100, offset = 0 } = options;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (userId) {
      whereClause += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }
    
    if (tableName) {
      whereClause += ` AND table_name = $${params.length + 1}`;
      params.push(tableName);
    }
    
    if (operation) {
      whereClause += ` AND operation = $${params.length + 1}`;
      params.push(operation);
    }
    
    const query = `
      SELECT * FROM "AuditLog" 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    return await prisma.$queryRawUnsafe(query, ...params) as any[];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Export singleton instance
 */
export const prismaWithRLS = createPrismaWithRLS();

/**
 * Default export for convenience
 */
export default prismaWithRLS;