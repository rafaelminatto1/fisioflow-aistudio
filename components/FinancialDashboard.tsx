'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Calendar,
  AlertCircle,
  BarChart3,
  PieChart,
  Receipt,
  Plus,
  List,
  AlertTriangle
} from 'lucide-react';
import FinancialTransactions from './FinancialTransactions';
import DelinquencyControl from './DelinquencyControl';

interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  profitMargin: number;
  pendingPayments: number;
  overduePayments: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  growthRate: number;
}

interface RecentTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  category?: string;
  patient?: {
    name: string;
  };
}

type ActiveViewType = 'overview' | 'transactions' | 'delinquency';

export default function FinancialDashboard() {
  const [activeView, setActiveView] = useState<ActiveViewType>('overview');
  const [stats, setStats] = useState<FinancialStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    profitMargin: 0,
    pendingPayments: 0,
    overduePayments: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
  });
  
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // dias

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period));
      
      // Buscar dados de fluxo de caixa
      const cashflowRes = await fetch(
        `/api/financial/cashflow?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const cashflowData = await cashflowRes.json();
      
      // Buscar transações recentes
      const transactionsRes = await fetch('/api/financial/transactions?limit=5');
      const transactionsData = await transactionsRes.json();
      
      // Buscar pagamentos pendentes
      const paymentsRes = await fetch('/api/payments?status=pending&limit=100');
      const paymentsData = await paymentsRes.json();
      
      // Calcular pagamentos em atraso
      const overdueCount = paymentsData.payments?.filter((payment: any) => {
        const dueDate = new Date(payment.dueDate);
        return dueDate < new Date();
      }).length || 0;

      // Calcular crescimento mês a mês
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);

      const thisMonthRes = await fetch(
        `/api/financial/cashflow?startDate=${thisMonthStart.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const thisMonthData = await thisMonthRes.json();

      const lastMonthRes = await fetch(
        `/api/financial/cashflow?startDate=${lastMonthStart.toISOString()}&endDate=${lastMonthEnd.toISOString()}`
      );
      const lastMonthData = await lastMonthRes.json();

      const thisMonthRevenue = thisMonthData.summary?.totalIncome || 0;
      const lastMonthRevenue = lastMonthData.summary?.totalIncome || 0;
      const growthRate = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      setStats({
        totalIncome: cashflowData.summary?.totalIncome || 0,
        totalExpenses: cashflowData.summary?.totalExpenses || 0,
        netFlow: cashflowData.summary?.netFlow || 0,
        profitMargin: cashflowData.summary?.profitMargin || 0,
        pendingPayments: paymentsData.pagination?.total || 0,
        overduePayments: overdueCount,
        thisMonthRevenue,
        lastMonthRevenue,
        growthRate,
      });
      
      setRecentTransactions(transactionsData.transactions || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTabClassName = (tabName: ActiveViewType) => {
    return `py-2 px-1 border-b-2 font-medium text-sm ${
      activeView === tabName
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render different views based on activeView
  if (activeView === 'transactions') {
    return <FinancialTransactions />;
  }
  
  if (activeView === 'delinquency') {
    return <DelinquencyControl />;
  }
  
  // Default to overview view

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('overview')}
            className={getTabClassName('overview')}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveView('transactions')}
            className={getTabClassName('transactions')}
          >
            <List className="h-4 w-4 inline mr-2" />
            Transações
          </button>
          <button
            onClick={() => setActiveView('delinquency')}
            className={getTabClassName('delinquency')}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Inadimplência
            {stats.overduePayments > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {stats.overduePayments}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Controles do período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h2>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button
            onClick={() => setActiveView('transactions')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receita Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
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
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`ml-1 text-sm ${
              stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(stats.growthRate)} vs. mês anterior
            </span>
          </div>
        </div>

        {/* Fluxo de Caixa */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-500" />
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
        </div>

        {/* Pagamentos Pendentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-orange-500" />
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
        </div>

        {/* Inadimplência */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
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
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Transações Recentes
          </h3>
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
        </div>

        {/* Resumo de Despesas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Resumo do Período
          </h3>
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
        </div>
      </div>
    </div>
  );
}