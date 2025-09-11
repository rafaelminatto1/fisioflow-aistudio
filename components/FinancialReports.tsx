'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon, FileTextIcon, DownloadIcon, PrinterIcon, BarChart3Icon, PieChartIcon, LineChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  revenue: {
    total: number;
    byMonth: Array<{ month: string; amount: number; }>;
    byService: Array<{ service: string; amount: number; count: number; }>;
    byPaymentMethod: Array<{ method: string; amount: number; percentage: number; }>;
  };
  expenses: {
    total: number;
    byCategory: Array<{ category: string; amount: number; percentage: number; }>;
    byMonth: Array<{ month: string; amount: number; }>;
  };
  cashFlow: {
    net: number;
    byMonth: Array<{ month: string; revenue: number; expenses: number; net: number; }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    byMonth: Array<{ month: string; total: number; completed: number; cancelled: number; }>;
  };
  patients: {
    total: number;
    new: number;
    returning: number;
    byMonth: Array<{ month: string; new: number; returning: number; }>;
  };
}

interface ReportFilters {
  dateRange: DateRange | undefined;
  period: 'custom' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';
  groupBy: 'day' | 'week' | 'month' | 'year';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function FinancialReports() {
  const [reportData, setReportData] = useState<ReportData>({
    revenue: { total: 0, byMonth: [], byService: [], byPaymentMethod: [] },
    expenses: { total: 0, byCategory: [], byMonth: [] },
    cashFlow: { net: 0, byMonth: [] },
    appointments: { total: 0, completed: 0, cancelled: 0, noShow: 0, byMonth: [] },
    patients: { total: 0, new: 0, returning: 0, byMonth: [] }
  });
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    },
    period: 'thisMonth',
    groupBy: 'month'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: filters.period,
        groupBy: filters.groupBy
      });

      if (filters.dateRange?.from) {
        params.append('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        params.append('endDate', filters.dateRange.to.toISOString());
      }

      const response = await fetch(`/api/financial/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        toast.error('Erro ao carregar relatórios');
      }
    } catch (error) {
      console.error('Erro ao buscar dados dos relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    let dateRange: DateRange | undefined;
    const now = new Date();

    switch (period) {
      case 'thisMonth':
        dateRange = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      case 'lastMonth':
        const lastMonth = addDays(startOfMonth(now), -1);
        dateRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case 'thisYear':
        dateRange = { from: startOfYear(now), to: endOfYear(now) };
        break;
      case 'lastYear':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        dateRange = { from: startOfYear(lastYear), to: endOfYear(lastYear) };
        break;
      default:
        dateRange = filters.dateRange;
    }

    setFilters(prev => ({
      ...prev,
      period: period as any,
      dateRange
    }));
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        period: filters.period,
        groupBy: filters.groupBy
      });

      if (filters.dateRange?.from) {
        params.append('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        params.append('endDate', filters.dateRange.to.toISOString());
      }

      const response = await fetch(`/api/financial/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-financeiro-${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Relatório exportado com sucesso');
      } else {
        toast.error('Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) return 'Período personalizado';
    
    const from = format(filters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
    const to = format(filters.dateRange.to, 'dd/MM/yyyy', { locale: ptBR });
    return `${from} - ${to}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h2>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('excel')} variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <FileTextIcon className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                <SelectItem value="thisYear">Este Ano</SelectItem>
                <SelectItem value="lastYear">Ano Passado</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {filters.period === 'custom' && (
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
              />
            )}

            <Select value={filters.groupBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, groupBy: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              {getPeriodLabel()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDownIcon className="h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Pacientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.revenue.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDownIcon className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Despesas Totais</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.expenses.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSignIcon className={`h-5 w-5 ${reportData.cashFlow.net >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-sm text-gray-600">Lucro Líquido</p>
                    <p className={`text-2xl font-bold ${reportData.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.cashFlow.net)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Consultas Realizadas</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.appointments.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.cashFlow.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Receita" />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Despesas" />
                  <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={3} name="Lucro Líquido" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Service */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.revenue.byService}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ service, percentage }) => `${service} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.revenue.byService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.revenue.byPaymentMethod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.revenue.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.expenses.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.expenses.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expenses by Month */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução das Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.expenses.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Detalhado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.cashFlow.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#10B981" name="Receita" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
                  <Bar dataKey="net" fill="#3B82F6" name="Lucro Líquido" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total de Pacientes</span>
                    <Badge variant="outline">{reportData.patients.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Novos Pacientes</span>
                    <Badge className="bg-green-100 text-green-800">{reportData.patients.new}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pacientes Retornando</span>
                    <Badge className="bg-blue-100 text-blue-800">{reportData.patients.returning}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total de Consultas</span>
                    <Badge variant="outline">{reportData.appointments.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Realizadas</span>
                    <Badge className="bg-green-100 text-green-800">{reportData.appointments.completed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Canceladas</span>
                    <Badge className="bg-red-100 text-red-800">{reportData.appointments.cancelled}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Não Compareceu</span>
                    <Badge className="bg-orange-100 text-orange-800">{reportData.appointments.noShow}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.patients.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="new" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Novos" />
                  <Area type="monotone" dataKey="returning" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Retornando" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}