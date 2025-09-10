'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
  Bell,
  Settings,
  Download,
  Play,
  Square,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    frontend: ServiceStatus;
    storage: ServiceStatus;
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

interface HistoricalData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  responseTime: number;
  issues: number;
}

const MonitoringDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [preventionSystemStatus, setPreventionSystemStatus] = useState<
    'running' | 'stopped' | 'unknown'
  >('unknown');

  // Buscar status do sistema
  const fetchSystemStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system-status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);

        // Adicionar aos dados históricos
        const historicalPoint: HistoricalData = {
          timestamp: new Date().toISOString(),
          cpu: data.metrics.cpu,
          memory: data.metrics.memory,
          disk: data.metrics.disk,
          responseTime: data.metrics.responseTime,
          issues: data.issues.filter((issue: Issue) => !issue.resolved).length,
        };

        setHistoricalData(prev => {
          const newData = [...prev, historicalPoint];
          // Manter apenas últimas 50 entradas
          return newData.slice(-50);
        });
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erro ao buscar status do sistema:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar status do sistema de prevenção
  const fetchPreventionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/prevention-status');
      if (response.ok) {
        const data = await response.json();
        setPreventionSystemStatus(data.isRunning ? 'running' : 'stopped');
      }
    } catch (error) {
      setPreventionSystemStatus('unknown');
    }
  }, []);

  // Executar diagnóstico manual
  const runDiagnostic = async () => {
    try {
      const response = await fetch('/api/run-diagnostic', { method: 'POST' });
      if (response.ok) {
        await fetchSystemStatus();
      }
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
    }
  };

  // Executar correção automática
  const runAutoFix = async () => {
    try {
      const response = await fetch('/api/run-autofix', { method: 'POST' });
      if (response.ok) {
        await fetchSystemStatus();
      }
    } catch (error) {
      console.error('Erro ao executar correção automática:', error);
    }
  };

  // Controlar sistema de prevenção
  const togglePreventionSystem = async () => {
    try {
      const action = preventionSystemStatus === 'running' ? 'stop' : 'start';
      const response = await fetch(`/api/prevention-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchPreventionStatus();
      }
    } catch (error) {
      console.error('Erro ao controlar sistema de prevenção:', error);
    }
  };

  // Efeito para refresh automático
  useEffect(() => {
    fetchSystemStatus();
    fetchPreventionStatus();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemStatus();
        fetchPreventionStatus();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchSystemStatus, fetchPreventionStatus]);

  // Utilitários
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className='h-4 w-4' />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className='h-4 w-4' />;
      case 'critical':
      case 'offline':
        return <XCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading && !systemStatus) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Carregando status do sistema...</span>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar o status do sistema. Verifique se a API está
          funcionando.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Dashboard de Monitoramento
          </h1>
          <p className='text-muted-foreground'>
            Status geral do sistema FisioFlow
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <Square className='h-4 w-4' />
            ) : (
              <Play className='h-4 w-4' />
            )}
            {autoRefresh ? 'Pausar' : 'Iniciar'}
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={fetchSystemStatus}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>

          <Button variant='outline' size='sm' onClick={runDiagnostic}>
            <Activity className='h-4 w-4' />
            Diagnóstico
          </Button>

          <Button variant='outline' size='sm' onClick={runAutoFix}>
            <Zap className='h-4 w-4' />
            Auto-Fix
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Status Geral</CardTitle>
            <div className={getStatusColor(systemStatus.overall)}>
              {getStatusIcon(systemStatus.overall)}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(systemStatus.overall)}`}
            >
              {systemStatus.overall.toUpperCase()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Última atualização: {lastRefresh?.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Uptime</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatUptime(systemStatus.uptime)}
            </div>
            <p className='text-xs text-muted-foreground'>Sistema ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Problemas Ativos
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {systemStatus.issues.filter(issue => !issue.resolved).length}
            </div>
            <p className='text-xs text-muted-foreground'>
              {systemStatus.diagnostics.critical} críticos,{' '}
              {systemStatus.diagnostics.high} altos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Sistema de Prevenção
            </CardTitle>
            <Shield
              className={`h-4 w-4 ${
                preventionSystemStatus === 'running'
                  ? 'text-green-600'
                  : preventionSystemStatus === 'stopped'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div
                className={`text-lg font-bold ${
                  preventionSystemStatus === 'running'
                    ? 'text-green-600'
                    : preventionSystemStatus === 'stopped'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {preventionSystemStatus === 'running'
                  ? 'ATIVO'
                  : preventionSystemStatus === 'stopped'
                    ? 'PARADO'
                    : 'DESCONHECIDO'}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={togglePreventionSystem}
                disabled={preventionSystemStatus === 'unknown'}
              >
                {preventionSystemStatus === 'running' ? 'Parar' : 'Iniciar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Visão Geral</TabsTrigger>
          <TabsTrigger value='services'>Serviços</TabsTrigger>
          <TabsTrigger value='metrics'>Métricas</TabsTrigger>
          <TabsTrigger value='issues'>Problemas</TabsTrigger>
          <TabsTrigger value='alerts'>Alertas</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Métricas do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas do Sistema</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>CPU</span>
                    <span className='text-sm text-muted-foreground'>
                      {systemStatus.metrics.cpu}%
                    </span>
                  </div>
                  <Progress value={systemStatus.metrics.cpu} className='h-2' />
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Memória</span>
                    <span className='text-sm text-muted-foreground'>
                      {systemStatus.metrics.memory}%
                    </span>
                  </div>
                  <Progress
                    value={systemStatus.metrics.memory}
                    className='h-2'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Disco</span>
                    <span className='text-sm text-muted-foreground'>
                      {systemStatus.metrics.disk}%
                    </span>
                  </div>
                  <Progress value={systemStatus.metrics.disk} className='h-2' />
                </div>

                <div className='flex items-center justify-between pt-2'>
                  <span className='text-sm font-medium'>Tempo de Resposta</span>
                  <span className='text-sm text-muted-foreground'>
                    {systemStatus.metrics.responseTime}ms
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Tendências */}
            <Card>
              <CardHeader>
                <CardTitle>Tendências (Últimas 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={200}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='timestamp'
                      tickFormatter={value =>
                        new Date(value).toLocaleTimeString()
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={value => new Date(value).toLocaleString()}
                    />
                    <Line
                      type='monotone'
                      dataKey='cpu'
                      stroke='#8884d8'
                      strokeWidth={2}
                    />
                    <Line
                      type='monotone'
                      dataKey='memory'
                      stroke='#82ca9d'
                      strokeWidth={2}
                    />
                    <Line
                      type='monotone'
                      dataKey='responseTime'
                      stroke='#ffc658'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Problemas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Problemas Recentes</CardTitle>
              <CardDescription>
                Últimos problemas detectados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {systemStatus.issues.slice(0, 5).map(issue => (
                  <div
                    key={issue.id}
                    className='flex items-center justify-between p-2 border rounded'
                  >
                    <div className='flex items-center space-x-2'>
                      {getSeverityBadge(issue.severity)}
                      <span className='text-sm'>{issue.description}</span>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {new Date(issue.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}

                {systemStatus.issues.length === 0 && (
                  <div className='text-center py-4 text-muted-foreground'>
                    Nenhum problema detectado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Serviços */}
        <TabsContent value='services' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {Object.entries(systemStatus.services).map(
              ([serviceName, service]) => (
                <Card key={serviceName}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium capitalize'>
                      {serviceName === 'database' ? 'Database' : serviceName}
                    </CardTitle>
                    <div className={getStatusColor(service.status)}>
                      {getStatusIcon(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-lg font-bold ${getStatusColor(service.status)}`}
                    >
                      {service.status.toUpperCase()}
                    </div>

                    {service.responseTime && (
                      <p className='text-xs text-muted-foreground'>
                        Tempo de resposta: {service.responseTime}ms
                      </p>
                    )}

                    {service.uptime && (
                      <p className='text-xs text-muted-foreground'>
                        Uptime: {formatUptime(service.uptime)}
                      </p>
                    )}

                    {service.version && (
                      <p className='text-xs text-muted-foreground'>
                        Versão: {service.version}
                      </p>
                    )}

                    <p className='text-xs text-muted-foreground'>
                      Última verificação:{' '}
                      {new Date(service.lastCheck).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </TabsContent>

        {/* Métricas */}
        <TabsContent value='metrics' className='space-y-4'>
          <div className='grid gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='timestamp'
                      tickFormatter={value =>
                        new Date(value).toLocaleTimeString()
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={value => new Date(value).toLocaleString()}
                    />
                    <Area
                      type='monotone'
                      dataKey='cpu'
                      stackId='1'
                      stroke='#8884d8'
                      fill='#8884d8'
                      fillOpacity={0.6}
                    />
                    <Area
                      type='monotone'
                      dataKey='memory'
                      stackId='1'
                      stroke='#82ca9d'
                      fill='#82ca9d'
                      fillOpacity={0.6}
                    />
                    <Area
                      type='monotone'
                      dataKey='disk'
                      stackId='1'
                      stroke='#ffc658'
                      fill='#ffc658'
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Problemas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={200}>
                  <BarChart
                    data={[
                      {
                        name: 'Críticos',
                        value: systemStatus.diagnostics.critical,
                      },
                      { name: 'Altos', value: systemStatus.diagnostics.high },
                      {
                        name: 'Médios',
                        value: systemStatus.diagnostics.medium,
                      },
                      { name: 'Baixos', value: systemStatus.diagnostics.low },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill='#8884d8' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Problemas */}
        <TabsContent value='issues' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Todos os Problemas</CardTitle>
              <CardDescription>
                Lista completa de problemas detectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {systemStatus.issues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-3 border rounded ${
                      issue.resolved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        {getSeverityBadge(issue.severity)}
                        <Badge variant='outline'>{issue.category}</Badge>
                        <span
                          className={
                            issue.resolved
                              ? 'line-through text-muted-foreground'
                              : ''
                          }
                        >
                          {issue.description}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {new Date(issue.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {systemStatus.issues.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    <CheckCircle className='h-12 w-12 mx-auto mb-2' />
                    <p>Nenhum problema detectado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value='alerts' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alertas</CardTitle>
              <CardDescription>Alertas recentes do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {systemStatus.alerts.map(alert => (
                  <div key={alert.id} className='p-3 border rounded'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Bell className='h-4 w-4' />
                        {getSeverityBadge(alert.severity)}
                        <span className='font-medium'>{alert.rule}</span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {alert.message}
                    </p>
                  </div>
                ))}

                {systemStatus.alerts.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    <Bell className='h-12 w-12 mx-auto mb-2' />
                    <p>Nenhum alerta recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
