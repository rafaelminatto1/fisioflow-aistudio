import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Get all overdue payments
    const overduePayments = await prisma.financialTransaction.findMany({
      where: {
        userId: session.user.id,
        status: 'pending',
        dueDate: {
          lt: currentDate
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate total overdue amount
    const totalAmount = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate average days overdue
    const averageDaysOverdue = overduePayments.length > 0 
      ? overduePayments.reduce((sum, payment) => {
          const days = Math.floor(
            (currentDate.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / overduePayments.length
      : 0;

    // Get payments contacted today (using updatedAt as proxy for contact date)
    const contactedToday = await prisma.financialTransaction.count({
      where: {
        userId: session.user.id,
        status: 'pending',
        dueDate: {
          lt: currentDate
        },
        updatedAt: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    });

    // Get payments recovered this month (completed payments that were previously overdue)
    const recoveredThisMonth = await prisma.financialTransaction.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
        paidAt: {
          gte: startOfMonth,
          lt: currentDate
        },
        dueDate: {
          lt: currentDate // Was overdue when paid
        }
      }
    });

    const recoveredAmount = recoveredThisMonth.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate recovery rate (recovered vs total overdue in the period)
    const totalOverdueThisMonth = await prisma.financialTransaction.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            status: 'pending',
            dueDate: {
              gte: startOfMonth,
              lt: currentDate
            }
          },
          {
            status: 'completed',
            paidAt: {
              gte: startOfMonth,
              lt: currentDate
            },
            dueDate: {
              gte: startOfMonth,
              lt: currentDate
            }
          }
        ]
      }
    });

    const totalOverdueAmountThisMonth = totalOverdueThisMonth.reduce((sum, payment) => sum + payment.amount, 0);
    const recoveryRate = totalOverdueAmountThisMonth > 0 
      ? (recoveredAmount / totalOverdueAmountThisMonth) * 100 
      : 0;

    // Get additional insights
    const insights = {
      // Top delinquent patients
      topDelinquentPatients: await getTopDelinquentPatients(session.user.id, currentDate),
      
      // Overdue by age brackets
      overdueByAge: getOverdueByAge(overduePayments, currentDate),
      
      // Monthly trend (last 6 months)
      monthlyTrend: await getMonthlyTrend(session.user.id, currentDate)
    };

    const stats = {
      totalOverdue: overduePayments.length,
      totalAmount,
      averageDaysOverdue,
      contactedToday,
      recoveredThisMonth: recoveredAmount,
      recoveryRate,
      insights
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas de inadimplência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function getTopDelinquentPatients(userId: string, currentDate: Date) {
  const patients = await prisma.patient.findMany({
    where: {
      userId,
      financialTransactions: {
        some: {
          status: 'pending',
          dueDate: {
            lt: currentDate
          }
        }
      }
    },
    include: {
      financialTransactions: {
        where: {
          status: 'pending',
          dueDate: {
            lt: currentDate
          }
        }
      }
    }
  });

  return patients
    .map(patient => ({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      overdueAmount: patient.financialTransactions.reduce((sum, t) => sum + t.amount, 0),
      overdueCount: patient.financialTransactions.length,
      oldestOverdue: Math.min(
        ...patient.financialTransactions.map(t => 
          Math.floor((currentDate.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        )
      )
    }))
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 10);
}

function getOverdueByAge(overduePayments: any[], currentDate: Date) {
  const brackets = {
    '1-7': 0,
    '8-15': 0,
    '16-30': 0,
    '31-60': 0,
    '60+': 0
  };

  overduePayments.forEach(payment => {
    const days = Math.floor(
      (currentDate.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 7) brackets['1-7'] += payment.amount;
    else if (days <= 15) brackets['8-15'] += payment.amount;
    else if (days <= 30) brackets['16-30'] += payment.amount;
    else if (days <= 60) brackets['31-60'] += payment.amount;
    else brackets['60+'] += payment.amount;
  });

  return brackets;
}

async function getMonthlyTrend(userId: string, currentDate: Date) {
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    
    // Get overdue payments for this month
    const overduePayments = await prisma.financialTransaction.findMany({
      where: {
        userId,
        status: 'pending',
        dueDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get recovered payments for this month
    const recoveredPayments = await prisma.financialTransaction.findMany({
      where: {
        userId,
        status: 'completed',
        paidAt: {
          gte: monthStart,
          lte: monthEnd
        },
        dueDate: {
          lt: monthStart // Was overdue when paid
        }
      }
    });

    months.push({
      month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
      overdueCount: overduePayments.length,
      overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
      recoveredCount: recoveredPayments.length,
      recoveredAmount: recoveredPayments.reduce((sum, p) => sum + p.amount, 0)
    });
  }

  return months;
}