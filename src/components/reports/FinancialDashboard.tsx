'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FinancialReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    successRate: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
  };
  revenueByMethod: Array<{
    method: string;
    revenue: number;
    count: number;
  }>;
}

interface RevenueReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    averageTransaction: number;
    totalTransactions: number;
  };
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    transactions: number;
  }>;
  topPatients: Array<{
    patient: {
      id: string;
      name: string;
      email: string;
    };
    revenue: number;
    transactions: number;
  }>;
}

interface TrendsReport {
  currentPeriod: {
    startDate: string;
    endDate: string;
    revenue: number;
    transactions: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    revenue: number;
    transactions: number;
  };
  growth: {
    revenue: number;
    transactions: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PAYMENT_METHOD_LABELS = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_slip: 'Boleto Bancário'
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  expired: 'Expirado'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-500',
  paid: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
  expired: 'bg-orange-500'
};

const PAYMENT_STATUS_ICONS = {
  pending: Clock,
  paid: CheckCircle,
  failed: XCircle,
  cancelled: XCircle,
  expired: AlertCircle
};

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('last30days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [overviewData, setOverviewData] = useState<FinancialReport | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsReport | null>(null);

  // Carregar dados do relatório
  const loadReportData = async (reportType: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const params = new URLSearchParams({
        type: reportType,
        period: period
      });

      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/reports/financial?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatório');
      }

      const data = await response.json();
      
      switch (reportType) {
        case 'overview':
          setOverviewData(data);
          break;
        case 'revenue':
          setRevenueData(data);
          break;
        case 'trends':
          setTrendsData(data);
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório financeiro');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Atualizar dados quando período mudar
  useEffect(() => {
    loadReportData('overview');
    loadReportData('revenue', false);
    loadReportData('trends', false);
  }, [period, dateRange]);

  // Atualizar dados da aba ativa
  useEffect(() => {
    if (activeTab === 'overview' && !overviewData) {
      loadReportData('overview');
    } else if (activeTab === 'revenue' && !revenueData) {
      loadReportData('revenue');
    } else if (activeTab === 'trends' && !trendsData) {
      loadReportData('trends');
    }
  }, [activeTab]);

  // Atualizar todos os dados
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadReportData('overview', false),
      loadReportData('revenue', false),
      loadReportData('trends', false)
    ]);
    setRefreshing(false);
    toast.success('Dados atualizados com sucesso');
  };

  // Exportar relatório
  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab,
        period: period,
        format: 'csv'
      });

      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/reports/financial/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Relatório exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  // Formatar porcentagem
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho financeiro da sua clínica
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Período
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="thisYear">Este ano</SelectItem>
                  <SelectItem value="lastYear">Ano passado</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {period === 'custom' && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Intervalo de Datas
                </label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo dos Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : overviewData ? (
            <>
              {/* Cards de Métricas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(overviewData.summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {overviewData.summary.paidPayments} pagamentos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Taxa de Sucesso
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage(overviewData.summary.successRate)}
                    </div>
                    <Progress 
                      value={overviewData.summary.successRate} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Assinaturas Ativas
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overviewData.summary.activeSubscriptions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      MRR: {formatCurrency(overviewData.summary.monthlyRecurringRevenue)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pagamentos Pendentes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overviewData.summary.pendingPayments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {overviewData.summary.failedPayments} falharam
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Receita por Método */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overviewData.revenueByMethod.map(item => ({
                          name: PAYMENT_METHOD_LABELS[item.method as keyof typeof PAYMENT_METHOD_LABELS] || item.method,
                          value: item.revenue,
                          count: item.count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {overviewData.revenueByMethod.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
            </div>
          )}
        </TabsContent>

        {/* Receita */}
        <TabsContent value="revenue" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : revenueData ? (
            <>
              {/* Resumo da Receita */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Receita Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Ticket Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.averageTransaction)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Total de Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {revenueData.summary.totalTransactions}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Receita por Período */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData.revenueByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Pacientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Pacientes por Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueData.topPatients.map((patient, index) => (
                      <div key={patient.patient.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{patient.patient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {patient.transactions} transações
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(patient.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
            </div>
          )}
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="trends" className="space-y-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : trendsData ? (
            <>
              {/* Comparação de Períodos */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Crescimento da Receita
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold">
                        {formatPercentage(trendsData.growth.revenue)}
                      </div>
                      {trendsData.growth.revenue >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Atual: {formatCurrency(trendsData.currentPeriod.revenue)}</p>
                      <p>Anterior: {formatCurrency(trendsData.previousPeriod.revenue)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Crescimento de Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold">
                        {formatPercentage(trendsData.growth.transactions)}
                      </div>
                      {trendsData.growth.transactions >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Atual: {trendsData.currentPeriod.transactions}</p>
                      <p>Anterior: {trendsData.previousPeriod.transactions}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}