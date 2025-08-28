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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Database,
  Users,
  Activity,
  Settings,
  RefreshCw,
  Trash2,
  Play,
  RotateCcw,
  Eye,
  Filter,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface RLSStatus {
  tablesWithRLS: string[];
  policiesCount: number;
  isConfigured: boolean;
}

interface AuditLog {
  id: number;
  table_name: string;
  operation: string;
  user_id: string;
  user_role: string;
  timestamp: string;
  old_data?: any;
  new_data?: any;
}

interface Policy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

interface AccessStat {
  user_role: string;
  table_name: string;
  operation: string;
  operation_count: number;
  last_access: string;
}

export function RLSSecurityDashboard() {
  const [rlsStatus, setRlsStatus] = useState<RLSStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [accessStats, setAccessStats] = useState<AccessStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [auditFilters, setAuditFilters] = useState({
    userId: '',
    tableName: '',
    operation: '',
    limit: 100,
    offset: 0,
  });

  // Load initial data
  useEffect(() => {
    loadRLSStatus();
    loadAuditLogs();
    loadPolicies();
    loadAccessStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRLSStatus = async () => {
    try {
      const response = await fetch('/api/neon/rls?action=status');
      const data = await response.json();

      if (data.success) {
        setRlsStatus(data.data);
      } else {
        toast.error('Failed to load RLS status');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading RLS status:', error);
      toast.error('Error loading RLS status');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        action: 'audit',
        ...Object.fromEntries(
          Object.entries(auditFilters).map(([key, value]) => [
            key,
            value.toString(),
          ])
        ),
      });

      const response = await fetch(`/api/neon/rls?${params}`);
      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.data);
      } else {
        toast.error('Failed to load audit logs');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading audit logs:', error);
      toast.error('Error loading audit logs');
    }
  };

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/neon/rls?action=policies');
      const data = await response.json();

      if (data.success) {
        setPolicies(data.data);
      } else {
        toast.error('Failed to load policies');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading policies:', error);
      toast.error('Error loading policies');
    }
  };

  const loadAccessStats = async () => {
    try {
      const response = await fetch('/api/neon/rls?action=stats');
      const data = await response.json();

      if (data.success) {
        setAccessStats(data.data);
      } else {
        toast.error('Failed to load access stats');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading access stats:', error);
      toast.error('Error loading access stats');
    }
  };

  const setupRLS = async (force = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/neon/rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', force }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('RLS setup completed successfully');
        await loadRLSStatus();
        await loadPolicies();
      } else {
        toast.error(data.error || 'Failed to setup RLS');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting up RLS:', error);
      toast.error('Error setting up RLS');
    } finally {
      setLoading(false);
    }
  };

  const resetRLS = async () => {
    if (
      !confirm(
        'Are you sure you want to reset RLS configuration? This will remove all policies.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/neon/rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('RLS configuration reset successfully');
        await loadRLSStatus();
        await loadPolicies();
      } else {
        toast.error(data.error || 'Failed to reset RLS');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resetting RLS:', error);
      toast.error('Error resetting RLS');
    } finally {
      setLoading(false);
    }
  };

  const testRLS = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/neon/rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('RLS tests completed successfully');
        // eslint-disable-next-line no-console
      } else {
        toast.error(data.error || 'RLS tests failed');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error testing RLS:', error);
      toast.error('Error testing RLS');
    } finally {
      setLoading(false);
    }
  };

  const cleanupAuditLogs = async (days = 30) => {
    if (
      !confirm(
        `Are you sure you want to delete audit logs older than ${days} days?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/neon/rls?days=${days}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Audit logs cleaned up successfully`);
        await loadAuditLogs();
      } else {
        toast.error(data.error || 'Failed to cleanup audit logs');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error cleaning up audit logs:', error);
      toast.error('Error cleaning up audit logs');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRLSStatus(),
        loadAuditLogs(),
        loadPolicies(),
        loadAccessStats(),
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Error refreshing data');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = () => {
    const csv = [
      ['ID', 'Table', 'Operation', 'User ID', 'User Role', 'Timestamp'].join(
        ','
      ),
      ...auditLogs.map(log =>
        [
          log.id,
          log.table_name,
          log.operation,
          log.user_id,
          log.user_role,
          log.timestamp,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (isConfigured: boolean) => {
    return isConfigured ? 'text-green-600' : 'text-red-600';
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            RLS Security Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Monitor and manage Row Level Security configuration
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>RLS Status</CardTitle>
            {rlsStatus?.isConfigured ? (
              <ShieldCheck className='h-4 w-4 text-green-600' />
            ) : (
              <ShieldAlert className='h-4 w-4 text-red-600' />
            )}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              <span
                className={getStatusColor(rlsStatus?.isConfigured || false)}
              >
                {rlsStatus?.isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>
              {rlsStatus?.tablesWithRLS.length || 0} tables protected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Security Policies
            </CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {rlsStatus?.policiesCount || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Active security policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Audit Logs</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{auditLogs.length}</div>
            <p className='text-xs text-muted-foreground'>
              Recent activity records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Access Stats</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{accessStats.length}</div>
            <p className='text-xs text-muted-foreground'>
              Unique access patterns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Actions */}
      {!rlsStatus?.isConfigured && (
        <Alert>
          <ShieldAlert className='h-4 w-4' />
          <AlertDescription>
            Row Level Security is not configured. Click &quot;Setup RLS&quot; to
            configure security policies.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>
            Manage RLS configuration and security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => setupRLS(false)}
              disabled={loading}
              variant={rlsStatus?.isConfigured ? 'outline' : 'default'}
            >
              <Settings className='h-4 w-4 mr-2' />
              Setup RLS
            </Button>

            <Button
              onClick={() => setupRLS(true)}
              disabled={loading}
              variant='outline'
            >
              <RotateCcw className='h-4 w-4 mr-2' />
              Force Reconfigure
            </Button>

            <Button onClick={testRLS} disabled={loading} variant='outline'>
              <Play className='h-4 w-4 mr-2' />
              Test RLS
            </Button>

            <Button onClick={resetRLS} disabled={loading} variant='destructive'>
              <Trash2 className='h-4 w-4 mr-2' />
              Reset RLS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='policies'>Security Policies</TabsTrigger>
          <TabsTrigger value='audit'>Audit Logs</TabsTrigger>
          <TabsTrigger value='stats'>Access Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Protected Tables</CardTitle>
              <CardDescription>
                Tables with Row Level Security enabled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-2'>
                {rlsStatus?.tablesWithRLS.map(table => (
                  <div
                    key={table}
                    className='flex items-center justify-between p-2 border rounded'
                  >
                    <span className='font-medium'>{table}</span>
                    <Badge variant='secondary'>
                      <Database className='h-3 w-3 mr-1' />
                      Protected
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='policies' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Active RLS policies and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy, index) => (
                    <TableRow
                      key={
                        policy.schemaname + policy.tablename + policy.policyname
                      }
                    >
                      <TableCell className='font-medium'>
                        {policy.tablename}
                      </TableCell>
                      <TableCell>{policy.policyname}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{policy.cmd}</Badge>
                      </TableCell>
                      <TableCell>{policy.roles?.join(', ') || 'All'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            policy.permissive === 'PERMISSIVE'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {policy.permissive}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='audit' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Database activity monitoring and security audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className='flex items-center gap-2 mb-4'>
                <Input
                  placeholder='Filter by User ID'
                  value={auditFilters.userId}
                  onChange={e =>
                    setAuditFilters(prev => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                  className='max-w-xs'
                />
                <Select
                  value={auditFilters.tableName}
                  onValueChange={value =>
                    setAuditFilters(prev => ({ ...prev, tableName: value }))
                  }
                >
                  <SelectTrigger className='max-w-xs'>
                    <SelectValue placeholder='Filter by Table' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>All Tables</SelectItem>
                    <SelectItem value='User'>User</SelectItem>
                    <SelectItem value='Patient'>Patient</SelectItem>
                    <SelectItem value='Appointment'>Appointment</SelectItem>
                    <SelectItem value='PainPoint'>PainPoint</SelectItem>
                    <SelectItem value='MetricResult'>MetricResult</SelectItem>
                    <SelectItem value='SoapNote'>SoapNote</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={auditFilters.operation}
                  onValueChange={value =>
                    setAuditFilters(prev => ({ ...prev, operation: value }))
                  }
                >
                  <SelectTrigger className='max-w-xs'>
                    <SelectValue placeholder='Filter by Operation' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>All Operations</SelectItem>
                    <SelectItem value='INSERT'>INSERT</SelectItem>
                    <SelectItem value='UPDATE'>UPDATE</SelectItem>
                    <SelectItem value='DELETE'>DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant='outline' size='sm' onClick={loadAuditLogs}>
                  <Filter className='h-4 w-4 mr-2' />
                  Apply Filters
                </Button>
                <Button variant='outline' size='sm' onClick={exportAuditLogs}>
                  <Download className='h-4 w-4 mr-2' />
                  Export
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => cleanupAuditLogs(30)}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Cleanup
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className='text-sm'>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {log.table_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getOperationColor(log.operation)}>
                          {log.operation}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm'>{log.user_id}</TableCell>
                      <TableCell>
                        <Badge variant='outline'>{log.user_role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            toast.info(
                              'Check console for detailed log information'
                            );
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='stats' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Access Statistics</CardTitle>
              <CardDescription>
                User access patterns and database usage statistics (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Role</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Last Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessStats.map((stat, index) => (
                    <TableRow
                      key={
                        stat.user_role +
                        stat.table_name +
                        stat.operation +
                        stat.last_access
                      }
                    >
                      <TableCell>
                        <Badge variant='outline'>{stat.user_role}</Badge>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {stat.table_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getOperationColor(stat.operation)}>
                          {stat.operation}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        {stat.operation_count}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {new Date(stat.last_access).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
