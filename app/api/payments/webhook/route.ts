import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import prisma from '@/lib/prisma';
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
  description: z.string().optional()
});

// Schema para validação de webhook de cartão
const CardWebhookSchema = z.object({
  transactionId: z.string(),
  authorizationCode: z.string().optional(),
  status: z.enum(['pending', 'authorized', 'captured', 'failed', 'cancelled']),
  amount: z.number().positive(),
  lastFourDigits: z.string().optional(),
  brand: z.string().optional(),
  paidAt: z.string().optional()
});

/**
 * POST /api/payments/webhook - Webhook para atualizações de pagamento
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Webhook de pagamento recebido');

    const headersList = headers();
    const signature = headersList.get('x-webhook-signature') || 
                     headersList.get('x-signature') || 
                     headersList.get('signature');
    const webhookSource = headersList.get('x-webhook-source') || 'unknown';

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Erro ao parsear JSON do webhook:', error);
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    console.log('Webhook recebido:', {
      source: webhookSource,
      signature: signature ? 'presente' : 'ausente',
      body: JSON.stringify(body, null, 2)
    });

    // Determinar o tipo de webhook e buscar pagamento relacionado
    let payment;
    let paymentStatus: 'pending' | 'paid' = 'pending';

    if (webhookSource === 'pix' || body.txId || body.endToEndId) {
      // Webhook PIX
      const webhookData = PixWebhookSchema.parse(body);
      
      payment = await prisma.payment.findFirst({
        where: {
          id: webhookData.txId,
          method: 'pix'
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      paymentStatus = webhookData.status === 'paid' ? 'paid' : 'pending';

    } else if (webhookSource === 'card' || body.transactionId || body.authorizationCode) {
      // Webhook de cartão
      const webhookData = CardWebhookSchema.parse(body);
      
      payment = await prisma.payment.findFirst({
        where: {
          id: webhookData.transactionId,
          method: { in: ['credit_card', 'debit_card'] }
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      paymentStatus = (webhookData.status === 'authorized' || webhookData.status === 'captured') ? 'paid' : 'pending';

    } else {
      console.error('Tipo de webhook não reconhecido:', body);
      return NextResponse.json(
        { error: 'Tipo de webhook não reconhecido' },
        { status: 400 }
      );
    }

    if (!payment) {
      console.error('Pagamento não encontrado para o webhook:', body);
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status do pagamento se necessário
    if (payment.status !== paymentStatus) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          paidAt: paymentStatus === 'paid' ? new Date() : null,
          updatedAt: new Date()
        }
      });

      console.log(`Pagamento ${payment.id} atualizado para status: ${paymentStatus}`);
    }

    return NextResponse.json({ 
      message: 'Webhook processado com sucesso',
      paymentId: payment.id,
      status: paymentStatus
    });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);

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
 * GET /api/payments/webhook - Health check do webhook
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook de pagamentos ativo',
    timestamp: new Date().toISOString()
  });
}