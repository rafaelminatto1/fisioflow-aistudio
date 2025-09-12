import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Handlebars from 'handlebars';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      receiptId,
      method, // 'email' | 'whatsapp' | 'both'
      customMessage
    } = body;

    // Validações
    if (!receiptId || !method) {
      return NextResponse.json(
        { error: 'ID do recibo e método de envio são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['email', 'whatsapp', 'both'].includes(method)) {
      return NextResponse.json(
        { error: 'Método de envio inválido' },
        { status: 400 }
      );
    }

    // Buscar recibo com dados relacionados
    const receipt = await prisma.receipts.findFirst({
      where: {
        id: receiptId,
        userId: session.user.id
      },
      include: {
        patients: true,
        appointment: {
          select: {
            service: true,
            date: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dados do usuário/clínica
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        clinicName: true,
        clinicAddress: true,
        clinicPhone: true
      }
    });

    // Buscar template do recibo
    const template = await prisma.receiptTemplate.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template de recibo não encontrado' },
        { status: 404 }
      );
    }

    // Gerar HTML do recibo
    const receiptHtml = await generateReceiptHtml(receipt, user, template);

    const results = {
      email: null as any,
      whatsapp: null as any
    };

    // Enviar por email
    if (method === 'email' || method === 'both') {
      if (!receipt.patients.email) {
        return NextResponse.json(
          { error: 'Paciente não possui email cadastrado' },
          { status: 400 }
        );
      }

      try {
        const emailResult = await sendReceiptByEmail(
          receipt,
          receiptHtml,
          customMessage
        );
        results.email = emailResult;
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        results.email = { success: false, error: 'Erro ao enviar email' };
      }
    }

    // Enviar por WhatsApp
    if (method === 'whatsapp' || method === 'both') {
      if (!receipt.patients.phone) {
        return NextResponse.json(
          { error: 'Paciente não possui telefone cadastrado' },
          { status: 400 }
        );
      }

      try {
        const whatsappResult = await sendReceiptByWhatsApp(
          receipt,
          receiptHtml,
          customMessage
        );
        results.whatsapp = whatsappResult;
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        results.whatsapp = { success: false, error: 'Erro ao enviar WhatsApp' };
      }
    }

    // Atualizar status do recibo
    const hasSuccess = (results.email?.success !== false) && (results.whatsapp?.success !== false);
    if (hasSuccess) {
      await prisma.receipts.update({
        where: { id: receiptId },
        data: { 
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Registrar histórico de envio
      await prisma.receiptHistory.create({
        data: {
          receiptId,
          action: 'SENT',
          method,
          details: {
            email: results.email,
            whatsapp: results.whatsapp
          },
          userId: session.user.id
        }
      });
    }

    return NextResponse.json({
      success: hasSuccess,
      results,
      message: hasSuccess ? 'Recibo enviado com sucesso' : 'Erro ao enviar recibo'
    });
  } catch (error) {
    console.error('Erro ao enviar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para gerar HTML do recibo
async function generateReceiptHtml(receipt: any, user: any, template: any) {
  const handlebarsTemplate = Handlebars.compile(template.content);
  
  const templateData = {
    number: receipt.number,
    issueDate: new Date(receipt.service_date).toLocaleDateString('pt-BR'),
    dueDate: receipt.dueDate ? new Date(receipt.dueDate).toLocaleDateString('pt-BR') : null,
    amount: receipt.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }),
    description: receipt.description,
    paymentMethod: receipt.paymentMethod,
    notes: receipt.notes,
    patient: {
      name: receipt.patients.name,
      email: receipt.patients.email,
      phone: receipt.patients.phone
    },
    appointment: receipt.appointment ? {
      service: receipt.appointment.service,
      date: new Date(receipt.appointment.date).toLocaleDateString('pt-BR')
    } : null,
    clinicName: user.clinicName || user.name,
    clinicAddress: user.clinicAddress || '',
    clinicPhone: user.clinicPhone || '',
    clinicEmail: user.email,
    generatedAt: new Date().toLocaleString('pt-BR')
  };

  return handlebarsTemplate(templateData);
}

// Função para enviar recibo por email
async function sendReceiptByEmail(receipt: any, receiptHtml: string, customMessage?: string) {
  const subject = `Recibo ${receipt.number} - ${receipt.description}`;
  
  let message = customMessage || `
Olá ${receipt.patients.name},

Segue em anexo o recibo referente ao serviço prestado.

Recibo: ${receipt.number}
Valor: ${receipt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Descrição: ${receipt.description}

Atenciosamente,
Equipe FisioFlow
  `;

  return await sendEmail({
    to: receipt.patients.email,
    subject,
    text: message,
    html: receiptHtml,
    attachments: [{
      filename: `recibo-${receipt.number}.html`,
      content: receiptHtml,
      contentType: 'text/html'
    }]
  });
}

// Função para enviar recibo por WhatsApp
async function sendReceiptByWhatsApp(receipt: any, receiptHtml: string, customMessage?: string) {
  let message = customMessage || `
🧾 *Recibo ${receipt.number}*

Olá ${receipt.patients.name}!

Segue o recibo do serviço prestado:

💰 *Valor:* ${receipt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
📝 *Descrição:* ${receipt.description}
📅 *Data:* ${new Date(receipt.service_date).toLocaleDateString('pt-BR')}
💳 *Forma de Pagamento:* ${receipt.paymentMethod}

Obrigado pela confiança! 🙏
  `;

  return await sendWhatsAppMessage({
    to: receipt.patients.phone,
    message: message.trim()
  });
}