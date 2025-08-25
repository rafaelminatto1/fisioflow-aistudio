// lib/session-cache.ts - Distributed Session Cache System
import { sessionCache } from './cache';
import { railwayLogger } from './railway-logger';
import crypto from 'crypto';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface SessionOptions {
  maxAge?: number; // Session TTL in seconds (default: 24 hours)
  secure?: boolean; // HTTPS only
  sameSite?: 'strict' | 'lax' | 'none';
  rolling?: boolean; // Extend session on activity
}

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
   * Create a new session
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
      await sessionCache.set(
        `${this.sessionPrefix}:${sessionId}`,
        session,
        {
          ttl: mergedOptions.maxAge,
          tags: ['sessions', `user:${sessionData.userId}`],
          layer: 'both',
        }
      );

      // Track user sessions for concurrent session management
      await this.addUserSession(sessionData.userId, sessionId, mergedOptions.maxAge!);

      railwayLogger.info('Session created', {
        sessionId,
        userId: sessionData.userId,
        ttl: mergedOptions.maxAge,
      });

      return sessionId;
    } catch (error) {
      railwayLogger.error('Failed to create session', error, { sessionId });
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const session = await sessionCache.get<SessionData & { createdAt: number; sessionId: string }>(
        `${this.sessionPrefix}:${sessionId}`,
        { layer: 'both' }
      );

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
      railwayLogger.error('Failed to get session', error, { sessionId });
      return null;
    }
  }

  /**
   * Update session activity
   */
  async touchSession(sessionId: string, updateData?: Partial<SessionData>): Promise<boolean> {
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
      railwayLogger.error('Failed to touch session', error, { sessionId });
      return false;
    }
  }

  /**
   * Destroy a specific session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      // Remove from session cache
      await sessionCache.del(`${this.sessionPrefix}:${sessionId}`);

      // Remove from user sessions list
      await this.removeUserSession(session.userId, sessionId);

      railwayLogger.info('Session destroyed', {
        sessionId,
        userId: session.userId,
      });

      return true;
    } catch (error) {
      railwayLogger.error('Failed to destroy session', error, { sessionId });
      return false;
    }
  }

  /**
   * Destroy all sessions for a user
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

      railwayLogger.info('All user sessions destroyed', {
        userId,
        destroyedCount,
      });

      return destroyedCount;
    } catch (error) {
      railwayLogger.error('Failed to destroy user sessions', error, { userId });
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
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
      railwayLogger.error('Failed to get user sessions', error, { userId });
      return [];
    }
  }

  /**
   * Get session statistics
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
        activeUsers: 0,   // Would need to implement user counting
        avgSessionDuration: 0, // Would need to track session durations
        cacheStats: cacheMetrics,
      };
    } catch (error) {
      railwayLogger.error('Failed to get session stats', error);
      return {
        totalSessions: 0,
        activeUsers: 0,
        avgSessionDuration: 0,
        cacheStats: null,
      };
    }
  }

  /**
   * Cleanup expired sessions (should be called periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      // This is a simplified cleanup - in production you'd want a more efficient approach
      // Perhaps using Redis SCAN or maintaining an expiration index
      
      railwayLogger.info('Session cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      railwayLogger.error('Session cleanup failed', error);
      return 0;
    }
  }

  // Private methods

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async addUserSession(userId: string, sessionId: string, ttl: number): Promise<void> {
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

  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
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

// Export singleton instance
export const sessionManager = new DistributedSessionManager();

// Session middleware utilities
export class SessionMiddleware {
  /**
   * Extract session from request headers
   */
  static getSessionIdFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }

  /**
   * Create session cookie
   */
  static createSessionCookie(sessionId: string, options: SessionOptions = {}): string {
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
   * Clear session cookie
   */
  static clearSessionCookie(): string {
    return 'session=; Max-Age=0; Path=/';
  }
}

export default sessionManager;