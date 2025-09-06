// app/api/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // Calcular período
    const { startDate, endDate, days } = getDateRange(range)
    
    // Buscar dados em paralelo
    const [overview, chartData, realTime] = await Promise.all([
      getOverviewData(startDate, endDate),
      getChartData(startDate, endDate, days),
      getRealTimeData()
    ])

    return NextResponse.json({
      overview,
      chartData,
      realTime
    })

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getDateRange(range: string) {
  const now = new Date()
  let days: number
  
  switch (range) {
    case '7d':
      days = 7
      break
    case '30d':
      days = 30
      break
    case '90d':
      days = 90
      break
    default:
      days = 30
  }

  const startDate = startOfDay(subDays(now, days))
  const endDate = endOfDay(now)

  return { startDate, endDate, days }
}

async function getOverviewData(startDate: Date, endDate: Date) {
  // Buscar dados atuais usando campos que existem no schema
  const [totalPatients, totalAppointments] = await Promise.all([
    // Total de pacientes
    prisma.patient.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    
    // Total de consultas usando startTime ao invés de date
    prisma.appointment.count({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ])

  // Buscar dados do período anterior para comparação
  const previousPeriodStart = startOfDay(subDays(startDate, endDate.getTime() - startDate.getTime()))
  const previousPeriodEnd = startDate

  const [previousPatients, previousAppointments] = await Promise.all([
    prisma.patient.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd
        }
      }
    }),
    
    prisma.appointment.count({
      where: {
        startTime: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd
        }
      }
    })
  ])

  // Calcular percentuais de mudança
  const patientsChange = previousPatients > 0 
    ? ((totalPatients - previousPatients) / previousPatients) * 100 
    : totalPatients > 0 ? 100 : 0

  const appointmentsChange = previousAppointments > 0 
    ? ((totalAppointments - previousAppointments) / previousAppointments) * 100 
    : totalAppointments > 0 ? 100 : 0

  return {
    totalPatients: {
      value: totalPatients,
      change: Math.round(patientsChange * 100) / 100
    },
    totalAppointments: {
      value: totalAppointments,
      change: Math.round(appointmentsChange * 100) / 100
    },
    // Dados simulados para campos que não temos ainda
    totalRevenue: {
      value: totalAppointments * 120, // Valor médio estimado por consulta
      change: appointmentsChange
    },
    activeSessions: {
      value: 0, // Não temos sessões ativas no schema atual
      change: 0
    }
  }
}

async function getChartData(startDate: Date, endDate: Date, days: number) {
  // Buscar consultas por status usando campos disponíveis
  const appointments = await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  })

  // Dados da última semana para trends
  const lastWeekAppointments = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const count = await prisma.appointment.count({
      where: {
        startTime: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    })
    
    lastWeekAppointments.push({
      date: format(date, 'dd/MM', { locale: ptBR }),
      appointments: count,
      revenue: count * 120 // Valor simulado
    })
  }

  return {
    appointmentsByStatus: appointments.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: appointments.length > 0 
        ? Math.round((item._count.id / appointments.reduce((acc, curr) => acc + curr._count.id, 0)) * 100)
        : 0
    })),
    weeklyTrend: lastWeekAppointments
  }
}

async function getRealTimeData() {
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [todayAppointments, todayPatients] = await Promise.all([
    prisma.appointment.count({
      where: {
        startTime: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    }),
    
    prisma.patient.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })
  ])

  return {
    appointmentsToday: todayAppointments,
    newPatientsToday: todayPatients,
    activeUsers: 1, // Dados simulados
    systemStatus: 'operational'
  }
}