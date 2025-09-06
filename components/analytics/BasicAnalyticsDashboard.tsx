// components/analytics/BasicAnalyticsDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/Skeleton'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'

interface AnalyticsData {
  overview: {
    totalPatients: number
    totalAppointments: number
    monthlyRevenue: number
    completionRate: number
    growthRate: number
    averageSessionTime: number
  }
  chartData: {
    appointments: Array<{ date: string; count: number; completed: number; cancelled: number }>
    revenue: Array<{ month: string; income: number; expenses: number; net: number }>
    patientFlow: Array<{ name: string; value: number; color: string }>
    performance: Array<{ metric: string; current: number; target: number; previous: number }>
  }
  realTime: {
    activeUsers: number
    currentSessions: number
    pageViews: number
    bounceRate: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function BasicAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  
  const { trackEvent, getMetrics } = useAnalytics()

  useEffect(() => {
    loadAnalyticsData()
    trackEvent('analytics_dashboard_viewed', { timeRange })
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
    trackEvent('analytics_refreshed', { timeRange })
  }

  const handleExport = () => {
    trackEvent('analytics_exported', { timeRange, format: 'pdf' })
    // Implementar exportação
  }

  if (loading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Erro ao carregar dados de analytics</p>
          <Button onClick={loadAnalyticsData} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Métricas e insights do seu negócio
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Pacientes"
          value={data.overview.totalPatients}
          change={data.overview.growthRate}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Consultas do Mês"
          value={data.overview.totalAppointments}
          change={12.5}
          icon={Calendar}
          color="green"
        />
        <KPICard
          title="Receita Mensal"
          value={data.overview.monthlyRevenue}
          change={8.2}
          icon={DollarSign}
          color="yellow"
          format="currency"
        />
        <KPICard
          title="Taxa de Conclusão"
          value={data.overview.completionRate}
          change={2.1}
          icon={Target}
          color="purple"
          format="percentage"
        />
      </div>

      {/* Real-time Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-500" />
          Métricas em Tempo Real
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.realTime.activeUsers}
            </div>
            <div className="text-sm text-gray-500">Usuários Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.realTime.currentSessions}
            </div>
            <div className="text-sm text-gray-500">Sessões Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.realTime.pageViews}
            </div>
            <div className="text-sm text-gray-500">Visualizações</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.realTime.bounceRate}%
            </div>
            <div className="text-sm text-gray-500">Taxa de Rejeição</div>
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Consultas por Período</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData.appointments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#10b981" name="Concluídas" />
              <Bar dataKey="cancelled" fill="#ef4444" name="Canceladas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receita vs Despesas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.chartData.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
              <Area 
                type="monotone" 
                dataKey="income" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                name="Receita"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="2" 
                stroke="#ef4444" 
                fill="#ef4444" 
                name="Despesas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Patient Flow */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fluxo de Pacientes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.chartData.patientFlow}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.chartData.patientFlow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Performance</h3>
          <div className="space-y-4">
            {data.chartData.performance.map((metric, index) => (
              <div key={metric.metric} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <span className="text-sm text-gray-500">
                      {metric.current} / {metric.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(metric.current / metric.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className={`text-sm font-medium ${
                    metric.current > metric.previous ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.current > metric.previous ? '+' : ''}
                    {((metric.current - metric.previous) / metric.previous * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Componente KPI Card
function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  format = 'number' 
}: {
  title: string
  value: number
  change: number
  icon: any
  color: string
  format?: 'number' | 'currency' | 'percentage'
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `R$ ${val.toLocaleString('pt-BR')}`
      case 'percentage':
        return `${val}%`
      default:
        return val.toLocaleString('pt-BR')
    }
  }

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <TrendingUp className={`h-4 w-4 mr-1 ${
          change >= 0 ? 'text-green-500' : 'text-red-500'
        }`} />
        <span className={`text-sm font-medium ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-gray-500 ml-1">
          vs período anterior
        </span>
      </div>
    </Card>
  )
}

// Loading skeleton
function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}