// app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts
    const [
      totalPatients,
      totalAppointments,
      totalTherapists,
      totalExercises
    ] = await Promise.all([
      prisma.patients.count({ where: { status: 'Active' } }),
      prisma.appointments.count(),
      prisma.users.count({ where: { role: 'Fisioterapeuta' } }),
      prisma.exercises.count({ where: { status: 'approved' } })
    ]);

    // Get period-specific metrics
    const periodAppointments = await prisma.appointments.findMany({
      where: {
        start_time: {
          gte: startDate
        }
      },
      include: {
        patients: {
          select: { name: true }
        }
      }
    });

    // Calculate revenue
    const totalRevenue = periodAppointments
      .filter(app => app.value && app.payment_status === 'paid')
      .reduce((sum, app) => sum + Number(app.value), 0);

    // Get financial transactions
    const transactions = await prisma.financial_transactions.findMany({
      where: {
        date: {
          gte: startDate
        }
      },
      include: {
        patients: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Appointment statistics
    const appointmentStats = {
      total: periodAppointments.length,
      agendado: periodAppointments.filter(a => a.status === 'Agendado').length,
      realizado: periodAppointments.filter(a => a.status === 'Realizado').length,
      concluido: periodAppointments.filter(a => a.status === 'Concluido').length,
      cancelado: periodAppointments.filter(a => a.status === 'Cancelado').length,
      faltou: periodAppointments.filter(a => a.status === 'Faltou').length
    };

    // Calculate growth rates (comparing with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period));

    const [
      previousPatients,
      previousAppointments,
      previousRevenue
    ] = await Promise.all([
      prisma.patients.count({
        where: {
          created_at: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.appointments.count({
        where: {
          start_time: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.appointments.findMany({
        where: {
          start_time: {
            gte: previousPeriodStart,
            lt: startDate
          },
          payment_status: 'paid'
        },
        select: { value: true }
      }).then(apps => apps.reduce((sum, app) => sum + Number(app.value || 0), 0))
    ]);

    const currentPatients = await prisma.patients.count({
      where: {
        created_at: {
          gte: startDate
        }
      }
    });

    // Calculate growth percentages
    const patientGrowth = previousPatients === 0 ? 100 : 
      ((currentPatients - previousPatients) / previousPatients) * 100;

    const appointmentGrowth = previousAppointments === 0 ? 100 :
      ((periodAppointments.length - previousAppointments) / previousAppointments) * 100;

    const revenueGrowth = previousRevenue === 0 ? 100 :
      ((totalRevenue - previousRevenue) / previousRevenue) * 100;

    // Get recent activities
    const recentActivities = await Promise.all([
      prisma.appointments.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          patients: { select: { name: true } },
          users: { select: { name: true } }
        }
      }),
      prisma.patients.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: { id: true, name: true, created_at: true }
      })
    ]);

    const [recentAppointments, recentPatients] = recentActivities;

    // Daily revenue chart data (last 30 days)
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAppointments = await prisma.appointments.findMany({
        where: {
          start_time: {
            gte: date,
            lt: nextDate
          },
          payment_status: 'paid'
        },
        select: { value: true }
      });

      const dayRevenue = dayAppointments.reduce((sum, app) => sum + Number(app.value || 0), 0);

      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        appointments: dayAppointments.length
      });
    }

    // Payment method distribution
    const paymentMethods = await prisma.appointments.groupBy({
      by: ['payment_status'],
      where: {
        start_time: {
          gte: startDate
        },
        value: {
          not: null
        }
      },
      _count: {
        payment_status: true
      },
      _sum: {
        value: true
      }
    });

    return NextResponse.json({
      overview: {
        totalPatients,
        totalAppointments,
        totalTherapists,
        totalExercises,
        totalRevenue,
        netProfit: income - expenses
      },
      
      growth: {
        patients: {
          current: currentPatients,
          previous: previousPatients,
          percentage: Math.round(patientGrowth * 100) / 100
        },
        appointments: {
          current: periodAppointments.length,
          previous: previousAppointments,
          percentage: Math.round(appointmentGrowth * 100) / 100
        },
        revenue: {
          current: totalRevenue,
          previous: previousRevenue,
          percentage: Math.round(revenueGrowth * 100) / 100
        }
      },

      appointments: appointmentStats,

      financial: {
        income,
        expenses,
        netProfit: income - expenses,
        paymentMethods: paymentMethods.map(pm => ({
          method: pm.payment_status,
          count: pm._count.payment_status,
          total: Number(pm._sum.value || 0)
        }))
      },

      charts: {
        dailyRevenue,
        appointmentTypes: await prisma.appointments.groupBy({
          by: ['type'],
          where: {
            start_time: {
              gte: startDate
            }
          },
          _count: {
            type: true
          }
        })
      },

      recent: {
        appointments: recentAppointments.map(app => ({
          id: app.id,
          patientName: app.patients.name,
          therapistName: app.users.name,
          type: app.type,
          status: app.status,
          startTime: app.start_time,
          value: app.value
        })),
        patients: recentPatients
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}