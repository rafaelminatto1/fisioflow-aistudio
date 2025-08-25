// middleware-simple.ts - Simplified middleware for testing
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Simple health check
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: 'enabled',
        middleware: 'active',
      };
      
      return NextResponse.json(healthData, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
        },
      });
    }
    
    // Continue with the request
    const response = NextResponse.next();
    
    // Add basic headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-Cache', 'MISS');
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};