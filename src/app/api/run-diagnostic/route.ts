import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface DiagnosticResult {
  success: boolean;
  message: string;
  reportPath?: string;
  summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  executionTime?: number;
  timestamp: string;
}

// Função para executar diagnóstico
async function runDiagnostic(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const diagnosticScript = path.join(process.cwd(), 'scripts', 'diagnostic-framework.js');
    const reportPath = path.join(process.cwd(), 'scripts', 'diagnostic-report.json');
    
    // Verificar se o script existe
    try {
      await fs.access(diagnosticScript);
    } catch (error) {
      return {
        success: false,
        message: 'Script de diagnóstico não encontrado',
        timestamp
      };
    }
    
    // Executar o script de diagnóstico
    const { stdout, stderr } = await execAsync(`node "${diagnosticScript}"`, {
      cwd: process.cwd(),
      timeout: 60000 // 1 minuto de timeout
    });
    
    const executionTime = Date.now() - startTime;
    
    // Tentar ler o relatório gerado
    let summary;
    try {
      const reportData = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportData);
      
      if (report.issues && Array.isArray(report.issues)) {
        const issues = report.issues;
        summary = {
          critical: issues.filter((i: any) => i.severity === 'critical' && !i.resolved).length,
          high: issues.filter((i: any) => i.severity === 'high' && !i.resolved).length,
          medium: issues.filter((i: any) => i.severity === 'medium' && !i.resolved).length,
          low: issues.filter((i: any) => i.severity === 'low' && !i.resolved).length,
          total: issues.filter((i: any) => !i.resolved).length
        };
      }
    } catch (error) {
      console.warn('Não foi possível ler o relatório de diagnóstico:', error);
    }
    
    return {
      success: true,
      message: 'Diagnóstico executado com sucesso',
      reportPath,
      summary,
      executionTime,
      timestamp
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Erro ao executar diagnóstico:', error);
    
    return {
      success: false,
      message: `Erro ao executar diagnóstico: ${error}`,
      executionTime,
      timestamp
    };
  }
}

// Função para executar diagnóstico específico
async function runSpecificDiagnostic(category: string): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const diagnosticScript = path.join(process.cwd(), 'scripts', 'diagnostic-framework.js');
    
    // Verificar se o script existe
    try {
      await fs.access(diagnosticScript);
    } catch (error) {
      return {
        success: false,
        message: 'Script de diagnóstico não encontrado',
        timestamp
      };
    }
    
    // Executar diagnóstico específico
    const { stdout, stderr } = await execAsync(`node "${diagnosticScript}" --category=${category}`, {
      cwd: process.cwd(),
      timeout: 30000 // 30 segundos de timeout
    });
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `Diagnóstico de ${category} executado com sucesso`,
      executionTime,
      timestamp
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`Erro ao executar diagnóstico de ${category}:`, error);
    
    return {
      success: false,
      message: `Erro ao executar diagnóstico de ${category}: ${error}`,
      executionTime,
      timestamp
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category } = body;
    
    let result: DiagnosticResult;
    
    if (category) {
      // Executar diagnóstico específico
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
      
      result = await runSpecificDiagnostic(category);
    } else {
      // Executar diagnóstico completo
      result = await runDiagnostic();
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
    console.error('Erro na API de diagnóstico:', error);
    
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

// Endpoint GET para obter o último relatório de diagnóstico
export async function GET(request: NextRequest) {
  try {
    const reportPath = path.join(process.cwd(), 'scripts', 'diagnostic-report.json');
    
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
          message: 'Nenhum relatório de diagnóstico encontrado',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Erro ao obter relatório de diagnóstico:', error);
    
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