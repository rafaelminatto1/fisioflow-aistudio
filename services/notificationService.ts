import { NoShowPrediction } from './aiNoShowPredictionService'
import { Appointment } from '@/types'

export interface NotificationConfig {
  enableCriticalAlerts: boolean
  enableHighRiskAlerts: boolean
  enableEmailNotifications: boolean
  enableSMSNotifications: boolean
  enableWhatsAppNotifications: boolean
  criticalRiskThreshold: number
  highRiskThreshold: number
  notificationTiming: {
    immediate: boolean
    dayBefore: boolean
    hoursBeforeAppointment: number[]
  }
}

export interface NotificationTemplate {
  id: string
  type: 'email' | 'sms' | 'whatsapp' | 'push'
  riskLevel: 'critical' | 'high' | 'medium'
  template: string
  subject?: string
}

export interface NotificationLog {
  id: string
  appointmentId: string
  patientId: string
  type: 'email' | 'sms' | 'whatsapp' | 'push'
  riskLevel: string
  sentAt: Date
  status: 'sent' | 'failed' | 'pending'
  response?: string
}

class NotificationService {
  private config: NotificationConfig = {
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
  }

  private templates: NotificationTemplate[] = [
    {
      id: 'critical-email',
      type: 'email',
      riskLevel: 'critical',
      subject: 'URGENTE: Confirmação de Consulta Necessária',
      template: `
Olá {patientName},

Identificamos um alto risco de falta na sua consulta agendada para {appointmentDate} às {appointmentTime}.

Por favor, confirme sua presença o mais breve possível:
- Telefone: {clinicPhone}
- WhatsApp: {clinicWhatsApp}
- Email: {clinicEmail}

Caso não possa comparecer, solicitamos reagendamento com antecedência.

Atenciosamente,
{clinicName}
      `
    },
    {
      id: 'critical-sms',
      type: 'sms',
      riskLevel: 'critical',
      template: 'URGENTE: Confirme sua consulta de {appointmentDate} às {appointmentTime}. Ligue {clinicPhone} ou responda este SMS. {clinicName}'
    },
    {
      id: 'high-email',
      type: 'email',
      riskLevel: 'high',
      subject: 'Confirmação de Consulta - {appointmentDate}',
      template: `
Olá {patientName},

Lembramos da sua consulta agendada para {appointmentDate} às {appointmentTime}.

Por favor, confirme sua presença:
- Telefone: {clinicPhone}
- WhatsApp: {clinicWhatsApp}

Caso precise reagendar, entre em contato conosco.

Atenciosamente,
{clinicName}
      `
    },
    {
      id: 'high-sms',
      type: 'sms',
      riskLevel: 'high',
      template: 'Lembrete: Consulta {appointmentDate} às {appointmentTime}. Confirme ligando {clinicPhone}. {clinicName}'
    }
  ]

  private notificationLogs: NotificationLog[] = []

  /**
   * Processa previsões e envia notificações automáticas
   */
  async processNotifications(
    predictions: NoShowPrediction[],
    appointments: Appointment[],
    patientData: Record<string, any>
  ): Promise<void> {
    for (const prediction of predictions) {
      const appointment = appointments.find(apt => apt.id === prediction.appointmentId)
      if (!appointment) continue

      const patient = patientData[appointment.patientId]
      if (!patient) continue

      // Verifica se deve enviar notificação
      if (this.shouldSendNotification(prediction, appointment)) {
        await this.sendNotificationForPrediction(prediction, appointment, patient)
      }
    }
  }

  /**
   * Determina se deve enviar notificação baseado na configuração e risco
   */
  private shouldSendNotification(prediction: NoShowPrediction, appointment: Appointment): boolean {
    const { riskScore, riskLevel } = prediction
    const appointmentDate = new Date(appointment.date)
    const now = new Date()
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Verifica se o nível de risco está habilitado
    if (riskLevel === 'critical' && !this.config.enableCriticalAlerts) return false
    if (riskLevel === 'high' && !this.config.enableHighRiskAlerts) return false
    if (riskScore < this.config.highRiskThreshold) return false

    // Verifica timing da notificação
    if (this.config.notificationTiming.immediate && hoursUntilAppointment > 48) return true
    if (this.config.notificationTiming.dayBefore && hoursUntilAppointment <= 24 && hoursUntilAppointment > 12) return true
    
    for (const hours of this.config.notificationTiming.hoursBeforeAppointment) {
      if (Math.abs(hoursUntilAppointment - hours) < 0.5) return true
    }

    return false
  }

  /**
   * Envia notificação para uma previsão específica
   */
  private async sendNotificationForPrediction(
    prediction: NoShowPrediction,
    appointment: Appointment,
    patient: any
  ): Promise<void> {
    const templates = this.templates.filter(t => t.riskLevel === prediction.riskLevel)
    
    for (const template of templates) {
      if (!this.isNotificationTypeEnabled(template.type)) continue
      
      try {
        await this.sendNotification(template, prediction, appointment, patient)
      } catch (error) {
        console.error(`Erro ao enviar notificação ${template.type}:`, error)
      }
    }
  }

  /**
   * Verifica se um tipo de notificação está habilitado
   */
  private isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case 'email': return this.config.enableEmailNotifications
      case 'sms': return this.config.enableSMSNotifications
      case 'whatsapp': return this.config.enableWhatsAppNotifications
      default: return false
    }
  }

  /**
   * Envia uma notificação específica
   */
  private async sendNotification(
    template: NotificationTemplate,
    prediction: NoShowPrediction,
    appointment: Appointment,
    patient: any
  ): Promise<void> {
    const message = this.formatTemplate(template.template, {
      patientName: patient.name || 'Paciente',
      appointmentDate: new Date(appointment.date).toLocaleDateString('pt-BR'),
      appointmentTime: appointment.time,
      clinicName: 'FisioFlow',
      clinicPhone: '(11) 99999-9999',
      clinicWhatsApp: '(11) 99999-9999',
      clinicEmail: 'contato@fisioflow.com'
    })

    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      type: template.type,
      riskLevel: prediction.riskLevel,
      sentAt: new Date(),
      status: 'pending'
    }

    try {
      // Simula envio da notificação
      await this.simulateNotificationSend(template.type, message, patient)
      log.status = 'sent'
      log.response = 'Notificação enviada com sucesso'
    } catch (error) {
      log.status = 'failed'
      log.response = error instanceof Error ? error.message : 'Erro desconhecido'
    }

    this.notificationLogs.push(log)
  }

  /**
   * Simula o envio de notificação (substituir por integração real)
   */
  private async simulateNotificationSend(type: string, message: string, patient: any): Promise<void> {
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`📧 Notificação ${type} enviada para ${patient.name}:`, message)
    
    // Aqui você integraria com serviços reais:
    // - Email: SendGrid, AWS SES, etc.
    // - SMS: Twilio, AWS SNS, etc.
    // - WhatsApp: WhatsApp Business API
  }

  /**
   * Formata template com variáveis
   */
  private formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value)
    }
    return formatted
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Obtém logs de notificação
   */
  getNotificationLogs(appointmentId?: string): NotificationLog[] {
    if (appointmentId) {
      return this.notificationLogs.filter(log => log.appointmentId === appointmentId)
    }
    return [...this.notificationLogs]
  }

  /**
   * Obtém estatísticas de notificações
   */
  getNotificationStats(): {
    total: number
    sent: number
    failed: number
    byType: Record<string, number>
    byRiskLevel: Record<string, number>
  } {
    const logs = this.notificationLogs
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      byType: {} as Record<string, number>,
      byRiskLevel: {} as Record<string, number>
    }

    logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1
      stats.byRiskLevel[log.riskLevel] = (stats.byRiskLevel[log.riskLevel] || 0) + 1
    })

    return stats
  }

  /**
   * Limpa logs antigos (mais de 30 dias)
   */
  cleanOldLogs(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    this.notificationLogs = this.notificationLogs.filter(
      log => log.sentAt > thirtyDaysAgo
    )
  }
}

export const notificationService = new NotificationService()
export default notificationService
    prediction: NoShowPrediction,
    appointment: Appointment,
    patient: any
  ): Promise<void> {
    const templates = this.templates.filter(t => t.riskLevel === prediction.riskLevel)
    
    for (const template of templates) {
      if (!this.isNotificationTypeEnabled(template.type)) continue
      
      try {
        await this.sendNotification(template, prediction, appointment, patient)
      } catch (error) {
        console.error(`Erro ao enviar notificação ${template.type}:`, error)
      }
    }
  }

  /**
   * Verifica se um tipo de notificação está habilitado
   */
  private isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case 'email': return this.config.enableEmailNotifications
      case 'sms': return this.config.enableSMSNotifications
      case 'whatsapp': return this.config.enableWhatsAppNotifications
      default: return false
    }
  }

  /**
   * Envia uma notificação específica
   */
  private async sendNotification(
    template: NotificationTemplate,
    prediction: NoShowPrediction,
    appointment: Appointment,
    patient: any
  ): Promise<void> {
    const message = this.formatTemplate(template.template, {
      patientName: patient.name || 'Paciente',
      appointmentDate: new Date(appointment.date).toLocaleDateString('pt-BR'),
      appointmentTime: appointment.time,
      clinicName: 'FisioFlow',
      clinicPhone: '(11) 99999-9999',
      clinicWhatsApp: '(11) 99999-9999',
      clinicEmail: 'contato@fisioflow.com'
    })

    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      type: template.type,
      riskLevel: prediction.riskLevel,
      sentAt: new Date(),
      status: 'pending'
    }

    try {
      // Simula envio da notificação
      await this.simulateNotificationSend(template.type, message, patient)
      log.status = 'sent'
      log.response = 'Notificação enviada com sucesso'
    } catch (error) {
      log.status = 'failed'
      log.response = error instanceof Error ? error.message : 'Erro desconhecido'
    }

    this.notificationLogs.push(log)
  }

  /**
   * Simula o envio de notificação (substituir por integração real)
   */
  private async simulateNotificationSend(type: string, message: string, patient: any): Promise<void> {
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log(`📧 Notificação ${type} enviada para ${patient.name}:`, message)
    
    // Aqui você integraria com serviços reais:
    // - Email: SendGrid, AWS SES, etc.
    // - SMS: Twilio, AWS SNS, etc.
    // - WhatsApp: WhatsApp Business API
  }

  /**
   * Formata template com variáveis
   */
  private formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value)
    }
    return formatted
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Obtém logs de notificação
   */
  getNotificationLogs(appointmentId?: string): NotificationLog[] {
    if (appointmentId) {
      return this.notificationLogs.filter(log => log.appointmentId === appointmentId)
    }
    return [...this.notificationLogs]
  }

  /**
   * Obtém estatísticas de notificações
   */
  getNotificationStats(): {
    total: number
    sent: number
    failed: number
    byType: Record<string, number>
    byRiskLevel: Record<string, number>
  } {
    const logs = this.notificationLogs
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      byType: {} as Record<string, number>,
      byRiskLevel: {} as Record<string, number>
    }

    logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1
      stats.byRiskLevel[log.riskLevel] = (stats.byRiskLevel[log.riskLevel] || 0) + 1
    })

    return stats
  }

  /**
   * Limpa logs antigos (mais de 30 dias)
   */
  cleanOldLogs(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    this.notificationLogs = this.notificationLogs.filter(
      log => log.sentAt > thirtyDaysAgo
    )
  }
}

export const notificationService = new NotificationService()
export default notificationService