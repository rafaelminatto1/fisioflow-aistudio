'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { 
  Activity, 
  AlertTriangle, 
  Brain, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface AdvancedDashboardProps {
  userId: string;
}

interface DashboardData {
  overview: {
    totalPatients: number;
    activePatients: number;
    completionRate: number;
    avgSessionsPerPatient: number;
    monthlyGrowth: number;
  };
  patientInsights: Array<{
    patientId: string;
    patientName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recoveryProgress: number;
    attendanceRate: number;
    painTrend: 'improving' | 'stable' | 'worsening';
  }>;
  performance: {
    weeklyAppointments: Array<{
      week: string;
      appointments: number;
      completed: number;
      noShow: number;
    }>;
    treatmentSuccess: Array<{
      treatmentType: string;
      successRate: number;
      avgDuration: number;
      patientCount: number;
    }>;
    painReductionTrends: Array<{
      month: string;
      avgPainReduction: number;
      patientsSurvey: number;
    }>;
  };
  alerts: Array<{
    type: 'patient_risk' | 'capacity_warning' | 'quality_concern';
    severity: 'high' | 'medium' | 'low';
    message: string;
    patientName?: string;
    actionRequired: string;
    timestamp: string;
  }>;
  predictions: {
    dischargeCandidates: Array<{
      patientName: string;
      probability: number;
      expectedDate: string;
    }>;
    riskPatients: Array<{
      patientName: string;
      riskFactors: string[];
      recommendedActions: string[];
    }>;
  };
}

const COLORS = {
  primary: '#2563eb',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  secondary: '#6b7280'
};

const RISK_COLORS = {
  low: '#059669',
  medium: '#d97706',
  high: '#dc2626',
  critical: '#7c2d12'
};

export default function AdvancedDashboard({ userId }: AdvancedDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userId, selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/advanced?userId=${userId}&range=${selectedTimeRange}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const exportDashboard = async () => {
    try {
      const response = await fetch(`/api/analytics/export?userId=${userId}&range=${selectedTimeRange}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-analytics-${selectedTimeRange}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export dashboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Não foi possível carregar os dados do dashboard. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Avançado</h1>
          <p className="text-muted-foreground">
            Insights inteligentes e análises preditivas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={exportDashboard} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.monthlyGrowth > 0 ? '+' : ''}{data.overview.monthlyGrowth}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.completionRate}%</div>
            <Progress value={data.overview.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões/Paciente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgSessionsPerPatient.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Média por paciente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.alerts.filter(alert => alert.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Inteligentes
            </CardTitle>
            <CardDescription>
              Identificação automática de situações que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.slice(0, 5).map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 border-l-4 rounded-md ${
                    alert.severity === 'high' 
                      ? 'border-red-500 bg-red-50' 
                      : alert.severity === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      {alert.patientName && (
                        <p className="text-sm text-muted-foreground">
                          Paciente: {alert.patientName}
                        </p>
                      )}
                      <p className="text-sm mt-1">{alert.actionRequired}</p>
                    </div>
                    <Badge 
                      variant={
                        alert.severity === 'high' 
                          ? 'destructive' 
                          : alert.severity === 'medium' 
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {alert.severity === 'high' ? 'Alto' : 
                       alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="predictions">Predições IA</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Consultas Semanais</CardTitle>
                <CardDescription>
                  Acompanhamento de agendamentos e comparecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.performance.weeklyAppointments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="1"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="noShow"
                      stackId="1"
                      stroke={COLORS.danger}
                      fill={COLORS.danger}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Treatment Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso por Tratamento</CardTitle>
                <CardDescription>
                  Performance dos diferentes tipos de tratamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.performance.treatmentSuccess}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="treatmentType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pain Reduction Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Redução da Dor</CardTitle>
              <CardDescription>
                Evolução média da redução de dor dos pacientes ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.performance.painReductionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgPainReduction"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          {/* Patient Risk Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Baixo', value: data.patientInsights.filter(p => p.riskLevel === 'low').length },
                        { name: 'Médio', value: data.patientInsights.filter(p => p.riskLevel === 'medium').length },
                        { name: 'Alto', value: data.patientInsights.filter(p => p.riskLevel === 'high').length },
                        { name: 'Crítico', value: data.patientInsights.filter(p => p.riskLevel === 'critical').length },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { color: RISK_COLORS.low },
                        { color: RISK_COLORS.medium },
                        { color: RISK_COLORS.high },
                        { color: RISK_COLORS.critical }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* High Risk Patients */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pacientes de Alto Risco</CardTitle>
                <CardDescription>
                  Pacientes que requerem atenção especial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.patientInsights
                    .filter(patient => patient.riskLevel === 'high' || patient.riskLevel === 'critical')
                    .slice(0, 5)
                    .map((patient, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{patient.patientName}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Progresso: {patient.recoveryProgress}%</span>
                            <span>Frequência: {patient.attendanceRate}%</span>
                            <span className="flex items-center">
                              Dor: 
                              {patient.painTrend === 'improving' ? (
                                <TrendingDown className="w-3 h-3 ml-1 text-green-500" />
                              ) : patient.painTrend === 'worsening' ? (
                                <TrendingUp className="w-3 h-3 ml-1 text-red-500" />
                              ) : (
                                <Activity className="w-3 h-3 ml-1 text-yellow-500" />
                              )}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={patient.riskLevel === 'critical' ? 'destructive' : 'default'}
                        >
                          {patient.riskLevel === 'critical' ? 'Crítico' : 'Alto Risco'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discharge Candidates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Candidatos à Alta
                </CardTitle>
                <CardDescription>
                  Pacientes com alta probabilidade de conclusão do tratamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.predictions.dischargeCandidates.map((patient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{patient.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Previsão: {patient.expectedDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-700">
                          {patient.probability}%
                        </div>
                        <Progress value={patient.probability} className="w-20 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Patients Interventions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Intervenções Recomendadas
                </CardTitle>
                <CardDescription>
                  Ações sugeridas pela IA para pacientes em risco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictions.riskPatients.map((patient, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="font-medium mb-2">{patient.patientName}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Fatores de Risco:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {patient.riskFactors.map((factor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Ações Recomendadas:
                          </p>
                          <ul className="text-sm space-y-1">
                            {patient.recommendedActions.map((action, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Insights Operacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium">Otimização de Horários</h4>
                    <p className="text-sm text-muted-foreground">
                      Terças e quintas apresentam 23% menos agendamentos. 
                      Considere campanhas de incentivo para esses dias.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium">Capacidade</h4>
                    <p className="text-sm text-muted-foreground">
                      A capacidade está 85% utilizada nos horários de pico. 
                      Avaliar expansão do atendimento vespertino.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights Clínicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium">Efetividade do Tratamento</h4>
                    <p className="text-sm text-muted-foreground">
                      Pacientes com exercícios domiciliares têm 34% mais 
                      progresso na recuperação.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium">Padrão de Dor</h4>
                    <p className="text-sm text-muted-foreground">
                      86% dos pacientes relatam maior dor nas segundas-feiras. 
                      Considere ajustes no protocolo de fim de semana.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}