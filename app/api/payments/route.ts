import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Schemas de validação
const CreatePaymentSchema = z.object({
  patientId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer']),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

const PaymentQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20),
  patientId: z.string().optional(),
  status: z.enum(['pending', 'paid']).optional(),
  method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * GET /api/payments - Listar pagamentos
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
    const filters = PaymentQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // Configurar filtros baseados nas permissões
    let patientFilter = filters.patientId;
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      patientFilter = session.user.id; // Usuário só vê seus próprios pagamentos
    }

    const where: any = {};
    
    if (patientFilter) {
      where.patientId = patientFilter;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.method) {
      where.method = filters.method;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      payments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);

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
 * POST /api/payments - Criar novo pagamento
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

    // Apenas admin e médicos podem criar pagamentos
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);

    // Verificar se paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Criar pagamento
    const payment = await prisma.payment.create({
      data: {
        patientId: validatedData.patientId,
        amount: validatedData.amount,
        method: validatedData.method,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: 'pending'
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
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

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}