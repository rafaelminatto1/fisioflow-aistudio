'use client'

import React from 'react'
import { X, AlertTriangle, TrendingUp, Clock, Info, Brain, Calendar, User, MessageSquare } from 'lucide-react'
import { NoShowPrediction } from '@/services/aiNoShowPredictionService'

interface NoShowPredictionModalProps {
  isOpen: boolean
  onClose: () => void
  prediction: NoShowPrediction | null
  patientName?: string
  appointmentDate?: string
  appointmentTime?: string
}

const NoShowPredictionModal: React.FC<NoShowPredictionModalProps> = ({
  isOpen,
  onClose,
  prediction,
  patientName,
  appointmentDate,
  appointmentTime
}) => {
  if (!isOpen || !prediction) return null

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
      case 'critical': return <AlertTriangle className="w-6 h-6" />
      case 'high': return <TrendingUp className="w-6 h-6" />
      case 'medium': return <Clock className="w-6 h-6" />
      case 'low': return <Info className="w-6 h-6" />
      default: return <Info className="w-6 h-6" />
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

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'historical_pattern': return <TrendingUp className="w-4 h-4" />
      case 'recent_no_show': return <AlertTriangle className="w-4 h-4" />
      case 'advance_booking': return <Calendar className="w-4 h-4" />
      case 'day_of_week': return <Calendar className="w-4 h-4" />
      case 'time_slot': return <Clock className="w-4 h-4" />
      case 'seasonal_pattern': return <TrendingUp className="w-4 h-4" />
      case 'appointment_type': return <User className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getFactorName = (factor: string) => {
    switch (factor) {
      case 'historical_pattern': return 'Padrão Histórico'
      case 'recent_no_show': return 'Falta Recente'
      case 'advance_booking': return 'Antecedência do Agendamento'
      case 'day_of_week': return 'Dia da Semana'
      case 'time_slot': return 'Horário'
      case 'seasonal_pattern': return 'Padrão Sazonal'
      case 'appointment_type': return 'Tipo de Consulta'
      default: return factor
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Análise de Risco de No-Show
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações da Consulta */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Informações da Consulta</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {patientName && (
                <div>
                  <span className="text-gray-500">Paciente:</span>
                  <p className="font-medium">{patientName}</p>
                </div>
              )}
              {appointmentDate && (
                <div>
                  <span className="text-gray-500">Data:</span>
                  <p className="font-medium">
                    {new Date(appointmentDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {appointmentTime && (
                <div>
                  <span className="text-gray-500">Horário:</span>
                  <p className="font-medium">{appointmentTime}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Análise realizada em:</span>
                <p className="font-medium">
                  {new Date(prediction.predictedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Resultado da Previsão */}
          <div className={`rounded-lg border p-4 ${
            getRiskColor(prediction.riskLevel)
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getRiskIcon(prediction.riskLevel)}
                <div>
                  <h3 className="font-semibold text-lg">
                    Risco: {getRiskLabel(prediction.riskLevel)}
                  </h3>
                  <p className="text-sm opacity-75">
                    Probabilidade de falta: {prediction.riskScore}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{prediction.riskScore}%</div>
                <div className="text-xs opacity-75">
                  Confiança: {prediction.confidence}%
                </div>
              </div>
            </div>
          </div>

          {/* Fatores de Risco */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Fatores Analisados</h3>
            <div className="space-y-3">
              {prediction.factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getFactorIcon(factor.factor)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">
                        {getFactorName(factor.factor)}
                      </h4>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        factor.impact > 0 
                          ? 'text-red-700 bg-red-100' 
                          : factor.impact < 0
                          ? 'text-green-700 bg-green-100'
                          : 'text-gray-700 bg-gray-100'
                      }`}>
                        {factor.impact > 0 ? '+' : ''}{factor.impact}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendações */}
          {prediction.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Recomendações
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {prediction.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start text-sm text-blue-800">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fechar
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Aplicar Recomendações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoShowPredictionModal