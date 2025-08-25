// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { addSecurityHeaders, checkRateLimit } from '@/lib/security';

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientId = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime! - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // Redirect authenticated users away from login page
  if (session && pathname === '/login') {
    let defaultPath = '/dashboard';
    if (session.user?.role === Role.Paciente) defaultPath = '/portal/dashboard';
    return NextResponse.redirect(new URL(defaultPath, req.url));
  }

  // Protect routes that require authentication
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based access control
  if (session) {
    const isTherapistPortal = !pathname.startsWith('/portal') && !pathname.startsWith('/partner');
    const isPatientPortal = pathname.startsWith('/portal');
    const isPartnerPortal = pathname.startsWith('/partner');

    const allowedTherapistRoles: Role[] = [Role.Admin, Role.Fisioterapeuta, Role.EducadorFisico];

    if (isTherapistPortal && !allowedTherapistRoles.includes(session.user?.role as Role)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isPatientPortal && session.user?.role !== Role.Paciente) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Create response and add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png).*)',
  ],
};
