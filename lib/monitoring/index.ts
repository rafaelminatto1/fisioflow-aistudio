import { neonConfig, checkNeonHealth, getNeonMetrics } from '../neon-config';
import { logger } from '../logger';

export interface MonitoringMetrics {
  timestamp: Date;
  database: {
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    performance: {
      avgQueryTime: number;
      slowQueries: number;
      errorRate: number;
    };
    storage: {
      used: number;
      available: number;
      percentage: number;
    };
  };
  compute: {
    cpu: number;
    memory: number;
    status: 'active' | 'idle' | 'suspended';
    autoscaling: boolean;
  };
  api: {
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metric: string;
  value: number;
  threshold: number;
}

export class NeonMonitoring {
  private alerts: Alert[] = [];
  private metrics: MonitoringMetrics[] = [];
  private thresholds = {
    cpu: 80,
    memory: 85,
    connections: 90,
    errorRate: 5,
    responseTime: 1000,
    storage: 90
  };

  async collectMetrics(): Promise<MonitoringMetrics> {
    try {
      const [healthCheck, neonMetrics] = await Promise.all([
        checkNeonHealth(),
        getNeonMetrics()
      ]);
      
      const metrics: MonitoringMetrics = {
        timestamp: new Date(),
        database: {
          connections: {
            active: Number(neonMetrics.connectionStats?.active_connections) || 0,
            idle: Number(neonMetrics.connectionStats?.idle_connections) || 0,
            total: Number(neonMetrics.connectionStats?.total_connections) || 0
          },
          performance: {
            avgQueryTime: healthCheck.latency || 0,
            slowQueries: 0, // Not available from current metrics
            errorRate: healthCheck.status === 'unhealthy' ? 100 : 0
          },
          storage: {
            used: 0, // Not available from current metrics
            available: 0, // Not available from current metrics
            percentage: 0 // Not available from current metrics
          }
        },
        compute: {
          cpu: 0, // Not available from current metrics
          memory: 0, // Not available from current metrics
          status: healthCheck.status === 'healthy' ? 'active' : 'idle',
          autoscaling: false // Not available from current metrics
        },
        api: {
          responseTime: healthCheck.latency || 0,
          errorRate: healthCheck.status === 'unhealthy' ? 100 : 0,
          requestsPerMinute: 0 // Not available from current metrics
        }
      };

      this.metrics.push(metrics);
      this.checkThresholds(metrics);
      
      // Manter apenas as últimas 1000 métricas
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      return metrics;
    } catch (error) {
      logger.error('Erro ao coletar métricas:', error);
      throw error;
    }
  }

  private checkThresholds(metrics: MonitoringMetrics): void {
    const checks = [
      {
        metric: 'cpu',
        value: metrics.compute.cpu,
        threshold: this.thresholds.cpu,
        message: `CPU usage is ${metrics.compute.cpu}%`
      },
      {
        metric: 'memory',
        value: metrics.compute.memory / 1024, // Convert to GB
        threshold: this.thresholds.memory,
        message: `Memory usage is ${(metrics.compute.memory / 1024).toFixed(2)}GB`
      },
      {
        metric: 'connections',
        value: (metrics.database.connections.active / metrics.database.connections.total) * 100,
        threshold: this.thresholds.connections,
        message: `Connection usage is ${((metrics.database.connections.active / metrics.database.connections.total) * 100).toFixed(1)}%`
      },
      {
        metric: 'errorRate',
        value: metrics.database.performance.errorRate,
        threshold: this.thresholds.errorRate,
        message: `Error rate is ${metrics.database.performance.errorRate}%`
      },
      {
        metric: 'responseTime',
        value: metrics.api.responseTime,
        threshold: this.thresholds.responseTime,
        message: `API response time is ${metrics.api.responseTime}ms`
      },
      {
        metric: 'storage',
        value: metrics.database.storage.percentage,
        threshold: this.thresholds.storage,
        message: `Storage usage is ${metrics.database.storage.percentage.toFixed(1)}%`
      }
    ];

    checks.forEach(check => {
      if (check.value > check.threshold) {
        this.createAlert({
          type: check.value > check.threshold * 1.2 ? 'critical' : 'warning',
          message: check.message,
          metric: check.metric,
          value: check.value,
          threshold: check.threshold
        });
      }
    });
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);
    logger.warn(`Alert created: ${alert.message}`, { alert });

    // Enviar notificação se crítico
    if (alert.type === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  private async sendCriticalAlert(alert: Alert): Promise<void> {
    try {
      // Implementar notificação via email, Slack, etc.
      logger.error(`CRITICAL ALERT: ${alert.message}`, { alert });
      
      // Aqui você pode integrar com serviços de notificação
      // como SendGrid, Slack, Discord, etc.
    } catch (error) {
      logger.error('Erro ao enviar alerta crítico:', error);
    }
  }

  getMetrics(limit: number = 100): MonitoringMetrics[] {
    return this.metrics.slice(-limit);
  }

  getAlerts(resolved: boolean = false): Alert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`Alert resolved: ${alert.message}`, { alertId });
      return true;
    }
    return false;
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    activeAlerts: number;
    lastMetrics: MonitoringMetrics | null;
  } {
    const activeAlerts = this.getAlerts(false);
    const criticalAlerts = activeAlerts.filter(a => a.type === 'critical');
    const warningAlerts = activeAlerts.filter(a => a.type === 'warning');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'warning';
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      lastMetrics: this.metrics[this.metrics.length - 1] || null
    };
  }

  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Monitoring thresholds updated', { thresholds: this.thresholds });
  }
}

// Instância singleton
export const monitoring = new NeonMonitoring();

// Função para iniciar monitoramento automático
export function startMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('Starting Neon monitoring', { interval: intervalMs });
  
  return setInterval(async () => {
    try {
      await monitoring.collectMetrics();
    } catch (error) {
      logger.error('Erro no monitoramento automático:', error);
    }
  }, intervalMs);
}

// Função para parar monitoramento
export function stopMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  logger.info('Neon monitoring stopped');
}