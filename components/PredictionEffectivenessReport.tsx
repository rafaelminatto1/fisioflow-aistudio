'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Calendar, Users, AlertTriangle, CheckCircle, BarChart3, PieChart } from 'lucide-react'
import { NoShowPrediction } from '@/services/aiNoShowPredictionService'
import { Appointment } from '@/types'

interface PredictionEffectivenessReportProps {
  predictions: NoShowPrediction[]
  appointments: Appointment[]
  actualOutcomes: Record<string, 'attended' | 'no_show' | 'cancelled' | 'rescheduled'>
  dateRange: {
    start: Date
    end: Date
  }
}

interface EffectivenessMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  truePositives: number
  trueNegatives: number
  falsePositives: number
  falseNegatives: number
  totalPredictions: number
}

interface RiskLevelPerformance {
  level: string
  predicted: number
  actualNoShows: number
  accuracy: number
  falseAlarmRate: number
}

const PredictionEffectivenessReport: React.FC<PredictionEffectivenessReportProps> = ({
  predictions,
  appointments,
  actualOutcomes,
  dateRange
}) => {
  const [metrics, setMetrics] = useState<EffectivenessMetrics | null>(null)
  const [riskLevelPerformance, setRiskLevelPerformance] = useState<RiskLevelPerformance[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'trends'>('overview')

  useEffect(() => {
    calculateMetrics()
  }, [predictions, actualOutcomes])

  const calculateMetrics = () => {
    if (!predictions.length) return

    let truePositives = 0
    let trueNegatives = 0
    let falsePositives = 0
    let falseNegatives = 0

    const riskLevelStats: Record<string, { predicted: number; actualNoShows: number }> = {
      low: { predicted: 0, actualNoShows: 0 },
      medium: { predicted: 0, actualNoShows: 0 },
      high: { predicted: 0, actualNoShows: 0 },
      critical: { predicted: 0, actualNoShows: 0 }
    }

    predictions.forEach(prediction => {
      const outcome = actualOutcomes[prediction.appointmentId]
      if (!outcome) return

      const predictedNoShow = prediction.riskLevel === 'high' || prediction.riskLevel === 'critical'
      const actualNoShow = outcome === 'no_show'

      // Atualizar estatísticas por nível de risco
      riskLevelStats[prediction.riskLevel].predicted++
      if (actualNoShow) {
        riskLevelStats[prediction.riskLevel].actualNoShows++
      }

      // Calcular matriz de confusão
      if (predictedNoShow && actualNoShow) {
        truePositives++
      } else if (!predictedNoShow && !actualNoShow) {
        trueNegatives++
      } else if (predictedNoShow && !actualNoShow) {
        falsePositives++
      } else if (!predictedNoShow && actualNoShow) {
        falseNegatives++
      }
    })

    const totalPredictions = truePositives + trueNegatives + falsePositives + falseNegatives
    const accuracy = totalPredictions > 0 ? (truePositives + trueNegatives) / totalPredictions : 0
    const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0
    const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0
    const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0

    setMetrics({
      accuracy,
      precision,
      recall,
      f1Score,
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
      totalPredictions
    })

    // Calcular performance por nível de risco
    const riskPerformance = Object.entries(riskLevelStats).map(([level, stats]) => ({
      level,
      predicted: stats.predicted,
      actualNoShows: stats.actualNoShows,
      accuracy: stats.predicted > 0 ? stats.actualNoShows / stats.predicted : 0,
      falseAlarmRate: stats.predicted > 0 ? (stats.predicted - stats.actualNoShows) / stats.predicted : 0
    }))

    setRiskLevelPerformance(riskPerformance)
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

  const getPerformanceColor = (value: number) => {
    if (value >= 0.8) return 'text-green-600'
    if (value >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (value: number) => {
    if (value >= 0.8) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (value >= 0.6) return <Target className="w-4 h-4 text-yellow-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Carregando métricas de eficácia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório de Eficácia das Predições</h2>
          <p className="text-gray-600">
            Período: {dateRange.start.toLocaleDateString('pt-BR')} - {dateRange.end.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex space-x-2">
          {['overview', 'detailed', 'trends'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedView === view
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view === 'overview' ? 'Visão Geral' : view === 'detailed' ? 'Detalhado' : 'Tendências'}
            </button>
          ))}
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Acurácia Geral</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.accuracy)}`}>
                    {formatPercentage(metrics.accuracy)}
                  </p>
                </div>
                {getPerformanceIcon(metrics.accuracy)}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metrics.accuracy * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Precisão</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.precision)}`}>
                    {formatPercentage(metrics.precision)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.truePositives} de {metrics.truePositives + metrics.falsePositives} predições corretas
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recall</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.recall)}`}>
                    {formatPercentage(metrics.recall)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.truePositives} de {metrics.truePositives + metrics.falseNegatives} no-shows detectados
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">F1-Score</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.f1Score)}`}>
                    {formatPercentage(metrics.f1Score)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Média harmônica entre precisão e recall
              </p>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Matriz de Confusão</h3>
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <div></div>
              <div className="text-center font-medium text-gray-700">Predito: Não Falta</div>
              <div className="text-center font-medium text-gray-700">Predito: Falta</div>
              
              <div className="font-medium text-gray-700">Real: Não Falta</div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-800">{metrics.trueNegatives}</div>
                <div className="text-xs text-green-600">Verdadeiros Negativos</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-800">{metrics.falsePositives}</div>
                <div className="text-xs text-red-600">Falsos Positivos</div>
              </div>
              
              <div className="font-medium text-gray-700">Real: Falta</div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-800">{metrics.falseNegatives}</div>
                <div className="text-xs text-red-600">Falsos Negativos</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-800">{metrics.truePositives}</div>
                <div className="text-xs text-green-600">Verdadeiros Positivos</div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'detailed' && (
        <>
          {/* Performance by Risk Level */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Nível de Risco</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nível de Risco</th>
                    <th className="text-right py-2">Predições</th>
                    <th className="text-right py-2">No-Shows Reais</th>
                    <th className="text-right py-2">Taxa de Acerto</th>
                    <th className="text-right py-2">Taxa de Falso Alarme</th>
                  </tr>
                </thead>
                <tbody>
                  {riskLevelPerformance.map(perf => (
                    <tr key={perf.level} className="border-b">
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          perf.level === 'critical' ? 'bg-red-100 text-red-800' :
                          perf.level === 'high' ? 'bg-orange-100 text-orange-800' :
                          perf.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {perf.level === 'critical' ? 'Crítico' :
                           perf.level === 'high' ? 'Alto' :
                           perf.level === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </td>
                      <td className="text-right py-3">{perf.predicted}</td>
                      <td className="text-right py-3">{perf.actualNoShows}</td>
                      <td className={`text-right py-3 font-medium ${getPerformanceColor(perf.accuracy)}`}>
                        {formatPercentage(perf.accuracy)}
                      </td>
                      <td className={`text-right py-3 font-medium ${getPerformanceColor(1 - perf.falseAlarmRate)}`}>
                        {formatPercentage(perf.falseAlarmRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendações para Melhoria</h3>
            <div className="space-y-4">
              {metrics.precision < 0.7 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Muitos Falsos Positivos</h4>
                    <p className="text-sm text-yellow-700">
                      Considere aumentar os limites de risco ou ajustar os pesos dos fatores para reduzir alertas desnecessários.
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.recall < 0.7 && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Muitos No-Shows Não Detectados</h4>
                    <p className="text-sm text-red-700">
                      Considere diminuir os limites de risco ou aumentar a sensibilidade do algoritmo.
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.accuracy >= 0.8 && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Excelente Performance</h4>
                    <p className="text-sm text-green-700">
                      O sistema está funcionando muito bem. Continue monitorando para manter a qualidade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedView === 'trends' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências de Performance</h3>
          <div className="text-center py-12 text-gray-500">
            <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Gráfico de tendências será implementado aqui</p>
            <p className="text-sm mt-2">Mostrará a evolução da acurácia ao longo do tempo</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PredictionEffectivenessReport