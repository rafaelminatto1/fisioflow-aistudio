'use client'

import React, { useState, useEffect } from 'react'
import { X, Settings, Brain, Bell, Sliders, Save, RotateCcw } from 'lucide-react'
import { NotificationConfig } from '@/services/notificationService'

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: AISettings) => void
  currentSettings?: AISettings
}

export interface AISettings {
  // Configurações do algoritmo de IA
  algorithm: {
    sensitivityLevel: number // 1-10
    riskThresholds: {
      low: number
      medium: number
      high: number
      critical: number
    }
    factorWeights: {
      patientHistory: number
      recentNoShows: number
      appointmentAdvance: number
      dayOfWeek: number
      timeOfDay: number
      seasonality: number
      appointmentType: number
    }
    enableWeatherFactor: boolean
    enableSeasonalityFactor: boolean
    enablePatientBehaviorLearning: boolean
  }
  
  // Configurações de notificações
  notifications: NotificationConfig
  
  // Configurações de interface
  ui: {
    showRiskScores: boolean
    showConfidenceLevel: boolean
    showRecommendations: boolean
    compactView: boolean
    enableRealTimeUpdates: boolean
  }
  
  // Configurações de relatórios
  reports: {
    enableAutomaticReports: boolean
    reportFrequency: 'daily' | 'weekly' | 'monthly'
    includePatientNames: boolean
    includeDetailedAnalysis: boolean
  }
}

const defaultSettings: AISettings = {
  algorithm: {
    sensitivityLevel: 7,
    riskThresholds: {
      low: 30,
      medium: 50,
      high: 70,
      critical: 85
    },
    factorWeights: {
      patientHistory: 0.25,
      recentNoShows: 0.20,
      appointmentAdvance: 0.15,
      dayOfWeek: 0.10,
      timeOfDay: 0.10,
      seasonality: 0.10,
      appointmentType: 0.10
    },
    enableWeatherFactor: false,
    enableSeasonalityFactor: true,
    enablePatientBehaviorLearning: true
  },
  notifications: {
    enableCriticalAlerts: true,
    enableHighRiskAlerts: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableWhatsAppNotifications: false,
    criticalRiskThreshold: 80,
    highRiskThreshold: 60,
    notificationTiming: {
      immediate: true,
      dayBefore: true,
      hoursBeforeAppointment: [24, 4, 1]
    }
  },
  ui: {
    showRiskScores: true,
    showConfidenceLevel: true,
    showRecommendations: true,
    compactView: false,
    enableRealTimeUpdates: true
  },
  reports: {
    enableAutomaticReports: false,
    reportFrequency: 'weekly',
    includePatientNames: false,
    includeDetailedAnalysis: true
  }
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<AISettings>(currentSettings || defaultSettings)
  const [activeTab, setActiveTab] = useState<'algorithm' | 'notifications' | 'ui' | 'reports'>('algorithm')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings)
    }
  }, [currentSettings])

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(currentSettings || defaultSettings))
  }, [settings, currentSettings])

  const handleSave = () => {
    onSave(settings)
    setHasChanges(false)
  }

  const handleReset = () => {
    setSettings(defaultSettings)
  }

  const updateAlgorithmSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      algorithm: {
        ...prev.algorithm,
        [key]: value
      }
    }))
  }

  const updateRiskThreshold = (level: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      algorithm: {
        ...prev.algorithm,
        riskThresholds: {
          ...prev.algorithm.riskThresholds,
          [level]: value
        }
      }
    }))
  }

  const updateFactorWeight = (factor: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      algorithm: {
        ...prev.algorithm,
        factorWeights: {
          ...prev.algorithm.factorWeights,
          [factor]: value
        }
      }
    }))
  }

  const updateNotificationSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const updateUISetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        [key]: value
      }
    }))
  }

  const updateReportSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      reports: {
        ...prev.reports,
        [key]: value
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurações da IA</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <nav className="p-4 space-y-2">
              {[
                { id: 'algorithm', label: 'Algoritmo', icon: Brain },
                { id: 'notifications', label: 'Notificações', icon: Bell },
                { id: 'ui', label: 'Interface', icon: Settings },
                { id: 'reports', label: 'Relatórios', icon: Sliders }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'algorithm' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configurações do Algoritmo</h3>
                
                {/* Sensitivity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Sensibilidade: {settings.algorithm.sensitivityLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.algorithm.sensitivityLevel}
                    onChange={(e) => updateAlgorithmSetting('sensitivityLevel', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservador</span>
                    <span>Agressivo</span>
                  </div>
                </div>

                {/* Risk Thresholds */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Limites de Risco (%)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(settings.algorithm.riskThresholds).map(([level, value]) => (
                      <div key={level}>
                        <label className="block text-sm text-gray-700 mb-1 capitalize">
                          {level === 'low' ? 'Baixo' : level === 'medium' ? 'Médio' : level === 'high' ? 'Alto' : 'Crítico'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => updateRiskThreshold(level, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factor Weights */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Pesos dos Fatores</h4>
                  <div className="space-y-3">
                    {Object.entries(settings.algorithm.factorWeights).map(([factor, weight]) => (
                      <div key={factor}>
                        <label className="block text-sm text-gray-700 mb-1">
                          {factor === 'patientHistory' ? 'Histórico do Paciente' :
                           factor === 'recentNoShows' ? 'Faltas Recentes' :
                           factor === 'appointmentAdvance' ? 'Antecedência do Agendamento' :
                           factor === 'dayOfWeek' ? 'Dia da Semana' :
                           factor === 'timeOfDay' ? 'Horário do Dia' :
                           factor === 'seasonality' ? 'Sazonalidade' :
                           'Tipo de Consulta'}: {(weight * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.05"
                          value={weight}
                          onChange={(e) => updateFactorWeight(factor, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Opções Avançadas</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.algorithm.enableWeatherFactor}
                        onChange={(e) => updateAlgorithmSetting('enableWeatherFactor', e.target.checked)}
                        className="mr-2"
                      />
                      Considerar fator climático
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.algorithm.enableSeasonalityFactor}
                        onChange={(e) => updateAlgorithmSetting('enableSeasonalityFactor', e.target.checked)}
                        className="mr-2"
                      />
                      Considerar sazonalidade
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.algorithm.enablePatientBehaviorLearning}
                        onChange={(e) => updateAlgorithmSetting('enablePatientBehaviorLearning', e.target.checked)}
                        className="mr-2"
                      />
                      Aprendizado de comportamento do paciente
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configurações de Notificações</h3>
                
                {/* Alert Types */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tipos de Alerta</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableCriticalAlerts}
                        onChange={(e) => updateNotificationSetting('enableCriticalAlerts', e.target.checked)}
                        className="mr-2"
                      />
                      Alertas críticos
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableHighRiskAlerts}
                        onChange={(e) => updateNotificationSetting('enableHighRiskAlerts', e.target.checked)}
                        className="mr-2"
                      />
                      Alertas de alto risco
                    </label>
                  </div>
                </div>

                {/* Notification Methods */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Métodos de Notificação</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableEmailNotifications}
                        onChange={(e) => updateNotificationSetting('enableEmailNotifications', e.target.checked)}
                        className="mr-2"
                      />
                      Email
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableSMSNotifications}
                        onChange={(e) => updateNotificationSetting('enableSMSNotifications', e.target.checked)}
                        className="mr-2"
                      />
                      SMS
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enableWhatsAppNotifications}
                        onChange={(e) => updateNotificationSetting('enableWhatsAppNotifications', e.target.checked)}
                        className="mr-2"
                      />
                      WhatsApp
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ui' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configurações de Interface</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ui.showRiskScores}
                      onChange={(e) => updateUISetting('showRiskScores', e.target.checked)}
                      className="mr-2"
                    />
                    Mostrar pontuações de risco
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ui.showConfidenceLevel}
                      onChange={(e) => updateUISetting('showConfidenceLevel', e.target.checked)}
                      className="mr-2"
                    />
                    Mostrar nível de confiança
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ui.showRecommendations}
                      onChange={(e) => updateUISetting('showRecommendations', e.target.checked)}
                      className="mr-2"
                    />
                    Mostrar recomendações
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ui.compactView}
                      onChange={(e) => updateUISetting('compactView', e.target.checked)}
                      className="mr-2"
                    />
                    Visualização compacta
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.ui.enableRealTimeUpdates}
                      onChange={(e) => updateUISetting('enableRealTimeUpdates', e.target.checked)}
                      className="mr-2"
                    />
                    Atualizações em tempo real
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configurações de Relatórios</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.reports.enableAutomaticReports}
                      onChange={(e) => updateReportSetting('enableAutomaticReports', e.target.checked)}
                      className="mr-2"
                    />
                    Relatórios automáticos
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência dos relatórios
                    </label>
                    <select
                      value={settings.reports.reportFrequency}
                      onChange={(e) => updateReportSetting('reportFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.reports.includePatientNames}
                      onChange={(e) => updateReportSetting('includePatientNames', e.target.checked)}
                      className="mr-2"
                    />
                    Incluir nomes dos pacientes
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.reports.includeDetailedAnalysis}
                      onChange={(e) => updateReportSetting('includeDetailedAnalysis', e.target.checked)}
                      className="mr-2"
                    />
                    Incluir análise detalhada
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                hasChanges
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISettingsModal