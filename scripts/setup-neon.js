#!/usr/bin/env node

const EnvUpdater = require('./update-env-from-cli');
const { execSync } = require('child_process');

class NeonSetup extends EnvUpdater {
  constructor() {
    super();
  }

  async setupNeon() {
    this.log('🐘 Configurando Neon CLI e credenciais', 'cyan');
    
    try {
      // Verificar e instalar Neon CLI
      if (!(await this.checkCLI('neonctl'))) {
        this.info('Neon CLI não encontrada. Instalando...');
        if (!(await this.installCLI('neon'))) {
          this.error('Falha ao instalar Neon CLI');
          return false;
        }
      } else {
        this.success('Neon CLI já está instalada');
      }

      // Verificar login
      if (!(await this.checkNeonLogin())) {
        this.info('Não está logado no Neon. Fazendo login...');
        if (!(await this.loginNeon())) {
          this.error('Falha no login do Neon');
          return false;
        }
      } else {
        this.success('Já está logado no Neon');
      }

      // Obter credenciais
      const credentials = await this.getNeonCredentials();
      if (!credentials) {
        this.error('Falha ao obter credenciais do Neon');
        return false;
      }

      // Mostrar informações obtidas
      this.log('\n📋 Credenciais obtidas do Neon:', 'green');
      this.log(`   Project ID: ${credentials.projectId}`);
      this.log(`   Project Name: ${credentials.projectName}`);
      this.log(`   Branch: ${credentials.branchName} (${credentials.branchId})`);
      this.log(`   Database: ${credentials.databaseName}`);
      this.log(`   Host: ${credentials.host}`);
      this.log(`   Region: ${credentials.region}`);
      this.log(`   Connection String: ${credentials.connectionString ? '✅ Obtida' : '❌ Não disponível'}`);
      this.log(`   API Key: ${credentials.apiKey ? '✅ Obtida' : '❌ Não disponível'}`);

      // Atualizar .env.local apenas com credenciais do Neon
      await this.updateEnvFile(null, credentials);

      this.success('✨ Neon configurado com sucesso!');
      return true;

    } catch (error) {
      this.error(`Erro ao configurar Neon: ${error.message}`);
      return false;
    }
  }

  // Listar projetos Neon
  async listProjects() {
    this.info('📋 Listando projetos Neon...');
    try {
      const projects = JSON.parse(execSync('neonctl projects list --output json', { encoding: 'utf8' }));
      
      if (projects.length === 0) {
        this.warning('Nenhum projeto encontrado.');
        return;
      }

      this.log('\n🐘 Projetos Neon:', 'cyan');
      projects.forEach((project, index) => {
        this.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
        this.log(`      Region: ${project.region_id}`);
        this.log(`      Created: ${new Date(project.created_at).toLocaleDateString()}`);
      });

    } catch (error) {
      this.error(`Erro ao listar projetos: ${error.message}`);
    }
  }

  // Listar branches de um projeto
  async listBranches(projectId) {
    if (!projectId) {
      this.error('Project ID é obrigatório');
      return;
    }

    this.info(`📋 Listando branches do projeto ${projectId}...`);
    try {
      const branches = JSON.parse(execSync(`neonctl branches list --project-id ${projectId} --output json`, { encoding: 'utf8' }));
      
      if (branches.length === 0) {
        this.warning('Nenhuma branch encontrada.');
        return;
      }

      this.log('\n🌿 Branches:', 'cyan');
      branches.forEach((branch, index) => {
        this.log(`   ${index + 1}. ${branch.name} (ID: ${branch.id})`);
        this.log(`      Primary: ${branch.primary ? '✅' : '❌'}`);
        this.log(`      Created: ${new Date(branch.created_at).toLocaleDateString()}`);
      });

    } catch (error) {
      this.error(`Erro ao listar branches: ${error.message}`);
    }
  }

  // Listar databases de um projeto/branch
  async listDatabases(projectId, branchName = 'main') {
    if (!projectId) {
      this.error('Project ID é obrigatório');
      return;
    }

    this.info(`📋 Listando databases do projeto ${projectId}, branch ${branchName}...`);
    try {
      const databases = JSON.parse(execSync(`neonctl databases list --project-id ${projectId} --branch ${branchName} --output json`, { encoding: 'utf8' }));
      
      if (databases.length === 0) {
        this.warning('Nenhum database encontrado.');
        return;
      }

      this.log('\n🗄️  Databases:', 'cyan');
      databases.forEach((db, index) => {
        this.log(`   ${index + 1}. ${db.name} (ID: ${db.id})`);
        this.log(`      Owner: ${db.owner_name}`);
        this.log(`      Created: ${new Date(db.created_at).toLocaleDateString()}`);
      });

    } catch (error) {
      this.error(`Erro ao listar databases: ${error.message}`);
    }
  }

  // Testar conexão com o banco
  async testConnection(connectionString) {
    if (!connectionString) {
      this.error('Connection string é obrigatória');
      return;
    }

    this.info('🔍 Testando conexão com o banco...');
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString });
      
      await client.connect();
      const result = await client.query('SELECT 1 as test');
      await client.end();
      
      if (result.rows[0].test === 1) {
        this.success('✅ Conexão com o banco estabelecida com sucesso!');
        return true;
      }
    } catch (error) {
      this.error(`❌ Falha na conexão: ${error.message}`);
      return false;
    }
  }

  // Verificar status do Neon
  async checkStatus() {
    this.info('🔍 Verificando status do Neon...');
    
    try {
      // Verificar CLI
      const cliInstalled = await this.checkCLI('neonctl');
      this.log(`   CLI Instalada: ${cliInstalled ? '✅' : '❌'}`);

      if (cliInstalled) {
        // Verificar login
        const loggedIn = await this.checkNeonLogin();
        this.log(`   Logado: ${loggedIn ? '✅' : '❌'}`);

        if (loggedIn) {
          // Mostrar usuário atual
          try {
            const userInfo = JSON.parse(execSync('neonctl me --output json', { encoding: 'utf8' }));
            this.log(`   Usuário: ${userInfo.email}`);
            this.log(`   ID: ${userInfo.id}`);
          } catch (error) {
            this.warning('Não foi possível obter informações do usuário');
          }

          // Listar projetos
          await this.listProjects();
        }
      }

    } catch (error) {
      this.error(`Erro ao verificar status: ${error.message}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  const neonSetup = new NeonSetup();

  switch (command) {
    case 'setup':
      neonSetup.setupNeon().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
    
    case 'status':
      neonSetup.checkStatus().then(() => {
        process.exit(0);
      });
      break;
    
    case 'projects':
      neonSetup.listProjects().then(() => {
        process.exit(0);
      });
      break;
    
    case 'branches':
      const projectId = args[1];
      if (!projectId) {
        console.log('Uso: node setup-neon.js branches <project-id>');
        process.exit(1);
      }
      neonSetup.listBranches(projectId).then(() => {
        process.exit(0);
      });
      break;
    
    case 'databases':
      const projId = args[1];
      const branchName = args[2] || 'main';
      if (!projId) {
        console.log('Uso: node setup-neon.js databases <project-id> [branch-name]');
        process.exit(1);
      }
      neonSetup.listDatabases(projId, branchName).then(() => {
        process.exit(0);
      });
      break;
    
    case 'test':
      const connString = args[1];
      if (!connString) {
        console.log('Uso: node setup-neon.js test <connection-string>');
        process.exit(1);
      }
      neonSetup.testConnection(connString).then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
    
    default:
      console.log('Uso: node setup-neon.js [setup|status|projects|branches|databases|test]');
      process.exit(1);
  }
}

module.exports = NeonSetup;