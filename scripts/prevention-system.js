#!/usr/bin/env node

/**
 * Sistema de Prevenção FisioFlow
 * Monitora continuamente e previne problemas antes que ocorram
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');
const DiagnosticFramework = require('./diagnostic-framework');

class PreventionSystem {
  constructor() {
    this.diagnostic = new DiagnosticFramework();
    this.watchers = new Map();
    this.preventionRules = [];
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // 5 minutos
    this.logPath = path.join(__dirname, '..', 'logs', 'prevention.log');
    
    this.initializePreventionRules();
  }

  // Inicializar regras de prevenção
  initializePreventionRules() {
    this.preventionRules = [
      {
        id: 'package-json-changes',
        name: 'Mudanças no package.json',
        files: ['package.json'],
        action: this.handlePackageJsonChanges.bind(this),
        priority: 'high'
      },
      {
        id: 'env-file-changes',
        name: 'Mudanças em arquivos de ambiente',
        files: ['.env', '.env.local', '.env.production'],
        action: this.handleEnvFileChanges.bind(this),
        priority: 'high'
      },
      {
        id: 'prisma-schema-changes',
        name: 'Mudanças no schema Prisma',
        files: ['prisma/schema.prisma'],
        action: this.handlePrismaSchemaChanges.bind(this),
        priority: 'medium'
      },
      {
        id: 'typescript-config-changes',
        name: 'Mudanças na configuração TypeScript',
        files: ['tsconfig.json'],
        action: this.handleTypeScriptConfigChanges.bind(this),
        priority: 'medium'
      },
      {
        id: 'next-config-changes',
        name: 'Mudanças na configuração Next.js',
        files: ['next.config.js', 'next.config.ts'],
        action: this.handleNextConfigChanges.bind(this),
        priority: 'medium'
      },
      {
        id: 'middleware-changes',
        name: 'Mudanças no middleware',
        files: ['middleware.ts', 'middleware.js'],
        action: this.handleMiddlewareChanges.bind(this),
        priority: 'medium'
      },
      {
        id: 'dependency-vulnerabilities',
        name: 'Verificação de vulnerabilidades',
        schedule: '0 */6 * * *', // A cada 6 horas
        action: this.checkDependencyVulnerabilities.bind(this),
        priority: 'high'
      },
      {
        id: 'disk-space-monitoring',
        name: 'Monitoramento de espaço em disco',
        schedule: '0 */1 * * *', // A cada hora
        action: this.checkDiskSpace.bind(this),
        priority: 'medium'
      },
      {
        id: 'database-connection-health',
        name: 'Saúde da conexão com banco',
        schedule: '*/15 * * * *', // A cada 15 minutos
        action: this.checkDatabaseHealth.bind(this),
        priority: 'high'
      },
      {
        id: 'build-performance-monitoring',
        name: 'Monitoramento de performance do build',
        schedule: '0 */2 * * *', // A cada 2 horas
        action: this.checkBuildPerformance.bind(this),
        priority: 'low'
      }
    ];
  }

  // Iniciar sistema de prevenção
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Sistema de prevenção já está rodando');
      return;
    }

    console.log('🛡️  Iniciando sistema de prevenção...');
    this.isRunning = true;

    // Criar diretório de logs
    fs.mkdirSync(path.dirname(this.logPath), { recursive: true });

    // Iniciar watchers de arquivos
    this.startFileWatchers();

    // Iniciar verificações periódicas
    this.startPeriodicChecks();

    // Executar verificação inicial
    await this.runInitialCheck();

    this.log('Sistema de prevenção iniciado com sucesso');
    console.log('✅ Sistema de prevenção ativo');
  }

  // Parar sistema de prevenção
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️  Sistema de prevenção não está rodando');
      return;
    }

    console.log('🛑 Parando sistema de prevenção...');
    this.isRunning = false;

    // Parar watchers
    for (const [id, watcher] of this.watchers) {
      await watcher.close();
    }
    this.watchers.clear();

    // Limpar intervalos
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }

    this.log('Sistema de prevenção parado');
    console.log('✅ Sistema de prevenção parado');
  }

  // Iniciar watchers de arquivos
  startFileWatchers() {
    const fileRules = this.preventionRules.filter(rule => rule.files);

    for (const rule of fileRules) {
      const watcher = chokidar.watch(rule.files, {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', async (filePath) => {
        this.log(`Arquivo modificado: ${filePath} (regra: ${rule.name})`);
        await this.executePreventionAction(rule, { filePath, event: 'change' });
      });

      watcher.on('add', async (filePath) => {
        this.log(`Arquivo adicionado: ${filePath} (regra: ${rule.name})`);
        await this.executePreventionAction(rule, { filePath, event: 'add' });
      });

      watcher.on('unlink', async (filePath) => {
        this.log(`Arquivo removido: ${filePath} (regra: ${rule.name})`);
        await this.executePreventionAction(rule, { filePath, event: 'unlink' });
      });

      this.watchers.set(rule.id, watcher);
    }
  }

  // Iniciar verificações periódicas
  startPeriodicChecks() {
    this.periodicCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;

      const scheduledRules = this.preventionRules.filter(rule => rule.schedule);
      
      for (const rule of scheduledRules) {
        if (this.shouldRunScheduledRule(rule)) {
          await this.executePreventionAction(rule, { event: 'scheduled' });
        }
      }
    }, this.checkInterval);
  }

  // Verificar se regra agendada deve ser executada
  shouldRunScheduledRule(rule) {
    // Implementação simplificada - em produção usar cron parser
    const now = new Date();
    const lastRun = this.getLastRunTime(rule.id);
    
    if (!lastRun) return true;

    const timeDiff = now - lastRun;
    
    // Verificações baseadas no schedule
    if (rule.schedule.includes('*/15 * * * *')) { // A cada 15 minutos
      return timeDiff >= 15 * 60 * 1000;
    }
    if (rule.schedule.includes('0 */1 * * *')) { // A cada hora
      return timeDiff >= 60 * 60 * 1000;
    }
    if (rule.schedule.includes('0 */2 * * *')) { // A cada 2 horas
      return timeDiff >= 2 * 60 * 60 * 1000;
    }
    if (rule.schedule.includes('0 */6 * * *')) { // A cada 6 horas
      return timeDiff >= 6 * 60 * 60 * 1000;
    }

    return false;
  }

  // Obter último tempo de execução
  getLastRunTime(ruleId) {
    try {
      const statusFile = path.join(__dirname, '..', 'logs', 'prevention-status.json');
      if (!fs.existsSync(statusFile)) return null;
      
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      return status[ruleId] ? new Date(status[ruleId].lastRun) : null;
    } catch (error) {
      return null;
    }
  }

  // Salvar tempo de execução
  saveLastRunTime(ruleId) {
    try {
      const statusFile = path.join(__dirname, '..', 'logs', 'prevention-status.json');
      let status = {};
      
      if (fs.existsSync(statusFile)) {
        status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      }
      
      status[ruleId] = {
        lastRun: new Date().toISOString(),
        count: (status[ruleId]?.count || 0) + 1
      };
      
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    } catch (error) {
      this.log(`Erro ao salvar status: ${error.message}`);
    }
  }

  // Executar ação de prevenção
  async executePreventionAction(rule, context) {
    try {
      this.log(`Executando ação de prevenção: ${rule.name}`);
      await rule.action(context);
      this.saveLastRunTime(rule.id);
    } catch (error) {
      this.log(`Erro na ação de prevenção ${rule.name}: ${error.message}`);
    }
  }

  // Executar verificação inicial
  async runInitialCheck() {
    this.log('Executando verificação inicial do sistema');
    
    try {
      const report = await this.diagnostic.runFullDiagnostic();
      
      if (report.summary.critical > 0 || report.summary.high > 0) {
        this.log(`Problemas detectados na verificação inicial: ${report.summary.critical} críticos, ${report.summary.high} altos`);
        
        // Notificar sobre problemas críticos
        if (report.summary.critical > 0) {
          console.log('🚨 PROBLEMAS CRÍTICOS DETECTADOS! Verifique o relatório de diagnóstico.');
        }
      } else {
        this.log('Verificação inicial concluída - sistema saudável');
      }
    } catch (error) {
      this.log(`Erro na verificação inicial: ${error.message}`);
    }
  }

  // Handlers para diferentes tipos de mudanças

  async handlePackageJsonChanges(context) {
    this.log('Detectada mudança no package.json');
    
    // Verificar se dependências foram alteradas
    if (context.event === 'change') {
      console.log('📦 package.json modificado - verificando dependências...');
      
      try {
        // Verificar se node_modules está sincronizado
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const lockFileExists = fs.existsSync('package-lock.json');
        
        if (!lockFileExists) {
          console.log('⚠️  package-lock.json não encontrado - executando npm install');
          execSync('npm install', { stdio: 'inherit' });
        }
        
        // Verificar vulnerabilidades
        await this.checkDependencyVulnerabilities();
        
      } catch (error) {
        this.log(`Erro ao processar mudanças do package.json: ${error.message}`);
      }
    }
  }

  async handleEnvFileChanges(context) {
    this.log(`Detectada mudança em arquivo de ambiente: ${context.filePath}`);
    
    if (context.event === 'change' || context.event === 'add') {
      console.log('🔐 Arquivo de ambiente modificado - verificando configuração...');
      
      // Verificar variáveis obrigatórias
      const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
      const missingVars = [];
      
      requiredVars.forEach(varName => {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      });
      
      if (missingVars.length > 0) {
        console.log(`⚠️  Variáveis faltando: ${missingVars.join(', ')}`);
      }
    }
  }

  async handlePrismaSchemaChanges(context) {
    this.log('Detectada mudança no schema Prisma');
    
    if (context.event === 'change') {
      console.log('🗄️  Schema Prisma modificado - verificando sincronização...');
      
      try {
        // Verificar se precisa gerar cliente
        execSync('npx prisma generate', { stdio: 'pipe' });
        console.log('✅ Cliente Prisma regenerado');
        
        // Verificar se há migrações pendentes
        const migrationStatus = execSync('npx prisma migrate status', { stdio: 'pipe' }).toString();
        
        if (migrationStatus.includes('pending')) {
          console.log('⚠️  Migrações pendentes detectadas');
        }
        
      } catch (error) {
        this.log(`Erro ao processar mudanças do Prisma: ${error.message}`);
      }
    }
  }

  async handleTypeScriptConfigChanges(context) {
    this.log('Detectada mudança na configuração TypeScript');
    
    if (context.event === 'change') {
      console.log('📝 tsconfig.json modificado - verificando tipos...');
      
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        console.log('✅ Verificação de tipos bem-sucedida');
      } catch (error) {
        console.log('❌ Erros de tipo detectados após mudança na configuração');
      }
    }
  }

  async handleNextConfigChanges(context) {
    this.log('Detectada mudança na configuração Next.js');
    
    if (context.event === 'change') {
      console.log('⚙️  next.config.js modificado - pode ser necessário reiniciar o servidor');
    }
  }

  async handleMiddlewareChanges(context) {
    this.log('Detectada mudança no middleware');
    
    if (context.event === 'change') {
      console.log('🛡️  Middleware modificado - verificando sintaxe...');
      
      try {
        execSync('npx tsc --noEmit middleware.ts', { stdio: 'pipe' });
        console.log('✅ Middleware válido');
      } catch (error) {
        console.log('❌ Erro de sintaxe no middleware');
      }
    }
  }

  async checkDependencyVulnerabilities() {
    this.log('Verificando vulnerabilidades de dependências');
    
    try {
      const auditResult = execSync('npm audit --json', { stdio: 'pipe' }).toString();
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const total = vulns.critical + vulns.high + vulns.moderate + vulns.low;
        
        if (total > 0) {
          console.log(`🚨 ${total} vulnerabilidades encontradas (${vulns.critical} críticas, ${vulns.high} altas)`);
          
          if (vulns.critical > 0 || vulns.high > 0) {
            console.log('⚠️  Recomendado executar: npm audit fix');
          }
        }
      }
    } catch (error) {
      // npm audit pode retornar código de saída não-zero mesmo com vulnerabilidades
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout.toString());
          if (audit.metadata && audit.metadata.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            const total = vulns.critical + vulns.high + vulns.moderate + vulns.low;
            
            if (total > 0) {
              console.log(`🚨 ${total} vulnerabilidades encontradas`);
            }
          }
        } catch (parseError) {
          this.log(`Erro ao verificar vulnerabilidades: ${error.message}`);
        }
      }
    }
  }

  async checkDiskSpace() {
    this.log('Verificando espaço em disco');
    
    try {
      // Verificar tamanho de node_modules
      if (fs.existsSync('node_modules')) {
        const stats = execSync('du -sh node_modules 2>/dev/null || dir node_modules /-c 2>nul', { stdio: 'pipe' }).toString();
        this.log(`Tamanho node_modules: ${stats.trim()}`);
      }
      
      // Verificar tamanho de .next
      if (fs.existsSync('.next')) {
        const stats = execSync('du -sh .next 2>/dev/null || dir .next /-c 2>nul', { stdio: 'pipe' }).toString();
        this.log(`Tamanho .next: ${stats.trim()}`);
      }
      
    } catch (error) {
      this.log(`Erro ao verificar espaço em disco: ${error.message}`);
    }
  }

  async checkDatabaseHealth() {
    this.log('Verificando saúde da conexão com banco');
    
    try {
      if (process.env.DATABASE_URL) {
        // Tentar conexão simples com Prisma
        execSync('npx prisma db execute --stdin <<< "SELECT 1;"', { stdio: 'pipe' });
        this.log('Conexão com banco de dados OK');
      }
    } catch (error) {
      this.log(`Problema na conexão com banco: ${error.message}`);
      console.log('🚨 Problema na conexão com banco de dados detectado');
    }
  }

  async checkBuildPerformance() {
    this.log('Verificando performance do build');
    
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const buildTime = Date.now() - startTime;
      
      this.log(`Tempo de build: ${buildTime}ms`);
      
      if (buildTime > 5 * 60 * 1000) { // Mais de 5 minutos
        console.log('⚠️  Build está lento - considere otimizações');
      }
      
    } catch (error) {
      this.log(`Erro no build: ${error.message}`);
    }
  }

  // Logging
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.logPath, logMessage);
    } catch (error) {
      console.error('Erro ao escrever log:', error.message);
    }
  }

  // Obter status do sistema
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeWatchers: this.watchers.size,
      preventionRules: this.preventionRules.length,
      logPath: this.logPath
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const prevention = new PreventionSystem();
  
  // Tratar sinais de sistema
  process.on('SIGINT', async () => {
    console.log('\n🛑 Recebido SIGINT, parando sistema de prevenção...');
    await prevention.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Recebido SIGTERM, parando sistema de prevenção...');
    await prevention.stop();
    process.exit(0);
  });
  
  // Iniciar sistema
  prevention.start().catch(console.error);
}

module.exports = PreventionSystem;