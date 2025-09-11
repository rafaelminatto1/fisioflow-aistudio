// lib/email.ts
interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private configured: boolean = false

  constructor() {
    // Check if email service is configured
    this.configured = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    )
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.configured) {
      console.warn('Email service not configured')
      return { success: false, error: 'Email service not configured' }
    }

    try {
      // Email sending logic would go here
      // For now, just log and return success
      console.log(`Email would be sent to: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      
      return { success: true }
    } catch (error: any) {
      console.error('Email sending failed:', error)
      return { success: false, error: error.message }
    }
  }

  async sendAppointmentConfirmation(
    to: string, 
    patientName: string, 
    appointmentDate: string,
    appointmentTime: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = `
      <h2>Confirmação de Consulta - FisioFlow</h2>
      <p>Olá ${patientName},</p>
      <p>Sua consulta foi confirmada para:</p>
      <ul>
        <li><strong>Data:</strong> ${appointmentDate}</li>
        <li><strong>Horário:</strong> ${appointmentTime}</li>
      </ul>
      <p>Por favor, chegue com alguns minutos de antecedência.</p>
      <p>Equipe FisioFlow</p>
    `

    return this.sendEmail({
      to,
      subject: 'Confirmação de Consulta - FisioFlow',
      html,
      text: `Olá ${patientName}, sua consulta foi confirmada para ${appointmentDate} às ${appointmentTime}.`
    })
  }

  async sendAppointmentReminder(
    to: string, 
    patientName: string, 
    appointmentDate: string,
    appointmentTime: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = `
      <h2>Lembrete de Consulta - FisioFlow</h2>
      <p>Olá ${patientName},</p>
      <p>Este é um lembrete da sua consulta:</p>
      <ul>
        <li><strong>Data:</strong> ${appointmentDate}</li>
        <li><strong>Horário:</strong> ${appointmentTime}</li>
      </ul>
      <p>Não esqueça!</p>
      <p>Equipe FisioFlow</p>
    `

    return this.sendEmail({
      to,
      subject: 'Lembrete de Consulta - FisioFlow',
      html,
      text: `Lembrete: Você tem uma consulta marcada para ${appointmentDate} às ${appointmentTime}.`
    })
  }

  isConfigured(): boolean {
    return this.configured
  }
}

export const emailService = new EmailService()
export default emailService