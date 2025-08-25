import { neonConfig } from '@/lib/neon-config';
import { PrismaClient } from '@prisma/client';

/**
 * Row Level Security (RLS) Configuration for Neon DB
 * Manages security policies, audit logging, and access control
 */

export interface SecurityPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  condition: string;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  tableName?: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SecurityMetrics {
  totalPolicies: number;
  activePolicies: number;
  auditLogEntries: number;
  recentSecurityEvents: AuditLogEntry[];
  policyViolations: number;
  lastSecurityCheck: Date;
}

export class RLSSecurityManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = neonConfig.prisma;
  }

  /**
   * Get all security policies
   */
  async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
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
        ORDER BY tablename, policyname;
      `;

      return result.map(policy => ({
        name: policy.policyname,
        table: policy.tablename,
        operation: policy.cmd as any,
        condition: policy.qual || policy.with_check || '',
        description: `Policy for ${policy.tablename} - ${policy.cmd}`
      }));
    } catch (error) {
      console.error('Error fetching security policies:', error);
      return [];
    }
  }

  /**
   * Check if RLS is enabled for all tables
   */
  async checkRLSStatus(): Promise<Record<string, boolean>> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_prisma_%'
        ORDER BY tablename;
      `;

      const status: Record<string, boolean> = {};
      result.forEach(table => {
        status[table.tablename] = table.rowsecurity;
      });

      return status;
    } catch (error) {
      console.error('Error checking RLS status:', error);
      return {};
    }
  }

  /**
   * Get recent audit log entries
   */
  async getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          id,
          "userId",
          action,
          "tableName",
          "recordId",
          "ipAddress",
          "userAgent",
          metadata,
          "createdAt"
        FROM "SecurityAuditLog"
        ORDER BY "createdAt" DESC
        LIMIT ${limit};
      `;

      return result.map(log => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        tableName: log.tableName,
        recordId: log.recordId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: new Date(log.createdAt)
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    action: string,
    tableName?: string,
    recordId?: string,
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    try {
      const ipAddress = request?.headers.get('x-forwarded-for') || 
                       request?.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request?.headers.get('user-agent') || 'unknown';

      await this.prisma.$executeRaw`
        SELECT log_security_event(
          ${action},
          ${tableName},
          ${recordId},
          ${metadata ? JSON.stringify(metadata) : null}::jsonb
        );
      `;

      // Also update the audit log with IP and user agent if available
      if (request) {
        await this.prisma.$executeRaw`
          UPDATE "SecurityAuditLog" 
          SET "ipAddress" = ${ipAddress}, "userAgent" = ${userAgent}
          WHERE action = ${action} 
          AND "createdAt" > NOW() - INTERVAL '1 minute'
          ORDER BY "createdAt" DESC
          LIMIT 1;
        `;
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const [policies, auditCount, recentEvents] = await Promise.all([
        this.getSecurityPolicies(),
        this.getAuditLogCount(),
        this.getAuditLogs(10)
      ]);

      const rlsStatus = await this.checkRLSStatus();
      const activePolicies = Object.values(rlsStatus).filter(Boolean).length;

      return {
        totalPolicies: policies.length,
        activePolicies,
        auditLogEntries: auditCount,
        recentSecurityEvents: recentEvents,
        policyViolations: await this.getPolicyViolationCount(),
        lastSecurityCheck: new Date()
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        totalPolicies: 0,
        activePolicies: 0,
        auditLogEntries: 0,
        recentSecurityEvents: [],
        policyViolations: 0,
        lastSecurityCheck: new Date()
      };
    }
  }

  /**
   * Get audit log count
   */
  private async getAuditLogCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "SecurityAuditLog";
      `;
      return Number(result[0].count);
    } catch (error) {
      console.error('Error getting audit log count:', error);
      return 0;
    }
  }

  /**
   * Get policy violation count (failed access attempts)
   */
  private async getPolicyViolationCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count 
        FROM "SecurityAuditLog" 
        WHERE action LIKE '%VIOLATION%' 
        OR action LIKE '%DENIED%'
        AND "createdAt" > NOW() - INTERVAL '24 hours';
      `;
      return Number(result[0].count);
    } catch (error) {
      console.error('Error getting policy violation count:', error);
      return 0;
    }
  }

  /**
   * Validate user permissions for a specific operation
   */
  async validateUserPermission(
    userId: string,
    operation: string,
    tableName: string,
    recordId?: string
  ): Promise<boolean> {
    try {
      // This would typically check against the RLS policies
      // For now, we'll implement basic role-based checks
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        await this.logSecurityEvent(
          'PERMISSION_DENIED',
          tableName,
          recordId,
          { reason: 'User not found', operation }
        );
        return false;
      }

      // Admin has access to everything
      if (user.role === 'ADMIN') {
        return true;
      }

      // Implement specific permission logic based on table and operation
      const hasPermission = await this.checkSpecificPermission(
        userId,
        user.role,
        operation,
        tableName,
        recordId
      );

      if (!hasPermission) {
        await this.logSecurityEvent(
          'PERMISSION_DENIED',
          tableName,
          recordId,
          { reason: 'Insufficient permissions', operation, role: user.role }
        );
      }

      return hasPermission;
    } catch (error) {
      console.error('Error validating user permission:', error);
      await this.logSecurityEvent(
        'PERMISSION_ERROR',
        tableName,
        recordId,
        { error: error.message, operation }
      );
      return false;
    }
  }

  /**
   * Check specific permission based on role and context
   */
  private async checkSpecificPermission(
    userId: string,
    role: string,
    operation: string,
    tableName: string,
    recordId?: string
  ): Promise<boolean> {
    switch (tableName) {
      case 'Patient':
        if (role === 'PHYSIOTHERAPIST') {
          // Check if physiotherapist owns the patient
          if (recordId) {
            const patient = await this.prisma.patient.findFirst({
              where: {
                id: recordId,
                physiotherapistId: userId
              }
            });
            return !!patient;
          }
          return operation === 'SELECT' || operation === 'INSERT';
        }
        if (role === 'PATIENT') {
          // Patients can only view/update their own data
          return recordId === userId && (operation === 'SELECT' || operation === 'UPDATE');
        }
        break;

      case 'Appointment':
        if (role === 'PHYSIOTHERAPIST' || role === 'PATIENT') {
          // Check if user is related to the appointment
          if (recordId) {
            const appointment = await this.prisma.appointment.findFirst({
              where: {
                id: recordId,
                OR: [
                  { patient: { physiotherapistId: userId } },
                  { patientId: userId }
                ]
              }
            });
            return !!appointment;
          }
          return operation === 'SELECT' || operation === 'INSERT';
        }
        break;

      default:
        // Default restrictive policy
        return false;
    }

    return false;
  }

  /**
   * Enable RLS for a specific table
   */
  async enableRLSForTable(tableName: string): Promise<boolean> {
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
      `);
      
      await this.logSecurityEvent(
        'RLS_ENABLED',
        tableName,
        undefined,
        { tableName }
      );
      
      return true;
    } catch (error) {
      console.error(`Error enabling RLS for table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Disable RLS for a specific table (use with caution)
   */
  async disableRLSForTable(tableName: string): Promise<boolean> {
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;
      `);
      
      await this.logSecurityEvent(
        'RLS_DISABLED',
        tableName,
        undefined,
        { tableName, warning: 'RLS disabled - security risk' }
      );
      
      return true;
    } catch (error) {
      console.error(`Error disabling RLS for table ${tableName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const rlsSecurityManager = new RLSSecurityManager();

// Export utility functions
export const securityUtils = {
  /**
   * Check if user has admin role
   */
  isAdmin: (role: string): boolean => role === 'ADMIN',

  /**
   * Check if user has physiotherapist role
   */
  isPhysiotherapist: (role: string): boolean => role === 'PHYSIOTHERAPIST',

  /**
   * Check if user has patient role
   */
  isPatient: (role: string): boolean => role === 'PATIENT',

  /**
   * Get user IP address from request
   */
  getUserIP: (request: Request): string => {
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           'unknown';
  },

  /**
   * Get user agent from request
   */
  getUserAgent: (request: Request): string => {
    return request.headers.get('user-agent') || 'unknown';
  },

  /**
   * Sanitize sensitive data for logging
   */
  sanitizeForLog: (data: any): any => {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
};