#!/usr/bin/env node

/**
 * 🚂 FisioFlow - Railway Pre-Deploy Validation
 * Script para validação completa antes do deploy no Railway
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

// Configurações
const CONFIG = {
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  },
  timeouts: {
    command: 30000,
    healthCheck: 60000,
    dbConnection: 15000
  },
  requiredFiles: [
    'package.json',
    'next.config.js',
    'tailwind.config.js',
    'prisma/schema.prisma',
    '.env.example'
  ],
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  optionalEnvVars: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME'
  ],
  buildOutputs: [
    '.next',
    'node_modules'
  ]
};

// Utilitários
class Logger {
  static log(message, color = 'reset') {
    console.log(`${CONFIG.colors[color]}${message}${CONFIG.colors.reset}`);
  }

  static success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  static error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  static warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  static info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  static step(message) {
    this.log(`🔍 ${message}`, 'cyan');
  }
}

class CommandRunner {
  static async run(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || CONFIG.timeouts.command;
      const silent = options.silent || false;
      
      try {
        const result = execSync(command, {
          encoding: 'utf8',
          timeout,
          stdio: silent ? 'pipe' : 'inherit',
          ...options
        });
        resolve({ success: true, output: result });
      } catch (error) {
        resolve({ 
          success: false, 
          error: error.message,
          code: error.status || 1
        });
      }
    });
  }

  static async checkCommand(command) {
    const result = await this.run(`${command} --version`, { silent: true });
    return result.success;
  }
}

// Validadores
class FileValidator {
  static validateRequiredFiles() {
    Logger.step('Verificando arquivos obrigatórios...');
    
    const missing = [];
    const existing = [];
    
    for (const file of CONFIG.requiredFiles) {
      if (fs.existsSync(file)) {
        existing.push(file);
        Logger.success(`${file} encontrado`);
      } else {
        missing.push(file);
        Logger.error(`${file} não encontrado`);
      }
    }
    
    return {
      success: missing.length === 0,
      missing,
      existing,
      message: missing.length > 0 
        ? `Arquivos obrigatórios ausentes: ${missing.join(', ')}`
        : 'Todos os arquivos obrigatórios encontrados'
    };
  }

  static validatePackageJson() {
    Logger.step('Validando package.json...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const issues = [];
      
      // Verificar scripts essenciais
      const requiredScripts = ['build', 'start', 'dev'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          issues.push(`Script '${script}' ausente`);
        }
      }
      
      // Verificar dependências críticas
      const criticalDeps = ['next', 'react', '@prisma/client'];
      for (const dep of criticalDeps) {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          issues.push(`Dependência crítica '${dep}' ausente`);
        }
      }
      
      if (issues.length === 0) {
        Logger.success('package.json válido');
      } else {
        issues.forEach(issue => Logger.error(issue));
      }
      
      return {
        success: issues.length === 0,
        issues,
        packageJson
      };
    } catch (error) {
      Logger.error(`Erro ao ler package.json: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static validatePrismaSchema() {
    Logger.step('Validando schema do Prisma...');
    
    try {
      const schemaPath = 'prisma/schema.prisma';
      if (!fs.existsSync(schemaPath)) {
        return {
          success: false,
          error: 'Schema do Prisma não encontrado'
        };
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const issues = [];
      
      // Verificar provider
      if (!schema.includes('provider = "postgresql"')) {
        issues.push('Provider PostgreSQL não configurado');
      }
      
      // Verificar se há modelos
      if (!schema.includes('model ')) {
        issues.push('Nenhum modelo definido no schema');
      }
      
      // Verificar URL do banco
      if (!schema.includes('env("DATABASE_URL")')) {
        issues.push('DATABASE_URL não configurada no schema');
      }
      
      if (issues.length === 0) {
        Logger.success('Schema do Prisma válido');
      } else {
        issues.forEach(issue => Logger.error(issue));
      }
      
      return {
        success: issues.length === 0,
        issues
      };
    } catch (error) {
      Logger.error(`Erro ao validar schema: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

class EnvironmentValidator {
  static validateEnvExample() {
    Logger.step('Validando .env.example...');
    
    try {
      if (!fs.existsSync('.env.example')) {
        return {
          success: false,
          error: '.env.example não encontrado'
        };
      }
      
      const envExample = fs.readFileSync('.env.example', 'utf8');
      const missing = [];
      
      for (const envVar of CONFIG.requiredEnvVars) {
        if (!envExample.includes(envVar)) {
          missing.push(envVar);
        }
      }
      
      if (missing.length === 0) {
        Logger.success('.env.example contém todas as variáveis obrigatórias');
      } else {
        missing.forEach(var_ => Logger.error(`Variável ${var_} ausente no .env.example`));
      }
      
      return {
        success: missing.length === 0,
        missing
      };
    } catch (error) {
      Logger.error(`Erro ao validar .env.example: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async validateRailwayVars() {
    Logger.step('Verificando variáveis do Railway...');
    
    const result = await CommandRunner.run('railway variables', { silent: true });
    
    if (!result.success) {
      return {
        success: false,
        error: 'Não foi possível acessar variáveis do Railway. Verifique se está logado.'
      };
    }
    
    const variables = result.output;
    const missing = [];
    const configured = [];
    
    for (const envVar of CONFIG.requiredEnvVars) {
      if (variables.includes(envVar)) {
        configured.push(envVar);
        Logger.success(`${envVar} configurado no Railway`);
      } else {
        missing.push(envVar);
        Logger.error(`${envVar} não configurado no Railway`);
      }
    }
    
    // Verificar variáveis opcionais
    const optionalConfigured = [];
    for (const envVar of CONFIG.optionalEnvVars) {
      if (variables.includes(envVar)) {
        optionalConfigured.push(envVar);
        Logger.info(`${envVar} configurado (opcional)`);
      }
    }
    
    return {
      success: missing.length === 0,
      missing,
      configured,
      optionalConfigured
    };
  }

  static validateSecrets() {
    Logger.step('Validando segurança das variáveis...');
    
    const issues = [];
    
    // Verificar se .env não está commitado
    if (fs.existsSync('.env')) {
      try {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        if (!gitignore.includes('.env')) {
          issues.push('.env deve estar no .gitignore');
        }
      } catch {
        issues.push('.gitignore não encontrado');
      }
    }
    
    // Verificar força do NEXTAUTH_SECRET
    if (process.env.NEXTAUTH_SECRET) {
      if (process.env.NEXTAUTH_SECRET.length < 32) {
        issues.push('NEXTAUTH_SECRET deve ter pelo menos 32 caracteres');
      }
    }
    
    if (issues.length === 0) {
      Logger.success('Configurações de segurança válidas');
    } else {
      issues.forEach(issue => Logger.warning(issue));
    }
    
    return {
      success: issues.length === 0,
      issues
    };
  }
}

class BuildValidator {
  static async validateBuild() {
    Logger.step('Validando build do projeto...');
    
    // Limpar build anterior
    if (fs.existsSync('.next')) {
      Logger.info('Removendo build anterior...');
      await CommandRunner.run('rm -rf .next', { silent: true });
    }
    
    Logger.info('Executando build...');
    const buildResult = await CommandRunner.run('npm run build', {
      timeout: 300000 // 5 minutos
    });
    
    if (!buildResult.success) {
      return {
        success: false,
        error: 'Falha no build',
        details: buildResult.error
      };
    }
    
    // Verificar se os arquivos de build foram criados
    const buildFiles = ['.next/BUILD_ID', '.next/static'];
    const missing = buildFiles.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
      return {
        success: false,
        error: 'Build incompleto',
        missing
      };
    }
    
    Logger.success('Build executado com sucesso');
    return { success: true };
  }

  static async validateTypeScript() {
    Logger.step('Verificando tipos TypeScript...');
    
    const result = await CommandRunner.run('npm run type-check', { silent: true });
    
    if (result.success) {
      Logger.success('Verificação de tipos passou');
    } else {
      Logger.error('Erros de tipo encontrados');
    }
    
    return result;
  }

  static async validateLinting() {
    Logger.step('Executando linting...');
    
    const result = await CommandRunner.run('npm run lint', { silent: true });
    
    if (result.success) {
      Logger.success('Linting passou');
    } else {
      Logger.warning('Problemas de linting encontrados');
    }
    
    return result;
  }
}

class DatabaseValidator {
  static async validateConnection() {
    Logger.step('Testando conexão com banco de dados...');
    
    try {
      const result = await CommandRunner.run('npx prisma db execute --stdin', {
        input: 'SELECT 1;',
        timeout: CONFIG.timeouts.dbConnection,
        silent: true
      });
      
      if (result.success) {
        Logger.success('Conexão com banco de dados OK');
        return { success: true };
      } else {
        Logger.error('Falha na conexão com banco de dados');
        return {
          success: false,
          error: 'Não foi possível conectar ao banco'
        };
      }
    } catch (error) {
      Logger.error(`Erro ao testar conexão: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async validateMigrations() {
    Logger.step('Verificando status das migrações...');
    
    const result = await CommandRunner.run('npx prisma migrate status', { silent: true });
    
    if (result.success) {
      if (result.output.includes('Database is up to date')) {
        Logger.success('Migrações estão atualizadas');
        return { success: true };
      } else {
        Logger.warning('Migrações pendentes detectadas');
        return {
          success: false,
          warning: 'Migrações pendentes',
          details: result.output
        };
      }
    } else {
      Logger.error('Erro ao verificar migrações');
      return {
        success: false,
        error: 'Não foi possível verificar status das migrações'
      };
    }
  }
}

class RailwayValidator {
  static async validateCLI() {
    Logger.step('Verificando Railway CLI...');
    
    const cliInstalled = await CommandRunner.checkCommand('railway');
    
    if (!cliInstalled) {
      return {
        success: false,
        error: 'Railway CLI não está instalado'
      };
    }
    
    Logger.success('Railway CLI instalado');
    
    // Verificar login
    const whoamiResult = await CommandRunner.run('railway whoami', { silent: true });
    
    if (!whoamiResult.success) {
      return {
        success: false,
        error: 'Não está logado no Railway'
      };
    }
    
    Logger.success(`Logado como: ${whoamiResult.output.trim()}`);
    
    // Verificar projeto linkado
    const statusResult = await CommandRunner.run('railway status', { silent: true });
    
    if (!statusResult.success || statusResult.output.includes('not linked')) {
      return {
        success: false,
        error: 'Projeto não está linkado ao Railway'
      };
    }
    
    Logger.success('Projeto linkado ao Railway');
    
    return { success: true };
  }

  static async validateDeployment() {
    Logger.step('Verificando último deployment...');
    
    const result = await CommandRunner.run('railway status --json', { silent: true });
    
    if (!result.success) {
      return {
        success: false,
        error: 'Não foi possível obter status do deployment'
      };
    }
    
    try {
      const status = JSON.parse(result.output);
      
      if (status.deployments && status.deployments.length > 0) {
        const lastDeploy = status.deployments[0];
        Logger.info(`Último deploy: ${lastDeploy.status} (${lastDeploy.createdAt})`);
        
        return {
          success: true,
          lastDeployment: lastDeploy
        };
      } else {
        Logger.info('Nenhum deployment anterior encontrado');
        return { success: true };
      }
    } catch (error) {
      Logger.warning('Não foi possível parsear status do deployment');
      return { success: true };
    }
  }
}

// Validador principal
class PreDeployValidator {
  constructor(options = {}) {
    this.options = {
      skipBuild: false,
      skipDatabase: false,
      skipRailway: false,
      verbose: false,
      ...options
    };
    
    this.results = {
      files: null,
      environment: null,
      build: null,
      database: null,
      railway: null,
      overall: false
    };
  }

  async validate() {
    Logger.log('🚂 FisioFlow - Validação Pré-Deploy Railway', 'magenta');
    Logger.log('='.repeat(50), 'magenta');
    console.log();
    
    const startTime = Date.now();
    
    try {
      // 1. Validação de arquivos
      await this.validateFiles();
      
      // 2. Validação de ambiente
      await this.validateEnvironment();
      
      // 3. Validação de build
      if (!this.options.skipBuild) {
        await this.validateBuild();
      }
      
      // 4. Validação de banco de dados
      if (!this.options.skipDatabase) {
        await this.validateDatabase();
      }
      
      // 5. Validação do Railway
      if (!this.options.skipRailway) {
        await this.validateRailway();
      }
      
      // Resultado final
      this.generateReport();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      Logger.log(`\n⏱️  Validação concluída em ${duration}s`, 'cyan');
      
      return this.results;
    } catch (error) {
      Logger.error(`Erro durante validação: ${error.message}`);
      return {
        ...this.results,
        error: error.message,
        overall: false
      };
    }
  }

  async validateFiles() {
    Logger.log('\n📁 VALIDAÇÃO DE ARQUIVOS', 'yellow');
    Logger.log('-'.repeat(30), 'yellow');
    
    const fileResults = FileValidator.validateRequiredFiles();
    const packageResults = FileValidator.validatePackageJson();
    const prismaResults = FileValidator.validatePrismaSchema();
    
    this.results.files = {
      requiredFiles: fileResults,
      packageJson: packageResults,
      prismaSchema: prismaResults,
      success: fileResults.success && packageResults.success && prismaResults.success
    };
  }

  async validateEnvironment() {
    Logger.log('\n🔧 VALIDAÇÃO DE AMBIENTE', 'yellow');
    Logger.log('-'.repeat(30), 'yellow');
    
    const envExampleResults = EnvironmentValidator.validateEnvExample();
    const railwayVarsResults = await EnvironmentValidator.validateRailwayVars();
    const securityResults = EnvironmentValidator.validateSecrets();
    
    this.results.environment = {
      envExample: envExampleResults,
      railwayVars: railwayVarsResults,
      security: securityResults,
      success: envExampleResults.success && railwayVarsResults.success
    };
  }

  async validateBuild() {
    Logger.log('\n🔨 VALIDAÇÃO DE BUILD', 'yellow');
    Logger.log('-'.repeat(30), 'yellow');
    
    const typeCheckResults = await BuildValidator.validateTypeScript();
    const lintResults = await BuildValidator.validateLinting();
    const buildResults = await BuildValidator.validateBuild();
    
    this.results.build = {
      typeCheck: typeCheckResults,
      lint: lintResults,
      build: buildResults,
      success: typeCheckResults.success && buildResults.success
    };
  }

  async validateDatabase() {
    Logger.log('\n🗄️  VALIDAÇÃO DE BANCO DE DADOS', 'yellow');
    Logger.log('-'.repeat(30), 'yellow');
    
    const connectionResults = await DatabaseValidator.validateConnection();
    const migrationResults = await DatabaseValidator.validateMigrations();
    
    this.results.database = {
      connection: connectionResults,
      migrations: migrationResults,
      success: connectionResults.success && migrationResults.success
    };
  }

  async validateRailway() {
    Logger.log('\n🚂 VALIDAÇÃO DO RAILWAY', 'yellow');
    Logger.log('-'.repeat(30), 'yellow');
    
    const cliResults = await RailwayValidator.validateCLI();
    const deploymentResults = await RailwayValidator.validateDeployment();
    
    this.results.railway = {
      cli: cliResults,
      deployment: deploymentResults,
      success: cliResults.success
    };
  }

  generateReport() {
    Logger.log('\n📊 RELATÓRIO FINAL', 'magenta');
    Logger.log('='.repeat(30), 'magenta');
    
    const sections = [
      { name: 'Arquivos', result: this.results.files },
      { name: 'Ambiente', result: this.results.environment },
      { name: 'Build', result: this.results.build },
      { name: 'Banco de Dados', result: this.results.database },
      { name: 'Railway', result: this.results.railway }
    ];
    
    let allPassed = true;
    
    sections.forEach(section => {
      if (section.result) {
        if (section.result.success) {
          Logger.success(`${section.name}: PASSOU`);
        } else {
          Logger.error(`${section.name}: FALHOU`);
          allPassed = false;
        }
      } else {
        Logger.info(`${section.name}: PULADO`);
      }
    });
    
    this.results.overall = allPassed;
    
    console.log();
    if (allPassed) {
      Logger.log('🎉 PROJETO PRONTO PARA DEPLOY!', 'green');
      Logger.log('Execute: npm run railway:deploy', 'cyan');
    } else {
      Logger.log('❌ PROJETO NÃO ESTÁ PRONTO PARA DEPLOY', 'red');
      Logger.log('Corrija os problemas acima antes de continuar', 'yellow');
    }
  }
}

// CLI
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    skipBuild: false,
    skipDatabase: false,
    skipRailway: false,
    verbose: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-database':
        options.skipDatabase = true;
        break;
      case '--skip-railway':
        options.skipRailway = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
🚂 FisioFlow - Railway Pre-Deploy Validation

USAGE:
  node scripts/railway-pre-deploy-validation.js [OPTIONS]

OPTIONS:
  --skip-build      Pular validação de build
  --skip-database   Pular validação de banco de dados
  --skip-railway    Pular validação do Railway
  --verbose, -v     Saída detalhada
  --help, -h        Mostrar esta ajuda

EXAMPLES:
  node scripts/railway-pre-deploy-validation.js
  node scripts/railway-pre-deploy-validation.js --skip-build
  node scripts/railway-pre-deploy-validation.js --verbose
`);
}

// Função principal
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  const validator = new PreDeployValidator(options);
  const results = await validator.validate();
  
  // Salvar relatório
  const reportPath = 'railway-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  Logger.info(`Relatório salvo em: ${reportPath}`);
  
  process.exit(results.overall ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    Logger.error(`Erro fatal: ${error.message}`);
    process.exit(1);
  });
}

// Função de conveniência para uso em outros scripts
async function runValidation(options = {}) {
  try {
    const validator = new PreDeployValidator(options);
    const results = await validator.validate();
    
    return {
      success: results.overall,
      results,
      errors: results.overall ? [] : ['Algumas validações falharam']
    };
  } catch (error) {
    return {
      success: false,
      results: null,
      errors: [error.message]
    };
  }
}

module.exports = {
  PreDeployValidator,
  FileValidator,
  EnvironmentValidator,
  BuildValidator,
  DatabaseValidator,
  RailwayValidator,
  runValidation
};