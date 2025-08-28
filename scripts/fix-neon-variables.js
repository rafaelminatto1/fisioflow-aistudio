#!/usr/bin/env node

/**
 * Script para corrigir variáveis Neon extraindo do DATABASE_URL
 */

const { execSync } = require('child_process');

class NeonVariableFixer {
  constructor() {
    this.databaseUrl = '';
  }

  async run() {
    console.log('🔧 FISIOFLOW - CORREÇÃO DE VARIÁVEIS NEON');
    console.log('==========================================\n');

    try {
      // 1. Obter DATABASE_URL atual
      await this.getCurrentDatabaseUrl();
      
      // 2. Extrair componentes
      const components = this.extractComponents();
      
      // 3. Configurar variáveis corretas
      await this.setNeonVariables(components);
      
      // 4. Verificar resultado
      await this.verifyResult();
      
      console.log('\n✅ VARIÁVEIS NEON CORRIGIDAS!');
      
    } catch (error) {
      console.error('\n❌ ERRO:', error.message);
      process.exit(1);
    }
  }

  async getCurrentDatabaseUrl() {
    console.log('🔍 Obtendo DATABASE_URL atual...');
    
    try {
      const variables = execSync('railway variables --json', { encoding: 'utf8' });
      const jsonData = JSON.parse(variables);
      
      if (jsonData.DATABASE_URL) {
        this.databaseUrl = jsonData.DATABASE_URL;
        console.log('✅ DATABASE_URL encontrado');
        console.log(`🔗 ${this.databaseUrl.substring(0, 50)}...`);
      } else {
        throw new Error('DATABASE_URL não encontrado nas variáveis');
      }
    } catch (error) {
      throw new Error(`Erro ao obter DATABASE_URL: ${error.message}`);
    }
  }

  extractComponents() {
    console.log('\n🔍 Extraindo componentes da DATABASE_URL...');
    
    try {
      // Regex mais robusta para extrair componentes
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d*)\/([^?]+)/;
      const match = this.databaseUrl.match(regex);
      
      if (!match) {
        throw new Error('Formato da DATABASE_URL inválido');
      }
      
      const components = {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4] || '5432',
        database: match[5]
      };
      
      console.log('✅ Componentes extraídos:');
      console.log(`   Host: ${components.host}`);
      console.log(`   Port: ${components.port}`);
      console.log(`   Database: ${components.database}`);
      console.log(`   User: ${components.user}`);
      console.log(`   Password: ${components.password.substring(0, 8)}...`);
      
      return components;
      
    } catch (error) {
      throw new Error(`Erro ao extrair componentes: ${error.message}`);
    }
  }

  async setNeonVariables(components) {
    console.log('\n🌿 Configurando variáveis Neon corretas...');
    
    const neonVars = {
      'NEON_DB_HOST': components.host,
      'NEON_DB_PORT': components.port,
      'NEON_DB_NAME': components.database,
      'NEON_DB_USER': components.user,
      'NEON_DB_PASSWORD': components.password,
      'NEON_API_KEY': 'your_neon_api_key_here',
      'NEON_PROJECT_ID': 'your_neon_project_id_here'
    };

    for (const [key, value] of Object.entries(neonVars)) {
      try {
        execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${key.includes('PASSWORD') ? '***' : value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  async verifyResult() {
    console.log('\n🧪 Verificando resultado...');
    
    try {
      const variables = execSync('railway variables', { encoding: 'utf8' });
      
      // Verificar se as variáveis Neon estão corretas
      const neonVars = ['NEON_DB_HOST', 'NEON_DB_NAME', 'NEON_DB_USER', 'NEON_DB_PORT'];
      let correctCount = 0;
      
      for (const varName of neonVars) {
        const match = variables.match(new RegExp(`${varName}\\s*│\\s*([^│\\n]+)`));
        if (match && match[1].trim() !== 'undefined') {
          correctCount++;
        }
      }
      
      console.log(`📊 Variáveis Neon corretas: ${correctCount}/${neonVars.length}`);
      
      if (correctCount === neonVars.length) {
        console.log('✅ Todas as variáveis Neon estão configuradas corretamente!');
      } else {
        console.log('⚠️ Algumas variáveis Neon ainda precisam ser corrigidas');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar resultado:', error.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const fixer = new NeonVariableFixer();
  fixer.run().catch(console.error);
}

module.exports = NeonVariableFixer;
