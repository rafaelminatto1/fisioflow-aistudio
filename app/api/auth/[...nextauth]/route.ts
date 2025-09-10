import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Wrap handlers with error logging
async function handleRequest(request: NextRequest, handler: any) {
  try {
    console.log(`[AUTH API] ${request.method} request to:`, request.url);
    const response = await handler(request);
    console.log(`[AUTH API] Response status:`, response.status);
    return response;
  } catch (error) {
    console.error('[AUTH API] Handler error:', error);
    console.error('[AUTH API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, handlers.GET);
}

export async function POST(request: NextRequest) {
  return handleRequest(request, handlers.POST);
}
