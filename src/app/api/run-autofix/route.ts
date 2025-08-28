import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface AutoFixResult {
  success: boolean;
  message: string;
  reportPath?: string;
  appliedFixes?: string[];
  failedFixes?: string[];
  backupPath?: string;
  executionTime?: number;
  timestamp: string;
}

// Função para executar correção automática
async function runAutoFix(options: { force?: boolean; category?: string } = {}): Promise<AutoFixResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const autoFixScript = path.join(process.cwd(), 'scripts', 'auto-fix-system.js');
    const reportPath = path.join(process.cwd(), 'scripts', 'autofix-report.json');
    
    // Verificar se o script existe
    try {
      await fs.access(autoFixScript);
    } catch (error) {
      return {
        success: false,
        message: 'Script de correção automática não encontrado',
        timestamp
      };
    }
    
    // Construir comando
    let command = `node "${autoFixScript}"`;
    
    if (options.force) {
      command += ' --force';
    }
    
    if (options.category) {
      command += ` --category=${options.category}`;
    }
    
    // Executar o script de correção automática
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutos de timeout
    });
    
    const executionTime = Date.now() - startTime;
    
    // Tentar ler o relatório gerado
    let appliedFixes: string[] = [];
    let failedFixes: string[] = [];
    let backupPath: string | undefined;
    
    try {
      const reportData = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportData);
      
      if (report.appliedFixes && Array.isArray(report.appliedFixes)) {
        appliedFixes = report.appliedFixes.map((fix: any) => fix.description || fix.type || 'Correção aplicada');
      }
      
      if (report.failedFixes && Array.isArray(report.failedFixes)) {
        failedFixes = report.failedFixes.map((fix: any) => fix.description || fix.type || 'Correção falhada');
      }
      
      if (report.backupPath) {
        backupPath = report.backupPath;
      }
    } catch (error) {
      console.warn('Não foi possível ler o relatório de correção automática:', error);
    }
    
    return {
      success: true,
      message: `Correção automática executada com sucesso. ${appliedFixes.length} correções aplicadas, ${failedFixes.length} falharam.`,
      reportPath,
      appliedFixes,
      failedFixes,
      backupPath,
      executionTime,
      timestamp
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Erro ao executar correção automática:', error);
    
    return {
      success: false,
      message: `Erro ao executar correção automática: ${error}`,
      executionTime,
      timestamp
    };
  }
}

// Função para executar health check
async function runHealthCheck(): Promise<AutoFixResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const healthCheckScript = path.join(process.cwd(), 'scripts', 'health-check.sh');
    
    // Verificar se o script existe
    try {
      await fs.access(healthCheckScript);
    } catch (error) {
      return {
        success: false,
        message: 'Script de health check não encontrado',
        timestamp
      };
    }
    
    // Executar o health check
    const { stdout, stderr } = await execAsync(`bash "${healthCheckScript}"`, {
      cwd: process.cwd(),
      timeout: 120000 // 2 minutos de timeout
    });
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Health check executado com sucesso',
      executionTime,
      timestamp
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Erro ao executar health check:', error);
    
    return {
      success: false,
      message: `Erro ao executar health check: ${error}`,
      executionTime,
      timestamp
    };
  }
}

// Função para executar auto-fix básico (shell script)
async function runBasicAutoFix(): Promise<AutoFixResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const autoFixScript = path.join(process.cwd(), 'scripts', 'auto-fix.sh');
    
    // Verificar se o script existe
    try {
      await fs.access(autoFixScript);
    } catch (error) {
      return {
        success: false,
        message: 'Script de auto-fix básico não encontrado',
        timestamp
      };
    }
    
    // Executar o auto-fix básico
    const { stdout, stderr } = await execAsync(`bash "${autoFixScript}"`, {
      cwd: process.cwd(),
      timeout: 300000 // 5 minutos de timeout
    });
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      message: 'Auto-fix básico executado com sucesso',
      executionTime,
      timestamp
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Erro ao executar auto-fix básico:', error);
    
    return {
      success: false,
      message: `Erro ao executar auto-fix básico: ${error}`,
      executionTime,
      timestamp
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type = 'advanced', force = false, category } = body;
    
    let result: AutoFixResult;
    
    switch (type) {
      case 'health-check':
        result = await runHealthCheck();
        break;
      
      case 'basic':
        result = await runBasicAutoFix();
        break;
      
      case 'advanced':
      default:
        // Validar categoria se fornecida
        if (category) {
          const validCategories = ['railway', 'neondb', 'typescript', 'dependencies', 'environment', 'build', 'runtime'];
          
          if (!validCategories.includes(category)) {
            return NextResponse.json(
              {
                success: false,
                message: `Categoria inválida. Categorias válidas: ${validCategories.join(', ')}`,
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            );
          }
        }
        
        result = await runAutoFix({ force, category });
        break;
    }
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erro na API de correção automática:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para obter o último relatório de correção automática
export async function GET(request: NextRequest) {
  try {
    const reportPath = path.join(process.cwd(), 'scripts', 'autofix-report.json');
    
    try {
      const reportData = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportData);
      
      return NextResponse.json({
        success: true,
        report,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nenhum relatório de correção automática encontrado',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Erro ao obter relatório de correção automática:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}