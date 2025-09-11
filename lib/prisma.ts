/**
 * @file src/lib/prisma.ts
 * @description Configuração e instanciação do cliente Prisma.
 * Este arquivo garante que apenas uma instância do PrismaClient seja criada
 * em ambiente de desenvolvimento, evitando o esgotamento de conexões com o banco de dados.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // Permite que a variável __prisma seja acessada globalmente.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * @constant prisma
 * @description Instância singleton do PrismaClient.
 * Em desenvolvimento, reutiliza a instância global para evitar múltiplas conexões.
 * Em produção, cria uma nova instância.
 * O logging de queries é ativado em desenvolvimento.
 */
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// --- PRISMA MIDDLEWARE ---
// Nenhum middleware configurado atualmente

/**
 * @description Exporta a instância do prisma com múltiplos aliases para compatibilidade.
 */
export const cachedPrisma = prisma;
export const prismaClient = prisma;
export { prisma };

export default prisma;
