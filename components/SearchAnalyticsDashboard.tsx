'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Zap, 
  Target,
  BarChart3,
  Activity,
  Database,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SearchAnalytics {
  total_searches: number;
  avg_query_time: number;
  cache_hit_rate: number;
  most_popular_query: string;
  unique_queries: number;
  hourly_data?: Array<{
    hour: number;
    searches: number;
    avg_query_time: number;
  }>;
  time_buckets?: {
    '<100ms': number;
    '100-500ms': number;
    '500ms-1s': number;
    '1s-2s': number;
    '>2s': number;
  };
  popular_queries?: Array<{
    query: string;
    count: number;
  }>;
  popular_terms?: Array<{
    term: string;
    count: number;
  }>;
  algorithm_stats?: Array<{
    algorithm: string;
    usage_count: number;
    usage_percentage: number;
    avg_query_time: number;
  }>;
  slowest_queries?: Array<{
    query: string;
    avg_time: number;
    count: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function SearchAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [metric, setMetric] = useState<'queries' | 'performance' | 'popular_terms' | 'cache_efficiency' | 'algorithm_usage'>('queries');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe, metric]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search/analytics?timeframe=${timeframe}&metric=${metric}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading search analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };

  const getPerformanceColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total de Buscas</p>
              <p className="text-2xl font-bold">{analytics?.total_searches?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(analytics?.avg_query_time || 0)}`}>
                {formatTime(analytics?.avg_query_time || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics?.cache_hit_rate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Consultas Únicas</p>
              <p className="text-2xl font-bold">{analytics?.unique_queries?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Mais Popular</p>
              <p className="text-sm font-bold truncate">{analytics?.most_popular_query || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQueriesChart = () => {
    if (!analytics?.hourly_data) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Buscas por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.hourly_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={formatHour}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(hour) => `${hour}:00`}
                formatter={(value, name) => [
                  name === 'searches' ? value : formatTime(value as number),
                  name === 'searches' ? 'Buscas' : 'Tempo Médio'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="searches" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="searches"
              />
              <Line 
                type="monotone" 
                dataKey="avg_query_time" 
                stroke="#10B981" 
                strokeWidth={2}
                yAxisId="right"
                name="avg_query_time"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceChart = () => {
    if (!analytics?.time_buckets) return null;

    const data = Object.entries(analytics.time_buckets).map(([range, count]) => ({
      range,
      count
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPopularQueries = () => (
    <Card>
      <CardHeader>
        <CardTitle>Consultas Mais Populares</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics?.popular_queries?.slice(0, 10).map((query, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium text-sm">{query.query}</span>
              <Badge variant="secondary">{query.count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderPopularTerms = () => (
    <Card>
      <CardHeader>
        <CardTitle>Termos Mais Buscados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {analytics?.popular_terms?.slice(0, 20).map((term, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-sm"
              style={{ 
                fontSize: Math.min(16, 8 + (term.count / Math.max(...(analytics?.popular_terms?.map(t => t.count) || [1]))) * 8) 
              }}
            >
              {term.term} ({term.count})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderAlgorithmUsage = () => {
    if (!analytics?.algorithm_stats) return null;

    const pieData = analytics.algorithm_stats.map((stat, index) => ({
      name: stat.algorithm,
      value: stat.usage_percentage,
      count: stat.usage_count
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Uso por Algoritmo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Uso']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Algoritmo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.algorithm_stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{stat.algorithm}</span>
                    <p className="text-sm text-gray-600">{stat.usage_count} usos</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${getPerformanceColor(stat.avg_query_time)}`}>
                      {formatTime(stat.avg_query_time)}
                    </span>
                    <p className="text-sm text-gray-600">
                      {stat.usage_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSlowestQueries = () => (
    <Card>
      <CardHeader>
        <CardTitle>Consultas Mais Lentas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics?.slowest_queries?.slice(0, 10).map((query, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
              <div>
                <span className="font-medium text-sm">{query.query}</span>
                <p className="text-xs text-gray-600">{query.count} execuções</p>
              </div>
              <span className="font-bold text-red-600">
                {formatTime(query.avg_time)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Analytics de Busca
        </h1>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={(value: string) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Última Hora</SelectItem>
              <SelectItem value="day">Último Dia</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {renderOverviewMetrics()}

      {/* Detailed Analytics */}
      <Tabs value={metric} onValueChange={(value: string) => setMetric(value)}>
        <TabsList>
          <TabsTrigger value="queries">Consultas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="popular_terms">Termos Populares</TabsTrigger>
          <TabsTrigger value="algorithm_usage">Algoritmos</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-4">
          {renderQueriesChart()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderPopularQueries()}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de buscas:</span>
                  <Badge variant="secondary">{analytics?.total_searches?.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Consultas únicas:</span>
                  <Badge variant="secondary">{analytics?.unique_queries?.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tempo médio:</span>
                  <Badge variant="secondary">{formatTime(analytics?.avg_query_time || 0)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cache hit rate:</span>
                  <Badge variant="secondary">{analytics?.cache_hit_rate?.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {renderPerformanceChart()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderSlowestQueries()}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>P95 (95º percentil):</span>
                  <Badge variant="secondary">
                    {formatTime(analytics?.p95_query_time || 0)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>P99 (99º percentil):</span>
                  <Badge variant="secondary">
                    {formatTime(analytics?.p99_query_time || 0)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {analytics?.time_buckets && Object.entries(analytics.time_buckets).map(([range, count]) => (
                    <div key={range} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{range}</div>
                      <div className="text-lg font-bold text-blue-600">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular_terms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderPopularQueries()}
            {renderPopularTerms()}
          </div>
        </TabsContent>

        <TabsContent value="algorithm_usage" className="space-y-4">
          {renderAlgorithmUsage()}
        </TabsContent>
      </Tabs>
    </div>
  );
}