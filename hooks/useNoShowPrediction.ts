'use client'

import { useState, useEffect, useCallback } from 'react'
import { Appointment } from '@/types'
import { 
  NoShowPrediction, 
  NoShowAnalytics,
  aiNoShowPredictionService 
} from '@/services/aiNoShowPredictionService'

interface UseNoShowPredictionOptions {
  autoPredict?: boolean
  refreshInterval?: number
}

interface UseNoShowPredictionReturn {
  predictions: Map<string, NoShowPrediction>
  analytics: NoShowAnalytics | null
  loading: boolean
  error: string | null
  predictForAppointment: (appointment: Appointment) => Promise<NoShowPrediction | null>
  predictForAppointments: (appointments: Appointment[]) => Promise<NoShowPrediction[]>
  updateAppointmentOutcome: (appointmentId: string, outcome: 'completed' | 'no_show' | 'cancelled') => Promise<void>
  refreshAnalytics: () => Promise<void>
  clearPredictions: () => void
  getPredictionByAppointmentId: (appointmentId: string) => NoShowPrediction | null
  getHighRiskAppointments: (threshold?: number) => NoShowPrediction[]
}

export const useNoShowPrediction = (
  options: UseNoShowPredictionOptions = {}
): UseNoShowPredictionReturn => {
  const { autoPredict = false, refreshInterval } = options

  const [predictions, setPredictions] = useState<Map<string, NoShowPrediction>>(new Map())
  const [analytics, setAnalytics] = useState<NoShowAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Predict no-show risk for a single appointment
  const predictForAppointment = useCallback(async (appointment: Appointment): Promise<NoShowPrediction | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const prediction = await aiNoShowPredictionService.predictNoShowRisk(appointment)
      
      setPredictions(prev => {
        const newPredictions = new Map(prev)
        newPredictions.set(appointment.id, prediction)
        return newPredictions
      })
      
      return prediction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao prever risco de no-show'
      setError(errorMessage)
      console.error('Error predicting no-show risk:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Predict no-show risk for multiple appointments
  const predictForAppointments = useCallback(async (appointments: Appointment[]): Promise<NoShowPrediction[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const batchPredictions = await aiNoShowPredictionService.batchPredictNoShowRisk(appointments)
      
      setPredictions(prev => {
        const newPredictions = new Map(prev)
        batchPredictions.forEach(prediction => {
          newPredictions.set(prediction.appointmentId, prediction)
        })
        return newPredictions
      })
      
      return batchPredictions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao prever riscos de no-show'
      setError(errorMessage)
      console.error('Error batch predicting no-show risks:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Update appointment outcome for learning
  const updateAppointmentOutcome = useCallback(async (
    appointmentId: string, 
    outcome: 'completed' | 'no_show' | 'cancelled'
  ): Promise<void> => {
    try {
      setError(null)
      await aiNoShowPredictionService.updateAppointmentOutcome(appointmentId, outcome)
      
      // Remove prediction from cache as it's no longer relevant
      setPredictions(prev => {
        const newPredictions = new Map(prev)
        newPredictions.delete(appointmentId)
        return newPredictions
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar resultado da consulta'
      setError(errorMessage)
      console.error('Error updating appointment outcome:', err)
    }
  }, [])

  // Refresh analytics data
  const refreshAnalytics = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const analyticsData = await aiNoShowPredictionService.getNoShowAnalytics()
      setAnalytics(analyticsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar analytics'
      setError(errorMessage)
      console.error('Error refreshing analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear all predictions
  const clearPredictions = useCallback((): void => {
    setPredictions(new Map())
  }, [])

  // Get prediction by appointment ID
  const getPredictionByAppointmentId = useCallback((appointmentId: string): NoShowPrediction | null => {
    return predictions.get(appointmentId) || null
  }, [predictions])

  // Get high-risk appointments
  const getHighRiskAppointments = useCallback((threshold: number = 60): NoShowPrediction[] => {
    return Array.from(predictions.values())
      .filter(prediction => prediction.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore)
  }, [predictions])

  // Load analytics on mount
  useEffect(() => {
    refreshAnalytics()
  }, [])

  // Auto-refresh analytics if interval is set
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshAnalytics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, refreshAnalytics])

  return {
    predictions,
    analytics,
    loading,
    error,
    predictForAppointment,
    predictForAppointments,
    updateAppointmentOutcome,
    refreshAnalytics,
    clearPredictions,
    getPredictionByAppointmentId,
    getHighRiskAppointments
  }
}

export default useNoShowPrediction