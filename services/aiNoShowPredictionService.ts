import { Appointment, AppointmentStatus } from '@/types'

export interface NoShowPrediction {
  appointmentId: string
  patientId: string
  riskScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    factor: string
    impact: number // -10 to +10
    description: string
  }[]
  recommendations: string[]
  confidence: number // 0-100
  predictedAt: string
}

export interface PatientNoShowHistory {
  patientId: string
  totalAppointments: number
  noShowCount: number
  noShowRate: number
  lastNoShow?: string
  averageAdvanceBooking: number // days
  preferredTimeSlots: string[]
  seasonalPatterns: {
    month: number
    noShowRate: number
  }[]
  dayOfWeekPatterns: {
    dayOfWeek: number // 0=Sunday, 6=Saturday
    noShowRate: number
  }[]
}

export interface NoShowAnalytics {
  overallNoShowRate: number
  monthlyTrends: {
    month: string
    noShowRate: number
    totalAppointments: number
  }[]
  timeSlotAnalysis: {
    timeSlot: string
    noShowRate: number
    totalAppointments: number
  }[]
  dayOfWeekAnalysis: {
    dayOfWeek: string
    noShowRate: number
    totalAppointments: number
  }[]
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  topRiskFactors: {
    factor: string
    frequency: number
    averageImpact: number
  }[]
}

// Mock historical data for training the AI model
const mockAppointmentHistory: (Appointment & { actualStatus: 'completed' | 'no_show' | 'cancelled' })[] = [
  // Patient with high no-show rate
  {
    id: '1',
    patientId: 'patient-1',
    therapistId: 'therapist-1',
    date: '2024-01-15',
    time: '09:00',
    duration: 60,
    type: 'consultation',
    status: AppointmentStatus.Scheduled,
    actualStatus: 'no_show',
    notes: '',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    patientId: 'patient-1',
    therapistId: 'therapist-1',
    date: '2024-01-08',
    time: '14:00',
    duration: 60,
    type: 'follow_up',
    status: AppointmentStatus.Scheduled,
    actualStatus: 'completed',
    notes: '',
    createdAt: '2024-01-05T15:00:00Z',
    updatedAt: '2024-01-08T14:00:00Z'
  },
  // Patient with good attendance
  {
    id: '3',
    patientId: 'patient-2',
    therapistId: 'therapist-1',
    date: '2024-01-12',
    time: '10:00',
    duration: 60,
    type: 'consultation',
    status: AppointmentStatus.Scheduled,
    actualStatus: 'completed',
    notes: '',
    createdAt: '2024-01-08T11:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z'
  }
]

class AINoShowPredictionService {
  private appointmentHistory: (Appointment & { actualStatus: 'completed' | 'no_show' | 'cancelled' })[] = mockAppointmentHistory
  private patientHistoryCache = new Map<string, PatientNoShowHistory>()

  // Predict no-show risk for a specific appointment
  async predictNoShowRisk(appointment: Appointment): Promise<NoShowPrediction> {
    const patientHistory = await this.getPatientNoShowHistory(appointment.patientId)
    const factors: NoShowPrediction['factors'] = []
    let riskScore = 0

    // Factor 1: Historical no-show rate
    const historyImpact = this.calculateHistoryImpact(patientHistory.noShowRate)
    factors.push({
      factor: 'historical_pattern',
      impact: historyImpact,
      description: `Taxa histórica de faltas: ${(patientHistory.noShowRate * 100).toFixed(1)}%`
    })
    riskScore += historyImpact

    // Factor 2: Recent no-show
    const recentNoShowImpact = this.calculateRecentNoShowImpact(patientHistory.lastNoShow)
    if (recentNoShowImpact !== 0) {
      factors.push({
        factor: 'recent_no_show',
        impact: recentNoShowImpact,
        description: patientHistory.lastNoShow 
          ? `Última falta: ${new Date(patientHistory.lastNoShow).toLocaleDateString('pt-BR')}`
          : 'Nenhuma falta recente'
      })
      riskScore += recentNoShowImpact
    }

    // Factor 3: Advance booking time
    const advanceBookingImpact = this.calculateAdvanceBookingImpact(
      appointment.date,
      appointment.createdAt || new Date().toISOString()
    )
    factors.push({
      factor: 'advance_booking',
      impact: advanceBookingImpact,
      description: `Agendamento com ${this.getDaysInAdvance(appointment.date, appointment.createdAt || new Date().toISOString())} dias de antecedência`
    })
    riskScore += advanceBookingImpact

    // Factor 4: Day of week pattern
    const dayOfWeek = new Date(appointment.date).getDay()
    const dayPattern = patientHistory.dayOfWeekPatterns.find(p => p.dayOfWeek === dayOfWeek)
    const dayOfWeekImpact = dayPattern ? this.calculateDayOfWeekImpact(dayPattern.noShowRate) : 0
    if (dayOfWeekImpact !== 0) {
      factors.push({
        factor: 'day_of_week',
        impact: dayOfWeekImpact,
        description: `${this.getDayName(dayOfWeek)}: ${(dayPattern!.noShowRate * 100).toFixed(1)}% de faltas`
      })
      riskScore += dayOfWeekImpact
    }

    // Factor 5: Time slot preference
    const timeSlotImpact = this.calculateTimeSlotImpact(appointment.time, patientHistory.preferredTimeSlots)
    factors.push({
      factor: 'time_slot',
      impact: timeSlotImpact,
      description: timeSlotImpact > 0 
        ? 'Horário fora da preferência do paciente'
        : 'Horário preferido do paciente'
    })
    riskScore += timeSlotImpact

    // Factor 6: Seasonal pattern
    const month = new Date(appointment.date).getMonth()
    const seasonalPattern = patientHistory.seasonalPatterns.find(p => p.month === month)
    const seasonalImpact = seasonalPattern ? this.calculateSeasonalImpact(seasonalPattern.noShowRate) : 0
    if (seasonalImpact !== 0) {
      factors.push({
        factor: 'seasonal_pattern',
        impact: seasonalImpact,
        description: `${this.getMonthName(month)}: ${(seasonalPattern!.noShowRate * 100).toFixed(1)}% de faltas`
      })
      riskScore += seasonalImpact
    }

    // Factor 7: Appointment type
    const appointmentTypeImpact = this.calculateAppointmentTypeImpact(appointment.type)
    factors.push({
      factor: 'appointment_type',
      impact: appointmentTypeImpact,
      description: `Tipo de consulta: ${this.getAppointmentTypeName(appointment.type)}`
    })
    riskScore += appointmentTypeImpact

    // Normalize risk score to 0-100
    riskScore = Math.max(0, Math.min(100, 50 + riskScore * 2))

    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore)

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, riskLevel)

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(patientHistory.totalAppointments, factors.length)

    return {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      riskScore,
      riskLevel,
      factors,
      recommendations,
      confidence,
      predictedAt: new Date().toISOString()
    }
  }

  // Get patient's no-show history
  async getPatientNoShowHistory(patientId: string): Promise<PatientNoShowHistory> {
    if (this.patientHistoryCache.has(patientId)) {
      return this.patientHistoryCache.get(patientId)!
    }

    const patientAppointments = this.appointmentHistory.filter(apt => apt.patientId === patientId)
    const totalAppointments = patientAppointments.length
    const noShowCount = patientAppointments.filter(apt => apt.actualStatus === 'no_show').length
    const noShowRate = totalAppointments > 0 ? noShowCount / totalAppointments : 0

    const lastNoShow = patientAppointments
      .filter(apt => apt.actualStatus === 'no_show')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date

    // Calculate average advance booking
    const advanceBookings = patientAppointments
      .filter(apt => apt.createdAt)
      .map(apt => this.getDaysInAdvance(apt.date, apt.createdAt!))
    const averageAdvanceBooking = advanceBookings.length > 0 
      ? advanceBookings.reduce((sum, days) => sum + days, 0) / advanceBookings.length
      : 7

    // Find preferred time slots
    const timeSlotCounts = new Map<string, number>()
    patientAppointments.forEach(apt => {
      const timeSlot = this.getTimeSlotCategory(apt.time)
      timeSlotCounts.set(timeSlot, (timeSlotCounts.get(timeSlot) || 0) + 1)
    })
    const preferredTimeSlots = Array.from(timeSlotCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot)

    // Calculate seasonal patterns
    const monthlyData = new Map<number, { total: number, noShows: number }>()
    patientAppointments.forEach(apt => {
      const month = new Date(apt.date).getMonth()
      const current = monthlyData.get(month) || { total: 0, noShows: 0 }
      current.total++
      if (apt.actualStatus === 'no_show') current.noShows++
      monthlyData.set(month, current)
    })

    const seasonalPatterns = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        noShowRate: data.total > 0 ? data.noShows / data.total : 0
      }))
      .filter(pattern => pattern.noShowRate > 0)

    // Calculate day of week patterns
    const dayOfWeekData = new Map<number, { total: number, noShows: number }>()
    patientAppointments.forEach(apt => {
      const dayOfWeek = new Date(apt.date).getDay()
      const current = dayOfWeekData.get(dayOfWeek) || { total: 0, noShows: 0 }
      current.total++
      if (apt.actualStatus === 'no_show') current.noShows++
      dayOfWeekData.set(dayOfWeek, current)
    })

    const dayOfWeekPatterns = Array.from(dayOfWeekData.entries())
      .map(([dayOfWeek, data]) => ({
        dayOfWeek,
        noShowRate: data.total > 0 ? data.noShows / data.total : 0
      }))
      .filter(pattern => pattern.noShowRate > 0)

    const history: PatientNoShowHistory = {
      patientId,
      totalAppointments,
      noShowCount,
      noShowRate,
      lastNoShow,
      averageAdvanceBooking,
      preferredTimeSlots,
      seasonalPatterns,
      dayOfWeekPatterns
    }

    this.patientHistoryCache.set(patientId, history)
    return history
  }

  // Get overall no-show analytics
  async getNoShowAnalytics(): Promise<NoShowAnalytics> {
    const totalAppointments = this.appointmentHistory.length
    const totalNoShows = this.appointmentHistory.filter(apt => apt.actualStatus === 'no_show').length
    const overallNoShowRate = totalAppointments > 0 ? totalNoShows / totalAppointments : 0

    // Monthly trends
    const monthlyData = new Map<string, { total: number, noShows: number }>()
    this.appointmentHistory.forEach(apt => {
      const monthKey = apt.date.substring(0, 7) // YYYY-MM
      const current = monthlyData.get(monthKey) || { total: 0, noShows: 0 }
      current.total++
      if (apt.actualStatus === 'no_show') current.noShows++
      monthlyData.set(monthKey, current)
    })

    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        noShowRate: data.total > 0 ? data.noShows / data.total : 0,
        totalAppointments: data.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Time slot analysis
    const timeSlotData = new Map<string, { total: number, noShows: number }>()
    this.appointmentHistory.forEach(apt => {
      const timeSlot = this.getTimeSlotCategory(apt.time)
      const current = timeSlotData.get(timeSlot) || { total: 0, noShows: 0 }
      current.total++
      if (apt.actualStatus === 'no_show') current.noShows++
      timeSlotData.set(timeSlot, current)
    })

    const timeSlotAnalysis = Array.from(timeSlotData.entries())
      .map(([timeSlot, data]) => ({
        timeSlot,
        noShowRate: data.total > 0 ? data.noShows / data.total : 0,
        totalAppointments: data.total
      }))

    // Day of week analysis
    const dayOfWeekData = new Map<number, { total: number, noShows: number }>()
    this.appointmentHistory.forEach(apt => {
      const dayOfWeek = new Date(apt.date).getDay()
      const current = dayOfWeekData.get(dayOfWeek) || { total: 0, noShows: 0 }
      current.total++
      if (apt.actualStatus === 'no_show') current.noShows++
      dayOfWeekData.set(dayOfWeek, current)
    })

    const dayOfWeekAnalysis = Array.from(dayOfWeekData.entries())
      .map(([dayOfWeek, data]) => ({
        dayOfWeek: this.getDayName(dayOfWeek),
        noShowRate: data.total > 0 ? data.noShows / data.total : 0,
        totalAppointments: data.total
      }))

    // Risk distribution (mock data for now)
    const riskDistribution = {
      low: 60,
      medium: 25,
      high: 12,
      critical: 3
    }

    // Top risk factors (mock data)
    const topRiskFactors = [
      { factor: 'historical_pattern', frequency: 85, averageImpact: 7.2 },
      { factor: 'advance_booking', frequency: 78, averageImpact: 5.8 },
      { factor: 'day_of_week', frequency: 65, averageImpact: 4.3 },
      { factor: 'time_slot', frequency: 52, averageImpact: 3.9 },
      { factor: 'seasonal_pattern', frequency: 41, averageImpact: 3.1 }
    ]

    return {
      overallNoShowRate,
      monthlyTrends,
      timeSlotAnalysis,
      dayOfWeekAnalysis,
      riskDistribution,
      topRiskFactors
    }
  }

  // Batch predict for multiple appointments
  async batchPredictNoShowRisk(appointments: Appointment[]): Promise<NoShowPrediction[]> {
    const predictions = await Promise.all(
      appointments.map(appointment => this.predictNoShowRisk(appointment))
    )
    return predictions.sort((a, b) => b.riskScore - a.riskScore)
  }

  // Helper methods
  private calculateHistoryImpact(noShowRate: number): number {
    if (noShowRate === 0) return -5
    if (noShowRate < 0.1) return -2
    if (noShowRate < 0.2) return 0
    if (noShowRate < 0.3) return 3
    if (noShowRate < 0.5) return 6
    return 10
  }

  private calculateRecentNoShowImpact(lastNoShow?: string): number {
    if (!lastNoShow) return -2
    const daysSinceLastNoShow = Math.floor(
      (Date.now() - new Date(lastNoShow).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastNoShow < 7) return 8
    if (daysSinceLastNoShow < 30) return 5
    if (daysSinceLastNoShow < 90) return 2
    return 0
  }

  private calculateAdvanceBookingImpact(appointmentDate: string, createdAt: string): number {
    const daysInAdvance = this.getDaysInAdvance(appointmentDate, createdAt)
    if (daysInAdvance < 1) return 8 // Same day booking
    if (daysInAdvance < 3) return 4 // Short notice
    if (daysInAdvance > 30) return 3 // Too far in advance
    return -1 // Optimal booking window
  }

  private calculateDayOfWeekImpact(dayNoShowRate: number): number {
    if (dayNoShowRate > 0.3) return 4
    if (dayNoShowRate > 0.2) return 2
    if (dayNoShowRate < 0.1) return -2
    return 0
  }

  private calculateTimeSlotImpact(appointmentTime: string, preferredSlots: string[]): number {
    const timeSlot = this.getTimeSlotCategory(appointmentTime)
    return preferredSlots.includes(timeSlot) ? -2 : 3
  }

  private calculateSeasonalImpact(monthNoShowRate: number): number {
    if (monthNoShowRate > 0.3) return 3
    if (monthNoShowRate > 0.2) return 1
    if (monthNoShowRate < 0.1) return -1
    return 0
  }

  private calculateAppointmentTypeImpact(type: string): number {
    switch (type) {
      case 'consultation': return 2 // First appointments have higher no-show
      case 'follow_up': return -1 // Follow-ups are more reliable
      case 'evaluation': return 1
      default: return 0
    }
  }

  private getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }

  private generateRecommendations(factors: NoShowPrediction['factors'], riskLevel: string): string[] {
    const recommendations: string[] = []

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Enviar lembrete por WhatsApp 24h antes')
      recommendations.push('Ligar para confirmar presença')
      recommendations.push('Considerar reagendamento para horário preferido')
    }

    if (riskLevel === 'medium' || riskLevel === 'high') {
      recommendations.push('Enviar lembrete por SMS')
      recommendations.push('Confirmar por telefone se necessário')
    }

    const historyFactor = factors.find(f => f.factor === 'historical_pattern')
    if (historyFactor && historyFactor.impact > 5) {
      recommendations.push('Paciente com histórico de faltas - atenção especial')
    }

    const advanceFactor = factors.find(f => f.factor === 'advance_booking')
    if (advanceFactor && advanceFactor.impact > 5) {
      recommendations.push('Agendamento de última hora - confirmar interesse')
    }

    const timeFactor = factors.find(f => f.factor === 'time_slot')
    if (timeFactor && timeFactor.impact > 2) {
      recommendations.push('Oferecer horário alternativo se possível')
    }

    if (recommendations.length === 0) {
      recommendations.push('Enviar lembrete padrão')
    }

    return recommendations
  }

  private calculateConfidence(totalAppointments: number, factorsCount: number): number {
    let confidence = 50
    
    // More historical data = higher confidence
    if (totalAppointments >= 10) confidence += 20
    else if (totalAppointments >= 5) confidence += 10
    else if (totalAppointments >= 2) confidence += 5
    
    // More factors analyzed = higher confidence
    confidence += Math.min(factorsCount * 3, 15)
    
    return Math.min(confidence, 95)
  }

  private getDaysInAdvance(appointmentDate: string, createdAt: string): number {
    const appointmentTime = new Date(appointmentDate).getTime()
    const createdTime = new Date(createdAt).getTime()
    return Math.floor((appointmentTime - createdTime) / (1000 * 60 * 60 * 24))
  }

  private getTimeSlotCategory(time: string): string {
    const hour = parseInt(time.split(':')[0])
    if (hour < 9) return 'early_morning'
    if (hour < 12) return 'morning'
    if (hour < 14) return 'lunch_time'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[dayOfWeek]
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month]
  }

  private getAppointmentTypeName(type: string): string {
    const types: Record<string, string> = {
      consultation: 'Consulta',
      follow_up: 'Retorno',
      evaluation: 'Avaliação',
      treatment: 'Tratamento'
    }
    return types[type] || type
  }

  // Update appointment outcome (for learning)
  async updateAppointmentOutcome(
    appointmentId: string, 
    actualStatus: 'completed' | 'no_show' | 'cancelled'
  ): Promise<void> {
    const appointmentIndex = this.appointmentHistory.findIndex(apt => apt.id === appointmentId)
    if (appointmentIndex !== -1) {
      this.appointmentHistory[appointmentIndex].actualStatus = actualStatus
      // Clear patient cache to recalculate history
      const patientId = this.appointmentHistory[appointmentIndex].patientId
      this.patientHistoryCache.delete(patientId)
    }
  }
}

export const aiNoShowPredictionService = new AINoShowPredictionService()
export default aiNoShowPredictionService