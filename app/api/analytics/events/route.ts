// app/api/analytics/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '../../../../lib/prisma'
import { z } from 'zod'

const AnalyticsEventSchema = z.object({
  name: z.string(),
  properties: z.record(z.any()).optional(),
  timestamp: z.number(),
  userId: z.string().optional(),
  sessionId: z.string(),
  page: z.string(),
  userAgent: z.string()
})

const EventsBatchSchema = z.object({
  events: z.array(AnalyticsEventSchema)
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    
    // Validar dados
    const { events } = EventsBatchSchema.parse(body)
    
    if (events.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    // Processar eventos em batch
    const processedEvents = events.map(event => ({
      name: event.name,
      properties: event.properties || {},
      timestamp: new Date(event.timestamp),
      userId: event.userId || session?.user?.id || null,
      sessionId: event.sessionId,
      page: event.page,
      userAgent: event.userAgent,
      ip: getClientIP(request),
      createdAt: new Date()
    }))

    // Salvar no banco de dados
    await prisma.analyticsEvent.createMany({
      data: processedEvents,
      skipDuplicates: true
    })

    // Processar métricas em tempo real
    await processRealTimeMetrics(events)
    
    // Atualizar agregações
    await updateAggregations(events)

    return NextResponse.json({ 
      success: true, 
      processed: events.length 
    })

  } catch (error) {
    console.error('Erro ao processar eventos de analytics:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventName = searchParams.get('event')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    
    if (eventName) {
      where.name = eventName
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          properties: true,
          timestamp: true,
          userId: true,
          sessionId: true,
          page: true,
          createdAt: true
        }
      }),
      prisma.analyticsEvent.count({ where })
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Funções auxiliares
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

async function processRealTimeMetrics(events: any[]) {
  try {
    const now = new Date()
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    
    // Contar eventos por tipo
    const eventCounts = events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Atualizar métricas em tempo real
    for (const [eventName, count] of Object.entries(eventCounts)) {
      await prisma.realTimeMetric.upsert({
        where: {
          metric_timestamp: {
            metric: `event_${eventName}`,
            timestamp: currentHour
          }
        },
        update: {
          value: {
            increment: count
          },
          updatedAt: now
        },
        create: {
          metric: `event_${eventName}`,
          value: count,
          timestamp: currentHour,
          type: 'counter'
        }
      })
    }

    // Atualizar usuários ativos
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean))
    const uniqueSessions = new Set(events.map(e => e.sessionId))

    if (uniqueUsers.size > 0) {
      await prisma.realTimeMetric.upsert({
        where: {
          metric_timestamp: {
            metric: 'active_users',
            timestamp: currentHour
          }
        },
        update: {
          value: uniqueUsers.size,
          updatedAt: now
        },
        create: {
          metric: 'active_users',
          value: uniqueUsers.size,
          timestamp: currentHour,
          type: 'gauge'
        }
      })
    }

    if (uniqueSessions.size > 0) {
      await prisma.realTimeMetric.upsert({
        where: {
          metric_timestamp: {
            metric: 'active_sessions',
            timestamp: currentHour
          }
        },
        update: {
          value: uniqueSessions.size,
          updatedAt: now
        },
        create: {
          metric: 'active_sessions',
          value: uniqueSessions.size,
          timestamp: currentHour,
          type: 'gauge'
        }
      })
    }

  } catch (error) {
    console.error('Erro ao processar métricas em tempo real:', error)
  }
}

async function updateAggregations(events: any[]) {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Agrupar eventos por página
    const pageViews = events
      .filter(e => e.name === 'page_view')
      .reduce((acc, event) => {
        acc[event.page] = (acc[event.page] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Atualizar agregações diárias
    for (const [page, views] of Object.entries(pageViews)) {
      await prisma.dailyAggregation.upsert({
        where: {
          date_metric_dimension: {
            date: today,
            metric: 'page_views',
            dimension: page
          }
        },
        update: {
          value: {
            increment: views
          },
          updatedAt: now
        },
        create: {
          date: today,
          metric: 'page_views',
          dimension: page,
          value: views
        }
      })
    }

    // Contar conversões
    const conversions = events.filter(e => e.name === 'conversion')
    if (conversions.length > 0) {
      await prisma.dailyAggregation.upsert({
        where: {
          date_metric_dimension: {
            date: today,
            metric: 'conversions',
            dimension: 'total'
          }
        },
        update: {
          value: {
            increment: conversions.length
          },
          updatedAt: now
        },
        create: {
          date: today,
          metric: 'conversions',
          dimension: 'total',
          value: conversions.length
        }
      })
    }

    // Calcular tempo de sessão médio
    const sessionEvents = events.reduce((acc, event) => {
      if (!acc[event.sessionId]) {
        acc[event.sessionId] = []
      }
      acc[event.sessionId].push(event.timestamp)
      return acc
    }, {} as Record<string, number[]>)

    for (const [sessionId, timestamps] of Object.entries(sessionEvents)) {
      if (timestamps.length > 1) {
        const sessionDuration = Math.max(...timestamps) - Math.min(...timestamps)
        
        await prisma.sessionMetric.upsert({
          where: {
            sessionId
          },
          update: {
            duration: sessionDuration,
            eventCount: timestamps.length,
            lastActivity: new Date(Math.max(...timestamps)),
            updatedAt: now
          },
          create: {
            sessionId,
            duration: sessionDuration,
            eventCount: timestamps.length,
            startTime: new Date(Math.min(...timestamps)),
            lastActivity: new Date(Math.max(...timestamps))
          }
        })
      }
    }

  } catch (error) {
    console.error('Erro ao atualizar agregações:', error)
  }
}