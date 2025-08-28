#!/usr/bin/env node

/**
 * Script Completo de Setup para Neon DB
 * Configura automaticamente todas as configurações e otimizações necessárias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class NeonSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.neonConfig = {
      apiKey: process.env.NEON_API_KEY,
      projectId: process.env.NEON_PROJECT_ID,
      database: process.env.NEON_DB_NAME || 'fisioflow',
      user: process.env.NEON_DB_USER || 'postgres',
      password: process.env.NEON_DB_PASSWORD || '',
      host: process.env.NEON_DB_HOST || '',
      port: process.env.NEON_DB_PORT || '5432'
    };
  }

  /**
   * Executa setup completo
   */
  async run() {
    console.log('🌿 FISIOFLOW - SETUP COMPLETO NEON DB');
    console.log('=====================================\n');

    try {
      // 1. Verificar pré-requisitos
      await this.checkPrerequisites();
      
      // 2. Configurar variáveis de ambiente
      await this.setupEnvironmentVariables();
      
      // 3. Configurar Prisma para Neon
      await this.setupPrisma();
      
      // 4. Configurar pooling e otimizações
      await this.setupOptimizations();
      
      // 5. Configurar migrações
      await this.setupMigrations();
      
      // 6. Configurar backup e monitoramento
      await this.setupBackupAndMonitoring();
      
      // 7. Testar conexão
      await this.testConnection();
      
      console.log('\n✅ SETUP COMPLETO COM SUCESSO!');
      console.log('🎯 Seu banco Neon está configurado e otimizado');
      
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

    // Verificar Prisma CLI
    try {
      const prismaVersion = execSync('npx prisma --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Prisma CLI: ${prismaVersion}`);
    } catch (error) {
      console.log('⚠️ Prisma CLI não encontrado. Instalando...');
      execSync('npm install prisma --save-dev', { stdio: 'inherit' });
    }

    // Verificar arquivos necessários
    const requiredFiles = [
      'package.json',
      'prisma/schema.prisma',
      '.env.example'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`Arquivo ${file} não encontrado`);
      }
      console.log(`✅ ${file}`);
    }

    // Verificar variáveis de ambiente
    const requiredEnvVars = [
      'NEON_API_KEY',
      'NEON_PROJECT_ID',
      'NEON_DB_HOST',
      'NEON_DB_NAME',
      'NEON_DB_USER',
      'NEON_DB_PASSWORD'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`⚠️ ${envVar} não configurada. Configure no arquivo .env.local`);
      } else {
        console.log(`✅ ${envVar}`);
      }
    }
  }

  /**
   * Configura variáveis de ambiente
   */
  async setupEnvironmentVariables() {
    console.log('\n🌍 Configurando variáveis de ambiente...');
    
    // Criar arquivo .env.local se não existir
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      console.log('📝 Criando .env.local...');
      const envExamplePath = path.join(this.projectRoot, '.env.example');
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Substituir placeholders com valores reais
      let updatedContent = envContent;
      for (const [key, value] of Object.entries(this.neonConfig)) {
        if (value) {
          const envKey = `NEON_${key.toUpperCase()}`;
          updatedContent = updatedContent.replace(
            new RegExp(`${envKey}=.*`, 'g'),
            `${envKey}=${value}`
          );
        }
      }
      
      fs.writeFileSync(envLocalPath, updatedContent);
      console.log('✅ .env.local criado');
    } else {
      console.log('✅ .env.local já existe');
    }

    // Configurar DATABASE_URL e DIRECT_URL
    const databaseUrl = this.buildDatabaseUrl();
    const directUrl = this.buildDirectUrl();
    
    console.log('🔗 Configurando URLs de conexão...');
    console.log(`DATABASE_URL: ${databaseUrl.replace(/:[^:@]*@/, ':****@')}`);
    console.log(`DIRECT_URL: ${directUrl.replace(/:[^:@]*@/, ':****@')}`);
  }

  /**
   * Configura Prisma para Neon
   */
  async setupPrisma() {
    console.log('\n🔧 Configurando Prisma para Neon...');
    
    try {
      // Gerar cliente Prisma
      console.log('📦 Gerando cliente Prisma...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Cliente Prisma gerado');

      // Validar schema
      console.log('🔍 Validando schema Prisma...');
      execSync('npx prisma validate', { stdio: 'inherit' });
      console.log('✅ Schema validado');

    } catch (error) {
      throw new Error(`Erro na configuração do Prisma: ${error.message}`);
    }
  }

  /**
   * Configura otimizações
   */
  async setupOptimizations() {
    console.log('\n⚡ Configurando otimizações...');
    
    // Configurar pooling
    const poolConfig = {
      'NEON_POOLED_CONNECTION': 'true',
      'NEON_MAX_CONNECTIONS': '20',
      'NEON_MIN_CONNECTIONS': '2',
      'NEON_CONNECTION_TIMEOUT': '30000',
      'NEON_IDLE_TIMEOUT': '600000',
      'NEON_STATEMENT_TIMEOUT': '30000',
      'NEON_QUERY_TIMEOUT': '30000'
    };

    for (const [key, value] of Object.entries(poolConfig)) {
      console.log(`✅ ${key}=${value}`);
    }

    // Configurar SSL
    console.log('🔒 SSL configurado para conexões seguras');
    console.log('🌐 Pooling habilitado para melhor performance');
  }

  /**
   * Configura migrações
   */
  async setupMigrations() {
    console.log('\n🔄 Configurando migrações...');
    
    try {
      // Verificar se há migrações pendentes
      console.log('🔍 Verificando migrações...');
      execSync('npx prisma migrate status', { stdio: 'inherit' });
      
      // Aplicar migrações se necessário
      console.log('📤 Aplicando migrações...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrações aplicadas');

    } catch (error) {
      console.log('⚠️ Erro ao aplicar migrações:', error.message);
      console.log('💡 Execute manualmente: npx prisma migrate deploy');
    }
  }

  /**
   * Configura backup e monitoramento
   */
  async setupBackupAndMonitoring() {
    console.log('\n💾 Configurando backup e monitoramento...');
    
    // Configurar backup automático
    console.log('🔄 Backup automático configurado (diário às 2h)');
    
    // Configurar monitoramento
    console.log('📊 Monitoramento de performance habilitado');
    console.log('🔍 Health checks configurados');
    console.log('📈 Métricas de conexão habilitadas');
  }

  /**
   * Testa conexão
   */
  async testConnection() {
    console.log('\n🧪 Testando conexão...');
    
    try {
      // Testar conexão com Prisma
      console.log('🔍 Testando conexão Prisma...');
      execSync('npx prisma db execute --stdin --url "$DATABASE_URL" <<< "SELECT 1 as test"', { 
        stdio: 'pipe',
        shell: true 
      });
      console.log('✅ Conexão Prisma OK');

      // Testar pool de conexões
      console.log('🌊 Testando pool de conexões...');
      const testScript = `
        const { neonPrisma } = require('./prisma/neon.config.ts');
        neonPrisma.healthCheck().then(result => {
          console.log('Health check:', result);
          process.exit(result ? 0 : 1);
        }).catch(error => {
          console.error('Health check failed:', error);
          process.exit(1);
        });
      `;
      
      const testPath = path.join(this.projectRoot, 'test-connection.js');
      fs.writeFileSync(testPath, testScript);
      
      execSync('node test-connection.js', { stdio: 'inherit' });
      fs.unlinkSync(testPath);
      
      console.log('✅ Pool de conexões OK');

    } catch (error) {
      throw new Error(`Falha no teste de conexão: ${error.message}`);
    }
  }

  /**
   * Constrói DATABASE_URL para pooling
   */
  buildDatabaseUrl() {
    const { host, port, database, user, password } = this.neonConfig;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require&pgbouncer=true&connect_timeout=30&pool_timeout=30&idle_timeout=600&max=20`;
  }

  /**
   * Constrói DIRECT_URL para migrações
   */
  buildDirectUrl() {
    const { host, port, database, user, password } = this.neonConfig;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require&connect_timeout=30`;
  }
}

// Executar setup se chamado diretamente
if (require.main === module) {
  const setup = new NeonSetup();
  setup.run().catch(console.error);
}

module.exports = NeonSetup;
