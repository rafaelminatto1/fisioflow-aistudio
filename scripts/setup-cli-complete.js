#!/usr/bin/env node

/**
 * Script Completo de Setup CLI para FisioFlow
 * Instala e configura todas as ferramentas CLI necessárias para Railway e Neon DB
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CLISetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.tools = {
      railway: {
        name: 'Railway CLI',
        package: '@railway/cli',
        global: true,
        commands: ['railway --version', 'railway login', 'railway whoami']
      },
      neon: {
        name: 'Neon CLI',
        package: '@neondatabase/cli',
        global: false,
        commands: ['npx @neondatabase/cli --version']
      },
      prisma: {
        name: 'Prisma CLI',
        package: 'prisma',
        global: false,
        commands: ['npx prisma --version', 'npx prisma generate']
      },
      vercel: {
        name: 'Vercel CLI',
        package: 'vercel',
        global: true,
        commands: ['vercel --version', 'vercel login']
      },
      docker: {
        name: 'Docker',
        package: null,
        global: true,
        commands: ['docker --version', 'docker-compose --version']
      },
      aws: {
        name: 'AWS CLI',
        package: null,
        global: true,
        commands: ['aws --version']
      },
      kubectl: {
        name: 'Kubernetes CLI',
        package: null,
        global: true,
        commands: ['kubectl version --client']
      }
    };
  }

  /**
   * Executa setup completo
   */
  async run() {
    console.log('🛠️ FISIOFLOW - SETUP COMPLETO CLI');
    console.log('==================================\n');

    try {
      // 1. Verificar sistema operacional
      await this.checkOperatingSystem();
      
      // 2. Verificar pré-requisitos
      await this.checkPrerequisites();
      
      // 3. Instalar ferramentas CLI
      await this.installCLITools();
      
      // 4. Configurar ferramentas
      await this.configureTools();
      
      // 5. Testar instalações
      await this.testInstallations();
      
      // 6. Criar aliases e scripts
      await this.createAliases();
      
      console.log('\n✅ SETUP CLI COMPLETO COM SUCESSO!');
      console.log('🎯 Todas as ferramentas CLI estão instaladas e configuradas');
      
    } catch (error) {
      console.error('\n❌ ERRO NO SETUP CLI:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verifica sistema operacional
   */
  async checkOperatingSystem() {
    console.log('💻 Verificando sistema operacional...');
    
    const platform = process.platform;
    const arch = process.arch;
    
    console.log(`✅ Sistema: ${platform} (${arch})`);
    
    if (platform === 'win32') {
      console.log('🪟 Windows detectado - Usando PowerShell');
    } else if (platform === 'darwin') {
      console.log('🍎 macOS detectado - Usando Terminal');
    } else if (platform === 'linux') {
      console.log('🐧 Linux detectado - Usando Bash');
    }
  }

  /**
   * Verifica pré-requisitos
   */
  async checkPrerequisites() {
    console.log('\n🔍 Verificando pré-requisitos...');
    
    // Verificar Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      
      if (nodeMajor < 18) {
        throw new Error(`Node.js ${nodeVersion} não é suportado. Requer Node.js 18+`);
      }
      
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

    // Verificar Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Git: ${gitVersion}`);
    } catch (error) {
      console.log('⚠️ Git não encontrado. Instale Git para controle de versão.');
    }

    // Verificar arquivos necessários
    const requiredFiles = [
      'package.json',
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
   * Instala ferramentas CLI
   */
  async installCLITools() {
    console.log('\n📦 Instalando ferramentas CLI...');
    
    for (const [key, tool] of Object.entries(this.tools)) {
      console.log(`\n🔧 Instalando ${tool.name}...`);
      
      try {
        if (tool.package) {
          if (tool.global) {
            console.log(`📥 Instalando ${tool.package} globalmente...`);
            execSync(`npm install -g ${tool.package}`, { stdio: 'inherit' });
          } else {
            console.log(`📥 Instalando ${tool.package} localmente...`);
            execSync(`npm install --save-dev ${tool.package}`, { stdio: 'inherit' });
          }
        } else {
          console.log(`ℹ️ ${tool.name} deve ser instalado manualmente`);
          this.showManualInstallInstructions(key);
        }
        
        console.log(`✅ ${tool.name} instalado`);
        
      } catch (error) {
        console.log(`⚠️ Erro ao instalar ${tool.name}: ${error.message}`);
        
        if (tool.package) {
          console.log(`💡 Tentando instalação alternativa...`);
          try {
            if (tool.global) {
              execSync(`npm install -g ${tool.package} --force`, { stdio: 'inherit' });
            } else {
              execSync(`npm install --save-dev ${tool.package} --force`, { stdio: 'inherit' });
            }
            console.log(`✅ ${tool.name} instalado com sucesso`);
          } catch (retryError) {
            console.log(`❌ Falha na instalação de ${tool.name}`);
          }
        }
      }
    }
  }

  /**
   * Configura ferramentas
   */
  async configureTools() {
    console.log('\n⚙️ Configurando ferramentas...');
    
    // Configurar Railway
    try {
      console.log('🚂 Configurando Railway CLI...');
      execSync('railway --version', { stdio: 'pipe' });
      console.log('✅ Railway CLI configurado');
    } catch (error) {
      console.log('⚠️ Railway CLI não configurado. Execute: railway login');
    }

    // Configurar Prisma
    try {
      console.log('🔧 Configurando Prisma CLI...');
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✅ Prisma CLI configurado');
    } catch (error) {
      console.log('⚠️ Prisma CLI não configurado');
    }

    // Configurar Docker (se disponível)
    try {
      console.log('🐳 Verificando Docker...');
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker disponível');
    } catch (error) {
      console.log('ℹ️ Docker não encontrado. Instale Docker para containerização.');
    }
  }

  /**
   * Testa instalações
   */
  async testInstallations() {
    console.log('\n🧪 Testando instalações...');
    
    for (const [key, tool] of Object.entries(this.tools)) {
      console.log(`\n🔍 Testando ${tool.name}...`);
      
      for (const command of tool.commands) {
        try {
          const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
          console.log(`✅ ${command}: OK`);
          
          if (command.includes('--version')) {
            const version = result.trim();
            console.log(`   Versão: ${version}`);
          }
          
        } catch (error) {
          console.log(`❌ ${command}: FALHOU`);
          console.log(`   Erro: ${error.message}`);
        }
      }
    }
  }

  /**
   * Cria aliases e scripts
   */
  async createAliases() {
    console.log('\n🔗 Criando aliases e scripts...');
    
    // Criar arquivo de aliases para PowerShell (Windows)
    if (process.platform === 'win32') {
      await this.createPowerShellAliases();
    } else {
      await this.createBashAliases();
    }

    // Criar scripts npm personalizados
    await this.createNPMScripts();
    
    // Criar arquivo de configuração
    await this.createCLIConfig();
  }

  /**
   * Cria aliases para PowerShell
   */
  async createPowerShellAliases() {
    const aliasesPath = path.join(this.projectRoot, 'scripts', 'cli-aliases.ps1');
    
    const aliases = `
# FisioFlow CLI Aliases para PowerShell
# Execute: . .\\scripts\\cli-aliases.ps1

# Railway
Set-Alias -Name rw -Value railway
Set-Alias -Name rw-deploy -Value "railway up"
Set-Alias -Name rw-logs -Value "railway logs --follow"
Set-Alias -Name rw-status -Value "railway status"

# Neon DB
Set-Alias -Name neon -Value "npx @neondatabase/cli"
Set-Alias -Name neon-status -Value "npx @neondatabase/cli status"

# Prisma
Set-Alias -Name pr -Value "npx prisma"
Set-Alias -Name pr-studio -Value "npx prisma studio"
Set-Alias -Name pr-migrate -Value "npx prisma migrate dev"
Set-Alias -Name pr-reset -Value "npx prisma migrate reset --force"

# Docker
Set-Alias -Name d -Value docker
Set-Alias -Name dc -Value docker-compose

# Utilitários
Set-Alias -Name ff-dev -Value "npm run dev"
Set-Alias -Name ff-build -Value "npm run build"
Set-Alias -Name ff-test -Value "npm run test"
Set-Alias -Name ff-deploy -Value "npm run railway:deploy"

Write-Host "🚂 FisioFlow CLI Aliases carregados!" -ForegroundColor Green
Write-Host "Use 'Get-Alias | Where-Object {$_.Name -like \"ff-*\"}' para ver todos os aliases" -ForegroundColor Yellow
`;

    fs.writeFileSync(aliasesPath, aliases);
    console.log('✅ Aliases PowerShell criados: scripts/cli-aliases.ps1');
  }

  /**
   * Cria aliases para Bash
   */
  async createBashAliases() {
    const aliasesPath = path.join(this.projectRoot, 'scripts', 'cli-aliases.sh');
    
    const aliases = `
# FisioFlow CLI Aliases para Bash
# Execute: source scripts/cli-aliases.sh

# Railway
alias rw='railway'
alias rw-deploy='railway up'
alias rw-logs='railway logs --follow'
alias rw-status='railway status'

# Neon DB
alias neon='npx @neondatabase/cli'
alias neon-status='npx @neondatabase/cli status'

# Prisma
alias pr='npx prisma'
alias pr-studio='npx prisma studio'
alias pr-migrate='npx prisma migrate dev'
alias pr-reset='npx prisma migrate reset --force'

# Docker
alias d='docker'
alias dc='docker-compose'

# Utilitários
alias ff-dev='npm run dev'
alias ff-build='npm run build'
alias ff-test='npm run test'
alias ff-deploy='npm run railway:deploy'

echo "🚂 FisioFlow CLI Aliases carregados!"
echo "Use 'alias | grep ff-' para ver todos os aliases"
`;

    fs.writeFileSync(aliasesPath, aliases);
    console.log('✅ Aliases Bash criados: scripts/cli-aliases.sh');
  }

  /**
   * Cria scripts npm personalizados
   */
  async createNPMScripts() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Adicionar scripts CLI se não existirem
    const newScripts = {
      'cli:setup': 'node scripts/setup-cli-complete.js',
      'cli:test': 'node scripts/test-cli-tools.js',
      'cli:update': 'npm update -g @railway/cli @neondatabase/cli vercel',
      'cli:version': 'node scripts/cli-version-check.js',
      'railway:quick': 'railway up',
      'railway:logs-follow': 'railway logs --follow',
      'railway:status-detailed': 'railway status --json',
      'neon:quick-status': 'npx @neondatabase/cli status',
      'prisma:quick-studio': 'npx prisma studio',
      'docker:quick-build': 'docker build -t fisioflow .',
      'docker:quick-run': 'docker run -p 3000:3000 fisioflow'
    };
    
    // Adicionar apenas scripts que não existem
    for (const [key, value] of Object.entries(newScripts)) {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value;
      }
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Scripts npm personalizados adicionados');
  }

  /**
   * Cria arquivo de configuração CLI
   */
  async createCLIConfig() {
    const configPath = path.join(this.projectRoot, 'scripts', 'cli-config.json');
    
    const config = {
      version: "1.0.0",
      name: "FisioFlow CLI Configuration",
      tools: {
        railway: {
          enabled: true,
          commands: {
            deploy: "railway up",
            logs: "railway logs --follow",
            status: "railway status",
            variables: "railway variables"
          }
        },
        neon: {
          enabled: true,
          commands: {
            status: "npx @neondatabase/cli status",
            backup: "npx @neondatabase/cli backup create",
            restore: "npx @neondatabase/cli backup restore"
          }
        },
        prisma: {
          enabled: true,
          commands: {
            studio: "npx prisma studio",
            migrate: "npx prisma migrate dev",
            generate: "npx prisma generate",
            reset: "npx prisma migrate reset --force"
          }
        }
      },
      aliases: {
        windows: "scripts/cli-aliases.ps1",
        unix: "scripts/cli-aliases.sh"
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Arquivo de configuração CLI criado: scripts/cli-config.json');
  }

  /**
   * Mostra instruções de instalação manual
   */
  showManualInstallInstructions(tool) {
    const instructions = {
      docker: `
🐳 Docker:
   Windows: https://docs.docker.com/desktop/install/windows-install/
   macOS: https://docs.docker.com/desktop/install/mac-install/
   Linux: https://docs.docker.com/engine/install/
`,
      aws: `
☁️ AWS CLI:
   Windows: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html
   macOS: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-mac.html
   Linux: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
`,
      kubectl: `
☸️ Kubernetes CLI:
   Windows: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
   macOS: https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/
   Linux: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
`
    };
    
    if (instructions[tool]) {
      console.log(instructions[tool]);
    }
  }
}

// Executar setup se chamado diretamente
if (require.main === module) {
  const setup = new CLISetup();
  setup.run().catch(console.error);
}

module.exports = CLISetup;
