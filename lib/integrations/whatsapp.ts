// lib/integrations/whatsapp.ts
import { structuredLogger } from '../monitoring/logger';
import { trackExternalAPICall } from '../middleware/performance';
import { BusinessMetrics } from '../monitoring/metrics';
import type { Appointment, Patient } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template' | 'media';
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export class WhatsAppIntegration {
  private apiKey: string;
  private phoneNumberId: string;
  private baseUrl: string;
  private version: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_BUSINESS_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.baseUrl = 'https://graph.facebook.com';
    this.version = 'v17.0';

    if (!this.apiKey || !this.phoneNumberId) {
      structuredLogger.warn('WhatsApp credentials not configured', {
        hasApiKey: !!this.apiKey,
        hasPhoneId: !!this.phoneNumberId,
      });
    }
  }

  private async makeRequest(
    endpoint: string,
    data: any
  ): Promise<WhatsAppResponse> {
    if (!this.apiKey || !this.phoneNumberId) {
      return { success: false, error: 'WhatsApp credentials not configured' };
    }

    return trackExternalAPICall('whatsapp', endpoint, async () => {
      try {
        const response = await fetch(
          `${this.baseUrl}/${this.version}/${this.phoneNumberId}/${endpoint}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          structuredLogger.error('WhatsApp API error', {
            endpoint,
            statusCode: response.status,
            error: result,
          });

          return {
            success: false,
            error: result.error?.message || 'Unknown WhatsApp API error',
            statusCode: response.status,
          };
        }

        structuredLogger.info('WhatsApp message sent successfully', {
          endpoint,
          messageId: result.messages?.[0]?.id,
          to: data.to,
        });

        BusinessMetrics.recordAPICall('whatsapp', 'POST', response.status);

        return {
          success: true,
          messageId: result.messages?.[0]?.id,
          statusCode: response.status,
        };
      } catch (error: any) {
        structuredLogger.error('WhatsApp request failed', {
          endpoint,
          error: error.message,
          stack: error.stack,
        });

        return {
          success: false,
          error: error.message,
        };
      }
    });
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(message.to),
      type: message.type || 'text',
      text: message.type === 'text' ? { body: message.message } : undefined,
      template:
        message.type === 'template'
          ? {
              name: message.templateName,
              language: { code: 'pt_BR' },
              components: message.templateParams
                ? [
                    {
                      type: 'body',
                      parameters: message.templateParams.map(param => ({
                        type: 'text',
                        text: param,
                      })),
                    },
                  ]
                : undefined,
            }
          : undefined,
    };

    return this.makeRequest('messages', payload);
  }

  async sendAppointmentReminder(
    patient: Patient,
    appointment: Appointment & { therapist: { name: string } }
  ): Promise<WhatsAppResponse> {
    if (!patient.phone || patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error:
          'Patient has not opted in for WhatsApp notifications or has no phone number',
      };
    }

    const appointmentDate = format(
      new Date(appointment.startTime),
      "dd 'de' MMMM",
      { locale: ptBR }
    );
    const appointmentTime = format(new Date(appointment.startTime), 'HH:mm');

    const message = `🏥 *Lembrete de Consulta - FisioFlow*

Olá ${patient.name}! 👋

Você tem uma consulta agendada:
📅 *Data:* ${appointmentDate}
⏰ *Horário:* ${appointmentTime}
👨‍⚕️ *Profissional:* ${appointment.therapist.name}
📍 *Tipo:* ${appointment.type}

${appointment.observations ? `📝 *Observações:* ${appointment.observations}` : ''}

Por favor, confirme sua presença respondendo:
✅ *SIM* - para confirmar
📅 *REAGENDAR* - para reagendar
❌ *CANCELAR* - para cancelar

_Caso não compareça sem aviso prévio, será cobrada taxa de falta._

Atenciosamente,
Equipe FisioFlow 💙`;

    const result = await this.sendMessage({
      to: patient.phone,
      message,
      type: 'text',
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('appointment_reminder_sent', {
        patientId: patient.id,
        appointmentId: appointment.id,
        channel: 'whatsapp',
      });
    }

    return result;
  }

  async sendAppointmentConfirmation(
    patient: Patient,
    appointment: Appointment & { therapist: { name: string } }
  ): Promise<WhatsAppResponse> {
    if (!patient.phone || patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp notifications',
      };
    }

    const appointmentDate = format(
      new Date(appointment.startTime),
      "dd 'de' MMMM",
      { locale: ptBR }
    );
    const appointmentTime = format(new Date(appointment.startTime), 'HH:mm');

    const message = `✅ *Consulta Confirmada - FisioFlow*

Olá ${patient.name}!

Sua consulta foi confirmada com sucesso:

📅 *Data:* ${appointmentDate}
⏰ *Horário:* ${appointmentTime}
👨‍⚕️ *Profissional:* ${appointment.therapist.name}
📍 *Tipo:* ${appointment.type}

📍 *Endereço:* 
[Endereço da clínica aqui]

⚠️ *Importante:*
• Chegue 10 minutos antes
• Traga documentos e exames anteriores
• Use roupas confortáveis

Qualquer dúvida, entre em contato conosco.

Equipe FisioFlow 💙`;

    const result = await this.sendMessage({
      to: patient.phone,
      message,
      type: 'text',
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('appointment_confirmed', {
        patientId: patient.id,
        appointmentId: appointment.id,
        channel: 'whatsapp',
      });
    }

    return result;
  }

  async sendTreatmentUpdate(
    patient: Patient,
    progressSummary: string,
    nextSteps: string
  ): Promise<WhatsAppResponse> {
    if (!patient.phone || patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp notifications',
      };
    }

    const message = `📈 *Relatório de Progresso - FisioFlow*

Olá ${patient.name}!

Temos novidades sobre seu tratamento:

*📊 Progresso Atual:*
${progressSummary}

*🎯 Próximos Passos:*
${nextSteps}

Continue seguindo as orientações do seu fisioterapeuta para obter os melhores resultados! 💪

Qualquer dúvida, estamos aqui para ajudar.

Equipe FisioFlow 💙`;

    const result = await this.sendMessage({
      to: patient.phone,
      message,
      type: 'text',
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('treatment_update_sent', {
        patientId: patient.id,
        channel: 'whatsapp',
      });
    }

    return result;
  }

  async sendWelcomeMessage(patient: Patient): Promise<WhatsAppResponse> {
    if (!patient.phone || patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp notifications',
      };
    }

    const message = `🎉 *Bem-vindo(a) à FisioFlow!*

Olá ${patient.name}! 

Seja muito bem-vindo(a) à nossa clínica! 🏥

Aqui você terá acesso a:
✅ Tratamentos personalizados
✅ Tecnologia de ponta
✅ Acompanhamento contínuo
✅ Lembretes automáticos

📱 *Pelo WhatsApp você receberá:*
• Confirmações de consultas
• Lembretes de agendamentos
• Relatórios de progresso
• Dicas de saúde

Para *PARAR* de receber mensagens, responda *SAIR*

Estamos ansiosos para cuidar da sua saúde! 💙

Equipe FisioFlow`;

    const result = await this.sendMessage({
      to: patient.phone,
      message,
      type: 'text',
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('welcome_message_sent', {
        patientId: patient.id,
        channel: 'whatsapp',
      });
    }

    return result;
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}`;
    } else if (cleaned.length === 10) {
      return `5511${cleaned}`;
    } else if (!cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }

    return cleaned;
  }

  async getMessageStatus(messageId: string): Promise<any> {
    return trackExternalAPICall('whatsapp', 'message_status', async () => {
      try {
        const response = await fetch(
          `${this.baseUrl}/${this.version}/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        return await response.json();
      } catch (error: any) {
        structuredLogger.error('Failed to get WhatsApp message status', {
          messageId,
          error: error.message,
        });
        throw error;
      }
    });
  }

  // Webhook handler for incoming messages
  async handleIncomingMessage(webhook: any): Promise<void> {
    try {
      const entries = webhook.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];

            for (const message of messages) {
              await this.processIncomingMessage(message);
            }
          }
        }
      }
    } catch (error: any) {
      structuredLogger.error('Error processing WhatsApp webhook', {
        error: error.message,
        webhook: JSON.stringify(webhook, null, 2),
      });
    }
  }

  private async processIncomingMessage(message: any): Promise<void> {
    const from = message.from;
    const messageBody = message.text?.body?.toLowerCase() || '';

    structuredLogger.info('Received WhatsApp message', {
      from,
      message: messageBody,
      type: message.type,
    });

    // Handle opt-out requests
    if (['sair', 'stop', 'parar'].includes(messageBody)) {
      // Update patient WhatsApp consent to opt_out
      // This would require a database update
      structuredLogger.info('Patient opted out of WhatsApp notifications', {
        from,
      });
    }

    // Handle appointment confirmations
    if (['sim', 'confirmar', 'ok'].includes(messageBody)) {
      // Process appointment confirmation
      structuredLogger.info('Appointment confirmation received', { from });
    }

    // Handle rescheduling requests
    if (['reagendar', 'remarcar'].includes(messageBody)) {
      // Process rescheduling request
      structuredLogger.info('Rescheduling request received', { from });
    }

    BusinessMetrics.recordBusinessEvent('whatsapp_message_received', {
      from,
      messageType: message.type,
    });
  }

  // Health check for WhatsApp integration
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    error?: string;
  }> {
    try {
      if (!this.apiKey || !this.phoneNumberId) {
        return {
          status: 'unhealthy',
          error: 'WhatsApp credentials not configured',
        };
      }

      // Simple health check - verify phone number
      const response = await fetch(
        `${this.baseUrl}/${this.version}/${this.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.ok) {
        return { status: 'healthy' };
      } else {
        return {
          status: 'unhealthy',
          error: `API returned ${response.status}`,
        };
      }
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Singleton instance
export const whatsappIntegration = new WhatsAppIntegration();
export default whatsappIntegration;
