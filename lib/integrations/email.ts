// lib/integrations/email.ts
import { structuredLogger } from '../monitoring/logger';
import { trackExternalAPICall } from '../middleware/performance';
import { BusinessMetrics } from '../monitoring/metrics';
import type { Appointment, Patient } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateName?: string;
  templateData?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
}

export class EmailIntegration {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@fisioflow.com.br';
    this.fromName = process.env.FROM_NAME || 'FisioFlow';
    this.baseUrl = 'https://api.resend.com';

    if (!this.apiKey) {
      structuredLogger.warn('Email API key not configured', {
        hasApiKey: !!this.apiKey,
      });
    }
  }

  private async makeRequest(
    endpoint: string,
    data: any
  ): Promise<EmailResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'Email API key not configured' };
    }

    return trackExternalAPICall('email', endpoint, async () => {
      try {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          structuredLogger.error('Email API error', {
            endpoint,
            statusCode: response.status,
            error: result,
          });

          return {
            success: false,
            error: result.message || 'Unknown email API error',
            statusCode: response.status,
          };
        }

        structuredLogger.info('Email sent successfully', {
          endpoint,
          messageId: result.id,
          to: data.to,
        });

        BusinessMetrics.recordAPICall('email', 'POST', response.status);

        return {
          success: true,
          messageId: result.id,
          statusCode: response.status,
        };
      } catch (error: any) {
        structuredLogger.error('Email request failed', {
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

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    const payload = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text || this.htmlToText(message.html),
    };

    return this.makeRequest('emails', payload);
  }

  async sendAppointmentReminder(
    patient: Patient,
    appointment: Appointment & { therapist: { name: string } }
  ): Promise<EmailResponse> {
    if (!patient.email) {
      return {
        success: false,
        error: 'Patient has no email address',
      };
    }

    const appointmentDate = format(
      new Date(appointment.startTime),
      "dd 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    );
    const appointmentTime = format(new Date(appointment.startTime), 'HH:mm');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lembrete de Consulta - FisioFlow</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .appointment-details { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="emoji">🏥</span> Lembrete de Consulta</h1>
        <p>FisioFlow - Cuidando da sua saúde</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>Olá ${patient.name}! <span class="emoji">👋</span></h2>
            
            <p>Você tem uma consulta agendada em nossa clínica:</p>
            
            <div class="appointment-details">
                <p><strong><span class="emoji">📅</span> Data:</strong> ${appointmentDate}</p>
                <p><strong><span class="emoji">⏰</span> Horário:</strong> ${appointmentTime}</p>
                <p><strong><span class="emoji">👨‍⚕️</span> Profissional:</strong> ${appointment.therapist.name}</p>
                <p><strong><span class="emoji">📍</span> Tipo:</strong> ${appointment.type}</p>
                ${appointment.observations ? `<p><strong><span class="emoji">📝</span> Observações:</strong> ${appointment.observations}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button" style="background: #4caf50;">✅ Confirmar</a>
                <a href="#" class="button" style="background: #ff9800;">📅 Reagendar</a>
                <a href="#" class="button" style="background: #f44336;">❌ Cancelar</a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
                <p><strong>⚠️ Importante:</strong></p>
                <p>Caso não compareça sem aviso prévio, será cobrada taxa de falta conforme política da clínica.</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>FisioFlow - Fisioterapia & Reabilitação</p>
        <p>Para cancelar o recebimento destes e-mails, <a href="#">clique aqui</a></p>
    </div>
</body>
</html>`;

    const text = `
LEMBRETE DE CONSULTA - FISIOFLOW

Olá ${patient.name}!

Você tem uma consulta agendada:

📅 Data: ${appointmentDate}
⏰ Horário: ${appointmentTime}
👨‍⚕️ Profissional: ${appointment.therapist.name}
📍 Tipo: ${appointment.type}
${appointment.observations ? `📝 Observações: ${appointment.observations}` : ''}

IMPORTANTE: Caso não compareça sem aviso prévio, será cobrada taxa de falta.

Para confirmar, reagendar ou cancelar, entre em contato conosco.

Atenciosamente,
Equipe FisioFlow
`;

    const result = await this.sendEmail({
      to: patient.email,
      subject: `🏥 Lembrete: Consulta agendada para ${appointmentDate}`,
      html,
      text,
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('appointment_reminder_email_sent', {
        patientId: patient.id,
        appointmentId: appointment.id,
        channel: 'email',
      });
    }

    return result;
  }

  async sendAppointmentConfirmation(
    patient: Patient,
    appointment: Appointment & { therapist: { name: string } }
  ): Promise<EmailResponse> {
    if (!patient.email) {
      return {
        success: false,
        error: 'Patient has no email address',
      };
    }

    const appointmentDate = format(
      new Date(appointment.startTime),
      "dd 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    );
    const appointmentTime = format(new Date(appointment.startTime), 'HH:mm');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consulta Confirmada - FisioFlow</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .appointment-details { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .instructions { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="emoji">✅</span> Consulta Confirmada</h1>
        <p>FisioFlow - Cuidando da sua saúde</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>Olá ${patient.name}!</h2>
            
            <p>Sua consulta foi <strong>confirmada com sucesso</strong>:</p>
            
            <div class="appointment-details">
                <p><strong><span class="emoji">📅</span> Data:</strong> ${appointmentDate}</p>
                <p><strong><span class="emoji">⏰</span> Horário:</strong> ${appointmentTime}</p>
                <p><strong><span class="emoji">👨‍⚕️</span> Profissional:</strong> ${appointment.therapist.name}</p>
                <p><strong><span class="emoji">📍</span> Tipo:</strong> ${appointment.type}</p>
            </div>
            
            <div class="instructions">
                <h3><span class="emoji">⚠️</span> Instruções Importantes:</h3>
                <ul>
                    <li>Chegue <strong>10 minutos antes</strong> do horário agendado</li>
                    <li>Traga documentos pessoais e carteirinha do convênio</li>
                    <li>Traga exames anteriores relacionados ao tratamento</li>
                    <li>Use <strong>roupas confortáveis</strong> e adequadas para exercícios</li>
                    <li>Evite refeições pesadas antes da sessão</li>
                </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4><span class="emoji">📍</span> Endereço da Clínica:</h4>
                <p>[Endereço completo da clínica será inserido aqui]</p>
                <p><strong>Telefone:</strong> [Telefone da clínica]</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>FisioFlow - Fisioterapia & Reabilitação</p>
        <p>Qualquer dúvida, entre em contato conosco</p>
        <p>Para cancelar o recebimento destes e-mails, <a href="#">clique aqui</a></p>
    </div>
</body>
</html>`;

    const result = await this.sendEmail({
      to: patient.email,
      subject: `✅ Consulta confirmada para ${appointmentDate} às ${appointmentTime}`,
      html,
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('appointment_confirmed_email', {
        patientId: patient.id,
        appointmentId: appointment.id,
        channel: 'email',
      });
    }

    return result;
  }

  async sendTreatmentReport(
    patient: Patient,
    reportData: {
      progressSummary: string;
      nextSteps: string;
      exercises?: string[];
      recommendations?: string[];
      therapistName: string;
    }
  ): Promise<EmailResponse> {
    if (!patient.email) {
      return {
        success: false,
        error: 'Patient has no email address',
      };
    }

    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Progresso - FisioFlow</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .progress-section { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .next-steps { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .exercises { background: #f3e5f5; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .emoji { font-size: 1.2em; }
        ul { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="emoji">📈</span> Relatório de Progresso</h1>
        <p>FisioFlow - Acompanhamento do seu tratamento</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>Olá ${patient.name}!</h2>
            
            <p>Preparamos um relatório detalhado sobre o progresso do seu tratamento em <strong>${currentDate}</strong>:</p>
            
            <div class="progress-section">
                <h3><span class="emoji">📊</span> Progresso Atual</h3>
                <p>${reportData.progressSummary}</p>
            </div>
            
            <div class="next-steps">
                <h3><span class="emoji">🎯</span> Próximos Passos</h3>
                <p>${reportData.nextSteps}</p>
            </div>
            
            ${
              reportData.exercises && reportData.exercises.length > 0
                ? `
            <div class="exercises">
                <h3><span class="emoji">💪</span> Exercícios Recomendados</h3>
                <ul>
                    ${reportData.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                </ul>
            </div>
            `
                : ''
            }
            
            ${
              reportData.recommendations &&
              reportData.recommendations.length > 0
                ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3><span class="emoji">💡</span> Recomendações Gerais</h3>
                <ul>
                    ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            `
                : ''
            }
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p><strong>Continue seguindo as orientações para obter os melhores resultados!</strong> <span class="emoji">💪</span></p>
                <p><em>Relatório elaborado por: ${reportData.therapistName}</em></p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>FisioFlow - Fisioterapia & Reabilitação</p>
        <p>Qualquer dúvida sobre seu tratamento, entre em contato conosco</p>
        <p>Para cancelar o recebimento destes e-mails, <a href="#">clique aqui</a></p>
    </div>
</body>
</html>`;

    const result = await this.sendEmail({
      to: patient.email,
      subject: `📈 Relatório de Progresso - ${currentDate}`,
      html,
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('treatment_report_email_sent', {
        patientId: patient.id,
        channel: 'email',
      });
    }

    return result;
  }

  async sendWelcomeEmail(patient: Patient): Promise<EmailResponse> {
    if (!patient.email) {
      return {
        success: false,
        error: 'Patient has no email address',
      };
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo à FisioFlow!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .features { background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .emoji { font-size: 1.2em; }
        .button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="emoji">🎉</span> Bem-vindo à FisioFlow!</h1>
        <p>Tecnologia e cuidado para sua saúde</p>
    </div>
    
    <div class="content">
        <div class="card">
            <h2>Olá ${patient.name}! <span class="emoji">👋</span></h2>
            
            <p>Seja muito bem-vindo(a) à nossa clínica! Estamos muito felizes em ter você conosco.</p>
            
            <div class="features">
                <h3><span class="emoji">🏥</span> Na FisioFlow você terá acesso a:</h3>
                <ul>
                    <li><strong>Tratamentos personalizados</strong> baseados nas suas necessidades específicas</li>
                    <li><strong>Tecnologia de ponta</strong> para diagnóstico e acompanhamento</li>
                    <li><strong>Profissionais especializados</strong> com vasta experiência</li>
                    <li><strong>Acompanhamento contínuo</strong> do seu progresso</li>
                    <li><strong>Sistema digital</strong> para agendamentos e relatórios</li>
                </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3><span class="emoji">📧</span> Por e-mail você receberá:</h3>
                <ul>
                    <li>Confirmações de consultas agendadas</li>
                    <li>Lembretes de próximos atendimentos</li>
                    <li>Relatórios detalhados de progresso</li>
                    <li>Orientações e dicas de saúde</li>
                    <li>Comunicados importantes da clínica</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p>Pronto para começar sua jornada de recuperação?</p>
                <a href="#" class="button">Acessar Portal do Paciente</a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
                <p><strong>Dica:</strong> Salve nossos contatos em sua agenda para não perder nenhuma comunicação importante!</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>FisioFlow - Fisioterapia & Reabilitação</p>
        <p>Estamos aqui para cuidar da sua saúde com dedicação e tecnologia</p>
        <p>Se não deseja mais receber estes e-mails, <a href="#">clique aqui para cancelar</a></p>
    </div>
</body>
</html>`;

    const result = await this.sendEmail({
      to: patient.email,
      subject:
        '🎉 Bem-vindo à FisioFlow - Sua jornada de recuperação começa aqui!',
      html,
    });

    if (result.success) {
      BusinessMetrics.recordBusinessEvent('welcome_email_sent', {
        patientId: patient.id,
        channel: 'email',
      });
    }

    return result;
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    htmlTemplate: string,
    personalizations?: Record<string, Record<string, any>>
  ): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    // Send in batches to avoid rate limiting
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async recipient => {
        let personalizedHtml = htmlTemplate;

        // Apply personalizations if provided
        if (personalizations && personalizations[recipient]) {
          const data = personalizations[recipient];
          Object.keys(data).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            personalizedHtml = personalizedHtml.replace(placeholder, data[key]);
          });
        }

        return this.sendEmail({
          to: recipient,
          subject,
          html: personalizedHtml,
        });
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    structuredLogger.info('Bulk email campaign completed', {
      totalRecipients: recipients.length,
      successCount,
      failureCount: recipients.length - successCount,
    });

    BusinessMetrics.recordBusinessEvent('bulk_email_campaign', {
      totalRecipients: recipients.length,
      successCount,
      channel: 'email',
    });

    return results;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Health check for Email integration
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return { status: 'unhealthy', error: 'Email API key not configured' };
      }

      // Simple health check - verify API connection
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

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
export const emailIntegration = new EmailIntegration();
export default emailIntegration;
