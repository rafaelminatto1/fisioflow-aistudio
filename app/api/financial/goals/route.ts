import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

const prisma = new PrismaClient();

interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  type: 'REVENUE' | 'PROFIT' | 'PATIENTS' | 'APPOINTMENTS';
  targetValue: number;
  currentValue: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock goals data - in a real implementation, this would be in the database
const mockGoals: FinancialGoal[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Meta de Receita Mensal',
    type: 'REVENUE',
    targetValue: 15000,
    currentValue: 12500,
    period: 'MONTHLY',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    isActive: true,
    description: 'Atingir R$ 15.000 em receitas mensais',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Meta de Lucro Trimestral',
    type: 'PROFIT',
    targetValue: 30000,
    currentValue: 18750,
    period: 'QUARTERLY',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 2, 31),
    isActive: true,
    description: 'Lucro líquido de R$ 30.000 no primeiro trimestre',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    userId: 'user1',
    name: 'Meta de Novos Pacientes',
    type: 'PATIENTS',
    targetValue: 50,
    currentValue: 32,
    period: 'MONTHLY',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    isActive: true,
    description: 'Cadastrar 50 novos pacientes por mês',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    userId: 'user1',
    name: 'Meta de Atendimentos Anuais',
    type: 'APPOINTMENTS',
    targetValue: 2000,
    currentValue: 156,
    period: 'YEARLY',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
    isActive: true,
    description: 'Realizar 2.000 atendimentos no ano',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['REVENUE', 'PROFIT', 'PATIENTS', 'APPOINTMENTS']),
  targetValue: z.number().positive('Valor da meta deve ser positivo'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredGoals = mockGoals.filter(goal => goal.userId === session.user.id);

    // Apply filters
    if (type) {
      filteredGoals = filteredGoals.filter(goal => goal.type === type);
    }

    if (period) {
      filteredGoals = filteredGoals.filter(goal => goal.period === period);
    }

    if (active !== null) {
      const isActive = active === 'true';
      filteredGoals = filteredGoals.filter(goal => goal.isActive === isActive);
    }

    // Calculate current values for each goal
    for (const goal of filteredGoals) {
      goal.currentValue = await calculateCurrentValue(goal, session.user.id);
    }

    // Pagination
    const total = filteredGoals.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGoals = filteredGoals.slice(startIndex, endIndex);

    // Calculate progress and status for each goal
    const goalsWithProgress = paginatedGoals.map(goal => {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      const daysRemaining = Math.ceil(
        (goal.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let status: 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'expired';
      
      if (progress >= 100) {
        status = 'achieved';
      } else if (daysRemaining < 0) {
        status = 'expired';
      } else if (progress >= 80) {
        status = 'on_track';
      } else if (progress >= 50) {
        status = 'at_risk';
      } else {
        status = 'behind';
      }

      return {
        ...goal,
        progress: Math.min(progress, 100),
        daysRemaining: Math.max(daysRemaining, 0),
        status
      };
    });

    return NextResponse.json({
      success: true,
      goals: goalsWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = goalSchema.parse(body);

    // Validate date range
    if (validatedData.endDate <= validatedData.startDate) {
      return NextResponse.json(
        { error: 'Data final deve ser posterior à data inicial' },
        { status: 400 }
      );
    }

    // Create new goal
    const newGoal: FinancialGoal = {
      id: (mockGoals.length + 1).toString(),
      userId: session.user.id,
      name: validatedData.name,
      type: validatedData.type,
      targetValue: validatedData.targetValue,
      currentValue: 0,
      period: validatedData.period,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      isActive: validatedData.isActive,
      description: validatedData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate initial current value
    newGoal.currentValue = await calculateCurrentValue(newGoal, session.user.id);

    // In a real implementation, save to database
    mockGoals.push(newGoal);

    return NextResponse.json({
      success: true,
      goal: newGoal,
      message: 'Meta criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar meta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      );
    }

    // Find goal
    const goalIndex = mockGoals.findIndex(
      goal => goal.id === id && goal.userId === session.user.id
    );

    if (goalIndex === -1) {
      return NextResponse.json(
        { error: 'Meta não encontrada' },
        { status: 404 }
      );
    }

    // Validate update data
    const validatedData = goalSchema.partial().parse(updateData);

    // Update goal
    const updatedGoal = {
      ...mockGoals[goalIndex],
      ...validatedData,
      updatedAt: new Date()
    };

    // Recalculate current value
    updatedGoal.currentValue = await calculateCurrentValue(updatedGoal, session.user.id);

    mockGoals[goalIndex] = updatedGoal;

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      message: 'Meta atualizada com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar meta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      );
    }

    // Find goal
    const goalIndex = mockGoals.findIndex(
      goal => goal.id === id && goal.userId === session.user.id
    );

    if (goalIndex === -1) {
      return NextResponse.json(
        { error: 'Meta não encontrada' },
        { status: 404 }
      );
    }

    // Remove goal
    const deletedGoal = mockGoals.splice(goalIndex, 1)[0];

    return NextResponse.json({
      success: true,
      goal: deletedGoal,
      message: 'Meta excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function calculateCurrentValue(goal: FinancialGoal, userId: string): Promise<number> {
  try {
    switch (goal.type) {
      case 'REVENUE':
        const revenue = await prisma.financialTransaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            status: 'PAID',
            createdAt: {
              gte: goal.startDate,
              lte: goal.endDate
            }
          },
          _sum: {
            amount: true
          }
        });
        return revenue._sum.amount || 0;

      case 'PROFIT':
        const income = await prisma.financialTransaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            status: 'PAID',
            createdAt: {
              gte: goal.startDate,
              lte: goal.endDate
            }
          },
          _sum: {
            amount: true
          }
        });

        const expenses = await prisma.financialTransaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            createdAt: {
              gte: goal.startDate,
              lte: goal.endDate
            }
          },
          _sum: {
            amount: true
          }
        });

        return (income._sum.amount || 0) - (expenses._sum.amount || 0);

      case 'PATIENTS':
        const patients = await prisma.patient.count({
          where: {
            userId,
            createdAt: {
              gte: goal.startDate,
              lte: goal.endDate
            }
          }
        });
        return patients;

      case 'APPOINTMENTS':
        const appointments = await prisma.appointment.count({
          where: {
            userId,
            status: 'COMPLETED',
            createdAt: {
              gte: goal.startDate,
              lte: goal.endDate
            }
          }
        });
        return appointments;

      default:
        return 0;
    }
  } catch (error) {
    console.error('Erro ao calcular valor atual da meta:', error);
    return 0;
  }
}