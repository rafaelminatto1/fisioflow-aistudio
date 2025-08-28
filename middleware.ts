import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const { auth } = NextAuth(authOptions);

const publicRoutes = ['/login', '/api/health'];
const authApiPattern = /^\/api\/auth\//;

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    publicRoutes.includes(pathname) || authApiPattern.test(pathname);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  response.headers.set('Access-Control-Allow-Origin', appUrl);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};