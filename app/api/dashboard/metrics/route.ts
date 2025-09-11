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
      prisma.patient.count({ where: { status: 'Active' } }),
      prisma.appointment.count(),
      prisma.user.count({ where: { role: 'Fisioterapeuta' } }),
      prisma.exercise.count({ where: { status: 'approved' } })
    ]);

    // Get period-specific metrics
    const periodAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate
        }
      },
      include: {
        patient: {
          select: { name: true }
        }
      }
    });

    // Calculate revenue
    const totalRevenue = periodAppointments
      .filter(app => app.value && app.paymentStatus === 'paid')
      .reduce((sum, app) => sum + Number(app.value), 0);

    // Get financial transactions
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: startDate
        }
      },
      include: {
        patient: {
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
      prisma.patient.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.appointment.count({
        where: {
          startTime: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.appointment.findMany({
        where: {
          startTime: {
            gte: previousPeriodStart,
            lt: startDate
          },
          paymentStatus: 'paid'
        },
        select: { value: true }
      }).then(apps => apps.reduce((sum, app) => sum + Number(app.value || 0), 0))
    ]);

    const currentPatients = await prisma.patient.count({
      where: {
        createdAt: {
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

    // Recent activities
    const recentAppointments = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { name: true }
        },
        therapist: {
          select: { name: true }
        }
      }
    });

    const recentPatients = await prisma.patient.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true
      }
    });

    // Daily revenue chart data (last 30 days)
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAppointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: date,
            lt: nextDate
          },
          paymentStatus: 'paid'
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
    const paymentMethods = await prisma.appointment.groupBy({
      by: ['paymentStatus'],
      where: {
        startTime: {
          gte: startDate
        },
        value: {
          not: null
        }
      },
      _count: {
        paymentStatus: true
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
          method: pm.paymentStatus,
          count: pm._count.paymentStatus,
          total: Number(pm._sum.value || 0)
        }))
      },

      charts: {
        dailyRevenue,
        appointmentTypes: await prisma.appointment.groupBy({
          by: ['type'],
          where: {
            startTime: {
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
          patientName: app.patient.name,
          therapistName: app.therapist.name,
          type: app.type,
          status: app.status,
          startTime: app.startTime,
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