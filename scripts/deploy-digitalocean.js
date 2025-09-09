#!/usr/bin/env node

/**
 * FisioFlow - DigitalOcean Deploy Script
 * Automatiza o processo de deploy no DigitalOcean App Platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DigitalOceanDeployer {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join(this.projectRoot, '.env.production');
    this.dockerFile = path.join(this.projectRoot, 'Dockerfile');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async validateEnvironment() {
    this.log('🔍 Validando ambiente de produção...');
    
    // Verificar se .env.production existe
    if (!fs.existsSync(this.envFile)) {
      this.log('❌ Arquivo .env.production não encontrado!', 'error');
      this.log('💡 Copie .env.production.example para .env.production e configure as variáveis', 'warning');
      process.exit(1);
    }

    // Verificar Dockerfile
    if (!fs.existsSync(this.dockerFile)) {
      this.log('❌ Dockerfile não encontrado!', 'error');
      process.exit(1);
    }

    // Verificar variáveis críticas
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const criticalVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missingVars = criticalVars.filter(varName => 
      !envContent.includes(`${varName}=`) || 
      envContent.includes(`${varName}=your-`) ||
      envContent.includes(`${varName}=sk-xxx`)
    );

    if (missingVars.length > 0) {
      this.log(`❌ Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`, 'error');
      process.exit(1);
    }

    this.log('✅ Ambiente validado com sucesso!', 'success');
  }

  async runTests(skipTests = false) {
    if (skipTests) {
      this.log('⏭️ Pulando testes (--skip-tests fornecido)...', 'warning');
      return;
    }
    
    this.log('🧪 Executando testes...');
    
    try {
      execSync('npm run test:ci', { stdio: 'inherit' });
      this.log('✅ Testes passaram!', 'success');
    } catch (error) {
      this.log('❌ Testes falharam!', 'error');
      this.log('💡 Corrija os testes antes de fazer deploy', 'warning');
      process.exit(1);
    }
  }

  async buildProject() {
    this.log('🏗️ Fazendo build do projeto...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      this.log('✅ Build concluído com sucesso!', 'success');
    } catch (error) {
      this.log('❌ Build falhou!', 'error');
      process.exit(1);
    }
  }

  async validateDocker() {
    this.log('🐳 Validando Dockerfile...');
    
    try {
      // Verificar se Docker está disponível
      execSync('docker --version', { stdio: 'pipe' });
      
      // Build da imagem Docker
      this.log('📦 Fazendo build da imagem Docker...');
      execSync('docker build -t fisioflow-test .', { stdio: 'inherit' });
      
      this.log('✅ Dockerfile validado com sucesso!', 'success');
    } catch (error) {
      this.log('⚠️ Docker não disponível ou build falhou', 'warning');
      this.log('💡 Certifique-se de que o Docker está instalado e funcionando', 'warning');
    }
  }

  async checkGitStatus() {
    this.log('📝 Verificando status do Git...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        this.log('⚠️ Existem alterações não commitadas:', 'warning');
        console.log(status);
        this.log('💡 Commit suas alterações antes do deploy', 'warning');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          readline.question('Deseja continuar mesmo assim? (y/N): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
      
      this.log('✅ Git status verificado!', 'success');
    } catch (error) {
      this.log('⚠️ Não foi possível verificar o Git status', 'warning');
    }
  }

  async generateAppSpec() {
    this.log('📋 Gerando App Spec para DigitalOcean...');
    
    const appSpec = {
      name: 'fisioflow',
      services: [{
        name: 'web',
        source_dir: '/',
        github: {
          repo: 'seu-usuario/fisioflow-aistudio', // Será atualizado manualmente
          branch: 'main',
          deploy_on_push: true
        },
        run_command: 'npm start',
        environment_slug: 'node-js',
        instance_count: 1,
        instance_size_slug: 'professional-xs',
        http_port: 3000,
        routes: [{ path: '/' }],
        health_check: {
          http_path: '/api/health',
          initial_delay_seconds: 60,
          period_seconds: 10,
          timeout_seconds: 5,
          success_threshold: 1,
          failure_threshold: 3
        },
        envs: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'NEXT_TELEMETRY_DISABLED', value: '1' },
          { key: 'PORT', value: '3000' }
        ]
      }],
      databases: [{
        name: 'fisioflow-db',
        engine: 'PG',
        version: '14',
        size: 'db-s-1vcpu-1gb'
      }]
    };

    const specPath = path.join(this.projectRoot, '.do', 'app.yaml');
    
    // Criar diretório .do se não existir
    const doDir = path.dirname(specPath);
    if (!fs.existsSync(doDir)) {
      fs.mkdirSync(doDir, { recursive: true });
    }

    fs.writeFileSync(specPath, `# DigitalOcean App Platform Spec\n# Generated automatically - do not edit manually\n\n${JSON.stringify(appSpec, null, 2)}`);
    
    this.log(`✅ App Spec gerado em: ${specPath}`, 'success');
  }

  async showDeployInstructions() {
    this.log('🚀 Instruções de Deploy:', 'success');
    console.log(`
📋 Próximos passos:

1. Acesse: https://cloud.digitalocean.com/apps
2. Clique em "Create App"
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente:
   - DATABASE_URL (do Managed Database)
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - Outras variáveis do .env.production

5. Selecione o plano:
   - App: Professional ($25/mês)
   - Database: Basic ($15/mês)

6. Clique em "Create Resources"

💡 Documentação completa em: .trae/documents/deploy-digitalocean-fisioflow.md
`);
  }

  async deploy(options = {}) {
    try {
      this.log('🚀 Iniciando processo de deploy para DigitalOcean...', 'success');
      
      await this.validateEnvironment();
      await this.checkGitStatus();
      await this.runTests(options.skipTests);
      await this.buildProject();
      await this.validateDocker();
      await this.generateAppSpec();
      await this.showDeployInstructions();
      
      this.log('✅ Preparação para deploy concluída com sucesso!', 'success');
      this.log('🎉 Seu projeto está pronto para deploy no DigitalOcean!', 'success');
      
    } catch (error) {
      this.log(`❌ Erro durante o deploy: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const skipTests = args.includes('--skip-tests');
  
  const deployer = new DigitalOceanDeployer();
  deployer.deploy({ skipTests });
}

module.exports = DigitalOceanDeployer;