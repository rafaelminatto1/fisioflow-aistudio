import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      issued_by: session.user.id,
    };

    if (search) {
      where.OR = [
        { receipt_number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          patients: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.service_date = {};
      if (startDate) {
        where.service_date.gte = new Date(startDate);
      }
      if (endDate) {
        where.service_date.lte = new Date(endDate);
      }
    }

    // Buscar recibos
    const [receipts, totalCount] = await Promise.all([
      prisma.receipts.findMany({
        where,
        include: {
          patients: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true
            }
          },
          financial_transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              description: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          service_date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.receipts.count({ where })
    ]);

    // Calcular estatísticas
    const stats = await calculateReceiptStats(session.user.id);

    return NextResponse.json({
      receipts,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar recibos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      appointmentId,
      amount,
      description,
      paymentMethod,
      service_date: issueDate,
      dueDate,
      template = 'default',
      notes
    } = body;

    // Validações
    if (!patientId || !amount || !description || !paymentMethod || !issueDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: patientId, amount, description, paymentMethod, issue_date' },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o agendamento existe (se fornecido)
    if (appointmentId) {
      const appointment = await prisma.appointments.findFirst({
        where: {
          id: appointmentId,
          therapist_id: session.user.id
        }
      });

      if (!appointment) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        );
      }
    }

    // Gerar número sequencial do recibo
    const receiptNumber = await generateReceiptNumber(session.user.id);

    // Criar transação financeira primeiro
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = await prisma.financial_transactions.create({
      data: {
        id: transactionId,
        type: 'INCOME',
        amount: parseFloat(amount),
        description,
        date: new Date(issueDate),
        patient_id: patientId,
        user_id: session.user.id
      }
    });

    // Criar recibo
    const receiptId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const receipt = await prisma.receipts.create({
      data: {
        id: receiptId,
        receipt_number: receiptNumber,
        transaction_id: transaction.id,
        patient_id: patientId,
        amount: parseFloat(amount),
        description,
        service_date: new Date(issueDate),
        payment_method: paymentMethod,
        notes: notes || null,
        issued_by: session.user.id,
        updated_at: new Date()
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
        financial_transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      amount,
      description,
      paymentMethod,
      issueDate,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recibo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o recibo existe e pertence ao usuário
    const existingReceipt = await prisma.receipts.findFirst({
      where: {
        id,
        issued_by: session.user.id
      }
    });

    if (!existingReceipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (paymentMethod !== undefined) updateData.payment_method = paymentMethod;
    if (issueDate !== undefined) updateData.service_date = new Date(issueDate);
    if (notes !== undefined) updateData.notes = notes || null;

    // Atualizar recibo
    const receipt = await prisma.receipts.update({
      where: { id },
      data: updateData,
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        financial_transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Erro ao atualizar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recibo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o recibo existe e pertence ao usuário
    const existingReceipt = await prisma.receipts.findFirst({
      where: {
        id,
        issued_by: session.user.id
      }
    });

    if (!existingReceipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    // Deletar recibo
    await prisma.receipts.delete({
      where: { id }
    });

    const receipt = { id, message: 'Recibo cancelado com sucesso' };

    return NextResponse.json({ message: 'Recibo cancelado com sucesso', receipt });
  } catch (error) {
    console.error('Erro ao cancelar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar número sequencial do recibo
async function generateReceiptNumber(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `REC-${currentYear}-`;

  // Buscar o último recibo do ano
  const lastReceipt = await prisma.receipts.findFirst({
    where: {
      issued_by: userId,
      receipt_number: {
        startsWith: prefix
      }
    },
    orderBy: {
      receipt_number: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastReceipt) {
    const lastNumber = parseInt(lastReceipt.receipt_number.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// Função auxiliar para calcular estatísticas
async function calculateReceiptStats(userId: string) {
  const [totalStats, paidStats, pendingStats] = await Promise.all([
    prisma.receipts.aggregate({
      where: {
        issued_by: userId
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.receipts.aggregate({
      where: {
        issued_by: userId
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.receipts.aggregate({
      where: {
        issued_by: userId
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    })
  ]);

  return {
    totalIssued: totalStats._count.id ?? 0,
    totalAmount: totalStats._sum.amount ?? 0,
    paidCount: paidStats._count.id ?? 0,
    paidAmount: paidStats._sum.amount ?? 0,
    pendingCount: pendingStats._count.id ?? 0,
    pendingAmount: pendingStats._sum.amount ?? 0
  };
}