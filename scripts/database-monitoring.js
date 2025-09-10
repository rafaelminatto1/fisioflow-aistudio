const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configurações de monitoramento
const MONITORING_CONFIG = {
  // Limites de performance
  MAX_QUERY_TIME: 5000, // 5 segundos
  MAX_CONNECTIONS: 80, // 80% do limite
  MAX_DB_SIZE: 1000, // 1GB em MB
  
  // Intervalos de verificação
  CHECK_INTERVAL: 60000, // 1 minuto
  LOG_RETENTION_DAYS: 7,
  
  // Alertas
  ALERT_EMAIL: process.env.ALERT_EMAIL || 'admin@fisioflow.com',
  WEBHOOK_URL: process.env.MONITORING_WEBHOOK_URL
};

// Classe para monitoramento do banco
class DatabaseMonitor {
  constructor() {
    this.isRunning = false;
    this.metrics = {
      connections: 0,
      queryCount: 0,
      slowQueries: 0,
      errors: 0,
      lastCheck: null
    };
    
    this.setupLogging();
  }
  
  setupLogging() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.logFile = path.join(logsDir, `db-monitor-${new Date().toISOString().split('T')[0]}.log`);
  }
  
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    
    // Salvar no arquivo de log
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }
  
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Teste de conectividade
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Verificar estatísticas do banco
      const stats = await this.getDatabaseStats();
      
      // Verificar queries lentas
      const slowQueries = await this.getSlowQueries();
      
      // Verificar tamanho do banco
      const dbSize = await this.getDatabaseSize();
      
      // Atualizar métricas
      this.metrics = {
        ...this.metrics,
        responseTime,
        dbSize,
        slowQueriesCount: slowQueries.length,
        lastCheck: new Date()
      };
      
      // Verificar alertas
      await this.checkAlerts({
        responseTime,
        dbSize,
        slowQueries,
        stats
      });
      
      this.log('info', 'Health check completed', {
        responseTime,
        dbSize,
        slowQueriesCount: slowQueries.length
      });
      
      return {
        status: 'healthy',
        responseTime,
        dbSize,
        metrics: this.metrics
      };
      
    } catch (error) {
      this.metrics.errors++;
      this.log('error', 'Health check failed', { error: error.message });
      
      await this.sendAlert('Database health check failed', {
        error: error.message,
        timestamp: new Date()
      });
      
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  async getDatabaseStats() {
    try {
      // Estatísticas de conexões
      const connections = await prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `;
      
      // Estatísticas de tabelas
      const tableStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
      
      return {
        connections: connections[0]?.active_connections || 0,
        tables: tableStats
      };
    } catch (error) {
      this.log('error', 'Failed to get database stats', { error: error.message });
      return { connections: 0, tables: [] };
    }
  }
  
  async getSlowQueries() {
    try {
      // Queries que demoram mais que o limite configurado
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          mean_exec_time,
          calls,
          total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > ${MONITORING_CONFIG.MAX_QUERY_TIME}
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `;
      
      return slowQueries;
    } catch (error) {
      // pg_stat_statements pode não estar habilitado
      this.log('warn', 'Could not get slow queries (pg_stat_statements not available)');
      return [];
    }
  }
  
  async getDatabaseSize() {
    try {
      const result = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `;
      
      const sizeBytes = parseInt(result[0]?.size_bytes || 0);
      const sizeMB = Math.round(sizeBytes / 1024 / 1024);
      
      return {
        pretty: result[0]?.size || '0 bytes',
        bytes: sizeBytes,
        mb: sizeMB
      };
    } catch (error) {
      this.log('error', 'Failed to get database size', { error: error.message });
      return { pretty: 'unknown', bytes: 0, mb: 0 };
    }
  }
  
  async checkAlerts(data) {
    const alerts = [];
    
    // Verificar tempo de resposta
    if (data.responseTime > MONITORING_CONFIG.MAX_QUERY_TIME) {
      alerts.push({
        type: 'performance',
        message: `High response time: ${data.responseTime}ms`,
        severity: 'warning'
      });
    }
    
    // Verificar tamanho do banco
    if (data.dbSize.mb > MONITORING_CONFIG.MAX_DB_SIZE) {
      alerts.push({
        type: 'storage',
        message: `Database size exceeded limit: ${data.dbSize.pretty}`,
        severity: 'warning'
      });
    }
    
    // Verificar queries lentas
    if (data.slowQueries.length > 0) {
      alerts.push({
        type: 'performance',
        message: `${data.slowQueries.length} slow queries detected`,
        severity: 'info',
        details: data.slowQueries
      });
    }
    
    // Verificar conexões
    if (data.stats.connections > MONITORING_CONFIG.MAX_CONNECTIONS) {
      alerts.push({
        type: 'connections',
        message: `High connection count: ${data.stats.connections}`,
        severity: 'critical'
      });
    }
    
    // Enviar alertas se necessário
    for (const alert of alerts) {
      await this.sendAlert(alert.message, alert);
    }
  }
  
  async sendAlert(message, data) {
    this.log('alert', message, data);
    
    // Enviar para webhook se configurado
    if (MONITORING_CONFIG.WEBHOOK_URL) {
      try {
        const fetch = require('node-fetch');
        await fetch(MONITORING_CONFIG.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 FisioFlow DB Alert: ${message}`,
            data
          })
        });
      } catch (error) {
        this.log('error', 'Failed to send webhook alert', { error: error.message });
      }
    }
  }
  
  async generateReport() {
    try {
      const health = await this.checkDatabaseHealth();
      const stats = await this.getDatabaseStats();
      
      const report = {
        timestamp: new Date(),
        health,
        stats,
        metrics: this.metrics,
        recommendations: this.getRecommendations(health, stats)
      };
      
      // Salvar relatório
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportFile = path.join(reportsDir, `db-report-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      this.log('info', 'Report generated', { file: reportFile });
      
      return report;
    } catch (error) {
      this.log('error', 'Failed to generate report', { error: error.message });
      throw error;
    }
  }
  
  getRecommendations(health, stats) {
    const recommendations = [];
    
    if (health.responseTime > 1000) {
      recommendations.push('Consider optimizing slow queries or adding database indexes');
    }
    
    if (health.dbSize.mb > 500) {
      recommendations.push('Database is growing large, consider archiving old data');
    }
    
    if (stats.connections > 50) {
      recommendations.push('High connection count, consider connection pooling');
    }
    
    return recommendations;
  }
  
  start() {
    if (this.isRunning) {
      this.log('warn', 'Monitor is already running');
      return;
    }
    
    this.isRunning = true;
    this.log('info', 'Starting database monitor');
    
    // Verificação inicial
    this.checkDatabaseHealth();
    
    // Configurar verificações periódicas
    this.interval = setInterval(() => {
      this.checkDatabaseHealth();
    }, MONITORING_CONFIG.CHECK_INTERVAL);
    
    // Gerar relatório diário
    this.dailyReport = setInterval(() => {
      this.generateReport();
    }, 24 * 60 * 60 * 1000); // 24 horas
  }
  
  stop() {
    if (!this.isRunning) {
      this.log('warn', 'Monitor is not running');
      return;
    }
    
    this.isRunning = false;
    this.log('info', 'Stopping database monitor');
    
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    if (this.dailyReport) {
      clearInterval(this.dailyReport);
    }
  }
  
  async cleanup() {
    // Limpar logs antigos
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MONITORING_CONFIG.LOG_RETENTION_DAYS);
      
      for (const file of files) {
        if (file.startsWith('db-monitor-')) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.log('info', `Cleaned up old log file: ${file}`);
          }
        }
      }
    }
  }
}

// CLI Interface
if (require.main === module) {
  const monitor = new DatabaseMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      monitor.start();
      
      // Manter o processo rodando
      process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, stopping monitor...');
        monitor.stop();
        process.exit(0);
      });
      
      // Manter o processo vivo
      setInterval(() => {}, 1000);
      break;
      
    case 'check':
      monitor.checkDatabaseHealth()
        .then(result => {
          console.log('Health Check Result:', JSON.stringify(result, null, 2));
          process.exit(result.status === 'healthy' ? 0 : 1);
        })
        .catch(error => {
          console.error('Health check failed:', error);
          process.exit(1);
        });
      break;
      
    case 'report':
      monitor.generateReport()
        .then(report => {
          console.log('Database Report:', JSON.stringify(report, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error('Report generation failed:', error);
          process.exit(1);
        });
      break;
      
    case 'cleanup':
      monitor.cleanup()
        .then(() => {
          console.log('Cleanup completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('Cleanup failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
FisioFlow Database Monitor

Usage: node scripts/database-monitoring.js <command>

Commands:
  start    - Start continuous monitoring
  check    - Run single health check
  report   - Generate detailed report
  cleanup  - Clean up old log files

Examples:
  node scripts/database-monitoring.js start
  node scripts/database-monitoring.js check
  node scripts/database-monitoring.js report
`);
      process.exit(1);
  }
}

module.exports = DatabaseMonitor;