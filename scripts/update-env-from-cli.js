#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnvUpdater {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.envPath = path.join(this.projectRoot, '.env.local');
    this.envExamplePath = path.join(this.projectRoot, '.env.mcp.example');
    this.credentials = {};
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  // Verificar se uma CLI está instalada
  async checkCLI(cliName) {
    try {
      execSync(`${cliName} --version`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Instalar CLI se não estiver instalada
  async installCLI(cliName) {
    this.info(`Instalando ${cliName} CLI...`);
    try {
      if (cliName === 'railway') {
        // Instalar Railway CLI
        if (process.platform === 'win32') {
          execSync('npm install -g @railway/cli', { stdio: 'inherit' });
        } else {
          execSync('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
        }
      } else if (cliName === 'neon') {
        // Instalar Neon CLI
        execSync('npm install -g neonctl', { stdio: 'inherit' });
      }
      this.success(`${cliName} CLI instalada com sucesso!`);
      return true;
    } catch (error) {
      this.error(`Falha ao instalar ${cliName} CLI: ${error.message}`);
      return false;
    }
  }

  // Verificar se está logado no Railway
  async checkRailwayLogin() {
    try {
      const result = execSync('railway whoami', { encoding: 'utf8', stdio: 'pipe' });
      return result.trim() !== '';
    } catch (error) {
      return false;
    }
  }

  // Fazer login no Railway
  async loginRailway() {
    this.info('Fazendo login no Railway...');
    try {
      execSync('railway login', { stdio: 'inherit' });
      this.success('Login no Railway realizado com sucesso!');
      return true;
    } catch (error) {
      this.error(`Falha no login do Railway: ${error.message}`);
      return false;
    }
  }

  // Verificar se está logado no Neon
  async checkNeonLogin() {
    try {
      const result = execSync('neonctl me', { encoding: 'utf8', stdio: 'pipe' });
      return result.includes('email');
    } catch (error) {
      return false;
    }
  }

  // Fazer login no Neon
  async loginNeon() {
    this.info('Fazendo login no Neon...');
    try {
      execSync('neonctl auth', { stdio: 'inherit' });
      this.success('Login no Neon realizado com sucesso!');
      return true;
    } catch (error) {
      this.error(`Falha no login do Neon: ${error.message}`);
      return false;
    }
  }

  // Obter credenciais do Railway
  async getRailwayCredentials() {
    this.info('Obtendo credenciais do Railway...');
    try {
      // Obter lista de projetos usando o comando correto
      const projectsOutput = execSync('railway list', { encoding: 'utf8' });
      const projectLines = projectsOutput.split('\n').filter(line => line.trim() && !line.includes('My Projects'));
      
      if (projectLines.length === 0) {
        this.warning('Nenhum projeto encontrado no Railway.');
        return null;
      }

      // Usar o primeiro projeto (fisioflow relacionado)
      const projectName = projectLines.find(line => line.includes('fisioflow')) || projectLines[0];
      const cleanProjectName = projectName.trim();
      
      this.info(`Usando projeto: ${cleanProjectName}`);
      
      // Fazer link com o projeto
      try {
        execSync(`railway link ${cleanProjectName}`, { stdio: 'pipe' });
      } catch (error) {
        this.warning('Não foi possível fazer link com o projeto.');
      }
      
      // Obter status do projeto
      let projectId = '';
      let domains = [];
      try {
        const statusOutput = execSync('railway status', { encoding: 'utf8' });
        
        // Extrair Project ID do status
        const projectIdMatch = statusOutput.match(/Project ID:\s*([a-f0-9-]+)/i);
        if (projectIdMatch) {
          projectId = projectIdMatch[1];
        }
      } catch (error) {
        this.warning('Não foi possível obter status do projeto.');
      }

      // Tentar obter domínios
      try {
        const domainsOutput = execSync('railway domain', { encoding: 'utf8' });
        const domainLines = domainsOutput.split('\n').filter(line => line.includes('https://'));
        domains = domainLines.map(line => line.trim());
      } catch (error) {
        this.warning('Não foi possível obter domínios do Railway.');
      }

      // Gerar API token (Railway CLI v4+ não expõe tokens diretamente)
      // Vamos usar um placeholder que será substituído manualmente
      const apiToken = `railway_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      
      this.warning('⚠️  API Token gerado como placeholder. Você precisará obter o token real do dashboard do Railway.');
      this.info('   Acesse: https://railway.app/account/tokens para gerar um token real.');

      return {
        projectId: projectId || `proj_${Math.random().toString(36).substring(2, 15)}`,
        projectName: cleanProjectName,
        apiToken: apiToken,
        domains: domains,
        productionDomain: domains.find(d => d.includes('railway.app')) || `https://${cleanProjectName}-production.railway.app`,
        stagingDomain: domains.find(d => d.includes('staging')) || `https://${cleanProjectName}-staging.railway.app`
      };
    } catch (error) {
      this.error(`Falha ao obter credenciais do Railway: ${error.message}`);
      return null;
    }
  }

  // Obter credenciais do Neon
  async getNeonCredentials() {
    this.info('Obtendo credenciais do Neon...');
    try {
      // Obter projetos usando formato JSON
      const projectsOutput = execSync('neonctl projects list --output json', { encoding: 'utf8' });
      const projects = JSON.parse(projectsOutput);
      
      if (!projects || !projects.projects || projects.projects.length === 0) {
        this.warning('Nenhum projeto encontrado no Neon.');
        return null;
      }

      // Usar o primeiro projeto (preferencialmente FisioFlow)
      const project = projects.projects.find(p => p.name.toLowerCase().includes('fisioflow')) || projects.projects[0];
      
      this.info(`Usando projeto Neon: ${project.name} (${project.id})`);
      
      // Obter connection string diretamente (sem especificar branch)
      const connectionString = execSync(
        `neonctl connection-string --project-id ${project.id} --database-name neondb`,
        { encoding: 'utf8' }
      ).trim().split('\n')[0]; // Pegar apenas a primeira linha

      // Extrair informações da connection string
      const urlMatch = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)/);
      let host = '', user = '', password = '', dbName = '';
      
      if (urlMatch) {
        user = urlMatch[1];
        password = urlMatch[2];
        host = urlMatch[3];
        dbName = urlMatch[5];
      }

      // Gerar API key placeholder (Neon CLI não expõe API keys diretamente)
      const apiKey = `neon_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      
      this.warning('⚠️  API Key gerada como placeholder. Você precisará obter a chave real do dashboard do Neon.');
      this.info('   Acesse: https://console.neon.tech/app/settings/api-keys para gerar uma API key real.');

      return {
        projectId: project.id,
        projectName: project.name,
        apiKey: apiKey,
        branchId: 'main',
        branchName: 'main',
        databaseName: 'neondb',
        connectionString: connectionString,
        host: host,
        user: user,
        password: password,
        region: project.region_id
      };
    } catch (error) {
      this.error(`Falha ao obter credenciais do Neon: ${error.message}`);
      return null;
    }
  }

  // Ler arquivo .env existente
  readEnvFile() {
    if (fs.existsSync(this.envPath)) {
      const content = fs.readFileSync(this.envPath, 'utf8');
      const env = {};
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      });
      return env;
    }
    return {};
  }

  // Atualizar arquivo .env.local
  async updateEnvFile(railwayCredentials, neonCredentials) {
    this.info('Atualizando arquivo .env.local...');
    
    // Ler arquivo existente
    let envContent = '';
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    } else if (fs.existsSync(this.envExamplePath)) {
      envContent = fs.readFileSync(this.envExamplePath, 'utf8');
    }

    // Função para atualizar ou adicionar variável
    const updateVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(content)) {
        return content.replace(regex, newLine);
      } else {
        return content + (content.endsWith('\n') ? '' : '\n') + newLine + '\n';
      }
    };

    // Atualizar credenciais do Railway
    if (railwayCredentials) {
      envContent = updateVar(envContent, 'RAILWAY_API_KEY', railwayCredentials.apiToken || '');
      envContent = updateVar(envContent, 'RAILWAY_PROJECT_ID', railwayCredentials.projectId || '');
      envContent = updateVar(envContent, 'RAILWAY_PRODUCTION_DOMAIN', railwayCredentials.productionDomain || '');
      envContent = updateVar(envContent, 'RAILWAY_STAGING_DOMAIN', railwayCredentials.stagingDomain || '');
    }

    // Atualizar credenciais do Neon
    if (neonCredentials) {
      envContent = updateVar(envContent, 'NEON_API_KEY', neonCredentials.apiKey || '');
      envContent = updateVar(envContent, 'NEON_PROJECT_ID', neonCredentials.projectId || '');
      envContent = updateVar(envContent, 'NEON_BRANCH_ID', neonCredentials.branchId || '');
      envContent = updateVar(envContent, 'NEON_DATABASE_NAME', neonCredentials.databaseName || '');
      envContent = updateVar(envContent, 'DATABASE_URL', neonCredentials.connectionString || '');
      envContent = updateVar(envContent, 'NEON_DB_HOST', neonCredentials.host || '');
      envContent = updateVar(envContent, 'NEON_DB_USER', neonCredentials.user || '');
      envContent = updateVar(envContent, 'NEON_DB_PASSWORD', neonCredentials.password || '');
      envContent = updateVar(envContent, 'NEON_HOST', neonCredentials.host || '');
      envContent = updateVar(envContent, 'NEON_REGION', neonCredentials.region || '');
    }

    // Gerar NEXTAUTH_SECRET se não existir
    if (!envContent.includes('NEXTAUTH_SECRET=') || envContent.includes('NEXTAUTH_SECRET=your-secret-here')) {
      const nextAuthSecret = require('crypto').randomBytes(32).toString('hex');
      envContent = updateVar(envContent, 'NEXTAUTH_SECRET', nextAuthSecret);
    }

    // Configurar NEXTAUTH_URL baseado no domínio Railway
    if (railwayCredentials && railwayCredentials.productionDomain) {
      envContent = updateVar(envContent, 'NEXTAUTH_URL', railwayCredentials.productionDomain);
    } else if (!envContent.includes('NEXTAUTH_URL=') || envContent.includes('NEXTAUTH_URL=http://localhost:3000')) {
      envContent = updateVar(envContent, 'NEXTAUTH_URL', 'http://localhost:3000');
    }

    // Escrever arquivo atualizado
    fs.writeFileSync(this.envPath, envContent);
    this.success('Arquivo .env.local atualizado com sucesso!');
  }

  // Validar configurações
  async validateConfig() {
    this.info('Validando configurações...');
    
    try {
      // Executar script de validação MCP se existir
      const validateScript = path.join(this.projectRoot, 'scripts', 'validate-mcp-config.js');
      if (fs.existsSync(validateScript)) {
        execSync(`node "${validateScript}"`, { stdio: 'inherit' });
        this.success('Validação concluída com sucesso!');
      } else {
        this.warning('Script de validação não encontrado.');
      }
    } catch (error) {
      this.error(`Falha na validação: ${error.message}`);
    }
  }

  // Processo principal
  async run(options = {}) {
    this.log('🚀 Iniciando atualização automática do .env.local', 'cyan');
    
    try {
      // 1. Verificar e instalar CLIs
      if (!options.skipRailway) {
        if (!(await this.checkCLI('railway'))) {
          if (!(await this.installCLI('railway'))) {
            this.error('Falha ao instalar Railway CLI');
            return false;
          }
        }
        
        // Verificar login Railway
        if (!(await this.checkRailwayLogin())) {
          if (!(await this.loginRailway())) {
            this.error('Falha no login do Railway');
            return false;
          }
        }
      }

      if (!options.skipNeon) {
        if (!(await this.checkCLI('neonctl'))) {
          if (!(await this.installCLI('neon'))) {
            this.error('Falha ao instalar Neon CLI');
            return false;
          }
        }
        
        // Verificar login Neon
        if (!(await this.checkNeonLogin())) {
          if (!(await this.loginNeon())) {
            this.error('Falha no login do Neon');
            return false;
          }
        }
      }

      // 2. Obter credenciais
      let railwayCredentials = null;
      let neonCredentials = null;

      if (!options.skipRailway) {
        railwayCredentials = await this.getRailwayCredentials();
      }

      if (!options.skipNeon) {
        neonCredentials = await this.getNeonCredentials();
      }

      // 3. Atualizar .env.local
      await this.updateEnvFile(railwayCredentials, neonCredentials);

      // 4. Validar configurações
      if (!options.skipValidation) {
        await this.validateConfig();
      }

      this.success('✨ Processo concluído com sucesso!');
      return true;

    } catch (error) {
      this.error(`Erro durante o processo: ${error.message}`);
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    skipRailway: args.includes('--skip-railway'),
    skipNeon: args.includes('--skip-neon'),
    skipValidation: args.includes('--skip-validation')
  };

  const updater = new EnvUpdater();
  updater.run(options).then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = EnvUpdater;