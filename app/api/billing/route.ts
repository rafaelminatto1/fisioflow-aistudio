import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingSystem, CreateSubscriptionData, CreateInvoiceData } from '@/lib/payment/billing-system';

// Schema para criação de assinatura
const CreateSubscriptionSchema = z.object({
  patientId: z.string().uuid(),
  planId: z.string(),
  planName: z.string().min(1),
  amount: z.number().positive(),
  interval: z.enum(['monthly', 'quarterly', 'yearly']),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
  metadata: z.record(z.any()).optional()
});

// Schema para criação de fatura
const CreateInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive()
  })),
  metadata: z.record(z.any()).optional()
});

// Schema para filtros de listagem
const ListFiltersSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional()
});

// Instância do sistema de cobrança
const billingSystem = new BillingSystem();

/**
 * GET /api/billing - Listar assinaturas e faturas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscriptions'; // 'subscriptions' ou 'invoices'
    
    const filters = ListFiltersSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      patientId: searchParams.get('patientId'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search')
    });

    // Verificar permissões
    const isAdmin = session.user.role === 'admin';
    const isDoctor = session.user.role === 'doctor';
    const isPatient = session.user.role === 'patient';

    if (!isAdmin && !isDoctor && !isPatient) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Filtrar por paciente se não for admin/médico
    if (isPatient) {
      filters.patientId = session.user.id;
    }

    const skip = (filters.page - 1) * filters.limit;

    if (type === 'subscriptions') {
      // Listar assinaturas
      const where: any = {};
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { planName: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: filters.limit,
          include: {
            patient: {
              select: { id: true, name: true, email: true }
            },
            invoices: {
              select: { id: true, status: true, amount: true, dueDate: true },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }),
        prisma.subscription.count({ where })
      ]);

      return NextResponse.json({
        subscriptions,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      });
    } else {
      // Listar faturas
      const where: any = {};
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: filters.limit,
          include: {
            patient: {
              select: { id: true, name: true, email: true }
            },
            subscription: {
              select: { id: true, planName: true, status: true }
            },
            payments: {
              select: { id: true, status: true, amount: true, method: true, createdAt: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        prisma.invoice.count({ where })
      ]);

      return NextResponse.json({
        invoices,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      });
    }
  } catch (error) {
    console.error('Erro ao listar dados de cobrança:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
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
 * POST /api/billing - Criar assinatura ou fatura
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin e médicos podem criar assinaturas/faturas
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscription';

    if (type === 'subscription') {
      // Criar assinatura
      const data = CreateSubscriptionSchema.parse(body);

      // Verificar se o paciente existe
      const patient = await prisma.user.findUnique({
        where: { id: data.patientId, role: 'patient' }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        );
      }

      // Verificar se já existe assinatura ativa para o mesmo plano
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          patientId: data.patientId,
          planId: data.planId,
          status: { in: ['active', 'trial'] }
        }
      });

      if (existingSubscription) {
        return NextResponse.json(
          { error: 'Paciente já possui assinatura ativa para este plano' },
          { status: 409 }
        );
      }

      const subscriptionData: CreateSubscriptionData = {
        patientId: data.patientId,
        planId: data.planId,
        planName: data.planName,
        amount: data.amount,
        interval: data.interval,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        trialDays: data.trialDays,
        metadata: data.metadata
      };

      const subscription = await billingSystem.createSubscription(subscriptionData);

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'subscription_created',
          entityType: 'subscription',
          entityId: subscription.id,
          details: {
            patientId: data.patientId,
            planId: data.planId,
            amount: data.amount,
            interval: data.interval
          },
          createdAt: new Date()
        }
      });

      // Criar notificação para o paciente
      await prisma.notification.create({
        data: {
          userId: data.patientId,
          type: 'subscription_created',
          title: 'Nova Assinatura',
          message: `Sua assinatura do plano ${data.planName} foi criada com sucesso.`,
          data: {
            subscriptionId: subscription.id,
            planName: data.planName,
            amount: data.amount
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(subscription, { status: 201 });
    } else {
      // Criar fatura
      const data = CreateInvoiceSchema.parse(body);

      // Verificar se o paciente existe
      const patient = await prisma.user.findUnique({
        where: { id: data.patientId, role: 'patient' }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        );
      }

      // Verificar se a assinatura existe (se fornecida)
      if (data.subscriptionId) {
        const subscription = await prisma.subscription.findUnique({
          where: { id: data.subscriptionId }
        });

        if (!subscription) {
          return NextResponse.json(
            { error: 'Assinatura não encontrada' },
            { status: 404 }
          );
        }

        if (subscription.patientId !== data.patientId) {
          return NextResponse.json(
            { error: 'Assinatura não pertence ao paciente informado' },
            { status: 400 }
          );
        }
      }

      const invoiceData: CreateInvoiceData = {
        patientId: data.patientId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        description: data.description,
        dueDate: new Date(data.dueDate),
        items: data.items,
        metadata: data.metadata
      };

      const invoice = await billingSystem.createInvoice(invoiceData);

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'invoice_created',
          entityType: 'invoice',
          entityId: invoice.id,
          details: {
            patientId: data.patientId,
            subscriptionId: data.subscriptionId,
            amount: data.amount,
            dueDate: data.dueDate
          },
          createdAt: new Date()
        }
      });

      // Criar notificação para o paciente
      await prisma.notification.create({
        data: {
          userId: data.patientId,
          type: 'invoice_created',
          title: 'Nova Fatura',
          message: `Uma nova fatura de R$ ${data.amount.toFixed(2)} foi gerada para você.`,
          data: {
            invoiceId: invoice.id,
            amount: data.amount,
            dueDate: data.dueDate
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(invoice, { status: 201 });
    }
  } catch (error) {
    console.error('Erro ao criar dados de cobrança:', error);
    
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
 * PUT /api/billing - Processar cobranças automáticas
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin pode processar cobranças automáticas
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'process_billing') {
      // Processar cobranças automáticas
      const result = await billingSystem.processAutomaticBilling();

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'automatic_billing_processed',
          entityType: 'system',
          entityId: 'billing_system',
          details: {
            processedInvoices: result.processedInvoices,
            successfulCharges: result.successfulCharges,
            failedCharges: result.failedCharges,
            totalAmount: result.totalAmount
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(result);
    } else if (action === 'retry_failed') {
      // Tentar novamente cobranças falhadas
      const result = await billingSystem.retryFailedCharges();

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'failed_charges_retried',
          entityType: 'system',
          entityId: 'billing_system',
          details: {
            retriedCharges: result.retriedCharges,
            successfulRetries: result.successfulRetries,
            stillFailedCharges: result.stillFailedCharges
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar cobrança:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing - Cancelar assinatura ou fatura
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscription';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    if (type === 'subscription') {
      // Cancelar assinatura
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar permissões
      const isAdmin = session.user.role === 'admin';
      const isDoctor = session.user.role === 'doctor';
      const isOwner = session.user.id === subscription.patientId;

      if (!isAdmin && !isDoctor && !isOwner) {
        return NextResponse.json(
          { error: 'Permissão negada' },
          { status: 403 }
        );
      }

      const result = await billingSystem.cancelSubscription(id);

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'subscription_cancelled',
          entityType: 'subscription',
          entityId: id,
          details: {
            patientId: subscription.patientId,
            planName: subscription.planName,
            cancelledBy: session.user.role
          },
          createdAt: new Date()
        }
      });

      // Criar notificação para o paciente
      await prisma.notification.create({
        data: {
          userId: subscription.patientId,
          type: 'subscription_cancelled',
          title: 'Assinatura Cancelada',
          message: `Sua assinatura do plano ${subscription.planName} foi cancelada.`,
          data: {
            subscriptionId: id,
            planName: subscription.planName
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Tipo de cancelamento não suportado' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}