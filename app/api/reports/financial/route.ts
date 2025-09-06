import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns';

// Schema para filtros de relatório
const ReportFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear', 'custom']).optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'cancelled', 'expired']).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
  includeDetails: z.boolean().optional()
});

/**
 * GET /api/reports/financial - Gerar relatórios financeiros
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
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    
    const filters = ReportFiltersSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period'),
      patientId: searchParams.get('patientId'),
      doctorId: searchParams.get('doctorId'),
      paymentMethod: searchParams.get('paymentMethod'),
      paymentStatus: searchParams.get('paymentStatus'),
      groupBy: searchParams.get('groupBy'),
      includeDetails: searchParams.get('includeDetails') === 'true'
    });

    // Determinar período de datas
    const { startDate, endDate } = getDateRange(filters.period, filters.startDate, filters.endDate);

    switch (reportType) {
      case 'overview':
        return NextResponse.json(await generateOverviewReport(startDate, endDate, filters));
      
      case 'revenue':
        return NextResponse.json(await generateRevenueReport(startDate, endDate, filters));
      
      case 'payments':
        return NextResponse.json(await generatePaymentsReport(startDate, endDate, filters));
      
      case 'subscriptions':
        return NextResponse.json(await generateSubscriptionsReport(startDate, endDate, filters));
      
      case 'invoices':
        return NextResponse.json(await generateInvoicesReport(startDate, endDate, filters));
      
      case 'trends':
        return NextResponse.json(await generateTrendsReport(startDate, endDate, filters));
      
      default:
        return NextResponse.json(
          { error: 'Tipo de relatório não reconhecido' },
          { status: 400 }
        );
    }
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

/**
 * Determinar período de datas baseado nos filtros
 */
function getDateRange(period?: string, startDateStr?: string, endDateStr?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  if (period === 'custom' && startDateStr && endDateStr) {
    return {
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr)
    };
  }

  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
    
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
    
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 7)),
        endDate: endOfDay(now)
      };
    
    case 'last30days':
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now)
      };
    
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    
    case 'thisYear':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
    
    case 'lastYear':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    
    default:
      // Padrão: últimos 30 dias
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now)
      };
  }
}

/**
 * Gerar relatório de visão geral
 */
async function generateOverviewReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.paymentMethod) where.method = filters.paymentMethod;
  if (filters.paymentStatus) where.status = filters.paymentStatus;

  // Estatísticas gerais
  const [totalRevenue, totalPayments, paidPayments, pendingPayments, failedPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: { ...where, status: 'paid' },
      _sum: { amount: true }
    }),
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { ...where, status: 'paid' } }),
    prisma.payment.count({ where: { ...where, status: 'pending' } }),
    prisma.payment.count({ where: { ...where, status: 'failed' } })
  ]);

  // Receita por método de pagamento
  const revenueByMethod = await prisma.payment.groupBy({
    by: ['method'],
    where: { ...where, status: 'paid' },
    _sum: { amount: true },
    _count: true
  });

  // Assinaturas ativas
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      status: 'active',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Receita recorrente mensal (MRR)
  const monthlyRecurringRevenue = await prisma.subscription.aggregate({
    where: {
      status: 'active',
      interval: 'monthly'
    },
    _sum: { amount: true }
  });

  return {
    period: {
      startDate,
      endDate
    },
    summary: {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      successRate: totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0,
      activeSubscriptions,
      monthlyRecurringRevenue: monthlyRecurringRevenue._sum.amount || 0
    },
    revenueByMethod: revenueByMethod.map(item => ({
      method: item.method,
      revenue: item._sum.amount || 0,
      count: item._count
    }))
  };
}

/**
 * Gerar relatório de receita
 */
async function generateRevenueReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    },
    status: 'paid'
  };

  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.paymentMethod) where.method = filters.paymentMethod;

  // Receita total
  const totalRevenue = await prisma.payment.aggregate({
    where,
    _sum: { amount: true },
    _avg: { amount: true },
    _count: true
  });

  // Receita por período (agrupamento)
  let groupByField = 'DATE(createdAt)';
  if (filters.groupBy === 'week') groupByField = 'YEARWEEK(createdAt)';
  else if (filters.groupBy === 'month') groupByField = 'DATE_FORMAT(createdAt, "%Y-%m")';
  else if (filters.groupBy === 'year') groupByField = 'YEAR(createdAt)';

  const revenueByPeriod = await prisma.$queryRaw`
    SELECT 
      ${groupByField} as period,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM Payment 
    WHERE createdAt >= ${startDate} 
      AND createdAt <= ${endDate}
      AND status = 'paid'
      ${filters.patientId ? `AND patientId = '${filters.patientId}'` : ''}
      ${filters.paymentMethod ? `AND method = '${filters.paymentMethod}'` : ''}
    GROUP BY ${groupByField}
    ORDER BY period
  `;

  // Top pacientes por receita
  const topPatients = await prisma.payment.groupBy({
    by: ['patientId'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  });

  // Buscar dados dos pacientes
  const patientIds = topPatients.map(p => p.patientId);
  const patients = await prisma.user.findMany({
    where: {
      id: { in: patientIds },
      role: 'patient'
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  const topPatientsWithData = topPatients.map(patient => {
    const patientData = patients.find(p => p.id === patient.patientId);
    return {
      patient: patientData,
      revenue: patient._sum.amount || 0,
      transactions: patient._count
    };
  });

  return {
    period: {
      startDate,
      endDate
    },
    summary: {
      totalRevenue: totalRevenue._sum.amount || 0,
      averageTransaction: totalRevenue._avg.amount || 0,
      totalTransactions: totalRevenue._count
    },
    revenueByPeriod,
    topPatients: topPatientsWithData
  };
}

/**
 * Gerar relatório de pagamentos
 */
async function generatePaymentsReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.paymentMethod) where.method = filters.paymentMethod;
  if (filters.paymentStatus) where.status = filters.paymentStatus;

  // Estatísticas por status
  const paymentsByStatus = await prisma.payment.groupBy({
    by: ['status'],
    where,
    _sum: { amount: true },
    _count: true
  });

  // Estatísticas por método
  const paymentsByMethod = await prisma.payment.groupBy({
    by: ['method'],
    where,
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true }
  });

  // Pagamentos detalhados (se solicitado)
  let paymentDetails = null;
  if (filters.includeDetails) {
    paymentDetails = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        consultation: {
          select: { id: true, type: true }
        },
        appointment: {
          select: { id: true, date: true }
        }
      }
    });
  }

  // Taxa de conversão por método
  const conversionRates = paymentsByMethod.map(method => {
    const totalAttempts = method._count;
    const successfulPayments = paymentsByStatus.find(
      status => status.status === 'paid'
    )?._count || 0;
    
    return {
      method: method.method,
      attempts: totalAttempts,
      successful: successfulPayments,
      conversionRate: totalAttempts > 0 ? (successfulPayments / totalAttempts) * 100 : 0
    };
  });

  return {
    period: {
      startDate,
      endDate
    },
    paymentsByStatus: paymentsByStatus.map(item => ({
      status: item.status,
      count: item._count,
      amount: item._sum.amount || 0
    })),
    paymentsByMethod: paymentsByMethod.map(item => ({
      method: item.method,
      count: item._count,
      amount: item._sum.amount || 0,
      averageAmount: item._avg.amount || 0
    })),
    conversionRates,
    paymentDetails
  };
}

/**
 * Gerar relatório de assinaturas
 */
async function generateSubscriptionsReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (filters.patientId) where.patientId = filters.patientId;

  // Estatísticas de assinaturas
  const subscriptionStats = await prisma.subscription.groupBy({
    by: ['status'],
    where,
    _count: true,
    _sum: { amount: true }
  });

  // Assinaturas por plano
  const subscriptionsByPlan = await prisma.subscription.groupBy({
    by: ['planId', 'planName'],
    where,
    _count: true,
    _sum: { amount: true },
    _avg: { amount: true }
  });

  // Churn rate (cancelamentos)
  const totalSubscriptions = await prisma.subscription.count({ where });
  const cancelledSubscriptions = await prisma.subscription.count({
    where: { ...where, status: 'cancelled' }
  });
  const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;

  // MRR (Monthly Recurring Revenue)
  const mrr = await prisma.subscription.aggregate({
    where: {
      status: 'active',
      interval: 'monthly'
    },
    _sum: { amount: true }
  });

  // ARR (Annual Recurring Revenue)
  const arr = await prisma.subscription.aggregate({
    where: {
      status: 'active',
      interval: 'yearly'
    },
    _sum: { amount: true }
  });

  return {
    period: {
      startDate,
      endDate
    },
    summary: {
      totalSubscriptions,
      cancelledSubscriptions,
      churnRate,
      mrr: mrr._sum.amount || 0,
      arr: arr._sum.amount || 0
    },
    subscriptionsByStatus: subscriptionStats.map(item => ({
      status: item.status,
      count: item._count,
      revenue: item._sum.amount || 0
    })),
    subscriptionsByPlan: subscriptionsByPlan.map(item => ({
      planId: item.planId,
      planName: item.planName,
      count: item._count,
      revenue: item._sum.amount || 0,
      averageAmount: item._avg.amount || 0
    }))
  };
}

/**
 * Gerar relatório de faturas
 */
async function generateInvoicesReport(startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (filters.patientId) where.patientId = filters.patientId;

  // Estatísticas de faturas
  const invoiceStats = await prisma.invoice.groupBy({
    by: ['status'],
    where,
    _count: true,
    _sum: { amount: true }
  });

  // Faturas em atraso
  const overdueInvoices = await prisma.invoice.count({
    where: {
      status: 'overdue',
      dueDate: {
        lt: new Date()
      }
    }
  });

  // Valor total em atraso
  const overdueAmount = await prisma.invoice.aggregate({
    where: {
      status: 'overdue',
      dueDate: {
        lt: new Date()
      }
    },
    _sum: { amount: true }
  });

  return {
    period: {
      startDate,
      endDate
    },
    summary: {
      overdueInvoices,
      overdueAmount: overdueAmount._sum.amount || 0
    },
    invoicesByStatus: invoiceStats.map(item => ({
      status: item.status,
      count: item._count,
      amount: item._sum.amount || 0
    }))
  };
}

/**
 * Gerar relatório de tendências
 */
async function generateTrendsReport(startDate: Date, endDate: Date, filters: any) {
  // Comparar com período anterior
  const periodDiff = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodDiff);
  const previousEndDate = new Date(startDate.getTime() - 1);

  const currentPeriodRevenue = await prisma.payment.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'paid'
    },
    _sum: { amount: true },
    _count: true
  });

  const previousPeriodRevenue = await prisma.payment.aggregate({
    where: {
      createdAt: { gte: previousStartDate, lte: previousEndDate },
      status: 'paid'
    },
    _sum: { amount: true },
    _count: true
  });

  const revenueGrowth = previousPeriodRevenue._sum.amount 
    ? ((currentPeriodRevenue._sum.amount || 0) - (previousPeriodRevenue._sum.amount || 0)) / (previousPeriodRevenue._sum.amount || 1) * 100
    : 0;

  const transactionGrowth = previousPeriodRevenue._count
    ? ((currentPeriodRevenue._count || 0) - (previousPeriodRevenue._count || 0)) / (previousPeriodRevenue._count || 1) * 100
    : 0;

  return {
    currentPeriod: {
      startDate,
      endDate,
      revenue: currentPeriodRevenue._sum.amount || 0,
      transactions: currentPeriodRevenue._count
    },
    previousPeriod: {
      startDate: previousStartDate,
      endDate: previousEndDate,
      revenue: previousPeriodRevenue._sum.amount || 0,
      transactions: previousPeriodRevenue._count
    },
    growth: {
      revenue: revenueGrowth,
      transactions: transactionGrowth
    }
  };
}