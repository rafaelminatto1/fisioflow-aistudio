// lib/monitoring/metrics.ts
import { structuredLogger } from './logger';

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];

  // Record a custom metric
  record(
    name: string,
    value: number,
    unit = 'count',
    tags: Record<string, string> = {}
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    });

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Record performance timing
  recordPerformance(
    operation: string,
    duration: number,
    status: 'success' | 'error' = 'success',
    metadata?: Record<string, any>
  ): void {
    this.performanceMetrics.push({
      operation,
      duration,
      status,
      metadata,
    });

    // Keep only last 500 performance metrics in memory
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-500);
    }
  }

  // Get metrics summary
  getSummary(): {
    totalMetrics: number;
    totalPerformanceMetrics: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const totalMetrics = this.metrics.length;
    const totalPerformanceMetrics = this.performanceMetrics.length;

    const successfulOperations = this.performanceMetrics.filter(
      m => m.status === 'success'
    );
    const averageResponseTime =
      successfulOperations.length > 0
        ? successfulOperations.reduce((sum, m) => sum + m.duration, 0) /
          successfulOperations.length
        : 0;

    const errorRate =
      totalPerformanceMetrics > 0
        ? (this.performanceMetrics.filter(m => m.status === 'error').length /
            totalPerformanceMetrics) *
          100
        : 0;

    return {
      totalMetrics,
      totalPerformanceMetrics,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  // Get recent metrics
  getRecentMetrics(limit = 50): Metric[] {
    return this.metrics.slice(-limit);
  }

  // Get recent performance metrics
  getRecentPerformanceMetrics(limit = 50): PerformanceMetric[] {
    return this.performanceMetrics.slice(-limit);
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.performanceMetrics = [];
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Business Metrics class for higher-level metrics
export class BusinessMetrics {
  static recordAPICall(
    endpoint: string,
    method: string,
    statusCode: number
  ): void {
    metrics.record('api_calls_total', 1, 'count', {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    structuredLogger.http('API call recorded', {
      endpoint,
      method,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }

  static recordBusinessEvent(
    eventType: string,
    metadata: Record<string, any> = {}
  ): void {
    metrics.record('business_events', 1, 'count', {
      eventType,
      ...metadata,
    });

    structuredLogger.info('Business event recorded', {
      eventType,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  static recordSecurityEvent(type: string, severity: string): void {
    metrics.record('security_events', 1, 'count', {
      type,
      severity,
    });

    structuredLogger.logSecurityEvent('Security event recorded', {
      type,
      severity,
      timestamp: new Date().toISOString(),
    });
  }

  static recordPerformance(
    operation: string,
    duration: number,
    status: 'success' | 'error' = 'success'
  ): void {
    metrics.recordPerformance(operation, duration, status);

    structuredLogger.info('Performance recorded', {
      operation,
      duration,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

// Timing decorator for automatic performance tracking
export function timed(operation: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        BusinessMetrics.recordPerformance(
          `${operation}.${propertyName}`,
          duration,
          'success'
        );
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        BusinessMetrics.recordPerformance(
          `${operation}.${propertyName}`,
          duration,
          'error'
        );
        throw error;
      }
    };

    return descriptor;
  };
}

// Utility function for timing async operations
export async function timeAsyncOperation<T>(
  operation: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await asyncFn();
    const duration = Date.now() - start;
    BusinessMetrics.recordPerformance(operation, duration, 'success');
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    BusinessMetrics.recordPerformance(operation, duration, 'error');
    throw error;
  }
}
