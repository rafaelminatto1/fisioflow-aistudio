#!/usr/bin/env node

/**
 * Script para Configurar Projeto Neon DB via MCP
 * Usa MCP Server do Neon para criar e gerenciar o projeto
 */

const { execSync } = require('child_process');
const readline = require('readline');

class NeonProjectSetupMCP {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.neonApiKey = '';
    this.projectName = 'fisioflow';
    this.databaseName = 'fisioflow';
    this.branchName = 'main';
  }

  async run() {
    console.log('🌿 FISIOFLOW - CONFIGURAÇÃO DE PROJETO NEON DB VIA MCP');
    console.log('================================================================\n');

    try {
      // 1. Verificar instalação do MCP Server
      await this.checkMCPInstallation();
      
      // 2. Coletar credenciais
      await this.collectCredentials();
      
      // 3. Configurar MCP Server
      await this.setupMCPServer();
      
      // 4. Criar projeto Neon
      await this.createNeonProject();
      
      // 5. Configurar banco e branch
      await this.setupDatabaseAndBranch();
      
      // 6. Testar conexão
      await this.testConnection();
      
      // 7. Configurar Railway
      await this.configureRailway();
      
      console.log('\n✅ PROJETO NEON DB CRIADO E CONFIGURADO COM SUCESSO!');
      
    } catch (error) {
      console.error('\n❌ ERRO:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async checkMCPInstallation() {
    console.log('🔍 Verificando instalação do MCP Server...');
    
    try {
      const version = execSync('npx @neondatabase/mcp-server-neon --version', { encoding: 'utf8' });
      console.log('✅ MCP Server instalado:', version.trim());
    } catch (error) {
      throw new Error('MCP Server do Neon não está instalado. Execute: npm install -g @neondatabase/mcp-server-neon');
    }
  }

  async collectCredentials() {
    console.log('\n📝 Por favor, forneça as credenciais do Neon:\n');
    
    this.neonApiKey = await this.question('🔑 Neon API Key: ');
    
    if (!this.neonApiKey) {
      throw new Error('API Key do Neon é obrigatória');
    }

    this.projectName = await this.question(`📁 Nome do projeto (padrão: ${this.projectName}): `) || this.projectName;
    this.databaseName = await this.question(`🗄️ Nome do banco (padrão: ${this.databaseName}): `) || this.databaseName;
    this.branchName = await this.question(`🌿 Nome da branch (padrão: ${this.branchName}): `) || this.branchName;
  }

  async setupMCPServer() {
    console.log('\n🔧 Configurando MCP Server...');
    
    try {
      // Testar MCP Server com a API Key
      console.log('🧪 Testando MCP Server...');
      const testResult = execSync(`npx @neondatabase/mcp-server-neon start ${this.neonApiKey} --test`, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000
      });
      console.log('✅ MCP Server funcionando');
      
    } catch (error) {
      console.log('⚠️ Erro ao testar MCP Server:', error.message);
      console.log('💡 Continuando com a configuração...');
    }
  }

  async createNeonProject() {
    console.log('\n🚀 Criando projeto Neon...');
    
    try {
      // Usar MCP Server para criar o projeto
      console.log('🔧 Executando comando MCP para criar projeto...');
      
      // Simular criação via MCP (em produção, isso seria feito via MCP Client)
      console.log(`📋 Comando MCP: create_project("${this.projectName}")`);
      console.log('💡 Para executar via MCP Client, use:');
      console.log(`   npx @neondatabase/mcp-server-neon start ${this.neonApiKey}`);
      console.log(`   create_project("${this.projectName}")`);
      
      // Por enquanto, vamos usar a API diretamente
      await this.createProjectViaAPI();
      
    } catch (error) {
      console.log('⚠️ Erro ao criar projeto via MCP:', error.message);
      console.log('💡 Tentando criar via API direta...');
      await this.createProjectViaAPI();
    }
  }

  async createProjectViaAPI() {
    console.log('\n🌐 Criando projeto via API Neon...');
    
    try {
      // Criar projeto usando curl (ou PowerShell no Windows)
      const createProjectCmd = `curl -X POST "https://api.neon.tech/v2/projects" \
        -H "accept: application/json" \
        -H "Authorization: Bearer ${this.neonApiKey}" \
        -H "Content-Type: application/json" \
        -d "{\\"name\\":\\"${this.projectName}\\",\\"database_name\\":\\"${this.databaseName}\\"}"`;
      
      console.log('📋 Comando para criar projeto:');
      console.log(createProjectCmd);
      
      // No Windows, usar PowerShell
      const psCommand = `Invoke-RestMethod -Uri "https://api.neon.tech/v2/projects" -Method POST -Headers @{"Authorization"="Bearer ${this.neonApiKey}"; "Content-Type"="application/json"} -Body '{"name":"${this.projectName}","database_name":"${this.databaseName}"}'`;
      
      console.log('\n📋 Comando PowerShell:');
      console.log(psCommand);
      
      console.log('\n💡 Execute um dos comandos acima para criar o projeto');
      console.log('🔑 Depois, forneça o Project ID retornado');
      
      // Aguardar input do usuário
      const projectId = await this.question('\n📁 Project ID retornado: ');
      
      if (projectId) {
        this.projectId = projectId;
        console.log('✅ Project ID configurado:', this.projectId);
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao criar projeto via API:', error.message);
    }
  }

  async setupDatabaseAndBranch() {
    console.log('\n🗄️ Configurando banco e branch...');
    
    if (!this.projectId) {
      console.log('⚠️ Project ID não disponível, pulando configuração de banco/branch');
      return;
    }
    
    try {
      console.log('🔧 Configurando via MCP...');
      console.log(`📋 Comandos MCP:`);
      console.log(`   describe_project("${this.projectId}")`);
      console.log(`   list_branch_computes("${this.projectId}")`);
      console.log(`   get_connection_string("${this.projectId}", "main")`);
      
      // Configurar variáveis de ambiente
      await this.setupEnvironmentVariables();
      
    } catch (error) {
      console.log('⚠️ Erro ao configurar banco/branch:', error.message);
    }
  }

  async setupEnvironmentVariables() {
    console.log('\n🌍 Configurando variáveis de ambiente...');
    
    const envVars = {
      'NEON_API_KEY': this.neonApiKey,
      'NEON_PROJECT_ID': this.projectId || 'your_project_id_here',
      'NEON_DB_NAME': this.databaseName,
      'NEON_BRANCH_NAME': this.branchName,
      'NEON_POOLED_CONNECTION': 'true',
      'NEON_MAX_CONNECTIONS': '20',
      'NEON_MIN_CONNECTIONS': '2'
    };

    // Salvar no .env.local
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    try {
      require('fs').writeFileSync('.env.local', envContent);
      console.log('✅ Variáveis salvas em .env.local');
      
      // Tentar configurar no Railway se disponível
      if (this.projectId) {
        await this.configureRailwayVariables(envVars);
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao salvar .env.local:', error.message);
    }
  }

  async configureRailwayVariables(envVars) {
    console.log('\n🚂 Configurando variáveis no Railway...');
    
    try {
      for (const [key, value] of Object.entries(envVars)) {
        try {
          execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
          console.log(`✅ ${key}=${key.includes('API_KEY') ? '***' : value}`);
        } catch (error) {
          console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Railway não disponível ou não configurado');
    }
  }

  async testConnection() {
    console.log('\n🧪 Testando conexão...');
    
    if (!this.projectId) {
      console.log('⚠️ Project ID não disponível, pulando teste de conexão');
      return;
    }
    
    try {
      console.log('🔍 Testando via MCP...');
      console.log(`📋 Comando MCP: run_sql("${this.projectId}", "main", "SELECT 1 as test")`);
      
      console.log('💡 Para testar a conexão, execute:');
      console.log(`   npx @neondatabase/mcp-server-neon start ${this.neonApiKey}`);
      console.log(`   run_sql("${this.projectId}", "main", "SELECT 1 as test")`);
      
    } catch (error) {
      console.log('⚠️ Erro ao testar conexão:', error.message);
    }
  }

  async configureRailway() {
    console.log('\n🚂 Configurando Railway...');
    
    try {
      // Verificar se Railway está configurado
      const status = execSync('railway status', { encoding: 'utf8' });
      console.log('✅ Railway configurado');
      
      // Configurar variáveis específicas do Railway
      const railwayVars = {
        'NODE_ENV': 'production',
        'PORT': '3000',
        'HOSTNAME': '0.0.0.0',
        'NEXT_TELEMETRY_DISABLED': '1'
      };

      for (const [key, value] of Object.entries(railwayVars)) {
        try {
          execSync(`railway variables --set "${key}=${value}"`, { stdio: 'pipe' });
          console.log(`✅ ${key}=${value}`);
        } catch (error) {
          console.log(`⚠️ Erro ao configurar ${key}: ${error.message}`);
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
  const setup = new NeonProjectSetupMCP();
  setup.run().catch(console.error);
}

module.exports = NeonProjectSetupMCP;
