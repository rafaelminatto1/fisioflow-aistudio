import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface ContactTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  message: string;
  daysOverdue: number;
  isActive: boolean;
}

// Mock templates - in a real implementation, these would come from database
const mockTemplates: ContactTemplate[] = [
  {
    id: '1',
    name: 'Lembrete Amigável (1-7 dias)',
    type: 'email',
    subject: 'Lembrete: Pagamento em atraso',
    message: 'Olá {nome}, notamos que seu pagamento de {valor} referente ao atendimento do dia {data} está em atraso. Por favor, regularize sua situação.',
    daysOverdue: 7,
    isActive: true
  },
  {
    id: '2',
    name: 'Cobrança Formal (8-15 dias)',
    type: 'email',
    subject: 'URGENTE: Pagamento em atraso há {dias} dias',
    message: 'Prezado(a) {nome}, seu pagamento está em atraso há {dias} dias. É necessário regularizar imediatamente para evitar medidas adicionais.',
    daysOverdue: 15,
    isActive: true
  },
  {
    id: '3',
    name: 'WhatsApp Lembrete',
    type: 'whatsapp',
    message: 'Oi {nome}! Lembrete sobre seu pagamento de {valor} em atraso. Podemos conversar sobre as opções de pagamento?',
    daysOverdue: 3,
    isActive: true
  },
  {
    id: '4',
    name: 'SMS Urgente',
    type: 'sms',
    message: '{nome}, seu pagamento de {valor} está {dias} dias em atraso. Entre em contato: {telefone}',
    daysOverdue: 10,
    isActive: true
  }
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIds, templateId, notes } = body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs dos pagamentos são obrigatórios' },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template é obrigatório' },
        { status: 400 }
      );
    }

    // Find the template
    const template = mockTemplates.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Get payments with patient information
    const payments = await prisma.financial_transactions.findMany({
      where: {
        id: { in: paymentIds },
        user_id: session.user.id
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (payments.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum pagamento encontrado' },
        { status: 404 }
      );
    }

    const results = [];
    const currentDate = new Date();

    for (const payment of payments) {
      try {
        // Calculate days overdue
        const daysOverdue = Math.floor(
          (currentDate.getTime() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Prepare message variables
        const variables = {
          nome: payment.patients?.name || 'Paciente',
          valor: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(Number(payment.amount)),
          data: new Date(payment.created_at).toLocaleDateString('pt-BR'),
          dias: daysOverdue.toString(),
          telefone: 'telefone da clínica'
        };

        // Replace variables in message
        let personalizedMessage = template.message;
        let personalizedSubject = template.subject || '';

        Object.entries(variables).forEach(([key, value]) => {
          const placeholder = `{${key}}`;
          personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, 'g'), value);
          personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
        });

        // Send the contact based on type
        let contactResult;
        switch (template.type) {
          case 'email':
            contactResult = await sendEmail({
              to: payment.patients?.email || '',
              subject: personalizedSubject,
              message: personalizedMessage,
              patientName: payment.patients?.name || 'Paciente'
            });
            break;
            
          case 'sms':
            contactResult = await sendSMS({
              to: payment.patients?.phone || '',
              message: personalizedMessage
            });
            break;
            
          case 'whatsapp':
            contactResult = await sendWhatsApp({
              to: payment.patients?.phone || '',
              message: personalizedMessage
            });
            break;
            
          default:
            contactResult = { success: false, error: 'Tipo de contato inválido' };
        }

        // Log the contact attempt (in a real implementation, you'd have a contact log table)
        if (contactResult.success) {
          // Note: financial_transactions table doesn't have notes field
          // Contact information is logged separately
        }

        results.push({
          paymentId: payment.id,
          patientName: payment.patients?.name,
          contactType: template.type,
          success: contactResult.success,
          error: contactResult.error
        });

      } catch (error) {
        console.error(`Erro ao processar pagamento ${payment.id}:`, error);
        results.push({
          paymentId: payment.id,
          patientName: payment.patients?.name,
          contactType: template.type,
          success: false,
          error: 'Erro interno ao processar contato'
        });
      }
    }

    // Summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    return NextResponse.json({
      success: true,
      summary,
      results
    });

  } catch (error) {
    console.error('Erro ao enviar contatos em massa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Mock email sending function
async function sendEmail({ to, subject, message, patientName }: {
  to: string;
  subject: string;
  message: string;
  patientName: string;
}) {
  // In a real implementation, you would integrate with an email service like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend
  
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Email inválido' };
  }

  // Simulate email sending
  console.log(`📧 Enviando email para ${patientName} (${to})`);
  console.log(`Assunto: ${subject}`);
  console.log(`Mensagem: ${message}`);
  
  // Simulate success/failure
  const success = Math.random() > 0.1; // 90% success rate
  
  return {
    success,
    error: success ? null : 'Falha na entrega do email'
  };
}

// Mock SMS sending function
async function sendSMS({ to, message }: {
  to: string;
  message: string;
}) {
  // In a real implementation, you would integrate with an SMS service like:
  // - Twilio
  // - AWS SNS
  // - Zenvia
  // - TotalVoice
  
  if (!to || to.length < 10) {
    return { success: false, error: 'Número de telefone inválido' };
  }

  // Simulate SMS sending
  console.log(`📱 Enviando SMS para ${to}`);
  console.log(`Mensagem: ${message}`);
  
  // Simulate success/failure
  const success = Math.random() > 0.05; // 95% success rate
  
  return {
    success,
    error: success ? null : 'Falha no envio do SMS'
  };
}

// Mock WhatsApp sending function
async function sendWhatsApp({ to, message }: {
  to: string;
  message: string;
}) {
  // In a real implementation, you would integrate with WhatsApp Business API:
  // - Meta WhatsApp Business API
  // - Twilio WhatsApp API
  // - 360Dialog
  // - Zenvia WhatsApp
  
  if (!to || to.length < 10) {
    return { success: false, error: 'Número de WhatsApp inválido' };
  }

  // Simulate WhatsApp sending
  console.log(`💬 Enviando WhatsApp para ${to}`);
  console.log(`Mensagem: ${message}`);
  
  // Simulate success/failure
  const success = Math.random() > 0.02; // 98% success rate
  
  return {
    success,
    error: success ? null : 'Falha no envio do WhatsApp'
  };
}