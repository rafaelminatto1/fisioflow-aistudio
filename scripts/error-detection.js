#!/usr/bin/env node

/**
 * Sistema de Detecção de Erros - FisioFlow
 * 
 * Este script monitora logs, arquivos e processos em tempo real
 * para detectar erros e problemas antes que afetem os usuários.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const chokidar = require('chokidar');

const execAsync = promisify(exec);

class ErrorDetectionSystem {
  constructor() {
    this.watchers = new Map();
    this.errorPatterns = this.initializeErrorPatterns();
    this.detectedErrors = [];
    this.isRunning = false;
    this.logFile = path.join(__dirname, 'error-detection.log');
    this.reportFile = path.join(__dirname, 'error-detection-report.json');
    this.statusFile = path.join(__dirname, 'error-detection-status.json');
  }

  // Padrões de erro para diferentes categorias
  initializeErrorPatterns() {
    return {
      railway: {
        patterns: [
          /railway.*error/i,
          /deployment.*failed/i,
          /build.*failed/i,
          /railway.*timeout/i,
          /railway.*connection.*refused/i,
          /railway.*authentication.*failed/i
        ],
        severity: 'high',
        category: 'railway'
      },
      neondb: {
        patterns: [
          /neon.*error/i,
          /database.*connection.*failed/i,
          /postgres.*error/i,
          /prisma.*error/i,
          /connection.*timeout/i,
          /authentication.*failed.*database/i,
          /too many connections/i
        ],
        severity: 'critical',
        category: 'neondb'
      },
      typescript: {
        patterns: [
          /typescript.*error/i,
          /type.*error/i,
          /ts\(\d+\)/,
          /cannot find module/i,
          /property.*does not exist/i,
          /argument of type.*not assignable/i
        ],
        severity: 'medium',
        category: 'typescript'
      },
      nextjs: {
        patterns: [
          /next.*error/i,
          /compilation.*failed/i,
          /module not found/i,
          /syntax.*error/i,
          /unexpected token/i,
          /failed to compile/i
        ],
        severity: 'high',
        category: 'nextjs'
      },
      runtime: {
        patterns: [
          /uncaught.*exception/i,
          /unhandled.*rejection/i,
          /reference.*error/i,
          /cannot read property/i,
          /undefined is not a function/i,
          /maximum call stack/i,
          /out of memory/i
        ],
        severity: 'critical',
        category: 'runtime'
      },
      api: {
        patterns: [
          /api.*error/i,
          /500.*internal server error/i,
          /404.*not found/i,
          /401.*unauthorized/i,
          /403.*forbidden/i,
          /timeout.*api/i
        ],
        severity: 'high',
        category: 'api'
      },
      environment: {
        patterns: [
          /environment.*variable.*not.*found/i,
          /missing.*env/i,
          /config.*error/i,
          /dotenv.*error/i,
          /invalid.*configuration/i
        ],
        severity: 'high',
        category: 'environment'
      }
    };
  }

  // Iniciar sistema de detecção
  async start() {
    try {
      this.log('Iniciando sistema de detecção de erros...');
      this.isRunning = true;
      
      await this.updateStatus({
        running: true,
        startTime: new Date().toISOString(),
        pid: process.pid,
        lastActivity: new Date().toISOString()
      });

      // Monitorar arquivos de log
      await this.startLogMonitoring();
      
      // Monitorar processos
      await this.startProcessMonitoring();
      
      // Monitorar arquivos de configuração
      await this.startConfigMonitoring();
      
      // Verificações periódicas
      this.startPeriodicChecks();
      
      this.log('Sistema de detecção de erros iniciado com sucesso');
      
      // Manter o processo ativo
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());
      
    } catch (error) {
      this.log(`Erro ao iniciar sistema de detecção: ${error.message}`, 'error');
      throw error;
    }
  }

  // Parar sistema de detecção
  async stop() {
    this.log('Parando sistema de detecção de erros...');
    this.isRunning = false;
    
    // Parar todos os watchers
    for (const [name, watcher] of this.watchers) {
      try {
        await watcher.close();
        this.log(`Watcher ${name} parado`);
      } catch (error) {
        this.log(`Erro ao parar watcher ${name}: ${error.message}`, 'error');
      }
    }
    
    await this.updateStatus({
      running: false,
      stopTime: new Date().toISOString()
    });
    
    this.log('Sistema de detecção de erros parado');
    process.exit(0);
  }

  // Monitorar arquivos de log
  async startLogMonitoring() {
    const logPaths = [
      '.next/trace',
      'logs',
      'node_modules/.cache',
      '.vercel/output'
    ];
    
    for (const logPath of logPaths) {
      const fullPath = path.join(process.cwd(), logPath);
      
      if (fs.existsSync(fullPath)) {
        const watcher = chokidar.watch(fullPath, {
          ignored: /node_modules/,
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('change', (filePath) => {
          this.analyzeLogFile(filePath);
        });
        
        watcher.on('add', (filePath) => {
          this.analyzeLogFile(filePath);
        });
        
        this.watchers.set(`log-${logPath}`, watcher);
        this.log(`Monitorando logs em: ${fullPath}`);
      }
    }
  }

  // Monitorar processos
  async startProcessMonitoring() {
    // Monitorar processo do Next.js
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        // Verificar se o processo Next.js está rodando
        const { stdout } = await execAsync('netstat -ano | findstr :3000');
        
        if (!stdout.trim()) {
          this.detectError({
            type: 'process',
            category: 'nextjs',
            severity: 'high',
            message: 'Processo Next.js não está rodando na porta 3000',
            timestamp: new Date().toISOString(),
            source: 'process-monitor'
          });
        }
      } catch (error) {
        // Processo não encontrado
        this.detectError({
          type: 'process',
          category: 'nextjs',
          severity: 'high',
          message: 'Processo Next.js não encontrado',
          timestamp: new Date().toISOString(),
          source: 'process-monitor'
        });
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  // Monitorar arquivos de configuração
  async startConfigMonitoring() {
    const configFiles = [
      'package.json',
      '.env',
      '.env.local',
      'next.config.js',
      'tsconfig.json',
      'prisma/schema.prisma'
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(process.cwd(), configFile);
      
      if (fs.existsSync(filePath)) {
        const watcher = chokidar.watch(filePath, {
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('change', () => {
          this.analyzeConfigChange(configFile);
        });
        
        this.watchers.set(`config-${configFile}`, watcher);
        this.log(`Monitorando arquivo de configuração: ${configFile}`);
      }
    }
  }

  // Verificações periódicas
  startPeriodicChecks() {
    // Verificar conectividade com banco de dados
    setInterval(async () => {
      if (!this.isRunning) return;
      await this.checkDatabaseConnectivity();
    }, 60000); // A cada 1 minuto
    
    // Verificar uso de memória
    setInterval(async () => {
      if (!this.isRunning) return;
      await this.checkMemoryUsage();
    }, 120000); // A cada 2 minutos
    
    // Verificar espaço em disco
    setInterval(async () => {
      if (!this.isRunning) return;
      await this.checkDiskSpace();
    }, 300000); // A cada 5 minutos
  }

  // Analisar arquivo de log
  async analyzeLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) return; // Ignorar arquivos muito grandes (>10MB)
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(-100); // Analisar apenas as últimas 100 linhas
      
      for (const line of lines) {
        this.analyzeLogLine(line, filePath);
      }
    } catch (error) {
      this.log(`Erro ao analisar arquivo de log ${filePath}: ${error.message}`, 'error');
    }
  }

  // Analisar linha de log
  analyzeLogLine(line, source) {
    for (const [category, config] of Object.entries(this.errorPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(line)) {
          this.detectError({
            type: 'log',
            category: config.category,
            severity: config.severity,
            message: line.trim(),
            timestamp: new Date().toISOString(),
            source,
            pattern: pattern.toString()
          });
          break;
        }
      }
    }
  }

  // Analisar mudança em arquivo de configuração
  async analyzeConfigChange(configFile) {
    this.log(`Detectada mudança no arquivo de configuração: ${configFile}`);
    
    // Verificar sintaxe do arquivo
    try {
      const filePath = path.join(process.cwd(), configFile);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (configFile.endsWith('.json')) {
        JSON.parse(content); // Verificar JSON válido
      }
      
      this.log(`Arquivo ${configFile} válido após mudança`);
    } catch (error) {
      this.detectError({
        type: 'config',
        category: 'environment',
        severity: 'high',
        message: `Erro de sintaxe no arquivo ${configFile}: ${error.message}`,
        timestamp: new Date().toISOString(),
        source: configFile
      });
    }
  }

  // Verificar conectividade com banco de dados
  async checkDatabaseConnectivity() {
    try {
      const { stdout, stderr } = await execAsync('npx prisma db pull --preview-feature', {
        timeout: 10000
      });
      
      if (stderr && stderr.includes('error')) {
        this.detectError({
          type: 'connectivity',
          category: 'neondb',
          severity: 'critical',
          message: 'Falha na conectividade com banco de dados',
          timestamp: new Date().toISOString(),
          source: 'connectivity-check',
          details: stderr
        });
      }
    } catch (error) {
      this.detectError({
        type: 'connectivity',
        category: 'neondb',
        severity: 'critical',
        message: 'Erro ao verificar conectividade com banco de dados',
        timestamp: new Date().toISOString(),
        source: 'connectivity-check',
        details: error.message
      });
    }
  }

  // Verificar uso de memória
  async checkMemoryUsage() {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal / 1024 / 1024; // MB
      const usedMem = memUsage.heapUsed / 1024 / 1024; // MB
      const memPercent = (usedMem / totalMem) * 100;
      
      if (memPercent > 90) {
        this.detectError({
          type: 'resource',
          category: 'runtime',
          severity: 'high',
          message: `Alto uso de memória: ${memPercent.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
          source: 'memory-check',
          details: { totalMem, usedMem, memPercent }
        });
      }
    } catch (error) {
      this.log(`Erro ao verificar uso de memória: ${error.message}`, 'error');
    }
  }

  // Verificar espaço em disco
  async checkDiskSpace() {
    try {
      const { stdout } = await execAsync('dir /-c', { cwd: process.cwd() });
      // Implementar verificação de espaço em disco para Windows
      // Por simplicidade, apenas log por enquanto
      this.log('Verificação de espaço em disco executada');
    } catch (error) {
      this.log(`Erro ao verificar espaço em disco: ${error.message}`, 'error');
    }
  }

  // Detectar erro
  detectError(errorInfo) {
    // Evitar duplicatas
    const isDuplicate = this.detectedErrors.some(existing => 
      existing.message === errorInfo.message &&
      existing.category === errorInfo.category &&
      Date.now() - new Date(existing.timestamp).getTime() < 60000 // 1 minuto
    );
    
    if (isDuplicate) return;
    
    this.detectedErrors.push(errorInfo);
    this.log(`ERRO DETECTADO [${errorInfo.severity.toUpperCase()}] ${errorInfo.category}: ${errorInfo.message}`, 'error');
    
    // Salvar relatório
    this.saveReport();
    
    // Atualizar status
    this.updateStatus({
      lastActivity: new Date().toISOString(),
      lastError: errorInfo,
      totalErrors: this.detectedErrors.length
    });
    
    // Executar ações automáticas baseadas na severidade
    this.handleErrorSeverity(errorInfo);
  }

  // Lidar com severidade do erro
  async handleErrorSeverity(errorInfo) {
    switch (errorInfo.severity) {
      case 'critical':
        // Executar correção automática imediata
        this.log(`Executando correção automática para erro crítico: ${errorInfo.category}`);
        try {
          await execAsync(`node "${path.join(__dirname, 'auto-fix-system.js')}" --category=${errorInfo.category}`);
        } catch (error) {
          this.log(`Falha na correção automática: ${error.message}`, 'error');
        }
        break;
        
      case 'high':
        // Agendar correção automática
        setTimeout(async () => {
          try {
            await execAsync(`node "${path.join(__dirname, 'diagnostic-framework.js')}" --category=${errorInfo.category}`);
          } catch (error) {
            this.log(`Falha no diagnóstico automático: ${error.message}`, 'error');
          }
        }, 30000); // 30 segundos
        break;
        
      case 'medium':
      case 'low':
        // Apenas registrar para análise posterior
        this.log(`Erro registrado para análise: ${errorInfo.category}`);
        break;
    }
  }

  // Salvar relatório
  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.detectedErrors.length,
      errorsByCategory: this.getErrorsByCategory(),
      errorsBySeverity: this.getErrorsBySeverity(),
      recentErrors: this.detectedErrors.slice(-10), // Últimos 10 erros
      systemStatus: {
        running: this.isRunning,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };
    
    try {
      fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
    } catch (error) {
      this.log(`Erro ao salvar relatório: ${error.message}`, 'error');
    }
  }

  // Obter erros por categoria
  getErrorsByCategory() {
    const categories = {};
    for (const error of this.detectedErrors) {
      categories[error.category] = (categories[error.category] || 0) + 1;
    }
    return categories;
  }

  // Obter erros por severidade
  getErrorsBySeverity() {
    const severities = {};
    for (const error of this.detectedErrors) {
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    }
    return severities;
  }

  // Atualizar status
  async updateStatus(statusUpdate) {
    try {
      let currentStatus = {};
      
      if (fs.existsSync(this.statusFile)) {
        const content = fs.readFileSync(this.statusFile, 'utf-8');
        currentStatus = JSON.parse(content);
      }
      
      const newStatus = { ...currentStatus, ...statusUpdate };
      fs.writeFileSync(this.statusFile, JSON.stringify(newStatus, null, 2));
    } catch (error) {
      this.log(`Erro ao atualizar status: ${error.message}`, 'error');
    }
  }

  // Log
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log:', error.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const detector = new ErrorDetectionSystem();
  
  // Processar argumentos da linha de comando
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  switch (command) {
    case 'start':
      detector.start().catch(error => {
        console.error('Erro ao iniciar sistema de detecção:', error);
        process.exit(1);
      });
      break;
      
    case 'stop':
      detector.stop().catch(error => {
        console.error('Erro ao parar sistema de detecção:', error);
        process.exit(1);
      });
      break;
      
    case 'status':
      const statusFile = path.join(__dirname, 'error-detection-status.json');
      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log('Sistema de detecção não está rodando');
      }
      break;
      
    case 'report':
      const reportFile = path.join(__dirname, 'error-detection-report.json');
      if (fs.existsSync(reportFile)) {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log('Nenhum relatório de detecção encontrado');
      }
      break;
      
    default:
      console.log('Comandos disponíveis: start, stop, status, report');
      break;
  }
}

module.exports = ErrorDetectionSystem;