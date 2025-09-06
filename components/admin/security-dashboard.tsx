'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityMetrics {
  totalPolicies: number;
  activePolicies: number;
  failedAttempts: number;
  successfulAccess: number;
  rlsEnabled: number;
  rlsDisabled: number;
  lastSecurityCheck: string;
}

interface SecurityPolicy {
  tableName: string;
  policyName: string;
  enabled: boolean;
  description: string;
}

interface RLSStatus {
  tableName: string;
  rlsEnabled: boolean;
  policies: string[];
}

interface AuditLog {
  id: string;
  eventType: string;
  tableName?: string;
  recordId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: any;
  createdAt: string;
}

interface SecurityData {
  metrics: SecurityMetrics;
  policies: SecurityPolicy[];
  rlsStatus: RLSStatus[];
  auditLogs: AuditLog[];
}

export function SecurityDashboard() {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [selectedTable, setSelectedTable] = useState<string>('');

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/security?type=all');

      if (!response.ok) {
        throw new Error('Failed to fetch security data');
      }

      const data = await response.json();
      setSecurityData(data);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleRLS = async (tableName: string, enable: boolean) => {
    try {
      const response = await fetch('/api/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: enable ? 'enable_rls' : 'disable_rls',
          tableName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle RLS');
      }

      const result = await response.json();
      toast.success(result.message);

      // Refresh data
      await fetchSecurityData();
    } catch (error) {
      console.error('Error toggling RLS:', error);
      toast.error('Erro ao alterar RLS');
    }
  };

  const clearOldLogs = async (days: number = 30) => {
    try {
      const response = await fetch(
        `/api/security?action=clear_old_logs&days=${days}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clear logs');
      }

      const result = await response.json();
      toast.success(`${result.deletedRecords} logs antigos removidos`);

      // Refresh data
      await fetchSecurityData();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Erro ao limpar logs');
    }
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/security?type=audit-logs&limit=1000');

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const data = await response.json();
      const csvContent = convertToCSV(data.auditLogs);
      downloadCSV(
        csvContent,
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      );

      toast.success('Logs exportados com sucesso');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Erro ao exportar logs');
    }
  };

  const convertToCSV = (logs: AuditLog[]) => {
    const headers = [
      'ID',
      'Event Type',
      'Table',
      'Record ID',
      'User ID',
      'IP Address',
      'Created At',
    ];
    const rows = logs.map(log => [
      log.id,
      log.eventType,
      log.tableName || '',
      log.recordId || '',
      log.userId || '',
      log.ipAddress || '',
      log.createdAt,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'UNAUTHORIZED_ACCESS':
      case 'PERMISSION_DENIED':
      case 'API_ERROR':
        return 'destructive';
      case 'SUCCESSFUL_ACCESS':
      case 'RLS_ENABLED':
        return 'default';
      case 'RLS_DISABLED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Carregando dados de segurança...</span>
      </div>
    );
  }

  if (!securityData) {
    return (
      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Não foi possível carregar os dados de segurança.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Dashboard de Segurança
          </h2>
          <p className='text-muted-foreground'>
            Monitoramento e controle de segurança do sistema
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSecurityData}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
          <Button variant='outline' size='sm' onClick={exportAuditLogs}>
            <Download className='h-4 w-4 mr-2' />
            Exportar Logs
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Políticas Ativas
            </CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {securityData.metrics.activePolicies}
            </div>
            <p className='text-xs text-muted-foreground'>
              de {securityData.metrics.totalPolicies} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              RLS Habilitado
            </CardTitle>
            <ShieldCheck className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {securityData.metrics.rlsEnabled}
            </div>
            <p className='text-xs text-muted-foreground'>
              {securityData.metrics.rlsDisabled} desabilitado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tentativas Falhadas
            </CardTitle>
            <ShieldAlert className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {securityData.metrics.failedAttempts}
            </div>
            <p className='text-xs text-muted-foreground'>últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Acessos Bem-sucedidos
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {securityData.metrics.successfulAccess}
            </div>
            <p className='text-xs text-muted-foreground'>últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='rls' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='rls'>Row Level Security</TabsTrigger>
          <TabsTrigger value='policies'>Políticas</TabsTrigger>
          <TabsTrigger value='audit'>Logs de Auditoria</TabsTrigger>
        </TabsList>

        {/* RLS Status Tab */}
        <TabsContent value='rls' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Status do Row Level Security</CardTitle>
              <CardDescription>
                Controle de acesso a nível de linha para cada tabela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {securityData.rlsStatus.map(table => (
                  <div
                    key={table.tableName}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div className='flex items-center space-x-3'>
                      {table.rlsEnabled ? (
                        <Lock className='h-5 w-5 text-green-600' />
                      ) : (
                        <Unlock className='h-5 w-5 text-red-600' />
                      )}
                      <div>
                        <p className='font-medium'>{table.tableName}</p>
                        <p className='text-sm text-muted-foreground'>
                          {table.policies.length} política(s) ativa(s)
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant={table.rlsEnabled ? 'default' : 'destructive'}
                      >
                        {table.rlsEnabled ? 'Habilitado' : 'Desabilitado'}
                      </Badge>
                      <Switch
                        checked={table.rlsEnabled}
                        onCheckedChange={checked =>
                          toggleRLS(table.tableName, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Policies Tab */}
        <TabsContent value='policies' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Segurança</CardTitle>
              <CardDescription>Políticas ativas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {securityData.policies.map((policy, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded'
                  >
                    <div>
                      <p className='font-medium'>{policy.policyName}</p>
                      <p className='text-sm text-muted-foreground'>
                        Tabela: {policy.tableName}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {policy.description}
                      </p>
                    </div>
                    <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                      {policy.enabled ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value='audit' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Logs de Auditoria</CardTitle>
                  <CardDescription>
                    Registro de eventos de segurança
                  </CardDescription>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => clearOldLogs(30)}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Limpar Logs Antigos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {securityData.auditLogs.map(log => (
                  <div
                    key={log.id}
                    className='flex items-center justify-between p-3 border rounded text-sm'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <Badge variant={getEventTypeColor(log.eventType)}>
                          {log.eventType}
                        </Badge>
                        {log.tableName && (
                          <span className='text-muted-foreground'>
                            em {log.tableName}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        IP: {log.ipAddress || 'N/A'} | User:{' '}
                        {log.userId || 'N/A'}
                      </p>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
