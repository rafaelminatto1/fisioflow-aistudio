import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayoutStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');
    const period = searchParams.get('period');
    const status = searchParams.get('status') as PayoutStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (professionalId) {
      where.professionalId = professionalId;
    }

    if (period) {
      where.period = period;
    }

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.professionalPayout.findMany({
        where,
        include: {
          professional: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.professionalPayout.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching professional payouts:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar repasses profissionais' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      professionalId, 
      period, 
      baseAmount, 
      commissionRate, 
      deductions = 0 
    } = body;

    // Validate required fields
    if (!professionalId || !period || !baseAmount || !commissionRate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: professionalId, period, baseAmount, commissionRate' },
        { status: 400 }
      );
    }

    // Check if payout already exists for this professional and period
    const existingPayout = await prisma.professionalPayout.findUnique({
      where: {
        professionalId_period: {
          professionalId,
          period,
        },
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: 'Repasse já existe para este profissional neste período' },
        { status: 409 }
      );
    }

    // Calculate amounts
    const grossAmount = parseFloat(baseAmount) * parseFloat(commissionRate);
    const netAmount = grossAmount - parseFloat(deductions);

    const payout = await prisma.professionalPayout.create({
      data: {
        professionalId,
        period,
        baseAmount: parseFloat(baseAmount),
        commissionRate: parseFloat(commissionRate),
        grossAmount,
        deductions: parseFloat(deductions),
        netAmount,
        status: PayoutStatus.PENDING,
      },
      include: {
        professional: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Error creating professional payout:', error);
    return NextResponse.json(
      { error: 'Erro ao criar repasse profissional' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      status, 
      baseAmount, 
      commissionRate, 
      deductions,
      paidAt 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do repasse é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // If marking as paid, set paidAt timestamp
      if (status === PayoutStatus.PAID && !paidAt) {
        updateData.paidAt = new Date();
      } else if (status !== PayoutStatus.PAID) {
        updateData.paidAt = null;
      }
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt);
    }

    // Recalculate amounts if base values change
    if (baseAmount || commissionRate || deductions !== undefined) {
      const currentPayout = await prisma.professionalPayout.findUnique({
        where: { id },
      });

      if (!currentPayout) {
        return NextResponse.json(
          { error: 'Repasse não encontrado' },
          { status: 404 }
        );
      }

      const newBaseAmount = baseAmount ? parseFloat(baseAmount) : currentPayout.baseAmount;
      const newCommissionRate = commissionRate ? parseFloat(commissionRate) : currentPayout.commissionRate;
      const newDeductions = deductions !== undefined ? parseFloat(deductions) : currentPayout.deductions;

      updateData.baseAmount = newBaseAmount;
      updateData.commissionRate = newCommissionRate;
      updateData.deductions = newDeductions;
      updateData.grossAmount = Number(newBaseAmount) * Number(newCommissionRate);
      updateData.netAmount = Number(updateData.grossAmount) - Number(newDeductions);
    }

    const updatedPayout = await prisma.professionalPayout.update({
      where: { id },
      data: updateData,
      include: {
        professional: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    return NextResponse.json(updatedPayout);
  } catch (error) {
    console.error('Error updating professional payout:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar repasse profissional' },
      { status: 500 }
    );
  }
}