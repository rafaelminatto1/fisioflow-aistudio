#!/usr/bin/env node

/**
 * Sistema de Correção Automática FisioFlow
 * Aplica correções automáticas para problemas identificados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DiagnosticFramework = require('./diagnostic-framework');

class AutoFixSystem {
  constructor() {
    this.diagnostic = new DiagnosticFramework();
    this.fixResults = [];
    this.backupDir = path.join(__dirname, '..', 'backups', new Date().toISOString().split('T')[0]);
  }

  // Executar correção automática completa
  async runAutoFix(options = {}) {
    console.log('🔧 Iniciando sistema de correção automática...');
    
    const {
      skipBackup = false,
      dryRun = false,
      categories = ['critical', 'high']
    } = options;

    // Criar backup se não for dry run
    if (!skipBackup && !dryRun) {
      await this.createBackup();
    }

    // Executar diagnóstico
    const diagnosticReport = await this.diagnostic.runFullDiagnostic();
    
    // Filtrar problemas por categoria
    const problemsToFix = diagnosticReport.diagnostics.filter(d => 
      categories.includes(d.severity)
    );

    console.log(`🎯 Encontrados ${problemsToFix.length} problemas para correção automática`);

    // Aplicar correções
    for (const problem of problemsToFix) {
      await this.applyFix(problem, dryRun);
    }

    // Gerar relatório de correções
    return this.generateFixReport();
  }

  // Criar backup dos arquivos importantes
  async createBackup() {
    try {
      console.log('💾 Criando backup dos arquivos importantes...');
      
      fs.mkdirSync(this.backupDir, { recursive: true });
      
      const filesToBackup = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'next.config.js',
        'middleware.ts',
        'prisma/schema.prisma',
        '.env',
        '.env.local'
      ];

      for (const file of filesToBackup) {
        if (fs.existsSync(file)) {
          const backupPath = path.join(this.backupDir, file);
          fs.mkdirSync(path.dirname(backupPath), { recursive: true });
          fs.copyFileSync(file, backupPath);
        }
      }

      console.log(`✅ Backup criado em: ${this.backupDir}`);
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      throw error;
    }
  }

  // Aplicar correção para um problema específico
  async applyFix(problem, dryRun = false) {
    const fixResult = {
      problemId: problem.id,
      type: problem.type,
      title: problem.title,
      attempted: true,
      success: false,
      actions: [],
      error: null
    };

    try {
      console.log(`🔧 ${dryRun ? '[DRY RUN] ' : ''}Corrigindo: ${problem.title}`);

      switch (problem.type) {
        case 'railway':
          await this.fixRailwayIssues(problem, dryRun, fixResult);
          break;
        case 'neon_db':
          await this.fixNeonDBIssues(problem, dryRun, fixResult);
          break;
        case 'typescript':
          await this.fixTypeScriptIssues(problem, dryRun, fixResult);
          break;
        case 'dependencies':
          await this.fixDependencyIssues(problem, dryRun, fixResult);
          break;
        case 'environment':
          await this.fixEnvironmentIssues(problem, dryRun, fixResult);
          break;
        case 'build':
          await this.fixBuildIssues(problem, dryRun, fixResult);
          break;
        case 'runtime':
          await this.fixRuntimeIssues(problem, dryRun, fixResult);
          break;
        default:
          fixResult.actions.push(`Tipo de problema não suportado: ${problem.type}`);
      }

      fixResult.success = true;
      console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Correção aplicada com sucesso`);

    } catch (error) {
      fixResult.error = error.message;
      console.error(`❌ Erro ao aplicar correção: ${error.message}`);
    }

    this.fixResults.push(fixResult);
  }

  // Corrigir problemas do Railway
  async fixRailwayIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('Railway CLI não encontrado')) {
      fixResult.actions.push('Instalando Railway CLI');
      if (!dryRun) {
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      }
    }

    if (problem.title.includes('Railway não autenticado')) {
      fixResult.actions.push('Instruções para autenticação no Railway');
      console.log('⚠️  AÇÃO MANUAL NECESSÁRIA: Execute "railway login" para autenticar');
    }

    if (problem.title.includes('Projeto não linkado ao Railway')) {
      fixResult.actions.push('Instruções para linkar projeto');
      console.log('⚠️  AÇÃO MANUAL NECESSÁRIA: Execute "railway link" para linkar o projeto');
    }
  }

  // Corrigir problemas do Neon DB
  async fixNeonDBIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('DATABASE_URL não configurada')) {
      fixResult.actions.push('Criando template de .env');
      if (!dryRun) {
        const envTemplate = `# Database
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"
`;
        if (!fs.existsSync('.env')) {
          fs.writeFileSync('.env', envTemplate);
        }
      }
      console.log('⚠️  AÇÃO MANUAL NECESSÁRIA: Configure DATABASE_URL no arquivo .env');
    }

    if (problem.title.includes('Schema Prisma não encontrado')) {
      fixResult.actions.push('Inicializando Prisma');
      if (!dryRun) {
        execSync('npx prisma init', { stdio: 'inherit' });
      }
    }
  }

  // Corrigir problemas do TypeScript
  async fixTypeScriptIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('TypeScript não instalado')) {
      fixResult.actions.push('Instalando TypeScript');
      if (!dryRun) {
        execSync('npm install typescript @types/node @types/react @types/react-dom --save-dev', { stdio: 'inherit' });
      }
    }

    if (problem.title.includes('tsconfig.json não encontrado')) {
      fixResult.actions.push('Criando tsconfig.json');
      if (!dryRun) {
        const tsconfig = {
          "compilerOptions": {
            "target": "es5",
            "lib": ["dom", "dom.iterable", "es6"],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": true,
            "forceConsistentCasingInFileNames": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "preserve",
            "incremental": true,
            "plugins": [
              {
                "name": "next"
              }
            ],
            "baseUrl": ".",
            "paths": {
              "@/*": ["./src/*"]
            }
          },
          "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          "exclude": ["node_modules"]
        };
        fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
      }
    }

    if (problem.title.includes('erros de TypeScript encontrados')) {
      fixResult.actions.push('Tentando correções automáticas de TypeScript');
      if (!dryRun) {
        // Tentar algumas correções comuns
        await this.fixCommonTypeScriptErrors();
      }
    }
  }

  // Corrigir problemas de dependências
  async fixDependencyIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('Dependências não instaladas')) {
      fixResult.actions.push('Instalando dependências');
      if (!dryRun) {
        execSync('npm install', { stdio: 'inherit' });
      }
    }

    if (problem.title.includes('dependências desatualizadas')) {
      fixResult.actions.push('Atualizando dependências');
      if (!dryRun) {
        execSync('npm update', { stdio: 'inherit' });
      }
    }

    if (problem.title.includes('package.json não encontrado')) {
      fixResult.actions.push('Inicializando package.json');
      if (!dryRun) {
        execSync('npm init -y', { stdio: 'inherit' });
      }
    }
  }

  // Corrigir problemas de variáveis de ambiente
  async fixEnvironmentIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('Arquivo .env não encontrado')) {
      fixResult.actions.push('Criando arquivo .env');
      if (!dryRun) {
        const envTemplate = `# Database
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# Railway (opcional)
RAILWAY_ENVIRONMENT="development"
`;
        fs.writeFileSync('.env', envTemplate);
      }
      console.log('⚠️  AÇÃO MANUAL NECESSÁRIA: Configure as variáveis no arquivo .env');
    }

    if (problem.title.includes('variáveis de ambiente faltando')) {
      fixResult.actions.push('Adicionando variáveis faltantes ao .env');
      console.log('⚠️  AÇÃO MANUAL NECESSÁRIA: Configure as variáveis faltantes no arquivo .env');
    }
  }

  // Corrigir problemas de build
  async fixBuildIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('Falha no build')) {
      fixResult.actions.push('Tentando correções de build');
      if (!dryRun) {
        // Limpar cache e reinstalar
        try {
          execSync('rm -rf .next', { stdio: 'inherit' });
        } catch (error) {
          // Ignorar erro no Windows
        }
        
        try {
          execSync('rmdir /s /q .next', { stdio: 'inherit' });
        } catch (error) {
          // Ignorar erro no Unix
        }

        execSync('npm run build', { stdio: 'inherit' });
      }
    }
  }

  // Corrigir problemas de runtime
  async fixRuntimeIssues(problem, dryRun, fixResult) {
    if (problem.title.includes('Arquivo de configuração faltando')) {
      fixResult.actions.push('Criando arquivos de configuração faltantes');
      
      if (problem.description.includes('next.config.js') && !dryRun) {
        const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
`;
        fs.writeFileSync('next.config.js', nextConfig);
      }

      if (problem.description.includes('middleware.ts') && !dryRun) {
        const middleware = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
`;
        fs.writeFileSync('middleware.ts', middleware);
      }
    }
  }

  // Corrigir erros comuns do TypeScript
  async fixCommonTypeScriptErrors() {
    try {
      // Adicionar tipos faltantes comuns
      const commonTypes = `// Tipos globais comuns
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export {};
`;
      
      if (!fs.existsSync('types')) {
        fs.mkdirSync('types');
      }
      
      fs.writeFileSync('types/global.d.ts', commonTypes);

      // Atualizar tsconfig para incluir tipos
      if (fs.existsSync('tsconfig.json')) {
        const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
        if (!tsconfig.include.includes('types/**/*.ts')) {
          tsconfig.include.push('types/**/*.ts');
          fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
        }
      }

    } catch (error) {
      console.error('Erro ao aplicar correções de TypeScript:', error.message);
    }
  }

  // Gerar relatório de correções
  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.fixResults.length,
        successful: this.fixResults.filter(r => r.success).length,
        failed: this.fixResults.filter(r => !r.success).length,
        manualActionRequired: this.fixResults.filter(r => 
          r.actions.some(action => action.includes('AÇÃO MANUAL'))
        ).length
      },
      fixes: this.fixResults,
      backupLocation: this.backupDir
    };

    // Salvar relatório
    const reportPath = path.join(__dirname, '..', 'logs', 'auto-fix-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Relatório de correções gerado:', reportPath);
    this.printFixSummary(report);

    return report;
  }

  // Imprimir resumo das correções
  printFixSummary(report) {
    console.log('\n🔧 RESUMO DAS CORREÇÕES');
    console.log('========================');
    console.log(`✅ Sucessos: ${report.summary.successful}`);
    console.log(`❌ Falhas: ${report.summary.failed}`);
    console.log(`⚠️  Ação manual necessária: ${report.summary.manualActionRequired}`);
    console.log(`📊 Total: ${report.summary.total}`);
    
    if (report.summary.manualActionRequired > 0) {
      console.log('\n⚠️  AÇÕES MANUAIS NECESSÁRIAS:');
      report.fixes.forEach(fix => {
        if (fix.actions.some(action => action.includes('AÇÃO MANUAL'))) {
          console.log(`- ${fix.title}`);
        }
      });
    }
  }

  // Restaurar backup
  async restoreBackup(backupPath) {
    try {
      console.log('🔄 Restaurando backup...');
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup não encontrado: ${backupPath}`);
      }

      const files = fs.readdirSync(backupPath, { recursive: true });
      
      for (const file of files) {
        const backupFilePath = path.join(backupPath, file);
        const originalPath = file;
        
        if (fs.statSync(backupFilePath).isFile()) {
          fs.mkdirSync(path.dirname(originalPath), { recursive: true });
          fs.copyFileSync(backupFilePath, originalPath);
        }
      }

      console.log('✅ Backup restaurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const autoFix = new AutoFixSystem();
  
  // Verificar argumentos da linha de comando
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipBackup = args.includes('--skip-backup');
  
  autoFix.runAutoFix({ dryRun, skipBackup }).catch(console.error);
}

module.exports = AutoFixSystem;