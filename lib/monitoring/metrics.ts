// lib/monitoring/metrics.ts

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
  record(name: string, value: number, unit = 'count', tags: Record<string, string> = {}): void {
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
  recordPerformance(operation: string, duration: number, status: 'success' | 'error' = 'success', metadata?: Record<string, any>): void {
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
    
    const successfulOperations = this.performanceMetrics.filter(m => m.status === 'success');
    const averageResponseTime = successfulOperations.length > 0
      ? successfulOperations.reduce((sum, m) => sum + m.duration, 0) / successfulOperations.length
      : 0;

    const errorRate = totalPerformanceMetrics > 0
      ? (this.performanceMetrics.filter(m => m.status === 'error').length / totalPerformanceMetrics) * 100
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

// Performance timing decorator
export function timed(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      let status: 'success' | 'error' = 'success';
      let error: any;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (e) {
        status = 'error';
        error = e;
        throw e;
      } finally {
        const duration = Date.now() - start;
        metrics.recordPerformance(operation, duration, status, { error: error?.message });
      }
    };

    return descriptor;
  };
}

// API call timing utility
export async function timeAsyncOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = Date.now();
  let status: 'success' | 'error' = 'success';
  let error: any;

  try {
    const result = await fn();
    return result;
  } catch (e) {
    status = 'error';
    error = e;
    throw e;
  } finally {
    const duration = Date.now() - start;
    metrics.recordPerformance(operation, duration, status, { 
      ...metadata,
      error: error?.message 
    });
  }
}

// Business metrics helpers
export const BusinessMetrics = {
  recordPatientCreated(): void {
    metrics.record('patients.created', 1);
  },

  recordAppointmentScheduled(type: string): void {
    metrics.record('appointments.scheduled', 1, 'count', { type });
  },

  recordAppointmentCompleted(type: string): void {
    metrics.record('appointments.completed', 1, 'count', { type });
  },

  recordReportGenerated(provider: string): void {
    metrics.record('reports.generated', 1, 'count', { provider });
  },

  recordUserLogin(role: string): void {
    metrics.record('users.login', 1, 'count', { role });
  },

  recordAPICall(endpoint: string, method: string, statusCode: number): void {
    metrics.record('api.calls', 1, 'count', { endpoint, method, status: statusCode.toString() });
  },

  recordCacheHit(key: string): void {
    metrics.record('cache.hits', 1, 'count', { key });
  },

  recordCacheMiss(key: string): void {
    metrics.record('cache.misses', 1, 'count', { key });
  },
};

export default metrics;