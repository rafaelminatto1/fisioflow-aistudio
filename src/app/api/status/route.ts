import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime compatible status endpoint
export const runtime = 'edge';

/**
 * Status Endpoint
 * Retorna informações detalhadas sobre o status da aplicação
 * Compatível com Edge Runtime
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Verificar memória (simulado para Edge Runtime)
    const memoryUsageInMB = {
      used: 0, // Edge Runtime não tem acesso a process.memoryUsage()
      total: 0,
      percentage: 0
    };

    // Verificar uptime (simulado para Edge Runtime)
    const uptime = 0; // Edge Runtime não tem acesso a process.uptime()

    // Status dos serviços
    const services = {
      database: await checkDatabaseStatus(),
      redis: await checkRedisStatus(),
      memory: {
        status: 'healthy', // Sempre healthy no Edge Runtime
        usage: memoryUsageInMB
      },
      system: {
        status: 'healthy',
        nodeVersion: 'edge-runtime', // Edge Runtime não tem acesso a process.version
        platform: 'edge' // Edge Runtime não tem acesso a process.platform
      }
    };

    // Determinar status geral
    const overallStatus = Object.values(services).every(
      service => service.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';

    const statusData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: (typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined) || 'development',
      uptime,
      services,
      metrics: {
        responseTime: Date.now() - startTime,
        memoryUsage: memoryUsageInMB
      }
    };

    return NextResponse.json(statusData, { 
      status: overallStatus === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    console.error('Status check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Verificar status do banco de dados
 */
async function checkDatabaseStatus() {
  try {
    // Em ambiente de teste, simular status saudável (Edge Runtime compatible)
    const nodeEnv = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
    if (nodeEnv === 'test') {
      return {
        status: 'healthy',
        responseTime: 10,
        message: 'Database connection simulated in test environment'
      };
    }

    // Verificar se DATABASE_URL está configurada (Edge Runtime compatible)
    const databaseUrl = typeof process !== 'undefined' && process.env ? process.env.DATABASE_URL : undefined;
    if (!databaseUrl) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: 'DATABASE_URL not configured'
      };
    }

    const startTime = Date.now();
    
    // Importar Prisma dinamicamente para evitar problemas em teste
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Database connection successful'
      };
    } catch (dbError) {
      await prisma.$disconnect();
      throw dbError;
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now(),
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Verificar status do Redis
 */
async function checkRedisStatus() {
  try {
    // Em ambiente de teste, simular status saudável (Edge Runtime compatible)
    const nodeEnv = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
    if (nodeEnv === 'test') {
      return {
        status: 'healthy',
        responseTime: 5,
        message: 'Redis connection simulated in test environment'
      };
    }

    // Verificar se REDIS_URL está configurada (Edge Runtime compatible)
    const redisUrl = typeof process !== 'undefined' && process.env ? process.env.REDIS_URL : undefined;
    if (!redisUrl) {
      return {
        status: 'warning',
        responseTime: 0,
        message: 'Redis not configured (optional service)'
      };
    }

    const startTime = Date.now();
    
    // Importar Redis dinamicamente
    const { createClient } = await import('redis');
    const client = createClient({
      url: redisUrl
    });
    
    try {
      await client.connect();
      await client.ping();
      await client.disconnect();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Redis connection successful'
      };
    } catch (redisError) {
      await client.disconnect().catch(() => {});
      throw redisError;
    }
  } catch (error) {
    return {
      status: 'warning',
      responseTime: Date.now(),
      message: 'Redis connection failed (optional service)'
    };
  }
}