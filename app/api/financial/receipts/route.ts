import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const CreateReceiptSchema = z.object({
  transactionId: z.string().min(1),
  patientId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1),
  serviceDate: z.string().datetime(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'insurance']),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().positive(),
    total: z.number().positive(),
  })).optional(),
});

const ReceiptQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20),
  patientId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  receiptNumber: z.string().optional(),
});

/**
 * GET /api/financial/receipts - Listar recibos
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
    const filters = ReceiptQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const where: any = {};
    
    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.receiptNumber) {
      where.receiptNumber = {
        contains: filters.receiptNumber,
        mode: 'insensitive'
      };
    }

    if (filters.startDate || filters.endDate) {
      where.serviceDate = {};
      if (filters.startDate) {
        where.serviceDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.serviceDate.lte = new Date(filters.endDate);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
        include: {
          patient: {
            select: { 
              id: true, 
              name: true, 
              cpf: true, 
              email: true,
              phone: true,
              address: true
            }
          },
          transaction: {
            select: { id: true, type: true, category: true }
          }
        }
      }),
      prisma.receipt.count({ where })
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      receipts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar recibos:', error);

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
 * POST /api/financial/receipts - Criar novo recibo
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

    // Apenas admin e fisioterapeutas podem criar recibos
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateReceiptSchema.parse(body);

    // Verificar se transação existe
    const transaction = await prisma.financialTransaction.findUnique({
      where: { id: validatedData.transactionId },
      include: { patient: true }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

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

    // Verificar se já existe recibo para essa transação
    const existingReceipt = await prisma.receipt.findUnique({
      where: { transactionId: validatedData.transactionId }
    });

    if (existingReceipt) {
      return NextResponse.json(
        { error: 'Recibo já existe para esta transação' },
        { status: 409 }
      );
    }

    // Gerar número do recibo
    const receiptCount = await prisma.receipt.count();
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(6, '0')}`;

    // Criar recibo
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        transactionId: validatedData.transactionId,
        patientId: validatedData.patientId,
        amount: validatedData.amount,
        description: validatedData.description,
        serviceDate: new Date(validatedData.serviceDate),
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        items: validatedData.items ? JSON.stringify(validatedData.items) : undefined,
        issuedBy: session.user.id,
      },
      include: {
        patient: {
          select: { 
            id: true, 
            name: true, 
            cpf: true, 
            email: true,
            phone: true,
            address: true
          }
        },
        transaction: {
          select: { id: true, type: true, category: true }
        },
        issuer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(receipt, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar recibo:', error);

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