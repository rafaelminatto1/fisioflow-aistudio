'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, AlertTriangleIcon, FileTextIcon, UsersIcon, BarChart3Icon, TargetIcon, PlusIcon, CreditCardIcon, AlertCircleIcon, ReceiptIcon, PieChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { FinancialReports } from './FinancialReports';
import { DelinquencyManager } from './DelinquencyManager';
import { FinancialGoals } from './FinancialGoals';
import { FinancialTransactions } from './FinancialTransactions';
import { ReceiptManager } from './ReceiptManager';

interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  pendingPayments: number;
  overduePayments: number;
  profitMargin: number;
  growthRate: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  category?: string;
  patient?: {
    name: string;
  };
}

interface ChartData {
  name: string;
  receita: number;
  despesa: number;
}

export default function FinancialDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'delinquency' | 'reports' | 'goals' | 'receipts'>('overview');
  const [stats, setStats] = useState<FinancialStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    pendingPayments: 0,
    overduePayments: 0,
    profitMargin: 0,
    growthRate: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch(`/api/financial/stats?period=${period}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/financial/transactions?limit=5');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.transactions || []);
      }

      // Generate mock chart data
      const mockChartData = [
        { name: 'Jan', receita: 12000, despesa: 8000 },
        { name: 'Fev', receita: 15000, despesa: 9000 },
        { name: 'Mar', receita: 18000, despesa: 10000 },
        { name: 'Abr', receita: 16000, despesa: 11000 },
        { name: 'Mai', receita: 20000, despesa: 12000 },
        { name: 'Jun', receita: 22000, despesa: 13000 }
      ];
      setChartData(mockChartData);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
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
        <h1 className="text-3xl font-bold text-gray-900">Controle Financeiro</h1>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <DollarSignIcon className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="delinquency" className="flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4" />
            Inadimplência
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <TargetIcon className="h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            Recibos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Controles do período */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h2>
            <div className="flex items-center gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setActiveView('transactions')}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nova Transação
              </Button>
            </div>
          </div>

          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Receita Total */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSignIcon className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalIncome)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stats.growthRate >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`ml-1 text-sm ${
                    stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(stats.growthRate)} vs. mês anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fluxo de Caixa */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3Icon className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Fluxo de Caixa</p>
                      <p className={`text-2xl font-bold ${
                        stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(stats.netFlow)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    Margem: {formatPercentage(stats.profitMargin)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagamentos Pendentes */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.pendingPayments}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    Aguardando pagamento
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inadimplência */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircleIcon className="h-8 w-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.overduePayments}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    {stats.overduePayments > 0 && (
                      <span className="text-red-600 font-medium">
                        Requer atenção
                      </span>
                    )}
                    {stats.overduePayments === 0 && (
                      <span className="text-green-600">
                        Tudo em dia
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transações Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptIcon className="h-5 w-5" />
                  Transações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border-l-4 border-l-gray-200 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            {transaction.patient?.name || transaction.category || 'Geral'} • 
                            {' '}
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className={`font-bold ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Nenhuma transação encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Resumo do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total de Receitas</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stats.totalIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total de Despesas</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(stats.totalExpenses)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold text-gray-900">Resultado</span>
                    <span className={`font-bold ${
                      stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(stats.netFlow)}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stats.profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(stats.profitMargin), 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    Margem de lucro: {formatPercentage(stats.profitMargin)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <FinancialTransactions />
        </TabsContent>

        <TabsContent value="delinquency">
          <DelinquencyManager />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="goals">
          <FinancialGoals />
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}