'use client'

import React from 'react'
import { AlertTriangle, Clock, TrendingUp, Info } from 'lucide-react'
import { NoShowPrediction } from '@/services/aiNoShowPredictionService'

interface NoShowRiskIndicatorProps {
  prediction: NoShowPrediction
  showDetails?: boolean
  compact?: boolean
}

const NoShowRiskIndicator: React.FC<NoShowRiskIndicatorProps> = ({
  prediction,
  showDetails = false,
  compact = false
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <TrendingUp className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      case 'low': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'Crítico'
      case 'high': return 'Alto'
      case 'medium': return 'Médio'
      case 'low': return 'Baixo'
      default: return 'Desconhecido'
    }
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
        getRiskColor(prediction.riskLevel)
      }`}>
        {getRiskIcon(prediction.riskLevel)}
        <span className="ml-1">{prediction.riskScore}%</span>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg border ${
      getRiskColor(prediction.riskLevel)
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getRiskIcon(prediction.riskLevel)}
          <span className="font-medium">
            Risco de Falta: {getRiskLabel(prediction.riskLevel)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold">{prediction.riskScore}%</span>
          <span className="text-xs opacity-75">
            Confiança: {prediction.confidence}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {/* Fatores de Risco */}
          <div>
            <h4 className="text-sm font-medium mb-2">Principais Fatores:</h4>
            <div className="space-y-1">
              {prediction.factors
                .filter(factor => Math.abs(factor.impact) >= 2)
                .slice(0, 3)
                .map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="opacity-75">{factor.description}</span>
                    <span className={`font-medium ${
                      factor.impact > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Recomendações */}
          {prediction.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recomendações:</h4>
              <ul className="space-y-1">
                {prediction.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="text-xs opacity-75 flex items-start">
                    <span className="w-1 h-1 bg-current rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NoShowRiskIndicator