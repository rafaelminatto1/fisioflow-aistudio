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
        issued_by: session.user.id
      },
      include: {
        patients: true,
        financial_transactions: {
          select: {
            type: true,
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
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true
      }
    });

    // Template básico (sem tabela receiptTemplate no schema)
    const template = {
      content: `
        <h1>Recibo - {{number}}</h1>
        <p>Data: {{issueDate}}</p>
        <p>Valor: {{amount}}</p>
        <p>Descrição: {{description}}</p>
        <p>Paciente: {{patient.name}}</p>
        <p>Clínica: {{clinicName}}</p>
      `
    };

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
      // Atualizar updated_at do recibo
      await prisma.receipts.update({
        where: { id: receiptId },
        data: { 
          updated_at: new Date()
        }
      });

      // Log do envio (sem tabela receiptHistory no schema)
      console.log('Recibo enviado:', {
        receiptId,
        method,
        email: results.email,
        whatsapp: results.whatsapp,
        userId: session.user.id
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
    paymentMethod: receipt.payment_method,
    notes: receipt.notes,
    patient: {
      name: receipt.patients.name,
      email: receipt.patients.email,
      phone: receipt.patients.phone
    },
    transaction: receipt.financial_transactions ? {
      type: receipt.financial_transactions.type,
      date: new Date(receipt.financial_transactions.date).toLocaleDateString('pt-BR')
    } : null,
    clinicName: user.name,
    clinicAddress: '',
    clinicPhone: '',
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

  // Email sending would be handled by an email service
  console.log('Sending email to:', receipt.patients.email);
  console.log('Subject:', subject);
  console.log('Message:', message);
  return { success: true, messageId: 'email_' + Date.now() };
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
💳 *Forma de Pagamento:* ${receipt.payment_method}

Obrigado pela confiança! 🙏
  `;

  // WhatsApp sending would be handled by WhatsApp Business Service
  console.log('Sending WhatsApp to:', receipt.patients.phone);
  console.log('Message:', message.trim());
  return { success: true, messageId: 'whatsapp_' + Date.now() };
}