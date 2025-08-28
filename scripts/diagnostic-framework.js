#!/usr/bin/env node

/**
 * Sistema de Diagnóstico FisioFlow
 * Framework para identificação e categorização de problemas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DiagnosticFramework {
  constructor() {
    this.diagnostics = [];
    this.categories = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    };
    this.types = {
      RAILWAY: 'railway',
      NEON_DB: 'neon_db',
      TYPESCRIPT: 'typescript',
      DEPENDENCIES: 'dependencies',
      ENVIRONMENT: 'environment',
      BUILD: 'build',
      RUNTIME: 'runtime'
    };
  }

  // Executar diagnóstico completo
  async runFullDiagnostic() {
    console.log('🔍 Iniciando diagnóstico completo do sistema...');
    
    this.diagnostics = [];
    
    await this.checkRailwayStatus();
    await this.checkNeonDBStatus();
    await this.checkTypeScriptIssues();
    await this.checkDependencies();
    await this.checkEnvironmentVariables();
    await this.checkBuildStatus();
    await this.checkRuntimeErrors();
    
    return this.generateReport();
  }

  // Verificar status do Railway
  async checkRailwayStatus() {
    try {
      // Verificar se Railway CLI está instalado
      try {
        execSync('railway --version', { stdio: 'pipe' });
      } catch (error) {
        this.addDiagnostic({
          type: this.types.RAILWAY,
          severity: this.categories.HIGH,
          title: 'Railway CLI não encontrado',
          description: 'Railway CLI não está instalado ou não está no PATH',
          solution: 'Instalar Railway CLI: npm install -g @railway/cli'
        });
        return;
      }

      // Verificar autenticação
      try {
        execSync('railway whoami', { stdio: 'pipe' });
      } catch (error) {
        this.addDiagnostic({
          type: this.types.RAILWAY,
          severity: this.categories.CRITICAL,
          title: 'Railway não autenticado',
          description: 'Usuário não está autenticado no Railway',
          solution: 'Executar: railway login'
        });
      }

      // Verificar projeto linkado
      if (fs.existsSync('.railway')) {
        this.addDiagnostic({
          type: this.types.RAILWAY,
          severity: this.categories.INFO,
          title: 'Projeto Railway linkado',
          description: 'Projeto está corretamente linkado ao Railway'
        });
      } else {
        this.addDiagnostic({
          type: this.types.RAILWAY,
          severity: this.categories.HIGH,
          title: 'Projeto não linkado ao Railway',
          description: 'Projeto não está linkado a um projeto Railway',
          solution: 'Executar: railway link'
        });
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.RAILWAY,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar Railway',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar instalação e configuração do Railway'
      });
    }
  }

  // Verificar status do Neon DB
  async checkNeonDBStatus() {
    try {
      // Verificar variáveis de ambiente do banco
      const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
      
      if (!dbUrl) {
        this.addDiagnostic({
          type: this.types.NEON_DB,
          severity: this.categories.CRITICAL,
          title: 'DATABASE_URL não configurada',
          description: 'Variável de ambiente DATABASE_URL não encontrada',
          solution: 'Configurar DATABASE_URL no arquivo .env'
        });
        return;
      }

      // Verificar formato da URL
      if (!dbUrl.includes('neon.tech') && !dbUrl.includes('postgresql://')) {
        this.addDiagnostic({
          type: this.types.NEON_DB,
          severity: this.categories.HIGH,
          title: 'Formato de DATABASE_URL inválido',
          description: 'URL do banco não parece ser válida',
          solution: 'Verificar formato da DATABASE_URL'
        });
      }

      // Verificar arquivo schema.prisma
      if (fs.existsSync('prisma/schema.prisma')) {
        const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
        if (schema.includes('postgresql')) {
          this.addDiagnostic({
            type: this.types.NEON_DB,
            severity: this.categories.INFO,
            title: 'Schema Prisma configurado para PostgreSQL',
            description: 'Configuração do banco está correta'
          });
        }
      } else {
        this.addDiagnostic({
          type: this.types.NEON_DB,
          severity: this.categories.HIGH,
          title: 'Schema Prisma não encontrado',
          description: 'Arquivo prisma/schema.prisma não existe',
          solution: 'Executar: npx prisma init'
        });
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.NEON_DB,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar Neon DB',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar configuração do banco de dados'
      });
    }
  }

  // Verificar problemas do TypeScript
  async checkTypeScriptIssues() {
    try {
      // Verificar se TypeScript está instalado
      if (!fs.existsSync('node_modules/typescript')) {
        this.addDiagnostic({
          type: this.types.TYPESCRIPT,
          severity: this.categories.HIGH,
          title: 'TypeScript não instalado',
          description: 'TypeScript não encontrado nas dependências',
          solution: 'Executar: npm install typescript --save-dev'
        });
        return;
      }

      // Verificar tsconfig.json
      if (!fs.existsSync('tsconfig.json')) {
        this.addDiagnostic({
          type: this.types.TYPESCRIPT,
          severity: this.categories.HIGH,
          title: 'tsconfig.json não encontrado',
          description: 'Arquivo de configuração TypeScript não existe',
          solution: 'Criar tsconfig.json ou executar: npx tsc --init'
        });
      }

      // Executar verificação de tipos
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        this.addDiagnostic({
          type: this.types.TYPESCRIPT,
          severity: this.categories.INFO,
          title: 'Verificação de tipos bem-sucedida',
          description: 'Nenhum erro de tipo encontrado'
        });
      } catch (error) {
        const output = error.stdout ? error.stdout.toString() : error.message;
        const errorCount = (output.match(/error TS/g) || []).length;
        
        this.addDiagnostic({
          type: this.types.TYPESCRIPT,
          severity: errorCount > 10 ? this.categories.CRITICAL : this.categories.HIGH,
          title: `${errorCount} erros de TypeScript encontrados`,
          description: 'Erros de tipo detectados no projeto',
          solution: 'Executar: npm run type-check para ver detalhes',
          details: output.split('\n').slice(0, 10).join('\n')
        });
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.TYPESCRIPT,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar TypeScript',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar instalação e configuração do TypeScript'
      });
    }
  }

  // Verificar dependências
  async checkDependencies() {
    try {
      // Verificar package.json
      if (!fs.existsSync('package.json')) {
        this.addDiagnostic({
          type: this.types.DEPENDENCIES,
          severity: this.categories.CRITICAL,
          title: 'package.json não encontrado',
          description: 'Arquivo package.json não existe',
          solution: 'Executar: npm init'
        });
        return;
      }

      // Verificar node_modules
      if (!fs.existsSync('node_modules')) {
        this.addDiagnostic({
          type: this.types.DEPENDENCIES,
          severity: this.categories.HIGH,
          title: 'Dependências não instaladas',
          description: 'Pasta node_modules não encontrada',
          solution: 'Executar: npm install'
        });
        return;
      }

      // Verificar dependências desatualizadas
      try {
        const output = execSync('npm outdated --json', { stdio: 'pipe' }).toString();
        const outdated = JSON.parse(output || '{}');
        const count = Object.keys(outdated).length;
        
        if (count > 0) {
          this.addDiagnostic({
            type: this.types.DEPENDENCIES,
            severity: count > 10 ? this.categories.MEDIUM : this.categories.LOW,
            title: `${count} dependências desatualizadas`,
            description: 'Algumas dependências podem ser atualizadas',
            solution: 'Executar: npm update'
          });
        }
      } catch (error) {
        // npm outdated retorna código de saída 1 quando há dependências desatualizadas
        if (error.status === 1) {
          this.addDiagnostic({
            type: this.types.DEPENDENCIES,
            severity: this.categories.LOW,
            title: 'Dependências desatualizadas detectadas',
            description: 'Algumas dependências podem ser atualizadas',
            solution: 'Executar: npm outdated para ver detalhes'
          });
        }
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.DEPENDENCIES,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar dependências',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar package.json e node_modules'
      });
    }
  }

  // Verificar variáveis de ambiente
  async checkEnvironmentVariables() {
    try {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      const missingVars = [];
      
      // Verificar arquivo .env
      if (!fs.existsSync('.env')) {
        this.addDiagnostic({
          type: this.types.ENVIRONMENT,
          severity: this.categories.HIGH,
          title: 'Arquivo .env não encontrado',
          description: 'Arquivo de variáveis de ambiente não existe',
          solution: 'Criar arquivo .env baseado no .env.example'
        });
      }

      // Verificar variáveis obrigatórias
      requiredVars.forEach(varName => {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      });

      if (missingVars.length > 0) {
        this.addDiagnostic({
          type: this.types.ENVIRONMENT,
          severity: this.categories.CRITICAL,
          title: `${missingVars.length} variáveis de ambiente faltando`,
          description: `Variáveis não configuradas: ${missingVars.join(', ')}`,
          solution: 'Configurar variáveis no arquivo .env'
        });
      } else {
        this.addDiagnostic({
          type: this.types.ENVIRONMENT,
          severity: this.categories.INFO,
          title: 'Variáveis de ambiente configuradas',
          description: 'Todas as variáveis obrigatórias estão presentes'
        });
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.ENVIRONMENT,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar variáveis de ambiente',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar configuração das variáveis de ambiente'
      });
    }
  }

  // Verificar status do build
  async checkBuildStatus() {
    try {
      // Verificar se o build funciona
      try {
        execSync('npm run build', { stdio: 'pipe' });
        this.addDiagnostic({
          type: this.types.BUILD,
          severity: this.categories.INFO,
          title: 'Build bem-sucedido',
          description: 'Projeto compila sem erros'
        });
      } catch (error) {
        const output = error.stdout ? error.stdout.toString() : error.message;
        
        this.addDiagnostic({
          type: this.types.BUILD,
          severity: this.categories.CRITICAL,
          title: 'Falha no build',
          description: 'Projeto não compila corretamente',
          solution: 'Verificar erros de compilação',
          details: output.split('\n').slice(0, 10).join('\n')
        });
      }

    } catch (error) {
      this.addDiagnostic({
        type: this.types.BUILD,
        severity: this.categories.CRITICAL,
        title: 'Erro ao verificar build',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar configuração de build'
      });
    }
  }

  // Verificar erros de runtime
  async checkRuntimeErrors() {
    try {
      // Verificar logs de erro recentes
      const logFiles = ['.next/trace', 'logs/error.log', 'railway.log'];
      
      for (const logFile of logFiles) {
        if (fs.existsSync(logFile)) {
          const stats = fs.statSync(logFile);
          const now = new Date();
          const fileAge = (now - stats.mtime) / (1000 * 60 * 60); // horas
          
          if (fileAge < 24) {
            this.addDiagnostic({
              type: this.types.RUNTIME,
              severity: this.categories.MEDIUM,
              title: 'Logs de erro recentes encontrados',
              description: `Arquivo de log: ${logFile}`,
              solution: 'Verificar logs para identificar problemas'
            });
          }
        }
      }

      // Verificar arquivos de configuração importantes
      const configFiles = ['next.config.js', 'middleware.ts', 'prisma/schema.prisma'];
      
      configFiles.forEach(file => {
        if (!fs.existsSync(file)) {
          this.addDiagnostic({
            type: this.types.RUNTIME,
            severity: this.categories.MEDIUM,
            title: `Arquivo de configuração faltando: ${file}`,
            description: `Arquivo ${file} não encontrado`,
            solution: `Criar ou restaurar arquivo ${file}`
          });
        }
      });

    } catch (error) {
      this.addDiagnostic({
        type: this.types.RUNTIME,
        severity: this.categories.MEDIUM,
        title: 'Erro ao verificar runtime',
        description: `Erro inesperado: ${error.message}`,
        solution: 'Verificar configuração de runtime'
      });
    }
  }

  // Adicionar diagnóstico
  addDiagnostic(diagnostic) {
    this.diagnostics.push({
      ...diagnostic,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  // Gerar relatório
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.diagnostics.length,
        critical: this.diagnostics.filter(d => d.severity === this.categories.CRITICAL).length,
        high: this.diagnostics.filter(d => d.severity === this.categories.HIGH).length,
        medium: this.diagnostics.filter(d => d.severity === this.categories.MEDIUM).length,
        low: this.diagnostics.filter(d => d.severity === this.categories.LOW).length,
        info: this.diagnostics.filter(d => d.severity === this.categories.INFO).length
      },
      diagnostics: this.diagnostics,
      recommendations: this.generateRecommendations()
    };

    // Salvar relatório
    const reportPath = path.join(__dirname, '..', 'logs', 'diagnostic-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Relatório de diagnóstico gerado:', reportPath);
    this.printSummary(report);

    return report;
  }

  // Gerar recomendações
  generateRecommendations() {
    const recommendations = [];
    const criticalIssues = this.diagnostics.filter(d => d.severity === this.categories.CRITICAL);
    const highIssues = this.diagnostics.filter(d => d.severity === this.categories.HIGH);

    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        action: 'Resolver problemas críticos imediatamente',
        description: `${criticalIssues.length} problemas críticos encontrados que impedem o funcionamento`
      });
    }

    if (highIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Resolver problemas de alta prioridade',
        description: `${highIssues.length} problemas importantes que afetam a funcionalidade`
      });
    }

    // Recomendações específicas por tipo
    const railwayIssues = this.diagnostics.filter(d => d.type === this.types.RAILWAY);
    if (railwayIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Configurar Railway corretamente',
        description: 'Problemas de configuração do Railway detectados'
      });
    }

    return recommendations;
  }

  // Imprimir resumo
  printSummary(report) {
    console.log('\n📋 RESUMO DO DIAGNÓSTICO');
    console.log('========================');
    console.log(`🔴 Críticos: ${report.summary.critical}`);
    console.log(`🟠 Altos: ${report.summary.high}`);
    console.log(`🟡 Médios: ${report.summary.medium}`);
    console.log(`🔵 Baixos: ${report.summary.low}`);
    console.log(`ℹ️  Informativos: ${report.summary.info}`);
    console.log(`📊 Total: ${report.summary.total}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      report.recommendations.forEach(rec => {
        console.log(`${rec.priority}: ${rec.action}`);
      });
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const diagnostic = new DiagnosticFramework();
  diagnostic.runFullDiagnostic().catch(console.error);
}

module.exports = DiagnosticFramework;