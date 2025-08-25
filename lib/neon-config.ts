import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Configure Neon for serverless environments
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Connection pool configuration
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ 
  connectionString,
  max: parseInt(process.env.DATABASE_POOL_SIZE || '20'),
  idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '600000'),
  connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30000'),
  statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '60000'),
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
});

// Prisma adapter for Neon
const adapter = new PrismaNeon(pool);

// Prisma client with Neon adapter
export const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Neon API configuration
export const neonApiConfig = {
  apiKey: process.env.NEON_API_KEY!,
  projectId: process.env.NEON_PROJECT_ID!,
  branchId: process.env.NEON_BRANCH_ID!,
  endpointId: process.env.NEON_ENDPOINT_ID!,
  baseUrl: 'https://console.neon.tech/api/v2',
};

// Health check function
export async function checkNeonHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  poolStats: {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  };
  timestamp: string;
}> {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency,
      poolStats: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Neon health check failed:', error);
    
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      poolStats: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Connection metrics
export async function getNeonMetrics() {
  try {
    const [connectionStats, databaseSize, activeQueries] = await Promise.all([
      // Connection statistics
      prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
      
      // Database size
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `,
      
      // Active queries
      prisma.$queryRaw`
        SELECT count(*) as active_queries
        FROM pg_stat_activity 
        WHERE state = 'active' AND query != '<IDLE>'
      `
    ]);

    return {
      connectionStats: Array.isArray(connectionStats) ? connectionStats[0] : connectionStats,
      databaseSize: Array.isArray(databaseSize) ? databaseSize[0] : databaseSize,
      activeQueries: Array.isArray(activeQueries) ? activeQueries[0] : activeQueries,
      poolStats: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get Neon metrics:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeNeonConnection() {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('Neon connections closed gracefully');
  } catch (error) {
    console.error('Error closing Neon connections:', error);
  }
}

// Auto-scaling configuration
export const neonAutoScaling = {
  minComputeUnits: 0.25,
  maxComputeUnits: 4,
  autoSuspendDelay: parseInt(process.env.NEON_AUTO_SUSPEND_DELAY || '300'),
  scaleUpThreshold: 80, // CPU percentage
  scaleDownThreshold: 20, // CPU percentage
};

// Export pool for direct access if needed
export { pool };

// Process cleanup
process.on('SIGINT', closeNeonConnection);
process.on('SIGTERM', closeNeonConnection);
process.on('beforeExit', closeNeonConnection);