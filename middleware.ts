// middleware.ts
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { token } = request.nextauth;
    const { pathname } = request.nextUrl;

    if (token && pathname === '/login') {
        let defaultPath = '/dashboard';
        if (token.role === Role.PACIENTE) defaultPath = '/portal/dashboard';
        if (token.role === Role.PARCEIRO) defaultPath = '/partner/dashboard';
        return NextResponse.redirect(new URL(defaultPath, request.url));
    }
    
    const isTherapistPortal = !pathname.startsWith('/portal') && !pathname.startsWith('/partner');
    const isPatientPortal = pathname.startsWith('/portal');
    const isPartnerPortal = pathname.startsWith('/partner');

    const allowedTherapistRoles: Role[] = [Role.ADMIN, Role.FISIOTERAPEUTA, Role.ESTAGIARIO];

    if (isTherapistPortal && !allowedTherapistRoles.includes(token?.role as Role)) {
        return NextResponse.redirect(new URL('/login', request.url)); 
    }

    if (isPatientPortal && token?.role !== Role.PACIENTE) {
         return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (isPartnerPortal && token?.role !== Role.PARCEIRO) {
         return NextResponse.redirect(new URL('/login', request.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png).*)',
  ],
};
