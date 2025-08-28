// lib/cache-invalidation.ts - Intelligent Cache Invalidation System
import {
  cache,
  patientCache,
  appointmentCache,
  reportCache,
  analyticsCache,
  sessionCache,
  queryCache,
} from './cache';
import { sessionManager } from './session-cache';
import edgeLogger from './edge-logger';

export interface InvalidationRule {
  trigger: string; // The event that triggers invalidation
  targets: string[]; // Cache keys/tags to invalidate
  delay?: number; // Optional delay before invalidation (ms)
  cascade?: boolean; // Whether to cascade to related data
  condition?: (data: any) => boolean; // Optional condition to check
}

export interface InvalidationEvent {
  type: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class CacheInvalidationManager {
  private rules: InvalidationRule[] = [];
  private eventQueue: InvalidationEvent[] = [];
  private processing = false;

  constructor() {
    this.setupDefaultRules();
    this.startEventProcessor();
  }

  /**
   * Setup default invalidation rules for common scenarios
   */
  private setupDefaultRules(): void {
    // Patient-related invalidation rules
    this.addRule({
      trigger: 'patient:created',
      targets: ['model:Patient', 'analytics:dashboard'],
      cascade: true,
    });

    this.addRule({
      trigger: 'patient:updated',
      targets: ['model:Patient', 'analytics:dashboard'],
      cascade: true,
    });

    this.addRule({
      trigger: 'patient:deleted',
      targets: [
        'model:Patient',
        'model:Appointment',
        'model:Report',
        'analytics:dashboard',
      ],
      cascade: true,
    });

    // Appointment-related invalidation rules
    this.addRule({
      trigger: 'appointment:created',
      targets: ['model:Appointment', 'daily-schedule', 'analytics:dashboard'],
      cascade: true,
    });

    this.addRule({
      trigger: 'appointment:updated',
      targets: ['model:Appointment', 'daily-schedule', 'analytics:dashboard'],
      cascade: true,
    });

    this.addRule({
      trigger: 'appointment:cancelled',
      targets: ['model:Appointment', 'daily-schedule', 'analytics:dashboard'],
      cascade: true,
    });

    // Report-related invalidation rules
    this.addRule({
      trigger: 'report:created',
      targets: ['model:Report', 'analytics:dashboard'],
      cascade: false,
    });

    this.addRule({
      trigger: 'report:updated',
      targets: ['model:Report', 'analytics:dashboard'],
      cascade: false,
    });

    // User/Session-related invalidation rules
    this.addRule({
      trigger: 'user:login',
      targets: ['analytics:dashboard'],
      cascade: false,
    });

    this.addRule({
      trigger: 'user:logout',
      targets: ['sessions'],
      cascade: false,
    });

    this.addRule({
      trigger: 'user:updated',
      targets: ['model:User', 'sessions'],
      cascade: true,
    });

    // Analytics-related invalidation rules
    this.addRule({
      trigger: 'analytics:refresh',
      targets: ['analytics:dashboard', 'model:Analytics'],
      delay: 5000, // 5 second delay to allow data consistency
      cascade: false,
    });

    // Time-based invalidation rules
    this.addRule({
      trigger: 'schedule:daily_change',
      targets: ['daily-schedule', 'model:Appointment'],
      cascade: false,
    });
  }

  /**
   * Add a custom invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    this.rules.push(rule);
    edgeLogger.debug('Cache invalidation rule added', {
      trigger: rule.trigger,
      targets: rule.targets.length,
    });
  }

  /**
   * Remove invalidation rules by trigger
   */
  removeRule(trigger: string): void {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.trigger !== trigger);
    const removedCount = initialLength - this.rules.length;

    if (removedCount > 0) {
      edgeLogger.info('Cache invalidation rules removed', {
        trigger,
        removedCount,
      });
    }
  }

  /**
   * Trigger cache invalidation for a specific event
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Add to event queue
      this.eventQueue.push(event);

      // Process immediately if not already processing
      if (!this.processing) {
        await this.processEventQueue();
      }

      edgeLogger.info('Cache invalidation triggered', {
        eventType: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      edgeLogger.error(`Cache invalidation failed for event ${event.type}`, error as Error);
      throw error;
    }
  }

  /**
   * Smart invalidation based on entity relationships
   */
  async smartInvalidate(
    entityType: string,
    entityId: string,
    operation: string
  ): Promise<void> {
    const event: InvalidationEvent = {
      type: `${entityType}:${operation}`,
      entityType,
      entityId,
      timestamp: Date.now(),
    };

    await this.invalidate(event);
  }

  /**
   * Bulk invalidation for multiple entities
   */
  async bulkInvalidate(events: InvalidationEvent[]): Promise<void> {
    const startTime = Date.now();

    try {
      // Add all events to queue
      this.eventQueue.push(...events);

      // Process queue
      await this.processEventQueue();

      edgeLogger.info('Bulk cache invalidation completed', {
        eventCount: events.length,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      edgeLogger.error(`Bulk cache invalidation failed for ${events.length} events`, error as Error);
      throw error;
    }
  }

  /**
   * Invalidate cache based on user context
   */
  async invalidateUserContext(
    userId: string,
    context: string[]
  ): Promise<void> {
    const event: InvalidationEvent = {
      type: 'user:context_change',
      entityType: 'User',
      entityId: userId,
      timestamp: Date.now(),
      metadata: { context },
    };

    await this.invalidate(event);
  }

  /**
   * Time-based cache invalidation (e.g., daily schedule changes)
   */
  async scheduleInvalidation(trigger: string, delay: number): Promise<void> {
    setTimeout(async () => {
      const event: InvalidationEvent = {
        type: trigger,
        entityType: 'Schedule',
        timestamp: Date.now(),
      };

      await this.invalidate(event);
    }, delay);

    edgeLogger.info('Cache invalidation scheduled', { trigger, delay });
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      edgeLogger.error('Error processing invalidation queue', error as Error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single invalidation event
   */
  private async processEvent(event: InvalidationEvent): Promise<void> {
    const matchingRules = this.rules.filter(
      rule => rule.trigger === event.type
    );

    if (matchingRules.length === 0) {
      edgeLogger.debug('No invalidation rules found for event', {
        eventType: event.type,
      });
      return;
    }

    for (const rule of matchingRules) {
      try {
        // Check condition if provided
        if (rule.condition && !rule.condition(event)) {
          continue;
        }

        // Apply delay if specified
        if (rule.delay) {
          setTimeout(() => this.executeRule(rule, event), rule.delay);
        } else {
          await this.executeRule(rule, event);
        }
      } catch (error) {
        edgeLogger.error(`Error executing invalidation rule: ${rule.trigger}`, error as Error);
      }
    }
  }

  /**
   * Execute a specific invalidation rule
   */
  private async executeRule(
    rule: InvalidationRule,
    event: InvalidationEvent
  ): Promise<void> {
    const startTime = Date.now();
    let invalidatedCount = 0;

    try {
      // Process each target
      for (const target of rule.targets) {
        await this.invalidateTarget(target, event, rule.cascade);
        invalidatedCount++;
      }

      // If cascade is enabled, invalidate related data
      if (rule.cascade && event.entityId) {
        await this.cascadeInvalidation(event);
      }

      edgeLogger.debug('Invalidation rule executed', {
        trigger: rule.trigger,
        targets: invalidatedCount,
        cascade: rule.cascade,
        executionTime: Date.now() - startTime,
      });
    } catch (error) {
      edgeLogger.error(`Failed to execute invalidation rule: ${rule.trigger}`, error as Error);
      throw error;
    }
  }

  /**
   * Invalidate a specific target (tag or key pattern)
   */
  private async invalidateTarget(
    target: string,
    event: InvalidationEvent,
    cascade?: boolean
  ): Promise<void> {
    try {
      if (target.startsWith('model:')) {
        // Invalidate database model cache
        const modelName = target.replace('model:', '');
        await this.invalidateModelCache(modelName, event.entityId);
      } else if (target.includes(':')) {
        // Invalidate specific cache manager by tag
        const [cacheType, tag] = target.split(':', 2);
        await this.invalidateCacheByType(cacheType, tag);
      } else {
        // Invalidate generic tag across all caches
        await this.invalidateGenericTag(target);
      }
    } catch (error) {
      edgeLogger.error(`Failed to invalidate target: ${target}`, error as Error);
      throw error;
    }
  }

  /**
   * Invalidate model cache
   */
  private async invalidateModelCache(
    modelName: string,
    entityId?: string
  ): Promise<void> {
    switch (modelName) {
      case 'Patient':
        if (entityId) {
          // await PrismaCache.invalidatePatient(entityId);
        } else {
          // await PrismaCache.invalidatePatients();
        }
        break;

      case 'Appointment':
        if (entityId) {
          // await PrismaCache.invalidateAppointment(entityId);
        } else {
          // await PrismaCache.invalidateAppointments();
        }
        break;

      case 'Report':
        // await PrismaCache.invalidateReports();
        break;

      case 'User':
        if (entityId) {
          // await PrismaCache.invalidateUserData(entityId);
          await sessionManager.destroyUserSessions(entityId);
        }
        break;

      default:
        edgeLogger.warn('Unknown model for cache invalidation', { modelName });
    }
  }

  /**
   * Invalidate cache by type and tag
   */
  private async invalidateCacheByType(
    cacheType: string,
    tag: string
  ): Promise<void> {
    switch (cacheType) {
      case 'patients':
        await patientCache.invalidateTag(tag);
        break;

      case 'appointments':
        await appointmentCache.invalidateTag(tag);
        break;

      case 'reports':
        await reportCache.invalidateTag(tag);
        break;

      case 'analytics':
        await analyticsCache.invalidateTag(tag);
        break;

      case 'sessions':
        await sessionCache.invalidateTag(tag);
        break;

      case 'queries':
        await queryCache.invalidateTag(tag);
        break;

      default:
        await cache.invalidateTag(tag);
    }
  }

  /**
   * Invalidate generic tag across all cache managers
   */
  private async invalidateGenericTag(tag: string): Promise<void> {
    await Promise.all([
      cache.invalidateTag(tag),
      patientCache.invalidateTag(tag),
      appointmentCache.invalidateTag(tag),
      reportCache.invalidateTag(tag),
      analyticsCache.invalidateTag(tag),
      sessionCache.invalidateTag(tag),
      queryCache.invalidateTag(tag),
    ]);
  }

  /**
   * Cascade invalidation to related entities
   */
  private async cascadeInvalidation(event: InvalidationEvent): Promise<void> {
    if (!event.entityId) return;

    try {
      switch (event.entityType) {
        case 'Patient':
          // Invalidate patient-related data
          // await PrismaCache.invalidatePatientRelated(event.entityId);
          break;

        case 'Appointment':
          // Invalidate appointment-related schedules
          await analyticsCache.invalidateTag('daily-schedule');
          break;

        case 'User':
          // Invalidate user sessions and related data
          if (event.userId || event.entityId) {
            const userId = event.userId || event.entityId;
            await sessionManager.destroyUserSessions(userId);
            // await PrismaCache.invalidateUserData(userId);
          }
          break;
      }

      edgeLogger.debug('Cascade invalidation completed', {
        entityType: event.entityType,
        entityId: event.entityId,
      });
    } catch (error) {
      edgeLogger.error(`Cascade invalidation failed for ${event.entityType}`, error as Error);
    }
  }

  /**
   * Start the event processor (runs periodically)
   */
  private startEventProcessor(): void {
    setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, 1000); // Process every second
  }

  /**
   * Get invalidation statistics
   */
  getStats(): {
    rulesCount: number;
    queueSize: number;
    processing: boolean;
  } {
    return {
      rulesCount: this.rules.length,
      queueSize: this.eventQueue.length,
      processing: this.processing,
    };
  }
}

// Export singleton instance
export const cacheInvalidator = new CacheInvalidationManager();

// Convenience functions for common invalidation scenarios
export const CacheInvalidation = {
  // Patient operations
  async patientCreated(patientId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('Patient', patientId, 'created');
  },

  async patientUpdated(patientId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('Patient', patientId, 'updated');
  },

  async patientDeleted(patientId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('Patient', patientId, 'deleted');
  },

  // Appointment operations
  async appointmentCreated(appointmentId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate(
      'Appointment',
      appointmentId,
      'created'
    );
  },

  async appointmentUpdated(appointmentId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate(
      'Appointment',
      appointmentId,
      'updated'
    );
  },

  async appointmentCancelled(appointmentId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate(
      'Appointment',
      appointmentId,
      'cancelled'
    );
  },

  // Report operations
  async reportCreated(reportId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('Report', reportId, 'created');
  },

  async reportUpdated(reportId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('Report', reportId, 'updated');
  },

  // User operations
  async userLogin(userId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('User', userId, 'login');
  },

  async userLogout(userId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('User', userId, 'logout');
  },

  async userUpdated(userId: string): Promise<void> {
    await cacheInvalidator.smartInvalidate('User', userId, 'updated');
  },

  // Daily operations
  async dailyScheduleChanged(date: string): Promise<void> {
    const event: InvalidationEvent = {
      type: 'schedule:daily_change',
      entityType: 'Schedule',
      timestamp: Date.now(),
      metadata: { date },
    };
    await cacheInvalidator.invalidate(event);
  },

  // Analytics refresh
  async refreshAnalytics(): Promise<void> {
    const event: InvalidationEvent = {
      type: 'analytics:refresh',
      entityType: 'Analytics',
      timestamp: Date.now(),
    };
    await cacheInvalidator.invalidate(event);
  },
};

export default cacheInvalidator;
