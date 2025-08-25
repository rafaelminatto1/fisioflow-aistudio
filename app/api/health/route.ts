import { NextResponse } from 'next/server';
import { createHealthCheckHandler } from '@/lib/middleware/performance';

// Use the new performance-optimized health check handler
export const GET = createHealthCheckHandler();

// Support HEAD requests for simple health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}