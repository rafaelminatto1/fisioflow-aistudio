// lib/cache-metrics.ts - Advanced Cache Metrics and Monitoring System
import {
  cache,
  patientCache,
  appointmentCache,
  reportCache,
  analyticsCache,
  sessionCache,
  queryCache,
  CacheWarmer,
} from './cache';
import { cacheInvalidator } from './cache-invalidation';
import { sessionManager } from './session-cache';
import edgeLogger from './edge-logger';
import redis from './redis';

export interface CacheMetricsSummary {
  timestamp: number;
  overall: {
    hitRate: number;
    totalOperations: number;
    totalHits: number;
    totalMisses: number;
    avgResponseTime: number;
    errorRate: number;
  };
  managers: {
    [key: string]: {
      hitRate: number;
      operations: number;
      hits: number;
      misses: number;
      memoryHits: number;
      redisHits: number;
      avgResponseTime: number;
      totalSize: number;
      errors: number;
    };
  };
  redis: any;
  invalidation: {
    rulesCount: number;
    queueSize: number;
    processing: boolean;
  };
  session: {
    totalSessions: number;
    activeUsers: number;
    avgSessionDuration: number;
  };
}

export interface AlertRule {
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  duration: number; // Duration in seconds to trigger alert
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

export interface MetricAlert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export class CacheMetricsManager {
  private alerts: MetricAlert[] = [];
  private alertRules: AlertRule[] = [];
  private metricsHistory: CacheMetricsSummary[] = [];
  private maxHistorySize = 1440; // 24 hours at 1-minute intervals
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Setup default alert rules for cache monitoring
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        metric: 'overall.hitRate',
        condition: 'below',
        threshold: 50,
        duration: 300, // 5 minutes
        severity: 'medium',
        description: 'Cache hit rate is below 50%',
        enabled: true,
      },
      {
        metric: 'overall.hitRate',
        condition: 'below',
        threshold: 30,
        duration: 180, // 3 minutes
        severity: 'high',
        description: 'Cache hit rate is critically low',
        enabled: true,
      },
      {
        metric: 'overall.avgResponseTime',
        condition: 'above',
        threshold: 100, // 100ms
        duration: 300,
        severity: 'medium',
        description: 'Cache response time is high',
        enabled: true,
      },
      {
        metric: 'overall.errorRate',
        condition: 'above',
        threshold: 5, // 5%
        duration: 120,
        severity: 'high',
        description: 'Cache error rate is elevated',
        enabled: true,
      },
      {
        metric: 'managers.sessions.totalSize',
        condition: 'above',
        threshold: 500 * 1024 * 1024, // 500MB
        duration: 600,
        severity: 'medium',
        description: 'Session cache size is high',
        enabled: true,
      },
      {
        metric: 'invalidation.queueSize',
        condition: 'above',
        threshold: 100,
        duration: 300,
        severity: 'medium',
        description: 'Cache invalidation queue is backing up',
        enabled: true,
      },
    ];
  }

  /**
   * Start monitoring cache metrics
   */
  startMonitoring(intervalMs = 60000): void {
    // Default: 1 minute
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        edgeLogger.error('Failed to collect cache metrics', error as Error);
      }
    }, intervalMs);

    edgeLogger.info('Cache metrics monitoring started', { intervalMs });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      edgeLogger.info('Cache metrics monitoring stopped');
    }
  }

  /**
   * Collect comprehensive cache metrics
   */
  async collectMetrics(): Promise<CacheMetricsSummary> {
    const startTime = Date.now();

    try {
      // Collect metrics from all cache managers
      const managers = {
        default: cache.getMetrics(),
        patients: patientCache.getMetrics(),
        appointments: appointmentCache.getMetrics(),
        reports: reportCache.getMetrics(),
        analytics: analyticsCache.getMetrics(),
        sessions: sessionCache.getMetrics(),
        queries: queryCache.getMetrics(),
      };

      // Calculate overall metrics
      let totalHits = 0;
      let totalMisses = 0;
      let totalOperations = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      for (const [name, metrics] of Object.entries(managers)) {
        totalHits += metrics.hits;
        totalMisses += metrics.misses;
        totalOperations += metrics.operations;
        totalErrors += metrics.errors;

        if (metrics.avgResponseTime > 0) {
          totalResponseTime += metrics.avgResponseTime;
          responseTimeCount++;
        }
      }

      const overallHitRate =
        totalOperations > 0 ? (totalHits / totalOperations) * 100 : 0;

      const avgResponseTime =
        responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

      const errorRate =
        totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;

      // Get Redis stats
      const redisStats = await cache.getRedisStats();

      // Get invalidation stats
      const invalidationStats = cacheInvalidator.getStats();

      // Get session stats
      const sessionStats = await sessionManager.getSessionStats();

      const summary: CacheMetricsSummary = {
        timestamp: Date.now(),
        overall: {
          hitRate: parseFloat(overallHitRate.toFixed(2)),
          totalOperations,
          totalHits,
          totalMisses,
          avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
          errorRate: parseFloat(errorRate.toFixed(2)),
        },
        managers,
        redis: redisStats,
        invalidation: invalidationStats,
        session: sessionStats,
      };

      // Store in history
      this.addToHistory(summary);

      // Check for alerts
      this.checkAlerts(summary);

      edgeLogger.debug('Cache metrics collected', {
        hitRate: summary.overall.hitRate,
        operations: summary.overall.totalOperations,
        collectionTime: Date.now() - startTime,
      });

      return summary;
    } catch (error) {
      edgeLogger.error('Error collecting cache metrics', error as Error);
      throw error;
    }
  }

  /**
   * Add metrics summary to history
   */
  private addToHistory(summary: CacheMetricsSummary): void {
    this.metricsHistory.push(summary);

    // Keep only the last maxHistorySize entries
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(summary: CacheMetricsSummary): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const value = this.getMetricValue(summary, rule.metric);
        if (value === undefined) continue;

        const shouldAlert =
          rule.condition === 'above'
            ? value > rule.threshold
            : value < rule.threshold;

        if (shouldAlert) {
          this.triggerAlert(rule, value);
        } else {
          this.resolveAlert(rule);
        }
      } catch (error) {
        edgeLogger.error('Error checking alert rule', error as Error, {
          rule: rule.metric,
        });
      }
    }
  }

  /**
   * Get metric value by path
   */
  private getMetricValue(
    summary: CacheMetricsSummary,
    metricPath: string
  ): number | undefined {
    const parts = metricPath.split('.');
    let value: any = summary;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return typeof value === 'number' ? value : undefined;
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, value: number): void {
    // Check if there's already an active alert for this rule
    const existingAlert = this.alerts.find(
      alert => alert.rule.metric === rule.metric && !alert.resolved
    );

    if (existingAlert) return; // Alert already active

    const alert: MetricAlert = {
      id: `${rule.metric}-${Date.now()}`,
      rule: { ...rule },
      value,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);

    edgeLogger.warn('Cache alert triggered', {
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      condition: rule.condition,
      severity: rule.severity,
    });

    // Send notification (implement your notification logic here)
    this.sendNotification(alert);
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(rule: AlertRule): void {
    const activeAlert = this.alerts.find(
      alert => alert.rule.metric === rule.metric && !alert.resolved
    );

    if (activeAlert) {
      activeAlert.resolved = true;
      activeAlert.resolvedAt = Date.now();

      edgeLogger.info('Cache alert resolved', {
        metric: rule.metric,
        duration: activeAlert.resolvedAt - activeAlert.timestamp,
      });
    }
  }

  /**
   * Send notification for alert (placeholder)
   */
  private sendNotification(alert: MetricAlert): void {
    //  Implement actual notification logic
    // This could send to Slack, email, webhook, etc.
    edgeLogger.info('Alert notification would be sent', {
      alertId: alert.id,
      severity: alert.rule.severity,
    });
  }

  /**
   * Get current metrics summary
   */
  async getCurrentMetrics(): Promise<CacheMetricsSummary> {
    return await this.collectMetrics();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(minutes = 60): CacheMetricsSummary[] {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    return this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MetricAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(limit = 100): MetricAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    edgeLogger.info('Alert rule added', { metric: rule.metric });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(metric: string): void {
    const initialLength = this.alertRules.length;
    this.alertRules = this.alertRules.filter(rule => rule.metric !== metric);

    if (this.alertRules.length < initialLength) {
      edgeLogger.info('Alert rule removed', { metric });
    }
  }

  /**
   * Update alert rule
   */
  updateAlertRule(metric: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.find(r => r.metric === metric);
    if (rule) {
      Object.assign(rule, updates);
      edgeLogger.info('Alert rule updated', { metric });
    }
  }

  /**
   * Get cache performance report
   */
  getPerformanceReport(hours = 24): {
    summary: {
      avgHitRate: number;
      totalOperations: number;
      peakHitRate: number;
      lowestHitRate: number;
      avgResponseTime: number;
    };
    trends: {
      hitRate: Array<{ timestamp: number; value: number }>;
      responseTime: Array<{ timestamp: number; value: number }>;
      operations: Array<{ timestamp: number; value: number }>;
    };
    recommendations: string[];
  } {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const relevantMetrics = this.metricsHistory.filter(
      m => m.timestamp >= cutoffTime
    );

    if (relevantMetrics.length === 0) {
      return {
        summary: {
          avgHitRate: 0,
          totalOperations: 0,
          peakHitRate: 0,
          lowestHitRate: 0,
          avgResponseTime: 0,
        },
        trends: { hitRate: [], responseTime: [], operations: [] },
        recommendations: ['Insufficient data for analysis'],
      };
    }

    // Calculate summary
    const hitRates = relevantMetrics.map(m => m.overall.hitRate);
    const responseTimes = relevantMetrics.map(m => m.overall.avgResponseTime);
    const operations = relevantMetrics.map(m => m.overall.totalOperations);

    const avgHitRate = hitRates.reduce((a, b) => a + b, 0) / hitRates.length;
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const totalOperations = operations.reduce((a, b) => a + b, 0);
    const peakHitRate = Math.max(...hitRates);
    const lowestHitRate = Math.min(...hitRates);

    // Generate trends
    const trends = {
      hitRate: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        value: m.overall.hitRate,
      })),
      responseTime: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        value: m.overall.avgResponseTime,
      })),
      operations: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        value: m.overall.totalOperations,
      })),
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (avgHitRate < 60) {
      recommendations.push(
        'Consider increasing cache TTL for frequently accessed data'
      );
    }

    if (avgResponseTime > 50) {
      recommendations.push(
        'Cache response times are high - consider memory cache optimization'
      );
    }

    if (peakHitRate - lowestHitRate > 30) {
      recommendations.push(
        'Hit rate varies significantly - review cache invalidation patterns'
      );
    }

    const memoryUsage = relevantMetrics[relevantMetrics.length - 1]?.managers;
    if (memoryUsage) {
      const totalMemorySize = Object.values(memoryUsage).reduce(
        (sum, m) => sum + m.totalSize,
        0
      );
      if (totalMemorySize > 800 * 1024 * 1024) {
        // 800MB
        recommendations.push(
          'Memory cache usage is high - consider implementing cache eviction policies'
        );
      }
    }

    return {
      summary: {
        avgHitRate: parseFloat(avgHitRate.toFixed(2)),
        totalOperations,
        peakHitRate,
        lowestHitRate,
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      },
      trends,
      recommendations,
    };
  }

  /**
   * Get cache health score (0-100)
   */
  getCacheHealthScore(): number {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) return 0;

    let score = 100;
    const metrics = latest.overall;

    // Hit rate score (40% weight)
    const hitRateScore = Math.min(metrics.hitRate, 100);
    score = score * 0.6 + hitRateScore * 0.4;

    // Response time score (30% weight)
    const responseTimeScore = Math.max(0, 100 - metrics.avgResponseTime / 2);
    score = score * 0.7 + responseTimeScore * 0.3;

    // Error rate score (20% weight)
    const errorRateScore = Math.max(0, 100 - metrics.errorRate * 10);
    score = score * 0.8 + errorRateScore * 0.2;

    // Active alerts penalty (10% weight)
    const activeAlertsCount = this.getActiveAlerts().length;
    const alertsPenalty = Math.min(activeAlertsCount * 10, 50);
    score = score * 0.9 + Math.max(0, 100 - alertsPenalty) * 0.1;

    return Math.max(0, Math.min(100, parseFloat(score.toFixed(1))));
  }
}

// Export singleton instance
export const cacheMetrics = new CacheMetricsManager();

// Utility functions
export const CacheMetricsUtils = {
  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format duration to human readable string
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  },

  /**
   * Get cache status color based on health score
   */
  getHealthColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  },
};

export default cacheMetrics;
