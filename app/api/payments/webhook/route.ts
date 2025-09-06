import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentGateway, PaymentConfig, PaymentMethod } from '@/lib/payment/payment-gateway';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Schema para validação de webhook PIX
const PixWebhookSchema = z.object({
  txId: z.string(),
  endToEndId: z.string().optional(),
  status: z.enum(['pending', 'paid', 'failed', 'cancelled', 'expired']),
  amount: z.number().positive(),
  paidAt: z.string().optional(),
  payerDocument: z.string().optional(),
  payerName: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Schema para validação de webhook de cartão
const CardWebhookSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['pending', 'processing', 'paid', 'failed', 'cancelled']),
  amount: z.number().positive(),
  authorizationCode: z.string().optional(),
  nsu: z.string().optional(),
  acquirerResponseCode: z.string().optional(),
  acquirerResponseMessage: z.string().optional(),
  processedAt: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Schema para validação de webhook de boleto
const BankSlipWebhookSchema = z.object({
  boletoId: z.string(),
  status: z.enum(['pending', 'paid', 'expired', 'cancelled']),
  amount: z.number().positive(),
  paidAt: z.string().optional(),
  paidAmount: z.number().optional(),
  payerDocument: z.string().optional(),
  payerName: z.string().optional(),
  bankCode: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Configuração do gateway de pagamento
const getPaymentConfig = (): PaymentConfig => {
  return {
    pix: {
      enabled: true,
      merchantId: process.env.PIX_MERCHANT_ID || 'FISIOFLOW_MERCHANT',
      merchantName: process.env.PIX_MERCHANT_NAME || 'FisioFlow',
      merchantCity: process.env.PIX_MERCHANT_CITY || 'São Paulo',
      pixKey: process.env.PIX_KEY || 'contato@fisioflow.com',
      apiUrl: process.env.PIX_API_URL || 'https://api.pix-provider.com',
      apiKey: process.env.PIX_API_KEY || 'test_key',
      webhookUrl: process.env.PIX_WEBHOOK_URL
    },
    creditCard: {
      enabled: true,
      acquirer: 'stone',
      merchantId: process.env.CARD_MERCHANT_ID || 'FISIOFLOW_CARD',
      apiKey: process.env.CARD_API_KEY || 'test_card_key',
      apiUrl: process.env.CARD_API_URL || 'https://api.stone.com.br',
      maxInstallments: 12,
      minInstallmentAmount: 50
    },
    bankSlip: {
      enabled: true,
      bankCode: '033',
      agency: '0001',
      account: '123456',
      apiUrl: process.env.BANK_SLIP_API_URL || 'https://api.bank.com',
      apiKey: process.env.BANK_SLIP_API_KEY || 'test_bank_key',
      defaultDueDays: 7
    }
  };
};

/**
 * POST /api/payments/webhook - Processar webhooks de pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get('x-signature') || headersList.get('signature');
    const webhookSource = headersList.get('x-webhook-source') || 'unknown';
    const contentType = headersList.get('content-type') || '';

    // Ler o corpo da requisição
    let body: any;
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    console.log('Webhook recebido:', {
      source: webhookSource,
      signature: signature ? 'presente' : 'ausente',
      body: JSON.stringify(body, null, 2)
    });

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    // Determinar o tipo de webhook baseado na fonte ou estrutura dos dados
    let paymentMethod: PaymentMethod;
    let webhookData: any;

    if (webhookSource === 'pix' || body.txId || body.endToEndId) {
      paymentMethod = 'pix';
      webhookData = PixWebhookSchema.parse(body);
    } else if (webhookSource === 'card' || body.transactionId || body.authorizationCode) {
      paymentMethod = 'credit_card'; // ou debit_card, dependendo do contexto
      webhookData = CardWebhookSchema.parse(body);
    } else if (webhookSource === 'bank_slip' || body.boletoId) {
      paymentMethod = 'bank_slip';
      webhookData = BankSlipWebhookSchema.parse(body);
    } else {
      console.error('Tipo de webhook não reconhecido:', body);
      return NextResponse.json(
        { error: 'Tipo de webhook não reconhecido' },
        { status: 400 }
      );
    }

    // Processar webhook através do gateway
    await gateway.processWebhook(paymentMethod, body, signature || undefined);

    // Buscar pagamento relacionado
    let payment;
    if (paymentMethod === 'pix') {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { externalId: webhookData.txId },
            { id: webhookData.txId }
          ],
          method: 'pix'
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } else if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { externalId: webhookData.transactionId },
            { id: webhookData.transactionId }
          ],
          method: { in: ['credit_card', 'debit_card'] }
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } else if (paymentMethod === 'bank_slip') {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { externalId: webhookData.boletoId },
            { id: webhookData.boletoId }
          ],
          method: 'bank_slip'
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    }

    if (!payment) {
      console.warn('Pagamento não encontrado para webhook:', webhookData);
      return NextResponse.json(
        { message: 'Pagamento não encontrado, mas webhook processado' },
        { status: 200 }
      );
    }

    // Atualizar status do pagamento se necessário
    const statusChanged = payment.status !== webhookData.status;
    if (statusChanged) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: webhookData.status,
          paidAt: webhookData.paidAt ? new Date(webhookData.paidAt) : 
                  (webhookData.processedAt ? new Date(webhookData.processedAt) : 
                   (webhookData.status === 'paid' ? new Date() : null)),
          updatedAt: new Date()
        }
      });

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: 'system',
          action: 'payment_status_updated',
          entityType: 'payment',
          entityId: payment.id,
          details: {
            previousStatus: payment.status,
            newStatus: webhookData.status,
            source: 'webhook',
            webhookSource,
            webhookData
          },
          createdAt: new Date()
        }
      });

      // Processar ações baseadas no novo status
      await processPaymentStatusChange(payment, webhookData.status, webhookData);
    }

    // Registrar webhook recebido
    await prisma.webhookLog.create({
      data: {
        source: webhookSource,
        method: paymentMethod,
        paymentId: payment.id,
        status: 'processed',
        payload: JSON.stringify(body),
        signature,
        processedAt: new Date(),
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Webhook processado com sucesso',
      paymentId: payment.id,
      statusChanged
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);

    // Registrar erro do webhook
    try {
      await prisma.webhookLog.create({
        data: {
          source: 'unknown',
          method: 'unknown',
          status: 'failed',
          payload: JSON.stringify(await request.clone().text()),
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          createdAt: new Date()
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar log do webhook:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados do webhook inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/webhook - Listar logs de webhooks (para debug)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const paymentId = searchParams.get('paymentId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (source) where.source = source;
    if (status) where.status = status;
    if (paymentId) where.paymentId = paymentId;

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              description: true,
              status: true,
              patient: {
                select: { name: true }
              }
            }
          }
        }
      }),
      prisma.webhookLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar logs de webhook:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Processar mudanças de status do pagamento
 */
async function processPaymentStatusChange(
  payment: any,
  newStatus: string,
  webhookData: any
): Promise<void> {
  try {
    switch (newStatus) {
      case 'paid':
        await handlePaymentPaid(payment, webhookData);
        break;
        
      case 'failed':
        await handlePaymentFailed(payment, webhookData);
        break;
        
      case 'cancelled':
        await handlePaymentCancelled(payment, webhookData);
        break;
        
      case 'expired':
        await handlePaymentExpired(payment, webhookData);
        break;
    }
  } catch (error) {
    console.error('Erro ao processar mudança de status:', error);
  }
}

/**
 * Processar pagamento aprovado
 */
async function handlePaymentPaid(payment: any, webhookData: any): Promise<void> {
  // Atualizar consulta/agendamento se relacionado
  if (payment.consultationId) {
    await prisma.consultation.update({
      where: { id: payment.consultationId },
      data: {
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
  }

  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: {
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
  }

  // Criar notificação para o paciente
  await prisma.notification.create({
    data: {
      userId: payment.patientId,
      type: 'payment_confirmed',
      title: 'Pagamento Confirmado',
      message: `Seu pagamento de R$ ${payment.amount.toFixed(2)} foi confirmado com sucesso.`,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method
      },
      createdAt: new Date()
    }
  });

  // Enviar email de confirmação (implementar conforme necessário)
  console.log(`Pagamento confirmado: ${payment.id} - R$ ${payment.amount}`);
}

/**
 * Processar pagamento falhado
 */
async function handlePaymentFailed(payment: any, webhookData: any): Promise<void> {
  // Criar notificação para o paciente
  await prisma.notification.create({
    data: {
      userId: payment.patientId,
      type: 'payment_failed',
      title: 'Falha no Pagamento',
      message: `Houve um problema com seu pagamento de R$ ${payment.amount.toFixed(2)}. Tente novamente ou entre em contato conosco.`,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        reason: webhookData.acquirerResponseMessage || 'Motivo não especificado'
      },
      createdAt: new Date()
    }
  });

  console.log(`Pagamento falhado: ${payment.id} - Motivo: ${webhookData.acquirerResponseMessage || 'Não especificado'}`);
}

/**
 * Processar pagamento cancelado
 */
async function handlePaymentCancelled(payment: any, webhookData: any): Promise<void> {
  // Criar notificação para o paciente
  await prisma.notification.create({
    data: {
      userId: payment.patientId,
      type: 'payment_cancelled',
      title: 'Pagamento Cancelado',
      message: `Seu pagamento de R$ ${payment.amount.toFixed(2)} foi cancelado.`,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method
      },
      createdAt: new Date()
    }
  });

  console.log(`Pagamento cancelado: ${payment.id}`);
}

/**
 * Processar pagamento expirado
 */
async function handlePaymentExpired(payment: any, webhookData: any): Promise<void> {
  // Criar notificação para o paciente
  await prisma.notification.create({
    data: {
      userId: payment.patientId,
      type: 'payment_expired',
      title: 'Pagamento Expirado',
      message: `Seu pagamento de R$ ${payment.amount.toFixed(2)} expirou. Você pode gerar um novo pagamento se necessário.`,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method
      },
      createdAt: new Date()
    }
  });

  console.log(`Pagamento expirado: ${payment.id}`);
}