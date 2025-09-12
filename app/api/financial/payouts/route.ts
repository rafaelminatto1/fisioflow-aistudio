import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

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
      where.professional_id = professionalId;
    }

    if (period) {
      where.period = period;
    }

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.professional_payouts.findMany({
        where,
        include: {
          users: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.professional_payouts.count({ where }),
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
    const existingPayout = await prisma.professional_payouts.findUnique({
      where: {
        professional_id_period: {
          professional_id: professionalId,
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

    const payout = await prisma.professional_payouts.create({
      data: {
        id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        professional_id: professionalId,
        period,
        base_amount: parseFloat(baseAmount),
        commission_rate: parseFloat(commissionRate),
        gross_amount: grossAmount,
        deductions: parseFloat(deductions),
        net_amount: netAmount,
        status: 'pending',
      },
      include: {
        users: {
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
      if (status === 'paid' && !paidAt) {
        updateData.paidAt = new Date();
      } else if (status !== 'paid') {
        updateData.paidAt = null;
      }
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt);
    }

    // Recalculate amounts if base values change
    if (baseAmount || commissionRate || deductions !== undefined) {
      const currentPayout = await prisma.professional_payouts.findUnique({
        where: { id },
      });

      if (!currentPayout) {
        return NextResponse.json(
          { error: 'Repasse não encontrado' },
          { status: 404 }
        );
      }

      const newBaseAmount = baseAmount ? parseFloat(baseAmount) : Number(currentPayout.base_amount);
      const newCommissionRate = commissionRate ? parseFloat(commissionRate) : Number(currentPayout.commission_rate);
      const newDeductions = deductions !== undefined ? parseFloat(deductions) : Number(currentPayout.deductions);

      updateData.base_amount = newBaseAmount;
      updateData.commission_rate = newCommissionRate;
      updateData.deductions = newDeductions;
      updateData.gross_amount = Number(newBaseAmount) * Number(newCommissionRate);
      updateData.net_amount = Number(updateData.gross_amount) - Number(newDeductions);
    }

    const updatedPayout = await prisma.professional_payouts.update({
      where: { id },
      data: updateData,
      include: {
        users: {
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