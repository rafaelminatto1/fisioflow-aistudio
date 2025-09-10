import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    authSystem: 'nextauth',
  };

  try {
    // Test environment variables
    diagnostics.envVars = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.database = { connected: true };
    } catch (dbError) {
      diagnostics.database = { 
        connected: false, 
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      };
    }

    // Test auth session
    try {
      const session = await auth();
      diagnostics.auth = {
        sessionAvailable: !!session,
        hasUser: !!session?.user,
        userInfo: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        } : null
      };
    } catch (authError) {
      diagnostics.auth = {
        sessionAvailable: false,
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        stack: authError instanceof Error ? authError.stack : undefined
      };
    }

    return NextResponse.json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('Diagnostic test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      diagnostics
    }, { status: 500 });
  }
}