import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * @interface SecurityPolicy
 * @description Representa uma política de segurança (Row Level Security) do banco de dados.
 */
export interface SecurityPolicy {
  name: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  condition: string;
  description: string;
}

/**
 * @interface AuditLogEntry
 * @description Representa uma entrada no log de auditoria de segurança.
 */
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

/**
 * @interface SecurityMetrics
 * @description Agrega métricas de segurança do sistema.
 */
export interface SecurityMetrics {
  totalPolicies: number;
  activePolicies: number;
  auditLogEntries: number;
  recentSecurityEvents: AuditLogEntry[];
  policyViolations: number;
  lastSecurityCheck: Date;
}

/**
 * @class RLSSecurityManager
 * @description Gerencia a segurança em nível de linha (RLS), logs de auditoria e permissões.
 */
export class RLSSecurityManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Busca todas as políticas de segurança (RLS) ativas no banco de dados.
   * @returns {Promise<SecurityPolicy[]>} Uma lista de políticas de segurança.
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
        description: `Policy for ${policy.tablename} - ${policy.cmd}`,
      }));
    } catch (error) {
      console.error('Error fetching security policies:', error);
      return [];
    }
  }

  /**
   * Verifica o status do RLS (ativado/desativado) para cada tabela no schema 'public'.
   * @returns {Promise<Record<string, boolean>>} Um objeto mapeando nomes de tabela para seu status de RLS.
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
   * Busca as entradas mais recentes do log de auditoria de segurança.
   * @param {number} [limit=100] - O número máximo de entradas a serem retornadas.
   * @returns {Promise<AuditLogEntry[]>} Uma lista de entradas de log de auditoria.
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
        createdAt: new Date(log.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Registra um evento de segurança no log de auditoria.
   * @param {string} action - A ação que está sendo registrada (ex: 'LOGIN_FAILED').
   * @param {string} [tableName] - A tabela associada ao evento.
   * @param {string} [recordId] - O ID do registro associado ao evento.
   * @param {Record<string, any>} [metadata] - Metadados adicionais.
   * @param {Request} [request] - O objeto da requisição HTTP para extrair IP e User-Agent.
   * @returns {Promise<void>}
   */
  async logSecurityEvent(
    action: string,
    tableName?: string,
    recordId?: string,
    metadata?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    try {
      const ipAddress =
        request?.headers.get('x-forwarded-for') ||
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
   * Coleta e retorna um resumo das principais métricas de segurança.
   * @returns {Promise<SecurityMetrics>} Um objeto com as métricas de segurança.
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const [policies, auditCount, recentEvents] = await Promise.all([
        this.getSecurityPolicies(),
        this.getAuditLogCount(),
        this.getAuditLogs(10),
      ]);

      const rlsStatus = await this.checkRLSStatus();
      const activePolicies = Object.values(rlsStatus).filter(Boolean).length;

      return {
        totalPolicies: policies.length,
        activePolicies,
        auditLogEntries: auditCount,
        recentSecurityEvents: recentEvents,
        policyViolations: await this.getPolicyViolationCount(),
        lastSecurityCheck: new Date(),
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        totalPolicies: 0,
        activePolicies: 0,
        auditLogEntries: 0,
        recentSecurityEvents: [],
        policyViolations: 0,
        lastSecurityCheck: new Date(),
      };
    }
  }

  /**
   * Conta o número total de entradas no log de auditoria.
   * @private
   * @returns {Promise<number>} O número total de logs de auditoria.
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
   * Conta o número de violações de política (tentativas de acesso negado) nas últimas 24 horas.
   * @private
   * @returns {Promise<number>} O número de violações de política.
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
   * Valida se um usuário tem permissão para executar uma operação específica em um recurso.
   * @param {string} userId - O ID do usuário.
   * @param {string} operation - A operação a ser validada (ex: 'SELECT', 'UPDATE').
   * @param {string} tableName - O nome da tabela do recurso.
   * @param {string} [recordId] - O ID do registro específico, se aplicável.
   * @returns {Promise<boolean>} `true` se o usuário tiver permissão, `false` caso contrário.
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
        select: { role: true },
      });

      if (!user) {
        await this.logSecurityEvent('PERMISSION_DENIED', tableName, recordId, {
          reason: 'User not found',
          operation,
        });
        return false;
      }

      // Admin has access to everything
      if (user.role === 'Admin') {
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
        await this.logSecurityEvent('PERMISSION_DENIED', tableName, recordId, {
          reason: 'Insufficient permissions',
          operation,
          role: user.role,
        });
      }

      return hasPermission;
    } catch (error) {
      console.error('Error validating user permission:', error);
      await this.logSecurityEvent('PERMISSION_ERROR', tableName, recordId, {
        error: error instanceof Error ? error.message : String(error),
        operation,
      });
      return false;
    }
  }

  /**
   * Verifica permissões específicas com base na role do usuário e no contexto da operação.
   * @private
   * @param {string} userId - O ID do usuário.
   * @param {string} role - A role do usuário.
   * @param {string} operation - A operação.
   * @param {string} tableName - O nome da tabela.
   * @param {string} [recordId] - O ID do registro.
   * @returns {Promise<boolean>} `true` se a permissão for concedida.
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
        if (role === 'Fisioterapeuta') {
          // Check if physiotherapist has appointments with the patient
          if (recordId) {
            const appointment = await this.prisma.appointment.findFirst({
              where: {
                patientId: recordId,
                therapistId: userId,
              },
            });
            return !!appointment;
          }
          return operation === 'SELECT' || operation === 'INSERT';
        }
        if (role === 'Paciente') {
          // Patients can only view/update their own data
          return (
            recordId === userId &&
            (operation === 'SELECT' || operation === 'UPDATE')
          );
        }
        break;

      case 'Appointment':
        if (role === 'Fisioterapeuta' || role === 'Paciente') {
          // Check if user is related to the appointment
          if (recordId) {
            const appointment = await this.prisma.appointment.findFirst({
              where: {
                id: recordId,
                OR: [{ therapistId: userId }, { patientId: userId }],
              },
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
   * Ativa o Row Level Security para uma tabela específica.
   * @param {string} tableName - O nome da tabela.
   * @returns {Promise<boolean>} `true` se a operação for bem-sucedida.
   */
  async enableRLSForTable(tableName: string): Promise<boolean> {
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;
      `);

      await this.logSecurityEvent('RLS_ENABLED', tableName, undefined, {
        tableName,
      });

      return true;
    } catch (error) {
      console.error(`Error enabling RLS for table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Desativa o Row Level Security para uma tabela específica (usar com extrema cautela).
   * @param {string} tableName - O nome da tabela.
   * @returns {Promise<boolean>} `true` se a operação for bem-sucedida.
   */
  async disableRLSForTable(tableName: string): Promise<boolean> {
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;
      `);

      await this.logSecurityEvent('RLS_DISABLED', tableName, undefined, {
        tableName,
        warning: 'RLS disabled - security risk',
      });

      return true;
    } catch (error) {
      console.error(`Error disabling RLS for table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Limpa os logs de auditoria antigos com base em uma política de retenção.
   * @param {number} [days=30] - O número de dias de logs a serem mantidos.
   * @returns {Promise<number>} O número de registros de log excluídos.
   */
  async clearOldAuditLogs(days: number = 30): Promise<number> {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM "SecurityAuditLog" 
        WHERE "createdAt" < NOW() - INTERVAL '${days} days';
      `;

      await this.logSecurityEvent(
        'AUDIT_LOG_CLEANUP',
        'SecurityAuditLog',
        undefined,
        { daysRetention: days, deletedRecords: result }
      );

      return Number(result);
    } catch (error) {
      console.error('Error clearing old audit logs:', error);
      return 0;
    }
  }
}

/**
 * @constant rlsSecurityManager
 * @description Instância singleton do RLSSecurityManager.
 */
export const rlsSecurityManager = new RLSSecurityManager();

/**
 * @constant securityUtils
 * @description Objeto com funções utilitárias de segurança.
 */
export const securityUtils = {
  /**
   * Check if user has admin role
   */
  isAdmin: (role: string): boolean => role === 'Admin',

  /**
   * Check if user has physiotherapist role
   */
  isPhysiotherapist: (role: string): boolean => role === 'Fisioterapeuta',

  /**
   * Check if user has patient role
   */
  isPatient: (role: string): boolean => role === 'Paciente',

  /**
   * Get user IP address from request
   */
  getUserIP: (request: Request): string => {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
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
  },
};
