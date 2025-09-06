// lib/prisma-optimized.ts
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Configuração do Redis para cache (opcional)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null

// Singleton do Prisma com otimizações
class OptimizedPrismaClient {
  private static instance: PrismaClient
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutos

  static getInstance(): PrismaClient {
    if (!OptimizedPrismaClient.instance) {
      OptimizedPrismaClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      // Middleware para logging de queries lentas
      OptimizedPrismaClient.instance.$use(async (params, next) => {
        const start = Date.now()
        const result = await next(params)
        const end = Date.now()
        const duration = end - start

        if (duration > 1000) { // Queries > 1s
          console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`)
        }

        return result
      })

      // Middleware para cache automático
      OptimizedPrismaClient.instance.$use(async (params, next) => {
        const cacheKey = `${params.model}_${params.action}_${JSON.stringify(params.args)}`
        
        // Apenas cachear operações de leitura
        if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
          const cached = await OptimizedPrismaClient.getFromCache(cacheKey)
          if (cached) {
            return cached
          }
        }

        const result = await next(params)

        // Cachear resultado de leitura
        if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
          await OptimizedPrismaClient.setCache(cacheKey, result)
        }

        // Invalidar cache em operações de escrita
        if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
          await OptimizedPrismaClient.invalidateModelCache(params.model!)
        }

        return result
      })
    }

    return OptimizedPrismaClient.instance
  }

  private static async getFromCache(key: string): Promise<any> {
    try {
      // Tentar Redis primeiro
      if (redis) {
        const cached = await redis.get(key)
        if (cached) {
          return JSON.parse(cached)
        }
      }

      // Fallback para cache em memória
      const instance = new OptimizedPrismaClient()
      const cached = instance.cache.get(key)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data
      }

      return null
    } catch (error) {
      console.warn('Cache read error:', error)
      return null
    }
  }

  private static async setCache(key: string, data: any, ttl = 5 * 60 * 1000): Promise<void> {
    try {
      // Salvar no Redis
      if (redis) {
        await redis.setex(key, Math.floor(ttl / 1000), JSON.stringify(data))
      }

      // Salvar no cache em memória
      const instance = new OptimizedPrismaClient()
      instance.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })

      // Limpar cache antigo
      if (instance.cache.size > 1000) {
        const oldestKey = instance.cache.keys().next().value
        instance.cache.delete(oldestKey)
      }
    } catch (error) {
      console.warn('Cache write error:', error)
    }
  }

  private static async invalidateModelCache(model: string): Promise<void> {
    try {
      // Invalidar no Redis
      if (redis) {
        const keys = await redis.keys(`${model}_*`)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      }

      // Invalidar cache em memória
      const instance = new OptimizedPrismaClient()
      for (const key of instance.cache.keys()) {
        if (key.startsWith(`${model}_`)) {
          instance.cache.delete(key)
        }
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error)
    }
  }

  static async clearAllCache(): Promise<void> {
    try {
      if (redis) {
        await redis.flushall()
      }
      const instance = new OptimizedPrismaClient()
      instance.cache.clear()
    } catch (error) {
      console.warn('Cache clear error:', error)
    }
  }
}

export const prisma = OptimizedPrismaClient.getInstance()

// Queries otimizadas específicas
export class OptimizedQueries {
  // Dashboard stats com cache agressivo
  static async getDashboardStats(userId: string) {
    const cacheKey = `dashboard_stats_${userId}`
    
    return prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "Patient" WHERE "userId" = ${userId}) as "totalPatients",
        (SELECT COUNT(*) FROM "Appointment" WHERE "userId" = ${userId} AND "date" >= CURRENT_DATE) as "upcomingAppointments",
        (SELECT COUNT(*) FROM "Appointment" WHERE "userId" = ${userId} AND "date" = CURRENT_DATE) as "todayAppointments",
        (SELECT COALESCE(SUM("amount"), 0) FROM "Transaction" WHERE "userId" = ${userId} AND "date" >= DATE_TRUNC('month', CURRENT_DATE)) as "monthlyRevenue"
    `
  }

  // Pacientes com paginação otimizada
  static async getPatientsPaginated({
    userId,
    page = 1,
    limit = 20,
    search,
    status
  }: {
    userId: string
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const skip = (page - 1) * limit
    
    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(status && { status })
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ])

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Agenda otimizada com relacionamentos
  static async getAppointmentsForDate(userId: string, date: Date) {
    return prisma.appointment.findMany({
      where: {
        userId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { time: 'asc' }
    })
  }

  // Métricas de performance
  static async getPerformanceMetrics(userId: string, startDate: Date, endDate: Date) {
    return prisma.$queryRaw`
      WITH daily_stats AS (
        SELECT 
          DATE("date") as day,
          COUNT(*) as appointments_count,
          COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END) as completed_count,
          COUNT(CASE WHEN "status" = 'CANCELLED' THEN 1 END) as cancelled_count
        FROM "Appointment" 
        WHERE "userId" = ${userId}
          AND "date" BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE("date")
      )
      SELECT 
        day,
        appointments_count,
        completed_count,
        cancelled_count,
        ROUND((completed_count::float / NULLIF(appointments_count, 0)) * 100, 2) as completion_rate
      FROM daily_stats
      ORDER BY day
    `
  }

  // Busca inteligente de pacientes
  static async searchPatients(userId: string, query: string, limit = 10) {
    return prisma.$queryRaw`
      SELECT 
        id,
        name,
        email,
        phone,
        status,
        ts_rank(to_tsvector('portuguese', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')), plainto_tsquery('portuguese', ${query})) as rank
      FROM "Patient"
      WHERE "userId" = ${userId}
        AND to_tsvector('portuguese', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')) @@ plainto_tsquery('portuguese', ${query})
      ORDER BY rank DESC, name
      LIMIT ${limit}
    `
  }

  // Relatório financeiro otimizado
  static async getFinancialReport(userId: string, startDate: Date, endDate: Date) {
    return prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "date") as day,
        SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END) as income,
        SUM(CASE WHEN "type" = 'EXPENSE' THEN "amount" ELSE 0 END) as expenses,
        SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE -"amount" END) as net
      FROM "Transaction"
      WHERE "userId" = ${userId}
        AND "date" BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE_TRUNC('day', "date")
      ORDER BY day
    `
  }
}

// Utilitários para otimização
export class QueryOptimizer {
  // Batch loading para evitar N+1
  static async batchLoadPatientAppointments(patientIds: string[]) {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: { in: patientIds }
      },
      include: {
        patient: {
          select: { id: true, name: true }
        }
      }
    })

    // Agrupar por paciente
    return patientIds.reduce((acc, patientId) => {
      acc[patientId] = appointments.filter(apt => apt.patientId === patientId)
      return acc
    }, {} as Record<string, any[]>)
  }

  // Preload de dados relacionados
  static async preloadRelatedData(userId: string) {
    const [patients, recentAppointments, pendingTasks] = await Promise.all([
      prisma.patient.findMany({
        where: { userId },
        take: 50,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.appointment.findMany({
        where: {
          userId,
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // próximos 7 dias
          }
        },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      }),
      // Adicionar outras queries de preload conforme necessário
    ])

    return {
      patients,
      recentAppointments,
      pendingTasks
    }
  }
}

// Cleanup automático
if (typeof window === 'undefined') {
  // Limpar cache a cada hora
  setInterval(() => {
    OptimizedPrismaClient.clearAllCache()
  }, 60 * 60 * 1000)
}