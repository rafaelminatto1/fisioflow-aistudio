// app/api/analytics/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
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

    const { startDate, endDate } = getDateRange(range)

    if (metric) {
      // TODO: Implement specific metric retrieval
      return NextResponse.json({
        data: [],
        aggregated: [],
        metric
      })
    }

    // TODO: Implement comprehensive metrics
    return NextResponse.json({
      performance: { pageLoad: 0, apiResponse: 0, errorRate: 0 },
      user: { activeUsers: 0, newUsers: 0, sessionDuration: 0 },
      business: { totalRevenue: 0, conversions: 0, retention: 0 },
      technical: { uptime: 100, serverLoad: 0, dbConnections: 0 },
      range,
      groupBy
    })

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

    const { metric, value, type, properties } = await request.json()

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
        category: type, // Use type as category
        tags: properties,
        createdBy: session.user.id
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

function getDateRange(range: string) {
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
    default:
      startDate = subHours(now, 24)
  }
  
  return { startDate, endDate: now }
}