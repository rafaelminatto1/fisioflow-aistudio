#!/usr/bin/env node

/**
 * FisioFlow - Railway Deployment Script
 * 
 * Script automatizado para deploy no Railway com:
 * - Validação de variáveis de ambiente
 * - Execução de migrações Prisma
 * - Health checks pós-deploy
 * - Rollback automático em caso de falha
 * - Notificações de status
 * 
 * Uso:
 *   node scripts/deploy-railway.js [--environment=production] [--force] [--dry-run]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configurações
const CONFIG = {
  environments: ['development', 'staging', 'production'],
  healthCheckTimeout: 300000, // 5 minutos
  healthCheckInterval: 10000,  // 10 segundos
  rollbackTimeout: 180000,     // 3 minutos
  maxRetries: 3,
  requiredEnvVars: [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEON_PROJECT_ID',
    'NEON_API_KEY',
    'JWT_SECRET',
    'NODE_ENV'
  ]
};

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Classe principal do deploy
class RailwayDeployer {
  constructor(options = {}) {
    this.environment = options.environment || 'production';
    this.force = options.force || false;
    this.dryRun = options.dryRun || false;
    this.startTime = Date.now();
    this.deploymentId = this.generateDeploymentId();
    
    this.log('info', `🚀 Iniciando deploy para ${this.environment}`);
    this.log('info', `📋 Deployment ID: ${this.deploymentId}`);
  }

  generateDeploymentId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `deploy-${timestamp}-${random}`;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelColors = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      debug: colors.cyan
    };
    
    const color = levelColors[level] || colors.reset;
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async executeCommand(command, options = {}) {
    this.log('debug', `Executando: ${command}`);
    
    if (this.dryRun) {
      this.log('info', `[DRY RUN] Comando: ${command}`);
      return { stdout: 'dry-run-output', stderr: '', code: 0 };
    }

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return { stdout: result, stderr: '', code: 0 };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        code: error.status || 1
      };
    }
  }

  async validateEnvironment() {
    this.log('info', '🔍 Validando ambiente...');
    
    // Verificar se Railway CLI está instalado
    const railwayCheck = await this.executeCommand('railway --version', { silent: true });
    if (railwayCheck.code !== 0) {
      throw new Error('Railway CLI não está instalado. Execute: npm install -g @railway/cli');
    }
    
    // Verificar autenticação
    const authCheck = await this.executeCommand('railway whoami', { silent: true });
    if (authCheck.code !== 0) {
      throw new Error('Não autenticado no Railway. Execute: railway login');
    }
    
    // Verificar projeto
    const projectCheck = await this.executeCommand('railway status', { silent: true });
    if (projectCheck.code !== 0) {
      throw new Error('Projeto Railway não configurado. Execute: railway link');
    }
    
    this.log('success', '✅ Ambiente validado');
  }

  async validateEnvironmentVariables() {
    this.log('info', '🔧 Validando variáveis de ambiente...');
    
    const missingVars = [];
    
    for (const varName of CONFIG.requiredEnvVars) {
      const result = await this.executeCommand(
        `railway variables get ${varName}`,
        { silent: true }
      );
      
      if (result.code !== 0 || !result.stdout.trim()) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    }
    
    this.log('success', '✅ Variáveis de ambiente validadas');
  }

  async runPreDeployChecks() {
    this.log('info', '🧪 Executando verificações pré-deploy...');
    
    // Verificar build
    const buildResult = await this.executeCommand('npm run build');
    if (buildResult.code !== 0) {
      throw new Error('Build falhou');
    }
    
    // Verificar testes (se existirem)
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.scripts && packageJson.scripts.test) {
        const testResult = await this.executeCommand('npm test');
        if (testResult.code !== 0 && !this.force) {
          throw new Error('Testes falharam. Use --force para ignorar');
        }
      }
    }
    
    this.log('success', '✅ Verificações pré-deploy concluídas');
  }

  async runDatabaseMigrations() {
    this.log('info', '🗄️ Executando migrações do banco de dados...');
    
    // Verificar se há migrações pendentes
    const migrateStatus = await this.executeCommand(
      'railway run npx prisma migrate status',
      { silent: true }
    );
    
    if (migrateStatus.stdout.includes('pending')) {
      this.log('info', 'Migrações pendentes encontradas, executando...');
      
      const migrateResult = await this.executeCommand(
        'railway run npx prisma migrate deploy'
      );
      
      if (migrateResult.code !== 0) {
        throw new Error('Falha ao executar migrações');
      }
      
      this.log('success', '✅ Migrações executadas com sucesso');
    } else {
      this.log('info', 'Nenhuma migração pendente');
    }
  }

  async deployToRailway() {
    this.log('info', '🚢 Iniciando deploy no Railway...');
    
    const deployResult = await this.executeCommand('railway up --detach');
    
    if (deployResult.code !== 0) {
      throw new Error('Falha no deploy do Railway');
    }
    
    // Extrair deployment ID do Railway
    const deploymentMatch = deployResult.stdout.match(/deployment\s+([a-f0-9-]+)/i);
    if (deploymentMatch) {
      this.railwayDeploymentId = deploymentMatch[1];
      this.log('info', `Railway Deployment ID: ${this.railwayDeploymentId}`);
    }
    
    this.log('success', '✅ Deploy iniciado no Railway');
  }

  async waitForDeployment() {
    this.log('info', '⏳ Aguardando conclusão do deployment...');
    
    const startTime = Date.now();
    const timeout = CONFIG.healthCheckTimeout;
    
    while (Date.now() - startTime < timeout) {
      const statusResult = await this.executeCommand(
        'railway status --json',
        { silent: true }
      );
      
      if (statusResult.code === 0) {
        try {
          const status = JSON.parse(statusResult.stdout);
          if (status.deployments && status.deployments[0]) {
            const deployment = status.deployments[0];
            
            if (deployment.status === 'SUCCESS') {
              this.log('success', '✅ Deployment concluído com sucesso');
              return true;
            } else if (deployment.status === 'FAILED') {
              throw new Error('Deployment falhou no Railway');
            }
          }
        } catch (parseError) {
          this.log('warning', 'Erro ao parsear status do Railway');
        }
      }
      
      await this.sleep(CONFIG.healthCheckInterval);
    }
    
    throw new Error('Timeout aguardando deployment');
  }

  async performHealthChecks() {
    this.log('info', '🏥 Executando health checks...');
    
    // Obter URL do serviço
    const urlResult = await this.executeCommand(
      'railway domain',
      { silent: true }
    );
    
    if (urlResult.code !== 0) {
      throw new Error('Não foi possível obter URL do serviço');
    }
    
    const serviceUrl = urlResult.stdout.trim();
    const healthUrl = `${serviceUrl}/api/health`;
    
    this.log('info', `Verificando health check: ${healthUrl}`);
    
    const startTime = Date.now();
    let attempts = 0;
    
    while (Date.now() - startTime < CONFIG.healthCheckTimeout) {
      attempts++;
      
      try {
        const response = await this.makeHttpRequest(healthUrl);
        
        if (response.statusCode === 200) {
          const healthData = JSON.parse(response.body);
          
          if (healthData.status === 'healthy') {
            this.log('success', '✅ Health check passou');
            this.log('info', 'Dados do health check:', healthData);
            return true;
          }
        }
      } catch (error) {
        this.log('debug', `Health check tentativa ${attempts} falhou: ${error.message}`);
      }
      
      await this.sleep(CONFIG.healthCheckInterval);
    }
    
    throw new Error('Health check falhou após múltiplas tentativas');
  }

  async makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async rollback() {
    this.log('warning', '🔄 Iniciando rollback...');
    
    try {
      // Obter deployment anterior
      const deploymentsResult = await this.executeCommand(
        'railway deployments --json',
        { silent: true }
      );
      
      if (deploymentsResult.code === 0) {
        const deployments = JSON.parse(deploymentsResult.stdout);
        const successfulDeployments = deployments.filter(d => d.status === 'SUCCESS');
        
        if (successfulDeployments.length > 1) {
          const previousDeployment = successfulDeployments[1];
          
          const rollbackResult = await this.executeCommand(
            `railway rollback ${previousDeployment.id}`
          );
          
          if (rollbackResult.code === 0) {
            this.log('success', '✅ Rollback executado com sucesso');
            return true;
          }
        }
      }
    } catch (error) {
      this.log('error', `Erro durante rollback: ${error.message}`);
    }
    
    this.log('error', '❌ Rollback falhou');
    return false;
  }

  async sendNotification(status, error = null) {
    const webhookUrl = process.env.RAILWAY_WEBHOOK_URL || process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      this.log('debug', 'Webhook não configurado, pulando notificação');
      return;
    }
    
    const payload = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      status: status,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      error: error ? error.message : null
    };
    
    try {
      await this.makeHttpRequest(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      this.log('success', '📧 Notificação enviada');
    } catch (error) {
      this.log('warning', `Falha ao enviar notificação: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async deploy() {
    try {
      await this.validateEnvironment();
      await this.validateEnvironmentVariables();
      await this.runPreDeployChecks();
      await this.runDatabaseMigrations();
      await this.deployToRailway();
      await this.waitForDeployment();
      await this.performHealthChecks();
      
      const duration = Date.now() - this.startTime;
      this.log('success', `🎉 Deploy concluído com sucesso em ${Math.round(duration / 1000)}s`);
      
      await this.sendNotification('success');
      
      return true;
    } catch (error) {
      this.log('error', `❌ Deploy falhou: ${error.message}`);
      
      if (!this.dryRun && this.environment === 'production') {
        this.log('info', 'Tentando rollback automático...');
        await this.rollback();
      }
      
      await this.sendNotification('failed', error);
      
      throw error;
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--environment=')) {
      options.environment = arg.split('=')[1];
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
FisioFlow Railway Deployment Script

Uso:
  node scripts/deploy-railway.js [opções]

Opções:
  --environment=ENV    Ambiente de deploy (development, staging, production)
  --force             Força deploy mesmo com testes falhando
  --dry-run           Simula deploy sem executar comandos
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/deploy-railway.js --environment=production
  node scripts/deploy-railway.js --dry-run
  node scripts/deploy-railway.js --force
`);
      process.exit(0);
    }
  });
  
  const deployer = new RailwayDeployer(options);
  
  deployer.deploy()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Deploy falhou:', error.message);
      process.exit(1);
    });
}

module.exports = RailwayDeployer;