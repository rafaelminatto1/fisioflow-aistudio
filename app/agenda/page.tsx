// app/agenda/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Brain, AlertTriangle, TrendingDown, X, Settings, BarChart3 } from 'lucide-react';
import { Appointment } from '@/types';
import NoShowRiskIndicator from '@/components/NoShowRiskIndicator'
import AgendaRiskIndicator from '@/components/AgendaRiskIndicator'
import NoShowPredictionModal from '@/components/NoShowPredictionModal'
import NoShowPredictionDashboard from '@/components/NoShowPredictionDashboard';
import { useNoShowPrediction } from '@/hooks/useNoShowPrediction';
import { NoShowPrediction } from '@/services/aiNoShowPredictionService';
import AISettingsModal, { AISettings } from '@/components/AISettingsModal'
import PredictionEffectivenessReport from '@/components/PredictionEffectivenessReport'
import { notificationService } from '@/services/notificationService'

export default function AgendaPage() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false)
  const [showAISettings, setShowAISettings] = useState(false)
  const [showEffectivenessReport, setShowEffectivenessReport] = useState(false)
  const [aiSettings, setAISettings] = useState<AISettings | undefined>(undefined)
  const [actualOutcomes, setActualOutcomes] = useState<Record<string, 'attended' | 'no_show' | 'cancelled' | 'rescheduled'>>({})
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: 60,
      type: 'consultation',
      status: 'scheduled',
      notes: '',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      patientId: 'patient-2',
      therapistId: 'therapist-1',
      date: new Date().toISOString().split('T')[0],
      time: '10:30',
      duration: 45,
      type: 'evaluation',
      status: 'scheduled',
      notes: '',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      patientId: 'patient-3',
      therapistId: 'therapist-1',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      duration: 60,
      type: 'follow_up',
      status: 'scheduled',
      notes: '',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  const {
    predictions,
    analytics,
    loading,
    error,
    predictForAppointments,
    getPredictionByAppointmentId,
    getHighRiskAppointments
  } = useNoShowPrediction({ autoPredict: true })

  // Mock patient names for display
  const patientNames: Record<string, string> = {
    'patient-1': 'Maria Silva',
    'patient-2': 'João Santos',
    'patient-3': 'Ana Costa'
  }

  const getAppointmentTypeName = (type: string) => {
    const types: Record<string, string> = {
      consultation: 'Consulta',
      evaluation: 'Avaliação',
      follow_up: 'Retorno',
      treatment: 'Tratamento'
    }
    return types[type] || type
  }

  const getStatusName = (status: string) => {
    const statuses: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Faltou'
    }
    return statuses[status] || status
  }

  const handleContactPatient = (appointmentId: string, method: 'call' | 'sms' | 'whatsapp') => {
    console.log(`Contacting patient for appointment ${appointmentId} via ${method}`)
    // Implementar lógica de contato
  }

  const handleAISettingsUpdate = (newSettings: AISettings) => {
    setAISettings(newSettings)
    // Salvar configurações no localStorage ou backend
    localStorage.setItem('aiSettings', JSON.stringify(newSettings))
    console.log('AI settings updated:', newSettings)
  }

  const handleOutcomeUpdate = (appointmentId: string, outcome: 'attended' | 'no_show' | 'cancelled' | 'rescheduled') => {
    setActualOutcomes(prev => ({
      ...prev,
      [appointmentId]: outcome
    }))
    // Enviar feedback para o sistema de IA para melhorar as predições
    console.log(`Outcome updated for appointment ${appointmentId}: ${outcome}`)
  }

  // Carregar configurações de IA ao inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiSettings')
    if (savedSettings) {
      setAISettings(JSON.parse(savedSettings))
    }
  }, [])

  // Processar notificações automáticas para casos críticos
  useEffect(() => {
    if (predictions && Object.keys(predictions).length > 0) {
      const criticalPredictions = Object.entries(predictions)
        .filter(([_, prediction]) => prediction.riskLevel === 'critical')
        .map(([appointmentId, prediction]) => {
          const appointment = appointments.find(apt => apt.id === appointmentId)
          return { appointmentId, prediction, appointment }
        })
        .filter(item => item.appointment)

      criticalPredictions.forEach(({ appointmentId, prediction, appointment }) => {
        notificationService.processNotification({
          appointmentId,
          patientName: patientNames[appointment!.patientId] || 'Paciente',
          appointmentTime: appointment!.time,
          riskScore: prediction.riskScore,
          riskLevel: prediction.riskLevel,
          factors: prediction.factors
        })
      })
    }
  }, [predictions, appointments])

  // Load predictions on mount
  useEffect(() => {
    if (appointments.length > 0) {
      predictForAppointments(appointments)
    }
  }, [appointments, predictForAppointments])

  const handlePredictionClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
  }

  const highRiskAppointments = getHighRiskAppointments(60)
  const criticalRiskCount = getHighRiskAppointments(80).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos e consultas</p>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAnalyticsDashboard(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <Brain className="w-4 h-4" />
              Analytics IA
            </button>
            <button 
              onClick={() => setShowAISettings(true)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Configurações IA
            </button>
            <button 
              onClick={() => setShowEffectivenessReport(true)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4" />
              Relatório de Eficácia
            </button>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* High Risk Alerts */}
      {criticalRiskCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">
              Atenção: {criticalRiskCount} consulta{criticalRiskCount > 1 ? 's' : ''} com risco crítico de falta
            </h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Recomendamos contato imediato com os pacientes para confirmação.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Calendário</h2>
          </div>
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Visualização do calendário será implementada aqui</p>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Hoje</h2>
          </div>
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const prediction = getPredictionByAppointmentId(appointment.id)
              const patientName = patientNames[appointment.patientId] || 'Paciente'
              
              return (
                <div key={appointment.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{appointment.time}</span>
                    <div className="flex items-center space-x-2">
                      {prediction && (
                        <button
                          onClick={() => handlePredictionClick(appointment.id)}
                          className="hover:scale-105 transition-transform"
                        >
                          <AgendaRiskIndicator prediction={prediction} size="sm" />
                        </button>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusName(appointment.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{patientName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getAppointmentTypeName(appointment.type)} • {appointment.duration} min
                  </div>
                  {prediction && prediction.riskLevel !== 'low' && (
                    <div className="mt-2 text-xs">
                      <div className="text-gray-600 mb-1">Recomendações:</div>
                      <div className="text-gray-500">
                        {prediction.recommendations.slice(0, 1).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div className="text-center py-4 text-gray-500">
                <Brain className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Analisando riscos de no-show...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-blue-600">3</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-purple-600">8</p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">4</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedAppointmentId && (
        <NoShowPredictionModal
          appointmentId={selectedAppointmentId}
          prediction={getPredictionByAppointmentId(selectedAppointmentId)}
          onClose={() => setSelectedAppointmentId(null)}
          onApplyRecommendation={(recommendation) => {
            console.log('Aplicando recomendação:', recommendation)
            // Aqui você pode implementar a lógica para aplicar a recomendação
          }}
        />
      )}

      {showAnalyticsDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Analytics de No-Show</h2>
              <button
                onClick={() => setShowAnalyticsDashboard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <NoShowPredictionDashboard 
                appointments={appointments}
                predictions={predictions}
                analytics={analytics}
                loading={loading}
                onContactPatient={(appointmentId, method) => {
                  console.log('Contatar paciente:', appointmentId, method)
                  // Implementar lógica de contato
                }}
                onRescheduleAppointment={(appointmentId) => {
                  console.log('Reagendar consulta:', appointmentId)
                  // Implementar lógica de reagendamento
                }}
                onRefreshPredictions={() => {
                  if (appointments.length > 0) {
                    predictForAppointments(appointments)
                  }
                }}
              />            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettingsModal
          settings={aiSettings}
          onSave={handleAISettingsUpdate}
          onClose={() => setShowAISettings(false)}
        />
      )}

      {/* Effectiveness Report Modal */}
      {showEffectivenessReport && (
        <PredictionEffectivenessReport
          predictions={predictions}
          actualOutcomes={actualOutcomes}
          onClose={() => setShowEffectivenessReport(false)}
          onOutcomeUpdate={handleOutcomeUpdate}
        />
      )}
     </div>
   )
}