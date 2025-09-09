import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type FinancialTransactionType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') as FinancialTransactionType | null;
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (type) {
      where.type = type;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, cpf: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching financial transactions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações financeiras' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, description, date, patientId, userId, category } = body;

    // Validate required fields
    if (!type || !amount || !description || !date || !userId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, amount, description, date, userId' },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de transação inválido' },
        { status: 400 }
      );
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        patientId: patientId || null,
        userId,
        category: category || null,
      },
      include: {
        patient: {
          select: { id: true, name: true, cpf: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating financial transaction:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação financeira' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, amount, description, date, patientId, userId, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    const updatedTransaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(patientId !== undefined && { patientId: patientId || null }),
        ...(userId && { userId }),
        ...(category !== undefined && { category: category || null }),
      },
      include: {
        patient: {
          select: { id: true, name: true, cpf: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating financial transaction:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar transação financeira' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.financialTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting financial transaction:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar transação financeira' },
      { status: 500 }
    );
  }
}