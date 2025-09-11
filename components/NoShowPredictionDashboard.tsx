'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import {
  aiNoShowPredictionService,
  NoShowPrediction,
  NoShowAnalytics,
  PatientNoShowHistory
} from '@/services/aiNoShowPredictionService'
import { Appointment } from '@/types'

interface NoShowPredictionDashboardProps {
  appointments: Appointment[]
  predictions: Map<string, NoShowPrediction>
  analytics: NoShowAnalytics | null
  loading: boolean
  onContactPatient: (appointmentId: string, method: 'sms' | 'whatsapp' | 'call') => void
  onRescheduleAppointment: (appointmentId: string) => void
  onRefreshPredictions: () => void
}

export default function NoShowPredictionDashboard({
  appointments,
  predictions,
  analytics,
  loading,
  onContactPatient,
  onRescheduleAppointment,
  onRefreshPredictions
}: NoShowPredictionDashboardProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<NoShowPrediction | null>(null)
  const [activeTab, setActiveTab] = useState('predictions')

  // Get predictions as array for easier manipulation
  const predictionsArray = Array.from(predictions.values())
  
  // Get high-risk appointments
  const highRiskAppointments = predictionsArray
    .filter(prediction => prediction.riskLevel === 'high' || prediction.riskLevel === 'critical')
    .sort((a, b) => b.riskScore - a.riskScore)

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <XCircle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <AlertCircle className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'default'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const getPatientName = (patientId: string) => {
    // Mock function - in real app, would fetch from patient service
    return `Paciente ${patientId.substring(0, 8)}`
  }

  const handleContactPatient = (appointmentId: string, method: 'phone' | 'sms' | 'whatsapp') => {
    onContactPatient(appointmentId, method === 'phone' ? 'call' : method)
  }

  const handleReschedule = (appointmentId: string) => {
    onRescheduleAppointment?.(appointmentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Analisando padrões de no-show...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Geral de No-Show</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? `${(analytics.overallNoShowRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em dados históricos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas de Alto Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {predictionsArray.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximas 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {predictionsArray.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Consultas monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {predictionsArray.length > 0 
                ? `${Math.round(predictionsArray.reduce((sum, p) => sum + p.confidence, 0) / predictionsArray.length)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Precisão das previsões
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Ações Recomendadas</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {predictionsArray.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma consulta agendada</h3>
                  <p className="text-muted-foreground">Não há consultas futuras para analisar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {predictionsArray.map((prediction) => {
                const appointment = appointments.find(apt => apt.id === prediction.appointmentId)
                if (!appointment) return null

                return (
                  <Card key={prediction.appointmentId} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getRiskColor(prediction.riskLevel)}`} />
                          <div>
                            <CardTitle className="text-lg">
                              {getPatientName(prediction.patientId)}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(appointment.date)} às {formatTime(appointment.time)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getRiskBadgeVariant(prediction.riskLevel)} className="flex items-center space-x-1">
                            {getRiskIcon(prediction.riskLevel)}
                            <span className="capitalize">{prediction.riskLevel}</span>
                          </Badge>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{prediction.riskScore}%</div>
                            <div className="text-xs text-muted-foreground">
                              {prediction.confidence}% confiança
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Risk Factors */}
                        <div>
                          <h4 className="font-medium mb-2">Fatores de Risco:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {prediction.factors.map((factor, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{factor.description}</span>
                                <Badge variant={factor.impact > 0 ? 'destructive' : 'default'}>
                                  {factor.impact > 0 ? '+' : ''}{factor.impact}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="font-medium mb-2">Recomendações:</h4>
                          <ul className="space-y-1">
                            {prediction.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm">
                                <Zap className="h-3 w-3 text-blue-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Buttons */}
                        {(prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') && (
                          <div className="flex space-x-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactPatient(appointment.id, 'phone')}
                              className="flex items-center space-x-1"
                            >
                              <Phone className="h-3 w-3" />
                              <span>Ligar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactPatient(appointment.id, 'whatsapp')}
                              className="flex items-center space-x-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>WhatsApp</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReschedule(appointment.id)}
                              className="flex items-center space-x-1"
                            >
                              <Calendar className="h-3 w-3" />
                              <span>Reagendar</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Tendências Mensais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.monthlyTrends.slice(-6).map((trend) => (
                      <div key={trend.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trend.month}</span>
                        <div className="flex items-center space-x-3">
                          <Progress value={trend.noShowRate * 100} className="w-24" />
                          <span className="text-sm w-12 text-right">
                            {(trend.noShowRate * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {trend.totalAppointments} consultas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slot Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Análise por Horário</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.timeSlotAnalysis.map((slot) => (
                      <div key={slot.timeSlot} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {slot.timeSlot.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-3">
                          <Progress value={slot.noShowRate * 100} className="w-24" />
                          <span className="text-sm w-12 text-right">
                            {(slot.noShowRate * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {slot.totalAppointments} consultas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Day of Week Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Análise por Dia da Semana</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.dayOfWeekAnalysis.map((day) => (
                      <div key={day.dayOfWeek} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.dayOfWeek}</span>
                        <div className="flex items-center space-x-3">
                          <Progress value={day.noShowRate * 100} className="w-24" />
                          <span className="text-sm w-12 text-right">
                            {(day.noShowRate * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {day.totalAppointments} consultas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Principais Fatores de Risco</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topRiskFactors.map((factor) => (
                      <div key={factor.factor} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {factor.factor.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-3">
                          <Progress value={factor.frequency} className="w-24" />
                          <span className="text-sm w-12 text-right">
                            {factor.frequency}%
                          </span>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            Impacto: {factor.averageImpact.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            {/* Critical Risk Appointments */}
            {predictionsArray.filter(p => p.riskLevel === 'critical').length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Ação Urgente Necessária:</strong> {predictionsArray.filter(p => p.riskLevel === 'critical').length} consulta(s) com risco crítico de no-show.
                  Recomenda-se contato imediato com os pacientes.
                </AlertDescription>
              </Alert>
            )}

            {/* High Risk Appointments */}
            {predictionsArray.filter(p => p.riskLevel === 'high').length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Atenção:</strong> {predictionsArray.filter(p => p.riskLevel === 'high').length} consulta(s) com alto risco de no-show.
                  Considere enviar lembretes adicionais.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Ações Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {predictionsArray.filter(p => p.riskLevel === 'critical').length}
                      </div>
                      <div className="text-sm text-red-800">Ligações Urgentes</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {predictionsArray.filter(p => p.riskLevel === 'high').length}
                      </div>
                      <div className="text-sm text-orange-800">WhatsApp/SMS</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {predictionsArray.filter(p => p.riskLevel === 'medium').length}
                      </div>
                      <div className="text-sm text-blue-800">Lembretes Padrão</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Próximas Ações:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Configurar lembretes automáticos por WhatsApp</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Implementar confirmação de presença 24h antes</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Oferecer reagendamento para horários preferenciais</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Monitorar padrões sazonais e ajustar estratégias</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}