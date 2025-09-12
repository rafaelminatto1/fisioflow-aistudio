import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Get all overdue payments
    const overduePayments = await prisma.payments.findMany({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: session.user.id
            }
          }
        },
        status: 'pending',
        due_date: {
          lt: currentDate
        }
      },
      include: {
        patients: true
      }
    });

    // Calculate total overdue amount
    const totalAmount = overduePayments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

    // Calculate average days overdue
    const averageDaysOverdue = overduePayments.length > 0 
      ? overduePayments.reduce((sum, payment) => {
          if (!payment.due_date) return sum;
          const days = Math.floor(
            (currentDate.getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / overduePayments.length
      : 0;

    // Get payments contacted today (using updatedAt as proxy for contact date)
    const contactedToday = await prisma.payments.count({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: session.user.id
            }
          }
        },
        status: 'pending',
        due_date: {
          lt: currentDate
        },
        updated_at: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    });

    // Get payments recovered this month (completed payments that were previously overdue)
    const recoveredThisMonth = await prisma.payments.findMany({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: session.user.id
            }
          }
        },
        status: 'paid',
        paid_at: {
          gte: startOfMonth,
          lt: currentDate
        },
        due_date: {
          lt: currentDate // Was overdue when paid
        }
      }
    });

    const recoveredAmount = recoveredThisMonth.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

    // Calculate recovery rate (recovered vs total overdue in the period)
    const totalOverdueThisMonth = await prisma.payments.findMany({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: session.user.id
            }
          }
        },
        OR: [
          {
            status: 'pending',
            due_date: {
              gte: startOfMonth,
              lt: currentDate
            }
          },
          {
            status: 'paid',
            paid_at: {
              gte: startOfMonth,
              lt: currentDate
            },
            due_date: {
              gte: startOfMonth,
              lt: currentDate
            }
          }
        ]
      }
    });

    const totalOverdueAmountThisMonth = totalOverdueThisMonth.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
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
  const patients = await prisma.patients.findMany({
    where: {
      appointments: {
        some: {
          therapist_id: userId
        }
      },
      payments: {
        some: {
          status: 'pending',
          due_date: {
            lt: currentDate
          }
        }
      }
    },
    include: {
        payments: {
          where: {
            status: 'pending',
            due_date: {
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
      overdueAmount: patient.payments.reduce((sum, t) => sum + t.amount.toNumber(), 0),
      overdueCount: patient.payments.length,
      oldestOverdue: Math.min(
          ...patient.payments
            .filter(t => t.due_date)
            .map(t => 
              Math.floor((currentDate.getTime() - new Date(t.due_date!).getTime()) / (1000 * 60 * 60 * 24))
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
    if (!payment.due_date) return;
    const days = Math.floor(
      (currentDate.getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 7) brackets['1-7'] += payment.amount.toNumber();
    else if (days <= 15) brackets['8-15'] += payment.amount.toNumber();
    else if (days <= 30) brackets['16-30'] += payment.amount.toNumber();
    else if (days <= 60) brackets['31-60'] += payment.amount.toNumber();
    else brackets['60+'] += payment.amount.toNumber();
  });

  return brackets;
}

async function getMonthlyTrend(userId: string, currentDate: Date) {
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    
    // Get overdue payments for this month
    const overduePayments = await prisma.payments.findMany({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: userId
            }
          }
        },
        status: 'pending',
        due_date: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get recovered payments for this month
    const recoveredPayments = await prisma.payments.findMany({
      where: {
        patients: {
          appointments: {
            some: {
              therapist_id: userId
            }
          }
        },
        status: 'paid',
        paid_at: {
          gte: monthStart,
          lte: monthEnd
        },
        due_date: {
          lt: monthStart // Was overdue when paid
        }
      }
    });

    months.push({
      month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
      overdueCount: overduePayments.length,
      overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount.toNumber(), 0),
      recoveredCount: recoveredPayments.length,
      recoveredAmount: recoveredPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0)
    });
  }

  return months;
}