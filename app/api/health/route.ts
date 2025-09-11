import { NextResponse } from 'next/server';
import { createHealthCheckHandler } from '@/lib/middleware/performance';

/**
 * @description Handler para a rota GET /api/health.
 * Utiliza um handler de health check com monitoramento de desempenho para
 * fornecer um status detalhado da saúde da aplicação.
 * @returns {Promise<NextResponse>} Uma resposta JSON com o status da aplicação.
 */
export const GET = createHealthCheckHandler();

/**
 * @description Handler para a rota HEAD /api/health.
 * Fornece um endpoint leve para verificações de saúde rápidas,
 * retornando apenas um status 200 OK sem corpo.
 * @returns {Promise<NextResponse>} Uma resposta vazia com status 200.
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
