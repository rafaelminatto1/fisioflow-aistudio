#!/usr/bin/env node

const EnvUpdater = require('./update-env-from-cli');

class RailwaySetup extends EnvUpdater {
  constructor() {
    super();
  }

  async setupRailway() {
    this.log('🚂 Configurando Railway CLI e credenciais', 'cyan');
    
    try {
      // Verificar e instalar Railway CLI
      if (!(await this.checkCLI('railway'))) {
        this.info('Railway CLI não encontrada. Instalando...');
        if (!(await this.installCLI('railway'))) {
          this.error('Falha ao instalar Railway CLI');
          return false;
        }
      } else {
        this.success('Railway CLI já está instalada');
      }

      // Verificar login
      if (!(await this.checkRailwayLogin())) {
        this.info('Não está logado no Railway. Fazendo login...');
        if (!(await this.loginRailway())) {
          this.error('Falha no login do Railway');
          return false;
        }
      } else {
        this.success('Já está logado no Railway');
      }

      // Obter credenciais
      const credentials = await this.getRailwayCredentials();
      if (!credentials) {
        this.error('Falha ao obter credenciais do Railway');
        return false;
      }

      // Mostrar informações obtidas
      this.log('\n📋 Credenciais obtidas do Railway:', 'green');
      this.log(`   Project ID: ${credentials.projectId}`);
      this.log(`   Project Name: ${credentials.projectName}`);
      this.log(`   Production Domain: ${credentials.productionDomain}`);
      this.log(`   Staging Domain: ${credentials.stagingDomain}`);
      this.log(`   API Token: ${credentials.apiToken ? '✅ Obtido' : '❌ Não disponível'}`);

      // Atualizar .env.local apenas com credenciais do Railway
      await this.updateEnvFile(credentials, null);

      this.success('✨ Railway configurado com sucesso!');
      return true;

    } catch (error) {
      this.error(`Erro ao configurar Railway: ${error.message}`);
      return false;
    }
  }

  // Listar projetos Railway
  async listProjects() {
    this.info('📋 Listando projetos Railway...');
    try {
      const projects = JSON.parse(execSync('railway projects --json', { encoding: 'utf8' }));
      
      if (projects.length === 0) {
        this.warning('Nenhum projeto encontrado.');
        return;
      }

      this.log('\n🚂 Projetos Railway:', 'cyan');
      projects.forEach((project, index) => {
        this.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
      });

    } catch (error) {
      this.error(`Erro ao listar projetos: ${error.message}`);
    }
  }

  // Verificar status do Railway
  async checkStatus() {
    this.info('🔍 Verificando status do Railway...');
    
    try {
      // Verificar CLI
      const cliInstalled = await this.checkCLI('railway');
      this.log(`   CLI Instalada: ${cliInstalled ? '✅' : '❌'}`);

      if (cliInstalled) {
        // Verificar login
        const loggedIn = await this.checkRailwayLogin();
        this.log(`   Logado: ${loggedIn ? '✅' : '❌'}`);

        if (loggedIn) {
          // Mostrar usuário atual
          try {
            const user = execSync('railway whoami', { encoding: 'utf8' }).trim();
            this.log(`   Usuário: ${user}`);
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

  const railwaySetup = new RailwaySetup();

  switch (command) {
    case 'setup':
      railwaySetup.setupRailway().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
    
    case 'status':
      railwaySetup.checkStatus().then(() => {
        process.exit(0);
      });
      break;
    
    case 'projects':
      railwaySetup.listProjects().then(() => {
        process.exit(0);
      });
      break;
    
    default:
      console.log('Uso: node setup-railway.js [setup|status|projects]');
      process.exit(1);
  }
}

module.exports = RailwaySetup;