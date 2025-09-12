// app/api/analytics/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AnalyticsEventCategory } from '@prisma/client'
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event_type: event.name, // Use name as event_type
      category: AnalyticsEventCategory.USER_ACTION, // Default category
      properties: {
        ...event.properties || {},
        page: event.page,
        userAgent: event.userAgent,
        ip: getClientIP(request),
        originalTimestamp: event.timestamp
      },
      user_id: event.userId || session?.user?.id || null,
      session_id: event.sessionId,
    }))

    // Salvar no banco de dados
    await prisma.analytics_events.createMany({
      data: processedEvents,
      skipDuplicates: true
    })

    // TODO: Processar métricas em tempo real (schema needs fixing)
    // await processRealTimeMetrics(events)
    
    // TODO: Atualizar agregações (schema needs fixing)
    // await updateAggregations(events)

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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const eventType = searchParams.get('eventType')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category') as AnalyticsEventCategory
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    
    if (eventType) where.event_type = eventType
    if (userId) where.user_id = userId
    if (category) where.category = category
    if (startDate || endDate) {
      where.created_at = {}
      if (startDate) where.created_at.gte = new Date(startDate)
      if (endDate) where.created_at.lte = new Date(endDate)
    }

    const [events, total] = await Promise.all([
      prisma.analytics_events.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          event_type: true,
          category: true,
          properties: true,
          user_id: true,
          session_id: true,
          created_at: true
        }
      }),
      prisma.analytics_events.count({ where })
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
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    )
  }
}

function getClientIP(request: NextRequest): string {
  // Tentar várias fontes de IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfIP) {
    return cfIP
  }
  
  return 'unknown'
}