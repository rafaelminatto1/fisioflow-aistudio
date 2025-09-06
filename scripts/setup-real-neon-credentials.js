#!/usr/bin/env node

/**
 * Script para Configurar Credenciais Reais do Neon DB
 * Usa Railway CLI para configurar as variáveis reais
 */

const { execSync } = require('child_process');
const readline = require('readline');

class NeonCredentialsSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.log('🌿 FISIOFLOW - CONFIGURAÇÃO DE CREDENCIAIS REAIS DO NEON DB');
    console.log('================================================================\n');

    try {
      // 1. Verificar status atual
      await this.checkCurrentStatus();
      
      // 2. Coletar credenciais do usuário
      const credentials = await this.collectCredentials();
      
      // 3. Configurar variáveis no Railway
      await this.configureRailwayVariables(credentials);
      
      // 4. Testar conexão
      await this.testConnection(credentials);
      
      // 5. Verificar configuração final
      await this.verifyFinalConfiguration();
      
      console.log('\n✅ CREDENCIAIS DO NEON DB CONFIGURADAS COM SUCESSO!');
      
    } catch (error) {
      console.error('\n❌ ERRO:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async checkCurrentStatus() {
    console.log('🔍 Verificando status atual das variáveis Neon...');
    
    try {
      const variables = execSync('railway variables --json', { encoding: 'utf8' });
      const jsonData = JSON.parse(variables);
      
      console.log('📊 Variáveis Neon atuais:');
      console.log(`   NEON_DB_HOST: ${jsonData.NEON_DB_HOST || '❌ Não configurado'}`);
      console.log(`   NEON_DB_NAME: ${jsonData.NEON_DB_NAME || '❌ Não configurado'}`);
      console.log(`   NEON_DB_USER: ${jsonData.NEON_DB_USER || '❌ Não configurado'}`);
      console.log(`   NEON_DB_PASSWORD: ${jsonData.NEON_DB_PASSWORD ? '***' : '❌ Não configurado'}`);
      console.log(`   NEON_API_KEY: ${jsonData.NEON_API_KEY || '❌ Não configurado'}`);
      console.log(`   NEON_PROJECT_ID: ${jsonData.NEON_PROJECT_ID || '❌ Não configurado'}`);
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar variáveis:', error.message);
    }
  }

  async collectCredentials() {
    console.log('\n📝 Por favor, forneça as credenciais reais do Neon DB:\n');
    
    const credentials = {};
    
    // Coletar informações básicas
    credentials.host = await this.question('🌐 Host do Neon DB (ex: ep-xxx-pooler.us-east-1.aws.neon.tech): ');
    credentials.port = await this.question('🔌 Porta (padrão: 5432): ') || '5432';
    credentials.database = await this.question('🗄️ Nome do banco (ex: fisioflow): ');
    credentials.user = await this.question('👤 Usuário: ');
    credentials.password = await this.question('🔑 Senha: ');
    
    // Coletar informações da API
    credentials.apiKey = await this.question('🔑 API Key do Neon: ');
    credentials.projectId = await this.question('📁 Project ID do Neon: ');
    
    // Coletar informações de pooling
    credentials.pooledConnection = await this.question('🌊 Usar conexão com pooling? (y/n, padrão: y): ') || 'y';
    credentials.maxConnections = await this.question('🔗 Máximo de conexões (padrão: 20): ') || '20';
    credentials.minConnections = await this.question('🔗 Mínimo de conexões (padrão: 2): ') || '2';
    
    return credentials;
  }

  async configureRailwayVariables(credentials) {
    console.log('\n🔧 Configurando variáveis no Railway...');
    
    const variables = {
      // Variáveis básicas do banco
      'NEON_DB_HOST': credentials.host,
      'NEON_DB_PORT': credentials.port,
      'NEON_DB_NAME': credentials.database,
      'NEON_DB_USER': credentials.user,
      'NEON_DB_PASSWORD': credentials.password,
      
      // Variáveis da API
      'NEON_API_KEY': credentials.apiKey,
      'NEON_PROJECT_ID': credentials.projectId,
      
      // Variáveis de pooling
      'NEON_POOLED_CONNECTION': credentials.pooledConnection === 'y' ? 'true' : 'false',
      'NEON_MAX_CONNECTIONS': credentials.maxConnections,
      'NEON_MIN_CONNECTIONS': credentials.minConnections,
      'NEON_CONNECTION_TIMEOUT': '30000',
      'NEON_IDLE_TIMEOUT': '600000',
      'NEON_STATEMENT_TIMEOUT': '30000',
      'NEON_QUERY_TIMEOUT': '30000'
    };

    for (const [key, value] of Object.entries(variables)) {
      try {
        execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${key.includes('PASSWORD') || key.includes('API_KEY') ? '***' : value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  async testConnection(credentials) {
    console.log('\n🧪 Testando conexão com o banco...');
    
    try {
      // Criar DATABASE_URL para teste
      const databaseUrl = `postgresql://${credentials.user}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}?sslmode=require`;
      
      // Testar com Prisma
      console.log('🔍 Testando conexão com Prisma...');
      execSync(`npx prisma db execute --stdin --url "${databaseUrl}" <<< "SELECT 1 as test"`, { 
        stdio: 'pipe',
        shell: true 
      });
      console.log('✅ Conexão com Prisma OK');
      
      // Atualizar DATABASE_URL no Railway se o teste passar
      try {
        execSync(`railway variables --set "DATABASE_URL=${databaseUrl}"`, { stdio: 'pipe' });
        console.log('✅ DATABASE_URL atualizado no Railway');
      } catch (error) {
        console.log('⚠️ Erro ao atualizar DATABASE_URL:', error.message);
      }
      
    } catch (error) {
      console.log('❌ Falha no teste de conexão:', error.message);
      console.log('💡 Verifique se as credenciais estão corretas');
    }
  }

  async verifyFinalConfiguration() {
    console.log('\n🧪 Verificando configuração final...');
    
    try {
      const variables = execSync('railway variables --json', { encoding: 'utf8' });
      const jsonData = JSON.parse(variables);
      
      console.log('📊 Configuração final das variáveis Neon:');
      console.log(`   NEON_DB_HOST: ${jsonData.NEON_DB_HOST || '❌ Não configurado'}`);
      console.log(`   NEON_DB_NAME: ${jsonData.NEON_DB_NAME || '❌ Não configurado'}`);
      console.log(`   NEON_DB_USER: ${jsonData.NEON_DB_USER || '❌ Não configurado'}`);
      console.log(`   NEON_DB_PASSWORD: ${jsonData.NEON_DB_PASSWORD ? '✅ Configurado' : '❌ Não configurado'}`);
      console.log(`   NEON_API_KEY: ${jsonData.NEON_API_KEY ? '✅ Configurado' : '❌ Não configurado'}`);
      console.log(`   NEON_PROJECT_ID: ${jsonData.NEON_PROJECT_ID || '❌ Não configurado'}`);
      console.log(`   DATABASE_URL: ${jsonData.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`);
      
      // Contar variáveis configuradas
      const neonVars = ['NEON_DB_HOST', 'NEON_DB_NAME', 'NEON_DB_USER', 'NEON_DB_PASSWORD', 'NEON_API_KEY', 'NEON_PROJECT_ID'];
      const configuredCount = neonVars.filter(varName => jsonData[varName]).length;
      
      console.log(`\n📊 Total de variáveis Neon configuradas: ${configuredCount}/${neonVars.length}`);
      
      if (configuredCount === neonVars.length) {
        console.log('🎯 Todas as variáveis Neon estão configuradas!');
      } else {
        console.log('⚠️ Algumas variáveis Neon ainda precisam ser configuradas');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar configuração final:', error.message);
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new NeonCredentialsSetup();
  setup.run().catch(console.error);
}

module.exports = NeonCredentialsSetup;
