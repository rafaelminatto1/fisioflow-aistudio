import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    frontend: ServiceStatus;
    railway: ServiceStatus;
    neondb: ServiceStatus;
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
  issues: Issue[];
  alerts: AlertInfo[];
  diagnostics: DiagnosticSummary;
}

interface ServiceStatus {
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  responseTime?: number;
  lastCheck: string;
  uptime?: number;
  version?: string;
}

interface Issue {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface AlertInfo {
  id: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  message: string;
}

interface DiagnosticSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  lastRun: string;
}

// Função para verificar status do banco de dados
async function checkDatabaseStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'online',
      responseTime,
      lastCheck: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

// Função para verificar status da API
async function checkApiStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar se a API está respondendo
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'online' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

// Função para verificar status do frontend
async function checkFrontendStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar se o frontend está acessível
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`, {
      method: 'HEAD'
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'online' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

// Função para verificar status do Railway
async function checkRailwayStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar se o Railway CLI está disponível
    await execAsync('railway --version');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'online',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unknown',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

// Função para verificar status do Neon DB
async function checkNeonDbStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar conexão com Neon DB através do Prisma
    await prisma.$queryRaw`SELECT version()`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'online',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

// Função para obter métricas do sistema
async function getSystemMetrics() {
  const startTime = Date.now();
  
  try {
    // Simular métricas do sistema (em produção, usar bibliotecas específicas)
    const metrics = {
      cpu: Math.floor(Math.random() * 100), // Placeholder
      memory: Math.floor(Math.random() * 100), // Placeholder
      disk: Math.floor(Math.random() * 100), // Placeholder
      responseTime: Date.now() - startTime
    };
    
    return metrics;
  } catch (error) {
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      responseTime: Date.now() - startTime
    };
  }
}

// Função para carregar problemas do arquivo de diagnóstico
async function loadIssues(): Promise<Issue[]> {
  try {
    const diagnosticPath = path.join(process.cwd(), 'scripts', 'diagnostic-report.json');
    const data = await fs.readFile(diagnosticPath, 'utf-8');
    const report = JSON.parse(data);
    
    return report.issues || [];
  } catch (error) {
    return [];
  }
}

// Função para carregar alertas
async function loadAlerts(): Promise<AlertInfo[]> {
  try {
    const alertsPath = path.join(process.cwd(), 'scripts', 'alerts.json');
    const data = await fs.readFile(alertsPath, 'utf-8');
    const alerts = JSON.parse(data);
    
    return alerts.slice(-10) || []; // Últimos 10 alertas
  } catch (error) {
    return [];
  }
}

// Função para obter resumo de diagnósticos
async function getDiagnosticSummary(): Promise<DiagnosticSummary> {
  try {
    const diagnosticPath = path.join(process.cwd(), 'scripts', 'diagnostic-report.json');
    const data = await fs.readFile(diagnosticPath, 'utf-8');
    const report = JSON.parse(data);
    
    const issues = report.issues || [];
    
    return {
      critical: issues.filter((i: Issue) => i.severity === 'critical' && !i.resolved).length,
      high: issues.filter((i: Issue) => i.severity === 'high' && !i.resolved).length,
      medium: issues.filter((i: Issue) => i.severity === 'medium' && !i.resolved).length,
      low: issues.filter((i: Issue) => i.severity === 'low' && !i.resolved).length,
      lastRun: report.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      lastRun: new Date().toISOString()
    };
  }
}

// Função para determinar status geral
function determineOverallStatus(
  services: SystemStatus['services'],
  metrics: SystemStatus['metrics'],
  diagnostics: DiagnosticSummary
): 'healthy' | 'warning' | 'critical' | 'unknown' {
  // Verificar serviços críticos
  if (services.database.status === 'offline' || services.neondb.status === 'offline') {
    return 'critical';
  }
  
  // Verificar problemas críticos
  if (diagnostics.critical > 0) {
    return 'critical';
  }
  
  // Verificar serviços degradados ou problemas altos
  if (
    Object.values(services).some(service => service.status === 'degraded') ||
    diagnostics.high > 2 ||
    metrics.cpu > 90 ||
    metrics.memory > 90 ||
    metrics.disk > 95
  ) {
    return 'warning';
  }
  
  // Verificar se há serviços offline não críticos
  if (Object.values(services).some(service => service.status === 'offline')) {
    return 'warning';
  }
  
  return 'healthy';
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Verificar status de todos os serviços em paralelo
    const [database, api, frontend, railway, neondb] = await Promise.all([
      checkDatabaseStatus(),
      checkApiStatus(),
      checkFrontendStatus(),
      checkRailwayStatus(),
      checkNeonDbStatus()
    ]);
    
    // Obter métricas e dados adicionais
    const [metrics, issues, alerts, diagnostics] = await Promise.all([
      getSystemMetrics(),
      loadIssues(),
      loadAlerts(),
      getDiagnosticSummary()
    ]);
    
    const services = {
      database,
      api,
      frontend,
      railway,
      neondb
    };
    
    const overall = determineOverallStatus(services, metrics, diagnostics);
    
    const systemStatus: SystemStatus = {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      metrics,
      issues,
      alerts,
      diagnostics
    };
    
    return NextResponse.json(systemStatus, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter status do sistema:', error);
    
    return NextResponse.json(
      {
        overall: 'unknown',
        timestamp: new Date().toISOString(),
        uptime: 0,
        services: {
          database: { status: 'unknown', lastCheck: new Date().toISOString() },
          api: { status: 'unknown', lastCheck: new Date().toISOString() },
          frontend: { status: 'unknown', lastCheck: new Date().toISOString() },
          railway: { status: 'unknown', lastCheck: new Date().toISOString() },
          neondb: { status: 'unknown', lastCheck: new Date().toISOString() }
        },
        metrics: { cpu: 0, memory: 0, disk: 0, responseTime: 0 },
        issues: [],
        alerts: [],
        diagnostics: { critical: 0, high: 0, medium: 0, low: 0, lastRun: new Date().toISOString() }
      },
      { status: 500 }
    );
  }
}

// Endpoint para executar diagnóstico manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'diagnostic') {
      // Executar diagnóstico
      const diagnosticScript = path.join(process.cwd(), 'scripts', 'diagnostic-framework.js');
      await execAsync(`node "${diagnosticScript}"`);
      
      return NextResponse.json({ success: true, message: 'Diagnóstico executado com sucesso' });
    }
    
    if (action === 'autofix') {
      // Executar correção automática
      const autofixScript = path.join(process.cwd(), 'scripts', 'auto-fix-system.js');
      await execAsync(`node "${autofixScript}"`);
      
      return NextResponse.json({ success: true, message: 'Correção automática executada com sucesso' });
    }
    
    return NextResponse.json(
      { success: false, message: 'Ação não reconhecida' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Erro ao executar ação:', error);
    
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}