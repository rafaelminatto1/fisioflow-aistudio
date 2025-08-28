import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface PreventionStatus {
  isRunning: boolean;
  pid?: number;
  startTime?: string;
  lastActivity?: string;
  watchers: {
    packageJson: boolean;
    envFile: boolean;
    prismaSchema: boolean;
    tsconfig: boolean;
    nextConfig: boolean;
    middleware: boolean;
  };
  periodicChecks: {
    vulnerabilities: boolean;
    diskSpace: boolean;
    dbHealth: boolean;
    buildPerformance: boolean;
  };
}

// Função para verificar se o sistema de prevenção está rodando
async function checkPreventionSystemStatus(): Promise<PreventionStatus> {
  try {
    const statusFile = path.join(process.cwd(), 'scripts', 'prevention-status.json');
    
    try {
      const data = await fs.readFile(statusFile, 'utf-8');
      const status = JSON.parse(data);
      
      // Verificar se o processo ainda está ativo
      if (status.pid) {
        try {
          process.kill(status.pid, 0); // Não mata o processo, apenas verifica se existe
          return {
            ...status,
            isRunning: true
          };
        } catch (error) {
          // Processo não existe mais
          return {
            ...status,
            isRunning: false,
            pid: undefined
          };
        }
      }
      
      return status;
    } catch (error) {
      // Arquivo não existe ou erro de leitura
      return {
        isRunning: false,
        watchers: {
          packageJson: false,
          envFile: false,
          prismaSchema: false,
          tsconfig: false,
          nextConfig: false,
          middleware: false
        },
        periodicChecks: {
          vulnerabilities: false,
          diskSpace: false,
          dbHealth: false,
          buildPerformance: false
        }
      };
    }
  } catch (error) {
    console.error('Erro ao verificar status do sistema de prevenção:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = await checkPreventionSystemStatus();
    
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erro ao obter status do sistema de prevenção:', error);
    
    return NextResponse.json(
      {
        isRunning: false,
        error: 'Erro ao verificar status do sistema de prevenção'
      },
      { status: 500 }
    );
  }
}