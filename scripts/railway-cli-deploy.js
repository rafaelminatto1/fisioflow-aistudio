#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Importar validação pré-deploy
let preDeployValidation;
try {
  preDeployValidation = require('./railway-pre-deploy-validation.js');
} catch (error) {
  console.warn('⚠️  Script de validação pré-deploy não encontrado');
}

// Configurações
const CONFIG = {
  projectName: 'fisioflow',
  environment: process.env.NODE_ENV || 'production',
  healthCheckUrl: process.env.RAILWAY_STATIC_URL || 'https://fisioflow.up.railway.app',
  maxRetries: 5,
  retryDelay: 10000, // 10 segundos
  buildTimeout: 600000, // 10 minutos
  validateOnly: process.argv.includes('--validate-only'),
  skipValidation: process.argv.includes('--skip-validation'),
  verbose: process.argv.includes('--verbose'),
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para executar comandos
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Verificar se Railway CLI está instalado
function checkRailwayCLI() {
  log('🔍 Verificando Railway CLI...', 'blue');
  
  const result = execCommand('railway --version', { silent: true });
  
  if (!result.success) {
    log('❌ Railway CLI não encontrado!', 'red');
    log('📦 Instalando Railway CLI...', 'yellow');
    
    // Tentar instalar via npm
    const installResult = execCommand('npm install -g @railway/cli');
    
    if (!installResult.success) {
      log('❌ Falha ao instalar Railway CLI via npm', 'red');
      log('💡 Instale manualmente: npm install -g @railway/cli', 'yellow');
      process.exit(1);
    }
    
    log('✅ Railway CLI instalado com sucesso!', 'green');
  } else {
    log('✅ Railway CLI encontrado!', 'green');
    log(`📋 Versão: ${result.output.trim()}`, 'cyan');
  }
}

// Verificar login no Railway
function checkRailwayLogin() {
  log('🔐 Verificando login no Railway...', 'blue');
  
  const result = execCommand('railway whoami', { silent: true });
  
  if (!result.success) {
    log('❌ Não logado no Railway!', 'red');
    log('🔑 Iniciando processo de login...', 'yellow');
    
    const loginResult = execCommand('railway login');
    
    if (!loginResult.success) {
      log('❌ Falha no login do Railway', 'red');
      process.exit(1);
    }
    
    log('✅ Login realizado com sucesso!', 'green');
  } else {
    log('✅ Já logado no Railway!', 'green');
    log(`👤 Usuário: ${result.output.trim()}`, 'cyan');
  }
}

// Verificar ou criar projeto
function setupProject() {
  log('🚂 Configurando projeto Railway...', 'blue');
  
  // Verificar se já existe um projeto linkado
  const linkResult = execCommand('railway status', { silent: true });
  
  if (!linkResult.success || linkResult.output.includes('not linked')) {
    log('🔗 Projeto não linkado. Criando/linkando projeto...', 'yellow');
    
    // Tentar linkar projeto existente
    const projects = execCommand('railway projects', { silent: true });
    
    if (projects.success && projects.output.includes(CONFIG.projectName)) {
      log(`🔗 Linkando ao projeto existente: ${CONFIG.projectName}`, 'yellow');
      const linkExisting = execCommand(`railway link ${CONFIG.projectName}`);
      
      if (!linkExisting.success) {
        log('❌ Falha ao linkar projeto existente', 'red');
        process.exit(1);
      }
    } else {
      log(`🆕 Criando novo projeto: ${CONFIG.projectName}`, 'yellow');
      const createResult = execCommand(`railway init ${CONFIG.projectName}`);
      
      if (!createResult.success) {
        log('❌ Falha ao criar projeto', 'red');
        process.exit(1);
      }
    }
    
    log('✅ Projeto configurado com sucesso!', 'green');
  } else {
    log('✅ Projeto já linkado!', 'green');
  }
}

// Configurar variáveis de ambiente
function setupEnvironmentVariables() {
  log('🔧 Configurando variáveis de ambiente...', 'blue');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    log('⚠️  Arquivo .env.example não encontrado', 'yellow');
    return;
  }
  
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const envVars = envExample
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => line.split('=')[0]);
  
  log(`📋 Encontradas ${envVars.length} variáveis de ambiente`, 'cyan');
  
  // Verificar variáveis existentes
  const existingVars = execCommand('railway variables', { silent: true });
  
  if (existingVars.success) {
    log('✅ Variáveis de ambiente já configuradas', 'green');
  } else {
    log('⚠️  Configure as variáveis de ambiente manualmente:', 'yellow');
    envVars.forEach(varName => {
      log(`   railway variables set ${varName}=<valor>`, 'cyan');
    });
  }
}

// Validar configurações pré-deploy
function validatePreDeploy() {
  if (CONFIG.skipValidation) {
    log('⚠️  Validação pré-deploy ignorada (--skip-validation)', 'yellow');
    return;
  }

  log('🔍 Validando configurações pré-deploy...', 'blue');
  
  // Usar script de validação dedicado se disponível
  if (preDeployValidation) {
    try {
      const validationResult = preDeployValidation.runValidation();
      if (!validationResult.success) {
        log('❌ Validação pré-deploy falhou', 'red');
        validationResult.errors.forEach(error => {
          log(`   • ${error}`, 'red');
        });
        process.exit(1);
      }
      log('✅ Validação pré-deploy completa passou!', 'green');
      return;
    } catch (error) {
      log(`⚠️  Erro no script de validação: ${error.message}`, 'yellow');
      log('🔄 Executando validação básica...', 'blue');
    }
  }
  
  // Validação básica como fallback
  const checks = [
    {
      name: 'package.json',
      check: () => fs.existsSync('package.json'),
      message: 'package.json encontrado'
    },
    {
      name: 'Dockerfile',
      check: () => fs.existsSync('Dockerfile'),
      message: 'Dockerfile encontrado'
    },
    {
      name: '.env.example',
      check: () => fs.existsSync('.env.example'),
      message: '.env.example encontrado'
    },
    {
      name: 'Build local',
      check: () => {
        log('   🔨 Executando build local...', 'cyan');
        const buildResult = execCommand('npm run build', { silent: !CONFIG.verbose });
        return buildResult.success;
      },
      message: 'Build local executado com sucesso'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      if (check.check()) {
        log(`✅ ${check.message}`, 'green');
      } else {
        log(`❌ Falha: ${check.name}`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`❌ Erro ao verificar ${check.name}: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  if (!allPassed) {
    log('❌ Algumas validações falharam. Corrija os problemas antes de continuar.', 'red');
    process.exit(1);
  }
  
  log('✅ Todas as validações passaram!', 'green');
}

// Executar deploy
function deployToRailway() {
  log('🚀 Iniciando deploy para Railway...', 'blue');
  
  const deployResult = execCommand('railway up --detach');
  
  if (!deployResult.success) {
    log('❌ Falha no deploy', 'red');
    process.exit(1);
  }
  
  log('✅ Deploy iniciado com sucesso!', 'green');
  
  // Aguardar deploy
  log('⏳ Aguardando conclusão do deploy...', 'yellow');
  
  let retries = 0;
  const maxRetries = 30; // 5 minutos
  
  const checkDeploy = setInterval(() => {
    const statusResult = execCommand('railway status', { silent: true });
    
    if (statusResult.success && statusResult.output.includes('Active')) {
      clearInterval(checkDeploy);
      log('✅ Deploy concluído com sucesso!', 'green');
      
      // Obter URL do deploy
      const urlResult = execCommand('railway domain', { silent: true });
      if (urlResult.success) {
        const url = urlResult.output.trim();
        log(`🌐 URL do deploy: ${url}`, 'cyan');
        CONFIG.healthCheckUrl = url;
      }
      
      // Executar health checks
      performHealthChecks();
    } else if (retries >= maxRetries) {
      clearInterval(checkDeploy);
      log('❌ Timeout no deploy', 'red');
      process.exit(1);
    } else {
      retries++;
      log(`⏳ Aguardando deploy... (${retries}/${maxRetries})`, 'yellow');
    }
  }, 10000); // Verificar a cada 10 segundos
}

// Executar health checks
function performHealthChecks() {
  log('🏥 Executando health checks...', 'blue');
  
  const healthChecks = [
    {
      name: 'Status da aplicação',
      url: `${CONFIG.healthCheckUrl}/api/health`,
      expectedStatus: 200
    },
    {
      name: 'Conexão com banco de dados',
      url: `${CONFIG.healthCheckUrl}/api/health/db`,
      expectedStatus: 200
    }
  ];
  
  let allHealthy = true;
  
  for (const check of healthChecks) {
    try {
      const curlResult = execCommand(`curl -s -o /dev/null -w "%{http_code}" ${check.url}`, { silent: true });
      
      if (curlResult.success && curlResult.output.trim() === check.expectedStatus.toString()) {
        log(`✅ ${check.name}: OK`, 'green');
      } else {
        log(`❌ ${check.name}: Falha (Status: ${curlResult.output.trim()})`, 'red');
        allHealthy = false;
      }
    } catch (error) {
      log(`❌ ${check.name}: Erro - ${error.message}`, 'red');
      allHealthy = false;
    }
  }
  
  if (allHealthy) {
    log('🎉 Todos os health checks passaram! Deploy concluído com sucesso!', 'green');
  } else {
    log('⚠️  Alguns health checks falharam. Verifique os logs da aplicação.', 'yellow');
  }
}

// Mostrar ajuda
function showHelp() {
  log('🚂 FisioFlow - Deploy via Railway CLI', 'magenta');
  log('=====================================', 'magenta');
  log('');
  log('Uso: node scripts/railway-cli-deploy.js [opções]', 'cyan');
  log('');
  log('Opções:', 'yellow');
  log('  --validate-only    Apenas executar validações (não fazer deploy)', 'cyan');
  log('  --skip-validation  Pular validações pré-deploy', 'cyan');
  log('  --verbose          Mostrar saída detalhada', 'cyan');
  log('  --help             Mostrar esta ajuda', 'cyan');
  log('');
  log('Exemplos:', 'yellow');
  log('  npm run deploy:railway-cli', 'cyan');
  log('  npm run railway:validate', 'cyan');
  log('  node scripts/railway-cli-deploy.js --verbose', 'cyan');
}

// Função principal
function main() {
  // Verificar se é pedido de ajuda
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    return;
  }

  log('🚂 FisioFlow - Deploy via Railway CLI', 'magenta');
  log('=====================================', 'magenta');
  
  if (CONFIG.validateOnly) {
    log('🔍 Modo: Apenas validação', 'yellow');
  }
  
  if (CONFIG.verbose) {
    log('📝 Modo verbose ativado', 'cyan');
  }
  
  try {
    checkRailwayCLI();
    checkRailwayLogin();
    setupProject();
    setupEnvironmentVariables();
    validatePreDeploy();
    
    if (CONFIG.validateOnly) {
      log('✅ Validação concluída com sucesso! Use sem --validate-only para fazer deploy.', 'green');
      return;
    }
    
    deployToRailway();
  } catch (error) {
    log(`❌ Erro durante o deploy: ${error.message}`, 'red');
    if (CONFIG.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkRailwayCLI,
  checkRailwayLogin,
  setupProject,
  setupEnvironmentVariables,
  validatePreDeploy,
  deployToRailway,
  performHealthChecks
};