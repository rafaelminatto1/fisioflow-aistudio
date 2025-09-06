#!/usr/bin/env node

/**
 * Script para Criar Projeto Neon DB
 * Execute: node scripts/create-neon-project.js
 */

const https = require('https');
const fs = require('fs');
const readline = require('readline');

class NeonProjectCreator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    console.log('🌿 FISIOFLOW - CRIAÇÃO DE PROJETO NEON DB');
    console.log('=============================================\n');

    try {
      // 1. Coletar credenciais
      const credentials = await this.collectCredentials();
      
      // 2. Criar projeto
      const project = await this.createProject(credentials);
      
      // 3. Aguardar projeto estar pronto
      await this.waitForProjectReady(credentials.apiKey, project.id);
      
      // 4. Obter informações completas
      const projectInfo = await this.getProjectInfo(credentials.apiKey, project.id);
      
      // 5. Obter connection string
      const connectionString = await this.getConnectionString(credentials.apiKey, project.id, projectInfo);
      
      // 6. Salvar configurações
      await this.saveConfiguration(credentials, project.id, connectionString);
      
      // 7. Configurar Railway
      await this.configureRailway(credentials, project.id, connectionString);
      
      console.log('\n🎉 PROJETO NEON DB CRIADO COM SUCESSO!');
      
    } catch (error) {
      console.error('\n❌ ERRO:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async collectCredentials() {
    console.log('📝 Por favor, forneça as credenciais do Neon:\n');
    
    const apiKey = await this.question('🔑 Neon API Key: ');
    if (!apiKey) {
      throw new Error('API Key do Neon é obrigatória');
    }

    const projectName = await this.question('📁 Nome do projeto (padrão: fisioflow): ') || 'fisioflow';
    const databaseName = await this.question('🗄️ Nome do banco (padrão: fisioflow): ') || 'fisioflow';

    return { apiKey, projectName, databaseName };
  }

  async createProject(credentials) {
    console.log('\n🚀 Criando projeto Neon...');
    
    const postData = JSON.stringify({
      name: credentials.projectName,
      database_name: credentials.databaseName
    });

    const options = {
      hostname: 'api.neon.tech',
      port: 443,
      path: '/v2/projects',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 201) {
            const response = JSON.parse(data);
            console.log('✅ Projeto criado com sucesso!');
            console.log(`   Project ID: ${response.id}`);
            console.log(`   Status: ${response.status}`);
            resolve(response);
          } else {
            reject(new Error(`Erro ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async waitForProjectReady(apiKey, projectId) {
    console.log('\n⏳ Aguardando projeto estar pronto...');
    
    return new Promise((resolve) => {
      const checkStatus = () => {
        this.getProjectInfo(apiKey, projectId).then(projectInfo => {
          console.log(`   Status atual: ${projectInfo.status}`);
          
          if (projectInfo.status === 'ready') {
            console.log('✅ Projeto está pronto!');
            resolve(projectInfo);
          } else if (projectInfo.status === 'creating') {
            setTimeout(checkStatus, 5000);
          } else {
            console.log(`⚠️ Projeto não está pronto. Status: ${projectInfo.status}`);
            resolve(projectInfo);
          }
        }).catch(error => {
          console.log(`   Erro ao verificar status: ${error.message}`);
          resolve(null);
        });
      };
      
      checkStatus();
    });
  }

  async getProjectInfo(apiKey, projectId) {
    const options = {
      hostname: 'api.neon.tech',
      port: 443,
      path: `/v2/projects/${projectId}`,
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            resolve(response);
          } else {
            reject(new Error(`Erro ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async getConnectionString(apiKey, projectId, projectInfo) {
    console.log('\n🔗 Obtendo connection string...');
    
    try {
      const options = {
        hostname: 'api.neon.tech',
        port: 443,
        path: `/v2/projects/${projectId}/branches`,
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              const mainBranch = response.branches.find(b => b.name === 'main');
              
              if (mainBranch && mainBranch.endpoints && mainBranch.endpoints.length > 0) {
                const connectionString = `postgresql://${projectInfo.owner_id}:${projectInfo.password}@${mainBranch.endpoints[0].host}:5432/${projectInfo.databases[0].name}?sslmode=require`;
                
                console.log('✅ Connection string obtida:');
                console.log(`   ${connectionString}`);
                
                resolve(connectionString);
              } else {
                reject(new Error('Branch main ou endpoints não encontrados'));
              }
            } else {
              reject(new Error(`Erro ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
      
    } catch (error) {
      console.log('⚠️ Erro ao obter connection string:', error.message);
      return null;
    }
  }

  async saveConfiguration(credentials, projectId, connectionString) {
    console.log('\n🌍 Salvando configurações...');
    
    const envVars = {
      'NEON_API_KEY': credentials.apiKey,
      'NEON_PROJECT_ID': projectId,
      'NEON_DB_NAME': credentials.databaseName,
      'NEON_BRANCH_NAME': 'main',
      'NEON_POOLED_CONNECTION': 'true',
      'NEON_MAX_CONNECTIONS': '20',
      'NEON_MIN_CONNECTIONS': '2'
    };

    // Salvar no .env.local
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    try {
      fs.writeFileSync('.env.local', envContent);
      console.log('✅ Variáveis salvas em .env.local');
      
      // Salvar connection string
      if (connectionString) {
        fs.writeFileSync('.neon-connection.txt', connectionString);
        console.log('✅ Connection string salva em .neon-connection.txt');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao salvar arquivos:', error.message);
    }
  }

  async configureRailway(credentials, projectId, connectionString) {
    console.log('\n🚂 Tentando configurar no Railway...');
    
    try {
      const { execSync } = require('child_process');
      
      const envVars = {
        'NEON_API_KEY': credentials.apiKey,
        'NEON_PROJECT_ID': projectId,
        'NEON_DB_NAME': credentials.databaseName,
        'NEON_BRANCH_NAME': 'main',
        'NEON_POOLED_CONNECTION': 'true',
        'NEON_MAX_CONNECTIONS': '20',
        'NEON_MIN_CONNECTIONS': '2'
      };

      for (const [key, value] of Object.entries(envVars)) {
        try {
          execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
          console.log(`✅ ${key}=${key.includes('API_KEY') ? '***' : value}`);
        } catch (error) {
          console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
        }
      }
      
      // Configurar DATABASE_URL se disponível
      if (connectionString) {
        try {
          execSync(`railway variables --set "DATABASE_URL=${connectionString}"`, { stdio: 'pipe' });
          console.log('✅ DATABASE_URL configurado');
        } catch (error) {
          console.log('⚠️ Erro ao configurar DATABASE_URL:', error.message);
        }
      }
      
    } catch (error) {
      console.log('⚠️ Railway não configurado ou não disponível');
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
  const creator = new NeonProjectCreator();
  creator.run().catch(console.error);
}

module.exports = NeonProjectCreator;
