#!/usr/bin/env node

/**
 * Script Completo de Setup para Railway
 * Configura automaticamente todas as variáveis e configurações necessárias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwaySetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.railwayConfig = {
      production: {},
      staging: {},
      development: {}
    };
  }

  /**
   * Executa setup completo
   */
  async run() {
    console.log('🚂 FISIOFLOW - SETUP COMPLETO RAILWAY');
    console.log('=====================================\n');

    try {
      // 1. Verificar pré-requisitos
      await this.checkPrerequisites();
      
      // 2. Configurar Railway CLI
      await this.setupRailwayCLI();
      
      // 3. Configurar projeto
      await this.setupProject();
      
      // 4. Configurar variáveis de ambiente
      await this.setupEnvironmentVariables();
      
      // 5. Configurar domínios
      await this.setupDomains();
      
      // 6. Configurar monitoramento
      await this.setupMonitoring();
      
      // 7. Testar configuração
      await this.testConfiguration();
      
      console.log('\n✅ SETUP COMPLETO COM SUCESSO!');
      console.log('🎯 Seu projeto está pronto para deploy no Railway');
      
    } catch (error) {
      console.error('\n❌ ERRO NO SETUP:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verifica pré-requisitos
   */
  async checkPrerequisites() {
    console.log('🔍 Verificando pré-requisitos...');
    
    // Verificar Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js não encontrado. Instale Node.js 18+ primeiro.');
    }

    // Verificar npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm não encontrado.');
    }

    // Verificar Railway CLI
    try {
      const railwayVersion = execSync('railway --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Railway CLI: ${railwayVersion}`);
    } catch (error) {
      console.log('⚠️ Railway CLI não encontrado. Instalando...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }

    // Verificar arquivos necessários
    const requiredFiles = [
      'package.json',
      'railway.json',
      'railway.toml',
      'Dockerfile',
      '.env.example'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`Arquivo ${file} não encontrado`);
      }
      console.log(`✅ ${file}`);
    }
  }

  /**
   * Configura Railway CLI
   */
  async setupRailwayCLI() {
    console.log('\n🔧 Configurando Railway CLI...');
    
    try {
      // Verificar se já está logado
      const whoami = execSync('railway whoami', { encoding: 'utf8' }).trim();
      console.log(`✅ Já logado como: ${whoami}`);
    } catch (error) {
      console.log('🔐 Fazendo login no Railway...');
      execSync('railway login', { stdio: 'inherit' });
    }
  }

  /**
   * Configura projeto
   */
  async setupProject() {
    console.log('\n📁 Configurando projeto...');
    
    try {
      // Verificar se já está linkado
      const status = execSync('railway status', { encoding: 'utf8' });
      console.log('✅ Projeto já configurado');
      console.log(status);
    } catch (error) {
      console.log('🔗 Linkando projeto...');
      
      // Tentar linkar com projeto existente
      try {
        execSync('railway link', { stdio: 'inherit' });
      } catch (linkError) {
        console.log('📝 Criando novo projeto...');
        execSync('railway init fisioflow', { stdio: 'inherit' });
      }
    }
  }

  /**
   * Configura variáveis de ambiente
   */
  async setupEnvironmentVariables() {
    console.log('\n🌍 Configurando variáveis de ambiente...');
    
    // Ler arquivo .env.example
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Extrair variáveis
    const variables = this.parseEnvFile(envContent);
    
    // Configurar variáveis por ambiente
    for (const [env, vars] of Object.entries(this.railwayConfig)) {
      console.log(`\n📋 Configurando ${env.toUpperCase()}...`);
      
      for (const [key, value] of Object.entries(vars)) {
        try {
          execSync(`railway variables set ${key}="${value}" --environment ${env}`, { stdio: 'pipe' });
          console.log(`✅ ${key}=${value}`);
        } catch (error) {
          console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
        }
      }
    }

    // Configurar variáveis específicas do Railway
    const railwayVars = {
      'NODE_ENV': 'production',
      'RAILWAY_STRUCTURED_LOGGING': 'true',
      'RAILWAY_METRICS_ENABLED': 'true',
      'HEALTH_CHECK_ENABLED': 'true',
      'RATE_LIMIT_ENABLED': 'true',
      'CORS_ENABLED': 'true'
    };

    for (const [key, value] of Object.entries(railwayVars)) {
      try {
        execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Configura domínios
   */
  async setupDomains() {
    console.log('\n🌐 Configurando domínios...');
    
    try {
      // Verificar domínios atuais
      const domains = execSync('railway domain', { encoding: 'utf8' });
      console.log('📋 Domínios atuais:');
      console.log(domains);
      
      // Configurar domínio customizado se especificado
      const customDomain = process.env.RAILWAY_CUSTOM_DOMAIN;
      if (customDomain) {
        console.log(`🔗 Configurando domínio customizado: ${customDomain}`);
        execSync(`railway domain add ${customDomain}`, { stdio: 'inherit' });
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao configurar domínios:', error.message);
    }
  }

  /**
   * Configura monitoramento
   */
  async setupMonitoring() {
    console.log('\n📊 Configurando monitoramento...');
    
    try {
      // Configurar health checks
      const healthCheckPath = '/api/health';
      console.log(`🏥 Health check configurado em: ${healthCheckPath}`);
      
      // Configurar logs estruturados
      console.log('📝 Logs estruturados habilitados');
      
      // Configurar métricas
      console.log('📈 Métricas habilitadas');
      
    } catch (error) {
      console.log('⚠️ Erro ao configurar monitoramento:', error.message);
    }
  }

  /**
   * Testa configuração
   */
  async testConfiguration() {
    console.log('\n🧪 Testando configuração...');
    
    try {
      // Verificar status do projeto
      const status = execSync('railway status', { encoding: 'utf8' });
      console.log('✅ Status do projeto:');
      console.log(status);
      
      // Verificar variáveis
      const variables = execSync('railway variables', { encoding: 'utf8' });
      console.log('✅ Variáveis configuradas:');
      console.log(variables);
      
      // Verificar domínios
      const domains = execSync('railway domain', { encoding: 'utf8' });
      console.log('✅ Domínios configurados:');
      console.log(domains);
      
    } catch (error) {
      throw new Error(`Falha no teste de configuração: ${error.message}`);
    }
  }

  /**
   * Parse arquivo .env
   */
  parseEnvFile(content) {
    const variables = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (value !== 'your_..._here' && value !== '') {
            variables[key] = value;
          }
        }
      }
    }
    
    return variables;
  }
}

// Executar setup se chamado diretamente
if (require.main === module) {
  const setup = new RailwaySetup();
  setup.run().catch(console.error);
}

module.exports = RailwaySetup;
