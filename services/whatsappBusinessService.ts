// services/whatsappBusinessService.ts
import { Patient, Appointment } from '../types';

interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  text?: {
    body: string;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

class WhatsAppBusinessService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming Brazil +55)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}`;
    } else if (cleaned.length === 10) {
      return `5511${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned;
    }
    
    return cleaned;
  }

  private async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse | null> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp Service Error:', error);
      return null;
    }
  }

  async sendAppointmentConfirmation(
    patient: Patient,
    appointment: Appointment
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp messages'
      };
    }

    const phoneNumber = this.formatPhoneNumber(patient.phone);
    const date = appointment.startTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
    const time = appointment.startTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `Olá, ${patient.name.split(' ')[0]}! 👋\n\nSua consulta de ${appointment.type} foi confirmada para:\n📅 ${date}\n🕐 ${time}\n\nPor favor, chegue com alguns minutos de antecedência.\n\nEquipe FisioFlow 🏥`
      }
    };

    const response = await this.sendMessage(message);
    
    if (response && response.messages && response.messages.length > 0) {
      return {
        success: true,
        messageId: response.messages[0].id
      };
    }

    return {
      success: false,
      error: 'Failed to send WhatsApp message'
    };
  }

  async sendAppointmentReminder(
    patient: Patient,
    appointment: Appointment,
    hoursBefore: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp messages'
      };
    }

    const phoneNumber = this.formatPhoneNumber(patient.phone);
    const time = appointment.startTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let reminderText = '';
    if (hoursBefore === 24) {
      reminderText = `Lembrete: Você tem uma consulta amanhã às ${time}. Não esqueça! 📅`;
    } else if (hoursBefore === 2) {
      reminderText = `Lembrete: Sua consulta é hoje às ${time}. Por favor, chegue com alguns minutos de antecedência. 🕐`;
    } else {
      reminderText = `Lembrete: Sua consulta é às ${time}. Até breve! 👋`;
    }

    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `${reminderText}\n\nEquipe FisioFlow 🏥`
      }
    };

    const response = await this.sendMessage(message);
    
    if (response && response.messages && response.messages.length > 0) {
      return {
        success: true,
        messageId: response.messages[0].id
      };
    }

    return {
      success: false,
      error: 'Failed to send WhatsApp reminder'
    };
  }

  async sendCustomMessage(
    patient: Patient,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp messages'
      };
    }

    const phoneNumber = this.formatPhoneNumber(patient.phone);

    const whatsappMessage: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `${message}\n\nEquipe FisioFlow 🏥`
      }
    };

    const response = await this.sendMessage(whatsappMessage);
    
    if (response && response.messages && response.messages.length > 0) {
      return {
        success: true,
        messageId: response.messages[0].id
      };
    }

    return {
      success: false,
      error: 'Failed to send WhatsApp message'
    };
  }

  async sendHEP(
    patient: Patient,
    hepContent: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (patient.whatsappConsent !== 'opt_in') {
      return {
        success: false,
        error: 'Patient has not opted in for WhatsApp messages'
      };
    }

    const phoneNumber = this.formatPhoneNumber(patient.phone);
    const firstName = patient.name.split(' ')[0];

    const message: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `Olá, ${firstName}! 👋\n\nSeu fisioterapeuta enviou seu plano de exercícios domiciliares:\n\n${hepContent}\n\nLembre-se de seguir as orientações e entre em contato se tiver dúvidas.\n\nEquipe FisioFlow 🏥`
      }
    };

    const response = await this.sendMessage(message);
    
    if (response && response.messages && response.messages.length > 0) {
      return {
        success: true,
        messageId: response.messages[0].id
      };
    }

    return {
      success: false,
      error: 'Failed to send HEP via WhatsApp'
    };
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  async handleWebhook(body: any): Promise<void> {
    try {
      if (body.object === 'whatsapp_business_account') {
        body.entry?.forEach((entry: any) => {
          entry.changes?.forEach((change: any) => {
            if (change.value?.messages) {
              change.value.messages.forEach((message: any) => {
                console.log('Received WhatsApp message:', {
                  from: message.from,
                  id: message.id,
                  timestamp: message.timestamp,
                  text: message.text?.body,
                  type: message.type
                });
                
                // Here you can implement auto-responses or save to database
                // For now, we just log the received message
              });
            }

            if (change.value?.statuses) {
              change.value.statuses.forEach((status: any) => {
                console.log('WhatsApp message status update:', {
                  id: status.id,
                  status: status.status,
                  timestamp: status.timestamp,
                  recipient_id: status.recipient_id
                });
                
                // Here you can update message status in your database
              });
            }
          });
        });
      }
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
    }
  }

  isConfigured(): boolean {
    return !!(this.config.accessToken && this.config.phoneNumberId);
  }

  getConfig(): Partial<WhatsAppConfig> {
    return {
      apiUrl: this.config.apiUrl,
      phoneNumberId: this.config.phoneNumberId ? '***' + this.config.phoneNumberId.slice(-4) : '',
      businessAccountId: this.config.businessAccountId ? '***' + this.config.businessAccountId.slice(-4) : '',
    };
  }
}

export const whatsappBusinessService = new WhatsAppBusinessService();
export default whatsappBusinessService;