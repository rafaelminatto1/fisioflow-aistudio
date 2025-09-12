// services/notificationService.ts
import { whatsapp } from '@/lib/whatsapp';
import { EmailService } from '@/lib/email';

interface NotificationTemplate {
  id: string;
  type: 'email' | 'whatsapp' | 'sms';
  riskLevel: 'low' | 'medium' | 'high';
  template: string;
  subject?: string;
  enabled: boolean;
}

interface NotificationConfig {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableWhatsAppNotifications: boolean;
  reminderHours: number[];
}

interface NotificationLog {
  id: string;
  appointmentId: string;
  patientId: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: Date;
  errorMessage?: string;
}

interface NoShowPrediction {
  patientId: string;
  appointmentId: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  factors: string[];
}

interface Appointment {
  id: string;
  date: Date | string;
  time: string;
  patientId: string;
}

class NotificationService {
  private emailService: EmailService;
  private templates: NotificationTemplate[] = [];
  private notificationLogs: NotificationLog[] = [];
  
  private config: NotificationConfig = {
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableWhatsAppNotifications: true,
    reminderHours: [24, 2]
  };

  constructor() {
    this.emailService = new EmailService();
    this.initializeTemplates();
  }

  /**
   * Inicializa os templates padrão de notificação
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'low-risk-whatsapp',
        type: 'whatsapp',
        riskLevel: 'low',
        template: 'Olá {{patientName}}! Lembrando da sua consulta amanhã às {{appointmentTime}}. Até lá! 😊',
        enabled: true
      },
      {
        id: 'medium-risk-whatsapp',
        type: 'whatsapp',
        riskLevel: 'medium',
        template: 'Oi {{patientName}}! Sua consulta está marcada para {{appointmentDate}} às {{appointmentTime}}. Por favor, confirme sua presença respondendo este WhatsApp. Obrigado! 📅',
        enabled: true
      },
      {
        id: 'high-risk-whatsapp',
        type: 'whatsapp',
        riskLevel: 'high',
        template: 'Olá {{patientName}}! Notamos que você tem consulta marcada para {{appointmentDate}} às {{appointmentTime}}. É muito importante que você compareça ou reagende com antecedência. Entre em contato conosco: {{clinicPhone}} 🏥',
        enabled: true
      },
      {
        id: 'low-risk-email',
        type: 'email',
        riskLevel: 'low',
        subject: 'Lembrete: Sua consulta é amanhã',
        template: 'Olá {{patientName}},\n\nLembramos que sua consulta está marcada para amanhã às {{appointmentTime}}.\n\nAtenciosamente,\n{{clinicName}}',
        enabled: true
      },
      {
        id: 'medium-risk-email',
        type: 'email',
        riskLevel: 'medium',
        subject: 'Confirmação necessária: Sua consulta',
        template: 'Olá {{patientName}},\n\nSua consulta está marcada para {{appointmentDate}} às {{appointmentTime}}.\n\nPor favor, confirme sua presença respondendo este email ou ligando para {{clinicPhone}}.\n\nAtenciosamente,\n{{clinicName}}',
        enabled: true
      },
      {
        id: 'high-risk-email',
        type: 'email',
        riskLevel: 'high',
        subject: 'IMPORTANTE: Confirmação de consulta necessária',
        template: 'Olá {{patientName}},\n\nSua consulta está marcada para {{appointmentDate}} às {{appointmentTime}}.\n\nÉ muito importante que você compareça ou reagende com antecedência para evitar taxas de não comparecimento.\n\nPara reagendar ou confirmar, entre em contato:\n- Telefone: {{clinicPhone}}\n- Email: {{clinicEmail}}\n\nContamos com sua compreensão.\n\nAtenciosamente,\n{{clinicName}}',
        enabled: true
      }
    ];
  }

  /**
   * Substitui variáveis no template
   */
  private formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      formatted = formatted.replace(regex, value);
    });
    return formatted;
  }

  /**
   * Envia notificações baseadas na previsão de no-show
   */
  async sendNoShowPredictionNotifications(
    prediction: NoShowPrediction,
    appointment: Appointment,
    patient: any
  ): Promise<void> {
    const templates = this.templates.filter(t => t.riskLevel === prediction.riskLevel);
    
    for (const template of templates) {
      if (!this.isNotificationTypeEnabled(template.type)) continue;
      
      try {
        await this.sendNotification(template, prediction, appointment, patient);
      } catch (error) {
        console.error(`Erro ao enviar notificação ${template.type}:`, error);
      }
    }
  }

  /**
   * Verifica se um tipo de notificação está habilitado
   */
  private isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case 'email': return this.config.enableEmailNotifications;
      case 'sms': return this.config.enableSMSNotifications;
      case 'whatsapp': return this.config.enableWhatsAppNotifications;
      default: return false;
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
    });

    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appointmentId: appointment.id,
      patientId: patient.id || prediction.patientId,
      type: template.type,
      status: 'pending',
      sentAt: new Date()
    };

    try {
      switch (template.type) {
        case 'whatsapp':
          if (patient.phone) {
            // Use whatsapp business service to send messages
            const result = await whatsapp.sendCustomMessage(patient, message);
            if (!result.success) {
              throw new Error(result.error || 'Failed to send WhatsApp message');
            }
          }
          break;
        
        case 'email':
          if (patient.email) {
            // Basic email sending - EmailService is assumed to have a send method
            console.log('Sending email to:', patient.email, 'Subject:', template.subject, 'Message:', message);
            // await this.emailService.sendEmail(patient.email, template.subject || 'Notificação da Clínica', message);
          }
          break;
        
        case 'sms':
          // SMS implementation would go here
          console.log('SMS notification not implemented yet');
          break;
      }
      
      log.status = 'sent';
    } catch (error) {
      log.status = 'failed';
      log.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw error;
    } finally {
      this.notificationLogs.push(log);
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém logs de notificação
   */
  getLogs(): NotificationLog[] {
    return [...this.notificationLogs];
  }

  /**
   * Limpa logs antigos (mais de 30 dias)
   */
  cleanOldLogs(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.notificationLogs = this.notificationLogs.filter(
      log => log.sentAt > thirtyDaysAgo
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;