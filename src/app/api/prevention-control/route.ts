import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface ControlRequest {
  action: 'start' | 'stop' | 'restart';
}

// Função para iniciar o sistema de prevenção
async function startPreventionSystem(): Promise<{ success: boolean; message: string; pid?: number }> {
  try {
    const preventionScript = path.join(process.cwd(), 'scripts', 'prevention-system.js');
    const statusFile = path.join(process.cwd(), 'scripts', 'prevention-status.json');
    
    // Verificar se já está rodando
    try {
      const data = await fs.readFile(statusFile, 'utf-8');
      const status = JSON.parse(data);
      
      if (status.isRunning && status.pid) {
        try {
          process.kill(status.pid, 0);
          return {
            success: false,
            message: 'Sistema de prevenção já está rodando'
          };
        } catch (error) {
          // Processo não existe mais, continuar com inicialização
        }
      }
    } catch (error) {
      // Arquivo não existe, continuar com inicialização
    }
    
    // Iniciar o processo em background
    const child = spawn('node', [preventionScript], {
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();
    
    // Salvar status
    const status = {
      isRunning: true,
      pid: child.pid,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      watchers: {
        packageJson: true,
        envFile: true,
        prismaSchema: true,
        tsconfig: true,
        nextConfig: true,
        middleware: true
      },
      periodicChecks: {
        vulnerabilities: true,
        diskSpace: true,
        dbHealth: true,
        buildPerformance: true
      }
    };
    
    await fs.writeFile(statusFile, JSON.stringify(status, null, 2));
    
    return {
      success: true,
      message: 'Sistema de prevenção iniciado com sucesso',
      pid: child.pid
    };
  } catch (error) {
    console.error('Erro ao iniciar sistema de prevenção:', error);
    return {
      success: false,
      message: `Erro ao iniciar sistema de prevenção: ${error}`
    };
  }
}

// Função para parar o sistema de prevenção
async function stopPreventionSystem(): Promise<{ success: boolean; message: string }> {
  try {
    const statusFile = path.join(process.cwd(), 'scripts', 'prevention-status.json');
    
    try {
      const data = await fs.readFile(statusFile, 'utf-8');
      const status = JSON.parse(data);
      
      if (status.pid) {
        try {
          // Tentar parar o processo graciosamente
          process.kill(status.pid, 'SIGTERM');
          
          // Aguardar um pouco e verificar se o processo parou
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            process.kill(status.pid, 0);
            // Se chegou aqui, o processo ainda está rodando, forçar parada
            process.kill(status.pid, 'SIGKILL');
          } catch (error) {
            // Processo já parou
          }
        } catch (error) {
          // Processo já não existe
        }
      }
      
      // Atualizar status
      const updatedStatus = {
        ...status,
        isRunning: false,
        pid: undefined,
        stopTime: new Date().toISOString()
      };
      
      await fs.writeFile(statusFile, JSON.stringify(updatedStatus, null, 2));
      
      return {
        success: true,
        message: 'Sistema de prevenção parado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sistema de prevenção não estava rodando'
      };
    }
  } catch (error) {
    console.error('Erro ao parar sistema de prevenção:', error);
    return {
      success: false,
      message: `Erro ao parar sistema de prevenção: ${error}`
    };
  }
}

// Função para reiniciar o sistema de prevenção
async function restartPreventionSystem(): Promise<{ success: boolean; message: string; pid?: number }> {
  const stopResult = await stopPreventionSystem();
  
  if (!stopResult.success) {
    return stopResult;
  }
  
  // Aguardar um pouco antes de reiniciar
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return await startPreventionSystem();
}

export async function POST(request: NextRequest) {
  try {
    const body: ControlRequest = await request.json();
    const { action } = body;
    
    let result;
    
    switch (action) {
      case 'start':
        result = await startPreventionSystem();
        break;
      case 'stop':
        result = await stopPreventionSystem();
        break;
      case 'restart':
        result = await restartPreventionSystem();
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Ação não reconhecida. Use: start, stop ou restart' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error('Erro ao controlar sistema de prevenção:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}