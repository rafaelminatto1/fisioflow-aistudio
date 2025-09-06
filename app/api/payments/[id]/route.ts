import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { PaymentGateway, PaymentConfig } from '@/lib/payment/payment-gateway';
import { prisma } from '@/lib/prisma';

// Schema para atualização de pagamento
const UpdatePaymentSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid', 'failed', 'cancelled', 'expired']).optional(),
  failureReason: z.string().optional(),
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
 * GET /api/payments/[id] - Consultar pagamento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    // Buscar pagamento
    const payment = await gateway.getPaymentStatus(id);

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      // Buscar dados do pagamento no banco para verificar se pertence ao usuário
      const paymentData = await prisma.payment.findUnique({
        where: { id },
        select: { patientId: true }
      });

      if (!paymentData || paymentData.patientId !== session.user.id) {
        return NextResponse.json(
          { error: 'Não autorizado a visualizar este pagamento' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/[id] - Atualizar pagamento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = UpdatePaymentSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o pagamento existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Não autorizado a atualizar pagamentos' },
        { status: 403 }
      );
    }

    // Atualizar pagamento no banco
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: validatedData.status || existingPayment.status,
        failureReason: validatedData.failureReason,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : existingPayment.metadata,
        updatedAt: new Date()
      }
    });

    // Log da atividade
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'payment_updated',
        entityType: 'payment',
        entityId: id,
        details: {
          changes: validatedData,
          previousStatus: existingPayment.status
        },
        createdAt: new Date()
      }
    });

    // Buscar dados atualizados
    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);
    const payment = await gateway.getPaymentStatus(id);

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
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
 * DELETE /api/payments/[id] - Cancelar pagamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Cancelado pelo usuário';

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o pagamento existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      // Paciente só pode cancelar seus próprios pagamentos pendentes
      if (existingPayment.patientId !== session.user.id) {
        return NextResponse.json(
          { error: 'Não autorizado a cancelar este pagamento' },
          { status: 403 }
        );
      }

      if (existingPayment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Apenas pagamentos pendentes podem ser cancelados' },
          { status: 400 }
        );
      }
    }

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    // Cancelar pagamento
    const success = await gateway.cancelPayment(id, reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao cancelar pagamento' },
        { status: 500 }
      );
    }

    // Log da atividade
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'payment_cancelled',
        entityType: 'payment',
        entityId: id,
        details: {
          reason,
          previousStatus: existingPayment.status
        },
        createdAt: new Date()
      }
    });

    // Buscar dados atualizados
    const payment = await gateway.getPaymentStatus(id);

    return NextResponse.json({
      message: 'Pagamento cancelado com sucesso',
      payment
    });
  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
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
 * PATCH /api/payments/[id] - Operações específicas no pagamento
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Ação é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o pagamento existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Não autorizado a executar esta ação' },
        { status: 403 }
      );
    }

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    let result;

    switch (action) {
      case 'refresh_status':
        // Atualizar status do pagamento
        result = await gateway.getPaymentStatus(id);
        break;

      case 'resend_notification':
        // Reenviar notificação (implementar conforme necessário)
        result = { message: 'Notificação reenviada com sucesso' };
        break;

      case 'generate_receipt':
        // Gerar comprovante (implementar conforme necessário)
        result = { 
          message: 'Comprovante gerado com sucesso',
          receiptUrl: `/api/payments/${id}/receipt`
        };
        break;

      default:
        return NextResponse.json(
          { error: `Ação '${action}' não reconhecida` },
          { status: 400 }
        );
    }

    // Log da atividade
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `payment_${action}`,
        entityType: 'payment',
        entityId: id,
        details: { action },
        createdAt: new Date()
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao executar ação no pagamento:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}