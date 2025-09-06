// app/api/analytics/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'
import { subDays, subHours, startOfDay, endOfDay } from 'date-fns'

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
    const range = searchParams.get('range') || '24h'
    const metric = searchParams.get('metric')
    const groupBy = searchParams.get('groupBy') || 'hour'
    
    // Calcular período
    const { startDate, endDate } = getTimeRange(range)
    
    if (metric) {
      // Buscar métrica específica
      const data = await getSpecificMetric(metric, startDate, endDate, groupBy)
      return NextResponse.json({ metric, data })
    } else {
      // Buscar todas as métricas
      const metrics = await getAllMetrics(startDate, endDate)
      return NextResponse.json(metrics)
    }

  } catch (error) {
    console.error('Erro ao buscar métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { metric, value, type = 'counter', properties = {} } = body
    
    if (!metric || value === undefined) {
      return NextResponse.json(
        { error: 'Métrica e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Salvar métrica customizada
    await prisma.customMetric.create({
      data: {
        name: metric,
        value: parseFloat(value),
        type,
        properties,
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao salvar métrica:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getTimeRange(range: string) {
  const now = new Date()
  let startDate: Date
  
  switch (range) {
    case '1h':
      startDate = subHours(now, 1)
      break
    case '24h':
      startDate = subHours(now, 24)
      break
    case '7d':
      startDate = subDays(now, 7)
      break
    case '30d':
      startDate = subDays(now, 30)
      break
    case '90d':
      startDate = subDays(now, 90)
      break
    default:
      startDate = subHours(now, 24)
  }
  
  return { startDate, endDate: now }
}

async function getSpecificMetric(metric: string, startDate: Date, endDate: Date, groupBy: string) {
  try {
    // Buscar em métricas em tempo real
    const realTimeData = await prisma.realTimeMetric.findMany({
      where: {
        metric,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Buscar em métricas customizadas
    const customData = await prisma.customMetric.findMany({
      where: {
        name: metric,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Combinar dados
    const combinedData = [
      ...realTimeData.map(item => ({
        timestamp: item.timestamp,
        value: item.value,
        type: item.type
      })),
      ...customData.map(item => ({
        timestamp: item.timestamp,
        value: item.value,
        type: item.type
      }))
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return combinedData

  } catch (error) {
    console.error('Erro ao buscar métrica específica:', error)
    return []
  }
}

async function getAllMetrics(startDate: Date, endDate: Date) {
  try {
    // Métricas de performance
    const performanceMetrics = await getPerformanceMetrics(startDate, endDate)
    
    // Métricas de usuário
    const userMetrics = await getUserMetrics(startDate, endDate)
    
    // Métricas de negócio
    const businessMetrics = await getBusinessMetrics(startDate, endDate)
    
    // Métricas técnicas
    const technicalMetrics = await getTechnicalMetrics(startDate, endDate)

    return {
      performance: performanceMetrics,
      user: userMetrics,
      business: businessMetrics,
      technical: technicalMetrics,
      summary: {
        totalEvents: await getTotalEvents(startDate, endDate),
        uniqueUsers: await getUniqueUsers(startDate, endDate),
        avgSessionDuration: await getAvgSessionDuration(startDate, endDate),
        bounceRate: await getBounceRate(startDate, endDate)
      }
    }

  } catch (error) {
    console.error('Erro ao buscar todas as métricas:', error)
    return {
      performance: {},
      user: {},
      business: {},
      technical: {},
      summary: {}
    }
  }
}

async function getPerformanceMetrics(startDate: Date, endDate: Date) {
  try {
    // Buscar métricas de performance dos eventos
    const performanceEvents = await prisma.analyticsEvent.findMany({
      where: {
        name: 'performance_timing',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        properties: true,
        timestamp: true
      }
    })

    // Agrupar por tipo de métrica
    const metrics = performanceEvents.reduce((acc, event) => {
      const metric = event.properties?.metric as string
      const duration = event.properties?.duration as number
      
      if (metric && duration) {
        if (!acc[metric]) {
          acc[metric] = []
        }
        acc[metric].push(duration)
      }
      
      return acc
    }, {} as Record<string, number[]>)

    // Calcular estatísticas
    const result: Record<string, any> = {}
    
    for (const [metric, values] of Object.entries(metrics)) {
      if (values.length > 0) {
        result[metric] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p50: getPercentile(values, 50),
          p95: getPercentile(values, 95),
          p99: getPercentile(values, 99),
          count: values.length
        }
      }
    }

    return result

  } catch (error) {
    console.error('Erro ao buscar métricas de performance:', error)
    return {}
  }
}

async function getUserMetrics(startDate: Date, endDate: Date) {
  try {
    const [pageViews, uniqueUsers, newUsers, returningUsers] = await Promise.all([
      // Page views
      prisma.analyticsEvent.count({
        where: {
          name: 'page_view',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Usuários únicos
      prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          userId: {
            not: null
          }
        }
      }).then(result => result.length),
      
      // Novos usuários
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Usuários retornando
      prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          userId: {
            not: null
          }
        },
        having: {
          userId: {
            _count: {
              gt: 1
            }
          }
        }
      }).then(result => result.length)
    ])

    return {
      pageViews,
      uniqueUsers,
      newUsers,
      returningUsers,
      retentionRate: uniqueUsers > 0 ? (returningUsers / uniqueUsers) * 100 : 0
    }

  } catch (error) {
    console.error('Erro ao buscar métricas de usuário:', error)
    return {}
  }
}

async function getBusinessMetrics(startDate: Date, endDate: Date) {
  try {
    const [revenue, appointments, conversions, cancellations] = await Promise.all([
      // Receita
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      }),
      
      // Consultas
      prisma.appointment.groupBy({
        by: ['status'],
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        }
      }),
      
      // Conversões
      prisma.analyticsEvent.count({
        where: {
          name: 'conversion',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Cancelamentos
      prisma.appointment.count({
        where: {
          status: 'CANCELLED',
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])

    const appointmentsByStatus = appointments.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const totalAppointments = appointments.reduce((sum, item) => sum + item._count.id, 0)

    return {
      revenue: revenue._sum.amount || 0,
      revenueTransactions: revenue._count.id,
      totalAppointments,
      completedAppointments: appointmentsByStatus.COMPLETED || 0,
      cancelledAppointments: appointmentsByStatus.CANCELLED || 0,
      conversions,
      conversionRate: totalAppointments > 0 ? (conversions / totalAppointments) * 100 : 0,
      cancellationRate: totalAppointments > 0 ? (cancellations / totalAppointments) * 100 : 0
    }

  } catch (error) {
    console.error('Erro ao buscar métricas de negócio:', error)
    return {}
  }
}

async function getTechnicalMetrics(startDate: Date, endDate: Date) {
  try {
    const [errors, apiCalls, loadTimes] = await Promise.all([
      // Erros
      prisma.analyticsEvent.count({
        where: {
          name: {
            in: ['javascript_error', 'unhandled_promise_rejection', 'component_error']
          },
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Chamadas de API
      prisma.analyticsEvent.count({
        where: {
          name: 'api_call',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Tempos de carregamento
      prisma.analyticsEvent.findMany({
        where: {
          name: 'performance_timing',
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          properties: {
            path: ['metric'],
            equals: 'page_load'
          }
        },
        select: {
          properties: true
        }
      })
    ])

    const loadTimesValues = loadTimes
      .map(event => event.properties?.duration as number)
      .filter(duration => typeof duration === 'number')

    return {
      errors,
      apiCalls,
      avgLoadTime: loadTimesValues.length > 0 
        ? loadTimesValues.reduce((a, b) => a + b, 0) / loadTimesValues.length 
        : 0,
      errorRate: apiCalls > 0 ? (errors / apiCalls) * 100 : 0
    }

  } catch (error) {
    console.error('Erro ao buscar métricas técnicas:', error)
    return {}
  }
}

// Funções auxiliares
async function getTotalEvents(startDate: Date, endDate: Date) {
  return await prisma.analyticsEvent.count({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }
  })
}

async function getUniqueUsers(startDate: Date, endDate: Date) {
  const result = await prisma.analyticsEvent.groupBy({
    by: ['userId'],
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      },
      userId: {
        not: null
      }
    }
  })
  return result.length
}

async function getAvgSessionDuration(startDate: Date, endDate: Date) {
  const result = await prisma.sessionMetric.aggregate({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    _avg: {
      duration: true
    }
  })
  return Math.round((result._avg.duration || 0) / 1000 / 60) // em minutos
}

async function getBounceRate(startDate: Date, endDate: Date) {
  const [singlePageSessions, totalSessions] = await Promise.all([
    prisma.sessionMetric.count({
      where: {
        eventCount: 1,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.sessionMetric.count({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ])
  
  return totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0
}

function getPercentile(values: number[], percentile: number): number {
  const sorted = values.slice().sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index] || 0
}