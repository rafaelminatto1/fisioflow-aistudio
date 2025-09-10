import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware for deployment
  const response = NextResponse.next();
  
  /*
   * CORS Configuration - Security Critical
   * 
   * Restricting CORS origins is essential for preventing unauthorized websites
   * from making requests to our API on behalf of users. Using '*' (wildcard)
   * allows ANY website to make requests, which can lead to:
   * 
   * - Cross-Site Request Forgery (CSRF) attacks
   * - Data theft through malicious scripts
   * - Unauthorized API access from untrusted domains
   * 
   * Only specific, trusted domains should be allowed to prevent these vulnerabilities.
   */
  
  // Define allowed origins for CORS
  const allowedOrigins = [
    'http://localhost:3000',           // Development
    'http://localhost:3001',           // Alternative dev port
    'https://fisioflow.vercel.app',    // Production Vercel
    'https://fisioflow-aistudio-1.ondigitalocean.app', // Production DigitalOcean
    // Add your production domain here when deployed
  ];
  
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Set CORS headers with specific origin validation
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow same-origin requests (no origin header means same-origin)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  // If origin is not allowed, don't set the CORS header (request will be blocked)
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled by their own middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - health check endpoint
     */
    '/((?!api|_next/static|_next/image|favicon.ico|health).*)',
  ],
};