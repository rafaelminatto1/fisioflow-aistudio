'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  MapPin, 
  Calendar,
  BarChart3,
  PieChart,
  Users,
  AlertTriangle
} from 'lucide-react'

import { painMapService, PainAnalytics, PainMapSession } from '@/services/painMapService'

interface PainAnalyticsDashboardProps {
  patientId?: string
  showAllPatients?: boolean
}

const BODY_PARTS_LABELS = {
  head: 'Cabeça',
  neck: 'Pescoço',
  shoulder_left: 'Ombro Esquerdo',
  shoulder_right: 'Ombro Direito',
  arm_left: 'Braço Esquerdo',
  arm_right: 'Braço Direito',
  chest: 'Peito',
  back_upper: 'Costas Superior',
  back_lower: 'Lombar',
  abdomen: 'Abdômen',
  hip_left: 'Quadril Esquerdo',
  hip_right: 'Quadril Direito',
  thigh_left: 'Coxa Esquerda',
  thigh_right: 'Coxa Direita',
  knee_left: 'Joelho Esquerdo',
  knee_right: 'Joelho Direito',
  calf_left: 'Panturrilha Esquerda',
  calf_right: 'Panturrilha Direita',
  foot_left: 'Pé Esquerdo',
  foot_right: 'Pé Direito'
}

const getTrendIcon = (trend: 'improving' | 'stable' | 'worsening') => {
  switch (trend) {
    case 'improving':
      return <TrendingDown className="w-4 h-4 text-green-500" />
    case 'worsening':
      return <TrendingUp className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-500" />
  }
}

const getTrendColor = (trend: 'improving' | 'stable' | 'worsening') => {
  switch (trend) {
    case 'improving':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'worsening':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getPainLevelColor = (level: number) => {
  if (level <= 3) return 'text-green-600 bg-green-50'
  if (level <= 6) return 'text-yellow-600 bg-yellow-50'
  if (level <= 8) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

export default function PainAnalyticsDashboard({ 
  patientId, 
  showAllPatients = false 
}: PainAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PainAnalytics | null>(null)
  const [recentSessions, setRecentSessions] = useState<PainMapSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [comparisonData, setComparisonData] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [patientId, selectedPeriod])

  const loadAnalytics = async () => {
    if (!patientId && !showAllPatients) return
    
    setIsLoading(true)
    try {
      if (patientId) {
        const [analyticsData, sessionsData] = await Promise.all([
          painMapService.getPainAnalytics(patientId),
          painMapService.getPainMapSessions(patientId)
        ])
        
        setAnalytics(analyticsData)
        setRecentSessions(sessionsData.slice(0, 5))
        
        // Load comparison data if we have multiple sessions
        if (sessionsData.length >= 2) {
          const comparison = await painMapService.comparePainMaps(
            sessionsData[1].id, // Older session
            sessionsData[0].id  // Newer session
          )
          setComparisonData(comparison)
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado de dor disponível
            </h3>
            <p className="text-gray-500">
              {patientId 
                ? 'Este paciente ainda não possui mapas de dor registrados.'
                : 'Selecione um paciente para visualizar os dados de dor.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Análise de Dor</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Nível Médio de Dor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                getPainLevelColor(analytics.averagePainLevel)
              }`}>
                {analytics.averagePainLevel.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.painTrend)}
              <Badge className={getTrendColor(analytics.painTrend)}>
                {analytics.painTrend === 'improving' ? 'Melhorando' :
                 analytics.painTrend === 'worsening' ? 'Piorando' : 'Estável'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Total de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.totalPainPoints}
            </div>
            <p className="text-sm text-gray-500">
              em {analytics.sessionsCount} sessões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Última Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {recentSessions.length > 0 
                ? new Date(recentSessions[0].sessionDate).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </div>
            <p className="text-sm text-gray-500">
              {recentSessions.length > 0 
                ? `${Math.floor((Date.now() - new Date(recentSessions[0].sessionDate).getTime()) / (1000 * 60 * 60 * 24))} dias atrás`
                : 'Nenhuma avaliação'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Affected Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Áreas Mais Afetadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.mostAffectedAreas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma área afetada registrada
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.mostAffectedAreas.map((area, index) => (
                  <div key={area.bodyPart} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">
                        {BODY_PARTS_LABELS[area.bodyPart as keyof typeof BODY_PARTS_LABELS] || area.bodyPart}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {area.frequency}x
                      </Badge>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getPainLevelColor(area.averageIntensity)
                      }`}>
                        {area.averageIntensity.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Sessões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma sessão registrada
              </p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(session.sessionDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.painPoints.length} pontos de dor
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getPainLevelColor(session.overallPainLevel)
                      }`}>
                        {session.overallPainLevel}/10
                      </span>
                      <Badge 
                        variant={session.functionalImpact === 'severe' ? 'destructive' : 
                                session.functionalImpact === 'high' ? 'default' : 'secondary'}
                      >
                        {session.functionalImpact === 'severe' ? 'Severo' :
                         session.functionalImpact === 'high' ? 'Alto' :
                         session.functionalImpact === 'moderate' ? 'Moderado' : 'Baixo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Analysis */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Análise Comparativa
              <Badge variant="outline" className="ml-2">
                Últimas 2 sessões
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  comparisonData.comparison.painLevelChange < 0 ? 'text-green-600' :
                  comparisonData.comparison.painLevelChange > 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparisonData.comparison.painLevelChange > 0 ? '+' : ''}
                  {comparisonData.comparison.painLevelChange.toFixed(1)}
                </div>
                <p className="text-sm text-gray-500">Mudança no nível de dor</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {comparisonData.comparison.improvedAreas.length}
                </div>
                <p className="text-sm text-gray-500">Áreas que melhoraram</p>
                {comparisonData.comparison.improvedAreas.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comparisonData.comparison.improvedAreas.map((area: any) => (
                      <Badge key={area.bodyPart} variant="outline" className="text-xs">
                        {BODY_PARTS_LABELS[area.bodyPart as keyof typeof BODY_PARTS_LABELS] || area.bodyPart}
                        (-{area.improvement})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {comparisonData.comparison.worsenedAreas.length}
                </div>
                <p className="text-sm text-gray-500">Áreas que pioraram</p>
                {comparisonData.comparison.worsenedAreas.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comparisonData.comparison.worsenedAreas.map((area: any) => (
                      <Badge key={area.bodyPart} variant="outline" className="text-xs">
                        {BODY_PARTS_LABELS[area.bodyPart as keyof typeof BODY_PARTS_LABELS] || area.bodyPart}
                        (+{area.worsening})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {(comparisonData.comparison.newPainAreas.length > 0 || comparisonData.comparison.resolvedPainAreas.length > 0) && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonData.comparison.newPainAreas.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Novas áreas de dor
                      </h4>
                      <div className="space-y-1">
                        {comparisonData.comparison.newPainAreas.map((area: string) => (
                          <Badge key={area} variant="destructive" className="mr-1">
                            {BODY_PARTS_LABELS[area as keyof typeof BODY_PARTS_LABELS] || area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {comparisonData.comparison.resolvedPainAreas.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">
                        Áreas resolvidas
                      </h4>
                      <div className="space-y-1">
                        {comparisonData.comparison.resolvedPainAreas.map((area: string) => (
                          <Badge key={area} variant="outline" className="mr-1 border-green-200 text-green-700">
                            {BODY_PARTS_LABELS[area as keyof typeof BODY_PARTS_LABELS] || area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}