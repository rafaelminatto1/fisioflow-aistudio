'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon,
  CalendarIcon,
  UsersIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon
} from 'lucide-react';
import { FinancialTransaction, TransactionType } from '@/types';

// Definir tipos locais já que não existem no types
type FinancialTransactionType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
type ProfessionalPayout = {
  id: string;
  professional: string;
  amount: number;
  period: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  dueDate: string;
};

interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  profitMargin: number;
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [payouts, setPayouts] = useState<ProfessionalPayout[]>([]);
  const [cashflowSummary, setCashflowSummary] = useState<CashflowSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      // Load cashflow summary
      const cashflowResponse = await fetch(
        `/api/financial/cashflow?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const cashflowData = await cashflowResponse.json();
      
      if (cashflowData.summary) {
        setCashflowSummary(cashflowData.summary);
      }

      // Load recent transactions
      const transactionsResponse = await fetch(
        `/api/financial/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=5`
      );
      const transactionsData = await transactionsResponse.json();
      
      if (transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      }

      // Load recent payouts
      const payoutsResponse = await fetch('/api/financial/payouts?limit=5');
      const payoutsData = await payoutsResponse.json();
      
      if (payoutsData.payouts) {
        setPayouts(payoutsData.payouts);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Módulo Financeiro"
        description="Gestão financeira avançada com fluxo de caixa e repasses profissionais"
      />

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadFinancialData} className="w-full">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Atualizar Período
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="payouts">Repasses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashflowSummary.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashflowSummary.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
                <DollarSignIcon className={`h-4 w-4 ${cashflowSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashflowSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashflowSummary.netFlow)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem</CardTitle>
                <Badge variant={cashflowSummary.profitMargin >= 20 ? 'default' : cashflowSummary.profitMargin >= 10 ? 'secondary' : 'destructive'}>
                  {cashflowSummary.profitMargin.toFixed(1)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashflowSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashflowSummary.profitMargin.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem de lucro
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transações Recentes</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando transações...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada para o período selecionado
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.date.toString())} • {transaction.category || 'Sem categoria'}
                        </div>
                        {transaction.patientName && (
                          <div className="text-xs text-blue-600">
                            Paciente: {transaction.patientName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          transaction.type === TransactionType.Receita 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === TransactionType.Receita ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Badge variant={transaction.type === TransactionType.Receita ? 'default' : 'secondary'}>
                          {transaction.type === TransactionType.Receita ? 'Receita' : 'Despesa'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Repasses Recentes</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('payouts')}>
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando repasses...</div>
              ) : payouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum repasse encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {payout.professional}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Período: {payout.period}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {formatCurrency(payout.amount)}
                        </div>
                        <Badge 
                          variant={
                            payout.status === 'COMPLETED' ? 'default' :
                            payout.status === 'PENDING' ? 'secondary' :
                            'outline'
                          }
                        >
                          {payout.status === 'COMPLETED' ? 'Pago' :
                           payout.status === 'PENDING' ? 'Pendente' :
                           'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-10 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="INCOME">Receitas</SelectItem>
                  <SelectItem value="EXPENSE">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as transações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSignIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Funcionalidade de gerenciamento de transações</p>
                <p className="text-sm">Será implementada aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar profissionais..."
                  className="pl-10 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Calcular Repasse
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repasses Profissionais</CardTitle>
              <CardDescription>
                Calcule e gerencie os repasses dos profissionais com base nos atendimentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <UsersIcon className="h-12 w-12 mx-auto mb-4" />
                <p>Funcionalidade de cálculo de repasses</p>
                <p className="text-sm">Será implementada aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}