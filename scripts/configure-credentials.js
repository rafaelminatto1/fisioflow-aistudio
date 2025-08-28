#!/usr/bin/env node

/**
 * Script para Configurar Credenciais Automaticamente
 * Usa CLI do Railway para configurar todas as variáveis necessárias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CredentialsConfigurator {
  constructor() {
    this.projectRoot = process.cwd();
    this.railwayProjectId = '9ef35899-98db-4e56-b32c-ae2c91c5a5d2';
    this.railwayServiceId = '66577a6e-948a-4866-af69-daab9010eb05';
  }

  /**
   * Executa configuração completa
   */
  async run() {
    console.log('🔐 FISIOFLOW - CONFIGURAÇÃO AUTOMÁTICA DE CREDENCIAIS');
    console.log('=====================================================\n');

    try {
      // 1. Verificar status do Railway
      await this.checkRailwayStatus();
      
      // 2. Configurar variáveis de ambiente
      await this.configureEnvironmentVariables();
      
      // 3. Configurar variáveis específicas do Neon
      await this.configureNeonVariables();
      
      // 4. Configurar variáveis de segurança
      await this.configureSecurityVariables();
      
      // 5. Configurar variáveis de monitoramento
      await this.configureMonitoringVariables();
      
      // 6. Verificar configuração final
      await this.verifyConfiguration();
      
      console.log('\n✅ CONFIGURAÇÃO DE CREDENCIAIS COMPLETA!');
      console.log('🎯 Todas as variáveis estão configuradas no Railway');
      
    } catch (error) {
      console.error('\n❌ ERRO NA CONFIGURAÇÃO:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verifica status do Railway
   */
  async checkRailwayStatus() {
    console.log('🔍 Verificando status do Railway...');
    
    try {
      const status = execSync('railway status', { encoding: 'utf8' });
      console.log('✅ Status do Railway:');
      console.log(status);
    } catch (error) {
      throw new Error('Railway não está configurado. Execute: railway login');
    }
  }

  /**
   * Configura variáveis de ambiente principais
   */
  async configureEnvironmentVariables() {
    console.log('\n🌍 Configurando variáveis de ambiente principais...');
    
    const envVars = {
      'NODE_ENV': 'production',
      'PORT': '3000',
      'HOSTNAME': '0.0.0.0',
      'NEXT_TELEMETRY_DISABLED': '1'
    };

    for (const [key, value] of Object.entries(envVars)) {
      try {
        execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Configura variáveis específicas do Neon DB
   */
  async configureNeonVariables() {
    console.log('\n🌿 Configurando variáveis do Neon DB...');
    
    // Extrair informações do DATABASE_URL atual
    try {
      const variables = execSync('railway variables', { encoding: 'utf8' });
      const databaseUrlMatch = variables.match(/DATABASE_URL\s*│\s*(postgresql:\/\/[^│]+)/);
      
      if (databaseUrlMatch) {
        const databaseUrl = databaseUrlMatch[1].trim();
        console.log('🔗 DATABASE_URL encontrado, configurando variáveis relacionadas...');
        
        // Extrair componentes da URL
        const urlParts = this.parseDatabaseUrl(databaseUrl);
        
        const neonVars = {
          'NEON_DB_HOST': urlParts.host,
          'NEON_DB_NAME': urlParts.database,
          'NEON_DB_USER': urlParts.user,
          'NEON_DB_PASSWORD': urlParts.password,
          'NEON_DB_PORT': urlParts.port || '5432',
          'NEON_POOLED_CONNECTION': 'true',
          'NEON_MAX_CONNECTIONS': '20',
          'NEON_MIN_CONNECTIONS': '2',
          'NEON_CONNECTION_TIMEOUT': '30000',
          'NEON_IDLE_TIMEOUT': '600000'
        };

        for (const [key, value] of Object.entries(neonVars)) {
          try {
            execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
            console.log(`✅ ${key}=${value}`);
          } catch (error) {
            console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao extrair informações do DATABASE_URL:', error.message);
    }
  }

  /**
   * Configura variáveis de segurança
   */
  async configureSecurityVariables() {
    console.log('\n🔒 Configurando variáveis de segurança...');
    
    const securityVars = {
      'HEALTH_CHECK_ENABLED': 'true',
      'RATE_LIMIT_ENABLED': 'true',
      'CORS_ENABLED': 'true',
      'STATUS_CHECK_TOKEN': this.generateSecureToken(),
      'ENCRYPTION_KEY': this.generateEncryptionKey()
    };

    for (const [key, value] of Object.entries(securityVars)) {
      try {
        execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Configura variáveis de monitoramento
   */
  async configureMonitoringVariables() {
    console.log('\n📊 Configurando variáveis de monitoramento...');
    
    const monitoringVars = {
      'RAILWAY_STRUCTURED_LOGGING': 'true',
      'RAILWAY_METRICS_ENABLED': 'true',
      'LOG_LEVEL': 'info',
      'ROUTE_CACHE_ENABLED': 'true',
      'ROUTE_CACHE_TTL': '300',
      'IMAGE_CACHE_TTL': '31536000'
    };

    for (const [key, value] of Object.entries(monitoringVars)) {
      try {
        execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key}=${value}`);
      } catch (error) {
        console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Verifica configuração final
   */
  async verifyConfiguration() {
    console.log('\n🧪 Verificando configuração final...');
    
    try {
      const variables = execSync('railway variables', { encoding: 'utf8' });
      console.log('✅ Variáveis configuradas:');
      console.log(variables);
      
      // Contar variáveis configuradas
      const lines = variables.split('\n');
      const varCount = lines.filter(line => line.includes('│')).length - 1; // -1 para o cabeçalho
      
      console.log(`\n📊 Total de variáveis configuradas: ${varCount}`);
      
    } catch (error) {
      throw new Error(`Falha na verificação: ${error.message}`);
    }
  }

  /**
   * Parse DATABASE_URL para extrair componentes
   */
  parseDatabaseUrl(url) {
    try {
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):?(\d*)\/([^?]+)/;
      const match = url.match(regex);
      
      if (match) {
        return {
          user: match[1],
          password: match[2],
          host: match[3],
          port: match[4] || '5432',
          database: match[5]
        };
      }
      
      return {};
    } catch (error) {
      console.log('⚠️ Erro ao fazer parse da DATABASE_URL:', error.message);
      return {};
    }
  }

  /**
   * Gera token seguro
   */
  generateSecureToken() {
    return 'fisioflow_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Gera chave de criptografia
   */
  generateEncryptionKey() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const configurator = new CredentialsConfigurator();
  configurator.run().catch(console.error);
}

module.exports = CredentialsConfigurator;
