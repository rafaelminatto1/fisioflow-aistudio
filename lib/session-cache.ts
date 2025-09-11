// lib/session-cache.ts - Distributed Session Cache System
import { sessionCache } from './cache';
import edgeLogger from './edge-logger';
import crypto from 'crypto';

/**
 * @interface SessionData
 * @description Representa os dados armazenados em uma sessão de usuário.
 */
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * @interface SessionOptions
 * @description Opções para a criação e gerenciamento de sessões.
 */
export interface SessionOptions {
  maxAge?: number; // Session TTL in seconds (default: 24 hours)
  secure?: boolean; // HTTPS only
  sameSite?: 'strict' | 'lax' | 'none';
  rolling?: boolean; // Extend session on activity
}

/**
 * @class DistributedSessionManager
 * @description Gerencia sessões de usuário distribuídas usando um cache (Redis).
 */
export class DistributedSessionManager {
  private defaultOptions: SessionOptions = {
    maxAge: 24 * 60 * 60, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    rolling: true,
  };

  private sessionPrefix = 'session';
  private userSessionPrefix = 'user_sessions';

  /**
   * Cria uma nova sessão para um usuário.
   * @param {SessionData} sessionData - Os dados a serem armazenados na sessão.
   * @param {SessionOptions} [options={}] - Opções para esta sessão específica.
   * @returns {Promise<string>} O ID da sessão criada.
   * @throws {Error} Se a criação da sessão falhar.
   */
  async createSession(
    sessionData: SessionData,
    options: SessionOptions = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const mergedOptions = { ...this.defaultOptions, ...options };

    const session = {
      ...sessionData,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      sessionId,
    };

    try {
      // Store session data
      await sessionCache.set(`${this.sessionPrefix}:${sessionId}`, session, {
        ttl: mergedOptions.maxAge,
        tags: ['sessions', `user:${sessionData.userId}`],
        layer: 'both',
      });

      // Track user sessions for concurrent session management
      await this.addUserSession(
        sessionData.userId,
        sessionId,
        mergedOptions.maxAge!
      );

      edgeLogger.info('Session created', {
        sessionId,
        userId: sessionData.userId,
        ttl: mergedOptions.maxAge,
      });

      return sessionId;
    } catch (error) {
      edgeLogger.error(`Failed to create session ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * Obtém os dados de uma sessão a partir de seu ID.
   * @param {string} sessionId - O ID da sessão a ser obtida.
   * @returns {Promise<SessionData | null>} Os dados da sessão ou nulo se não encontrada ou expirada.
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const session = await sessionCache.get<
        SessionData & { createdAt: number; sessionId: string }
      >(`${this.sessionPrefix}:${sessionId}`, { layer: 'both' });

      if (!session) {
        return null;
      }

      // Check if session is expired (additional check)
      const now = Date.now();
      const maxAge = this.defaultOptions.maxAge! * 1000;

      if (now - session.lastActivity > maxAge) {
        await this.destroySession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      edgeLogger.error('Failed to get session', error as Error);
      return null;
    }
  }

  /**
   * Atualiza a data de última atividade de uma sessão (rolling session) e, opcionalmente, atualiza seus dados.
   * @param {string} sessionId - O ID da sessão a ser atualizada.
   * @param {Partial<SessionData>} [updateData] - Dados parciais para atualizar na sessão.
   * @returns {Promise<boolean>} `true` se a sessão foi atualizada com sucesso.
   */
  async touchSession(
    sessionId: string,
    updateData?: Partial<SessionData>
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      const updatedSession = {
        ...session,
        ...updateData,
        lastActivity: Date.now(),
      };

      await sessionCache.set(
        `${this.sessionPrefix}:${sessionId}`,
        updatedSession,
        {
          ttl: this.defaultOptions.maxAge,
          tags: ['sessions', `user:${session.userId}`],
          layer: 'both',
        }
      );

      return true;
    } catch (error) {
      edgeLogger.error(`Failed to touch session ${sessionId}`, error as Error);
      return false;
    }
  }

  /**
   * Destrói uma sessão específica.
   * @param {string} sessionId - O ID da sessão a ser destruída.
   * @returns {Promise<boolean>} `true` se a sessão foi destruída com sucesso.
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      // Remove from session cache
      await sessionCache.del(`${this.sessionPrefix}:${sessionId}`);

      // Remove from user sessions list
      await this.removeUserSession(session.userId, sessionId);

      edgeLogger.info('Session destroyed', {
        sessionId,
        userId: session.userId,
      });

      return true;
    } catch (error) {
      edgeLogger.error(`Failed to destroy session ${sessionId}`, error as Error);
      return false;
    }
  }

  /**
   * Destrói todas as sessões ativas de um usuário.
   * @param {string} userId - O ID do usuário.
   * @returns {Promise<number>} O número de sessões destruídas.
   */
  async destroyUserSessions(userId: string): Promise<number> {
    try {
      const userSessions = await this.getUserSessions(userId);
      let destroyedCount = 0;

      for (const sessionId of userSessions) {
        if (await this.destroySession(sessionId)) {
          destroyedCount++;
        }
      }

      // Clear the user sessions list
      await sessionCache.del(`${this.userSessionPrefix}:${userId}`);

      edgeLogger.info('All user sessions destroyed', {
        userId,
        destroyedCount,
      });

      return destroyedCount;
    } catch (error) {
      edgeLogger.error(`Failed to destroy user sessions for ${userId}`, error as Error);
      return 0;
    }
  }

  /**
   * Obtém todos os IDs de sessão ativos para um usuário.
   * @param {string} userId - O ID do usuário.
   * @returns {Promise<string[]>} Um array com os IDs das sessões ativas.
   */
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const sessions = await sessionCache.get<string[]>(
        `${this.userSessionPrefix}:${userId}`,
        { layer: 'both' }
      );

      if (!sessions) return [];

      // Validate sessions still exist
      const validSessions: string[] = [];
      for (const sessionId of sessions) {
        const session = await this.getSession(sessionId);
        if (session) {
          validSessions.push(sessionId);
        }
      }

      // Update the list if it changed
      if (validSessions.length !== sessions.length) {
        await sessionCache.set(
          `${this.userSessionPrefix}:${userId}`,
          validSessions,
          {
            ttl: this.defaultOptions.maxAge,
            tags: [`user:${userId}`],
            layer: 'both',
          }
        );
      }

      return validSessions;
    } catch (error) {
      edgeLogger.error(`Failed to get user sessions for ${userId}`, error as Error);
      return [];
    }
  }

  /**
   * Obtém estatísticas sobre as sessões (implementação simplificada).
   * @returns {Promise<object>} Um objeto com estatísticas de cache.
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeUsers: number;
    avgSessionDuration: number;
    cacheStats: any;
  }> {
    try {
      const cacheMetrics = sessionCache.getMetrics();

      // This is a simplified implementation
      // In production, you might want to store more detailed metrics

      return {
        totalSessions: 0, // Would need to implement session counting
        activeUsers: 0, // Would need to implement user counting
        avgSessionDuration: 0, // Would need to track session durations
        cacheStats: cacheMetrics,
      };
    } catch (error) {
      edgeLogger.error('Failed to get session stats', error as Error);
      return {
        totalSessions: 0,
        activeUsers: 0,
        avgSessionDuration: 0,
        cacheStats: null,
      };
    }
  }

  /**
   * Limpa sessões expiradas (implementação simplificada, a ser chamada periodicamente).
   * @returns {Promise<number>} O número de sessões limpas.
   */
  async cleanupExpiredSessions(): Promise<number> {
    const cleanedCount = 0;

    try {
      // This is a simplified cleanup - in production you'd want a more efficient approach
      // Perhaps using Redis SCAN or maintaining an expiration index

      edgeLogger.info('Session cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      edgeLogger.error('Session cleanup failed', error as Error);
      return 0;
    }
  }

  // Private methods

  /**
   * Gera um ID de sessão único e seguro.
   * @private
   * @returns {string} O ID da sessão.
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Adiciona um ID de sessão à lista de sessões de um usuário.
   * @private
   * @param {string} userId - O ID do usuário.
   * @param {string} sessionId - O ID da sessão.
   * @param {number} ttl - O tempo de vida da entrada.
   * @returns {Promise<void>}
   */
  private async addUserSession(
    userId: string,
    sessionId: string,
    ttl: number
  ): Promise<void> {
    const userSessions = await this.getUserSessions(userId);

    // Limit concurrent sessions (optional)
    const maxSessions = 10;
    if (userSessions.length >= maxSessions) {
      // Remove oldest session
      const oldestSession = userSessions.shift();
      if (oldestSession) {
        await this.destroySession(oldestSession);
      }
    }

    userSessions.push(sessionId);

    await sessionCache.set(
      `${this.userSessionPrefix}:${userId}`,
      userSessions,
      {
        ttl,
        tags: [`user:${userId}`],
        layer: 'both',
      }
    );
  }

  /**
   * Remove um ID de sessão da lista de sessões de um usuário.
   * @private
   * @param {string} userId - O ID do usuário.
   * @param {string} sessionId - O ID da sessão a ser removida.
   * @returns {Promise<void>}
   */
  private async removeUserSession(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    const updatedSessions = userSessions.filter(id => id !== sessionId);

    if (updatedSessions.length === 0) {
      await sessionCache.del(`${this.userSessionPrefix}:${userId}`);
    } else {
      await sessionCache.set(
        `${this.userSessionPrefix}:${userId}`,
        updatedSessions,
        {
          ttl: this.defaultOptions.maxAge,
          tags: [`user:${userId}`],
          layer: 'both',
        }
      );
    }
  }
}

/**
 * @constant sessionManager
 * @description Instância singleton do DistributedSessionManager.
 */
export const sessionManager = new DistributedSessionManager();

/**
 * @class SessionMiddleware
 * @description Classe com utilitários para manipular sessões em middlewares HTTP.
 */
export class SessionMiddleware {
  /**
   * Extrai o ID da sessão do cabeçalho de cookies de uma requisição.
   * @param {Request} request - O objeto da requisição.
   * @returns {string | null} O ID da sessão ou nulo se não encontrado.
   */
  static getSessionIdFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }

  /**
   * Cria uma string de cookie de sessão para ser enviada ao cliente.
   * @param {string} sessionId - O ID da sessão.
   * @param {SessionOptions} [options={}] - Opções para o cookie.
   * @returns {string} A string do cabeçalho 'Set-Cookie'.
   */
  static createSessionCookie(
    sessionId: string,
    options: SessionOptions = {}
  ): string {
    const mergedOptions = {
      maxAge: 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...options,
    };

    let cookie = `session=${sessionId}; Max-Age=${mergedOptions.maxAge}; Path=/`;

    if (mergedOptions.secure) {
      cookie += '; Secure';
    }

    if (mergedOptions.sameSite) {
      cookie += `; SameSite=${mergedOptions.sameSite}`;
    }

    return cookie;
  }

  /**
   * Cria uma string de cookie para limpar a sessão no cliente.
   * @returns {string} A string do cabeçalho 'Set-Cookie' para limpar o cookie.
   */
  static clearSessionCookie(): string {
    return 'session=; Max-Age=0; Path=/';
  }
}

export default sessionManager;
