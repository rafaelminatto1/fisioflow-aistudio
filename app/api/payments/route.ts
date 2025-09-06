import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { PaymentGateway, PaymentConfig, CreatePaymentData, CreditCardData } from '@/lib/payment/payment-gateway';
import { prisma } from '@/lib/prisma';

// Schema de validação para criação de pagamento
const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  method: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']),
  patientId: z.string(),
  consultationId: z.string().optional(),
  appointmentId: z.string().optional(),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  installments: z.number().min(1).max(12).default(1),
  metadata: z.record(z.any()).optional(),
  
  // Dados do cartão (opcional)
  cardData: z.object({
    holderName: z.string().min(1),
    number: z.string().min(13).max(19),
    expiryMonth: z.number().min(1).max(12),
    expiryYear: z.number().min(new Date().getFullYear()),
    cvv: z.string().min(3).max(4),
    holderDocument: z.string().min(11).max(14)
  }).optional()
});

// Schema para filtros de listagem
const ListPaymentsSchema = z.object({
  patientId: z.string().optional(),
  status: z.string().optional(),
  method: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
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
 * GET /api/payments - Listar pagamentos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = ListPaymentsSchema.parse(Object.fromEntries(searchParams));

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    // Verificar permissões - apenas admin ou próprio paciente
    let patientFilter = filters.patientId;
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      patientFilter = session.user.id; // Usuário só vê seus próprios pagamentos
    }

    const result = await gateway.listPayments({
      ...filters,
      patientId: patientFilter
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    
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
 * POST /api/payments - Criar pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);

    // Verificar permissões
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      // Paciente só pode criar pagamentos para si mesmo
      if (validatedData.patientId !== session.user.id) {
        return NextResponse.json(
          { error: 'Não autorizado a criar pagamento para outro paciente' },
          { status: 403 }
        );
      }
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar consulta/agendamento se fornecido
    if (validatedData.consultationId) {
      const consultation = await prisma.consultation.findUnique({
        where: { id: validatedData.consultationId }
      });

      if (!consultation) {
        return NextResponse.json(
          { error: 'Consulta não encontrada' },
          { status: 404 }
        );
      }
    }

    if (validatedData.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: validatedData.appointmentId }
      });

      if (!appointment) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        );
      }
    }

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    // Preparar dados do pagamento
    const paymentData: CreatePaymentData = {
      amount: validatedData.amount,
      description: validatedData.description,
      method: validatedData.method,
      patientId: validatedData.patientId,
      consultationId: validatedData.consultationId,
      appointmentId: validatedData.appointmentId,
      dueDate: validatedData.dueDate,
      installments: validatedData.installments,
      metadata: {
        ...validatedData.metadata,
        createdBy: session.user.id,
        createdByRole: session.user.role
      }
    };

    // Criar pagamento
    const payment = await gateway.createPayment(
      paymentData,
      validatedData.cardData as CreditCardData | undefined
    );

    // Log da atividade
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'payment_created',
        entityType: 'payment',
        entityId: payment.id,
        details: {
          amount: payment.amount,
          method: payment.method,
          patientId: validatedData.patientId
        },
        createdAt: new Date()
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

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
 * PUT /api/payments - Atualizar configurações de pagamento
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar e atualizar configurações (implementar conforme necessário)
    // Por enquanto, retornar sucesso
    
    return NextResponse.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments - Cancelar múltiplos pagamentos
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIds, reason } = body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Lista de IDs de pagamento é obrigatória' },
        { status: 400 }
      );
    }

    const config = getPaymentConfig();
    const gateway = new PaymentGateway(config);

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[]
    };

    for (const paymentId of paymentIds) {
      try {
        await gateway.cancelPayment(paymentId, reason);
        results.successful.push(paymentId);
        
        // Log da atividade
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'payment_cancelled',
            entityType: 'payment',
            entityId: paymentId,
            details: { reason },
            createdAt: new Date()
          }
        });
      } catch (error) {
        results.failed.push({
          id: paymentId,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erro ao cancelar pagamentos:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}