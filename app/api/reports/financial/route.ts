import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

// Schema para parâmetros de relatório
const ReportParamsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month')
});

/**
 * GET /api/reports/financial - Relatórios financeiros
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

    // Apenas admin e médicos podem acessar relatórios financeiros
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = ReportParamsSchema.parse(Object.fromEntries(searchParams.entries()));

    // Determinar período de análise
    let startDate: Date;
    let endDate: Date;

    const now = new Date();
    
    switch (params.period) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (!params.startDate || !params.endDate) {
          return NextResponse.json(
            { error: 'startDate e endDate são obrigatórios para período customizado' },
            { status: 400 }
          );
        }
        startDate = new Date(params.startDate);
        endDate = new Date(params.endDate);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Métricas básicas de pagamentos
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      totalRevenue,
      paymentsByMethod
    ] = await Promise.all([
      prisma.payment.count({ where: dateFilter }),
      prisma.payment.count({ 
        where: { ...dateFilter, status: 'paid' } 
      }),
      prisma.payment.count({ 
        where: { ...dateFilter, status: 'pending' } 
      }),
      prisma.payment.aggregate({
        where: { ...dateFilter, status: 'paid' },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: dateFilter,
        _count: { method: true },
        _sum: { amount: true }
      })
    ]);

    // Pagamentos por status
    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true },
      _sum: { amount: true }
    });

    // Resumo por período
    const report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: params.period
      },
      overview: {
        totalPayments,
        paidPayments,
        pendingPayments,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        averagePayment: totalPayments > 0 ? Number(totalRevenue._sum.amount || 0) / totalPayments : 0
      },
      byMethod: paymentsByMethod.map(item => ({
        method: item.method,
        count: item._count.method,
        total: Number(item._sum.amount || 0)
      })),
      byStatus: paymentsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
        total: Number(item._sum.amount || 0)
      }))
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);

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