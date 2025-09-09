import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Configuração global para testes de integração
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://test:test@localhost:5432/fisioflow_test',
    },
  },
});

// Helper para criar requisições de teste
export function createTestRequest(
  url: string,
  options: RequestInit = {}
): NextRequest {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return new NextRequest(`${baseUrl}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'FisioFlow-Test/1.0',
      ...options.headers,
    },
    ...options,
  });
}

// Helper para autenticação em testes
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options: RequestInit = {}
): NextRequest {
  return createTestRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Cleanup após testes
export async function cleanupDatabase() {
  try {
    if (process.env.NODE_ENV === 'test') {
      // The tables are defined in snake_case in the @@map attributes in schema.prisma
      const tableNames = [
        'events',
        'event_registrations',
        'event_providers',
        'event_resources',
        'event_certificates',
        'event_communications',
        'appointments',
        'patients',
        'users',
      ];
      for (const tableName of tableNames) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
      }
      console.log('✅ Test database cleaned successfully.');
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up test database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Setup inicial para testes
export const setupTestEnvironment = async () => {
  try {
    // Verificar conexão com banco apenas se DATABASE_URL estiver configurada
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes('localhost')
    ) {
      await prisma.$connect();
      console.log('✅ Conexão com banco de dados estabelecida para testes');
    } else {
      console.log('📝 Usando mocks para testes (banco não configurado)');
    }

    return true;
  } catch (error) {
    console.warn(
      '⚠️ Erro ao conectar com banco de dados, usando mocks:',
      error.message
    );
    return false;
  }
};

export { prisma };
