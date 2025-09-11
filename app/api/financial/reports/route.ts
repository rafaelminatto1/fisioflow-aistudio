import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'thisMonth';
    const groupBy = searchParams.get('groupBy') || 'month';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    // Determine date range based on period
    if (period === 'custom' && startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else {
      switch (period) {
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'thisYear':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'lastYear':
          const lastYear = new Date(now.getFullYear() - 1, 0, 1);
          startDate = startOfYear(lastYear);
          endDate = endOfYear(lastYear);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }
    }

    // Get revenue data
    const revenueData = await prisma.financialTransaction.findMany({
      where: {
        userId: session.user.id,
        type: 'INCOME',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        appointment: {
          include: {
            patient: true
          }
        }
      }
    });

    // Get expense data
    const expenseData = await prisma.financialTransaction.findMany({
      where: {
        userId: session.user.id,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get appointment data
    const appointmentData = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true
      }
    });

    // Get patient data
    const patientData = await prisma.patient.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate revenue metrics
    const totalRevenue = revenueData.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const revenueByService = revenueData.reduce((acc, transaction) => {
      const service = transaction.description || 'Consulta';
      if (!acc[service]) {
        acc[service] = { service, amount: 0, count: 0 };
      }
      acc[service].amount += transaction.amount;
      acc[service].count += 1;
      return acc;
    }, {} as Record<string, { service: string; amount: number; count: number; }>);

    const revenueByPaymentMethod = revenueData.reduce((acc, transaction) => {
      const method = transaction.paymentMethod || 'Não informado';
      if (!acc[method]) {
        acc[method] = { method, amount: 0 };
      }
      acc[method].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { method: string; amount: number; }>);

    // Add percentages to payment methods
    const revenueByPaymentMethodWithPercentage = Object.values(revenueByPaymentMethod).map(item => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0
    }));

    // Calculate expense metrics
    const totalExpenses = expenseData.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const expensesByCategory = expenseData.reduce((acc, transaction) => {
      const category = transaction.category || 'Outros';
      if (!acc[category]) {
        acc[category] = { category, amount: 0 };
      }
      acc[category].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { category: string; amount: number; }>);

    // Add percentages to expense categories
    const expensesByCategoryWithPercentage = Object.values(expensesByCategory).map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
    }));

    // Calculate appointment metrics
    const totalAppointments = appointmentData.length;
    const completedAppointments = appointmentData.filter(apt => apt.status === 'COMPLETED').length;
    const cancelledAppointments = appointmentData.filter(apt => apt.status === 'CANCELLED').length;
    const noShowAppointments = appointmentData.filter(apt => apt.status === 'NO_SHOW').length;

    // Calculate patient metrics
    const totalPatients = patientData.length;
    const newPatients = patientData.filter(patient => {
      const firstAppointment = appointmentData
        .filter(apt => apt.patientId === patient.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      return firstAppointment && firstAppointment.date >= startDate;
    }).length;
    const returningPatients = totalPatients - newPatients;

    // Group data by time period
    const getGroupKey = (date: Date) => {
      switch (groupBy) {
        case 'day':
          return format(date, 'dd/MM', { locale: ptBR });
        case 'week':
          return `Semana ${format(startOfWeek(date), 'dd/MM', { locale: ptBR })}`;
        case 'month':
          return format(date, 'MMM/yyyy', { locale: ptBR });
        case 'year':
          return format(date, 'yyyy', { locale: ptBR });
        default:
          return format(date, 'MMM/yyyy', { locale: ptBR });
      }
    };

    // Group revenue by time period
    const revenueByMonth = revenueData.reduce((acc, transaction) => {
      const key = getGroupKey(transaction.date);
      if (!acc[key]) {
        acc[key] = { month: key, amount: 0 };
      }
      acc[key].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { month: string; amount: number; }>);

    // Group expenses by time period
    const expensesByMonth = expenseData.reduce((acc, transaction) => {
      const key = getGroupKey(transaction.date);
      if (!acc[key]) {
        acc[key] = { month: key, amount: 0 };
      }
      acc[key].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { month: string; amount: number; }>);

    // Calculate cash flow by time period
    const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)]);
    const cashFlowByMonth = Array.from(allMonths).map(month => {
      const revenue = revenueByMonth[month]?.amount || 0;
      const expenses = expensesByMonth[month]?.amount || 0;
      return {
        month,
        revenue,
        expenses,
        net: revenue - expenses
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    // Group appointments by time period
    const appointmentsByMonth = appointmentData.reduce((acc, appointment) => {
      const key = getGroupKey(appointment.date);
      if (!acc[key]) {
        acc[key] = { month: key, total: 0, completed: 0, cancelled: 0 };
      }
      acc[key].total += 1;
      if (appointment.status === 'COMPLETED') acc[key].completed += 1;
      if (appointment.status === 'CANCELLED') acc[key].cancelled += 1;
      return acc;
    }, {} as Record<string, { month: string; total: number; completed: number; cancelled: number; }>);

    // Group patients by time period
    const patientsByMonth = patientData.reduce((acc, patient) => {
      const key = getGroupKey(patient.createdAt);
      if (!acc[key]) {
        acc[key] = { month: key, new: 0, returning: 0 };
      }
      
      const firstAppointment = appointmentData
        .filter(apt => apt.patientId === patient.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      
      if (firstAppointment && firstAppointment.date >= startDate) {
        acc[key].new += 1;
      } else {
        acc[key].returning += 1;
      }
      return acc;
    }, {} as Record<string, { month: string; new: number; returning: number; }>);

    const reportData = {
      revenue: {
        total: totalRevenue,
        byMonth: Object.values(revenueByMonth).sort((a, b) => a.month.localeCompare(b.month)),
        byService: Object.values(revenueByService),
        byPaymentMethod: revenueByPaymentMethodWithPercentage
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategoryWithPercentage,
        byMonth: Object.values(expensesByMonth).sort((a, b) => a.month.localeCompare(b.month))
      },
      cashFlow: {
        net: totalRevenue - totalExpenses,
        byMonth: cashFlowByMonth
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        noShow: noShowAppointments,
        byMonth: Object.values(appointmentsByMonth).sort((a, b) => a.month.localeCompare(b.month))
      },
      patients: {
        total: totalPatients,
        new: newPatients,
        returning: returningPatients,
        byMonth: Object.values(patientsByMonth).sort((a, b) => a.month.localeCompare(b.month))
      }
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}