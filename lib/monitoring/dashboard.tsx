'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { MonitoringMetrics, Alert as MonitoringAlert } from './index';

interface DashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: DashboardProps) {
  const [metrics, setMetrics] = useState<MonitoringMetrics[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [healthStatus, setHealthStatus] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    activeAlerts: number;
    lastMetrics: MonitoringMetrics | null;
  }>({ status: 'healthy', activeAlerts: 0, lastMetrics: null });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsRes, alertsRes, healthRes] = await Promise.all([
        fetch('/api/neon/metrics?action=getMetrics&limit=50'),
        fetch('/api/neon/metrics?action=getAlerts'),
        fetch('/api/neon/metrics?action=getHealth'),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthStatus(
          healthData.health || {
            status: 'healthy',
            activeAlerts: 0,
            lastMetrics: null,
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados do monitoramento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
      case 'critical':
        return <XCircle className='h-5 w-5 text-red-600' />;
      default:
        return <Activity className='h-5 w-5 text-gray-600' />;
    }
  };

  const formatChartData = (metrics: MonitoringMetrics[]) => {
    return metrics.map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      cpu: metric.compute.cpu,
      memory: metric.compute.memory / 1024, // Convert to GB
      connections: metric.database.connections.active,
      responseTime: metric.api.responseTime,
      errorRate: metric.database.performance.errorRate,
      storage: metric.database.storage.percentage,
    }));
  };

  const chartData = formatChartData(metrics);
  const lastMetric = healthStatus.lastMetrics;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Carregando métricas...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Database className='h-8 w-8 text-blue-600' />
          <div>
            <h1 className='text-2xl font-bold'>Neon DB Monitoring</h1>
            <p className='text-gray-600'>
              Real-time database performance metrics
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size='sm'
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`}
            />
            Auto Refresh
          </Button>
          <Button onClick={fetchData} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Status Geral
                </p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(healthStatus.status)}`}
                >
                  {healthStatus.status.charAt(0).toUpperCase() +
                    healthStatus.status.slice(1)}
                </p>
              </div>
              {getStatusIcon(healthStatus.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Alertas Ativos
                </p>
                <p className='text-2xl font-bold'>
                  {healthStatus.activeAlerts}
                </p>
              </div>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>CPU Usage</p>
                <p className='text-2xl font-bold'>
                  {lastMetric?.compute.cpu || 0}%
                </p>
              </div>
              <Cpu className='h-5 w-5 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Connections</p>
                <p className='text-2xl font-bold'>
                  {lastMetric?.database.connections.active || 0}
                </p>
              </div>
              <Database className='h-5 w-5 text-green-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* CPU & Memory Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Cpu className='h-5 w-5 mr-2' />
              CPU & Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='cpu'
                  stroke='#3b82f6'
                  name='CPU %'
                />
                <Line
                  type='monotone'
                  dataKey='memory'
                  stroke='#10b981'
                  name='Memory GB'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Zap className='h-5 w-5 mr-2' />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Area
                  type='monotone'
                  dataKey='responseTime'
                  stroke='#f59e0b'
                  fill='#fbbf24'
                  name='Response Time (ms)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Connections Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Database className='h-5 w-5 mr-2' />
              Database Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey='connections'
                  fill='#8b5cf6'
                  name='Active Connections'
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <HardDrive className='h-5 w-5 mr-2' />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Area
                  type='monotone'
                  dataKey='storage'
                  stroke='#ef4444'
                  fill='#fca5a5'
                  name='Storage %'
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <AlertTriangle className='h-5 w-5 mr-2' />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {alerts.map(alert => (
                <Alert
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.type === 'critical'
                      ? 'border-red-500'
                      : alert.type === 'warning'
                        ? 'border-yellow-500'
                        : 'border-blue-500'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      {alert.type === 'critical' ? (
                        <XCircle className='h-5 w-5 text-red-600' />
                      ) : (
                        <AlertTriangle className='h-5 w-5 text-yellow-600' />
                      )}
                      <div>
                        <AlertDescription className='font-medium'>
                          {alert.message}
                        </AlertDescription>
                        <p className='text-sm text-gray-600'>
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        alert.type === 'critical' ? 'destructive' : 'secondary'
                      }
                    >
                      {alert.type}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MonitoringDashboard;
