import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Buscar transações
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true
            }
          },
          appointment: {
            select: {
              id: true,
              service: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    // Calcular estatísticas
    const stats = await calculateTransactionStats(session.user.id, where);

    return NextResponse.json({
      transactions,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
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
      description,
      amount,
      type,
      category,
      date,
      status = 'PAID',
      paymentMethod,
      patientId,
      appointmentId,
      notes
    } = body;

    // Validações
    if (!description || !amount || !type || !category || !date || !paymentMethod) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: description, amount, type, category, date, paymentMethod' },
        { status: 400 }
      );
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser INCOME ou EXPENSE' },
        { status: 400 }
      );
    }

    if (!['PAID', 'PENDING', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status deve ser PAID, PENDING ou CANCELLED' },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe (se fornecido)
    if (patientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          userId: session.user.id
        }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente não encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar se o agendamento existe (se fornecido)
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          userId: session.user.id
        }
      });

      if (!appointment) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        );
      }
    }

    // Criar transação
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        status,
        paymentMethod,
        patientId: patientId || null,
        appointmentId: appointmentId || null,
        notes: notes || null,
        userId: session.user.id
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        appointment: {
          select: {
            id: true,
            service: true
          }
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
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
      description,
      amount,
      type,
      category,
      date,
      status,
      paymentMethod,
      patientId,
      appointmentId,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    if (status !== undefined) updateData.status = status;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (patientId !== undefined) updateData.patientId = patientId || null;
    if (appointmentId !== undefined) updateData.appointmentId = appointmentId || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Atualizar transação
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        appointment: {
          select: {
            id: true,
            service: true
          }
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
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
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Deletar transação
    await prisma.transaction.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular estatísticas
async function calculateTransactionStats(userId: string, baseWhere: any) {
  const whereCondition = {
    ...baseWhere,
    userId
  };

  // Remover filtros de data para estatísticas gerais
  const { date, ...whereWithoutDate } = whereCondition;

  const [incomeStats, expenseStats, pendingStats, totalCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ...whereWithoutDate,
        type: 'INCOME',
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        ...whereWithoutDate,
        type: 'EXPENSE',
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        ...whereWithoutDate,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.count({
      where: whereCondition
    })
  ]);

  const totalIncome = incomeStats._sum.amount || 0;
  const totalExpenses = expenseStats._sum.amount || 0;
  const pendingAmount = pendingStats._sum.amount || 0;
  const netFlow = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netFlow,
    pendingAmount,
    transactionCount: totalCount
  };
}