import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Starting comprehensive auth debug');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // Environment variables check
      envCheck: {
        NEXTAUTH_SECRET: {
          exists: !!process.env.NEXTAUTH_SECRET,
          length: process.env.NEXTAUTH_SECRET?.length || 0,
          isValid: (process.env.NEXTAUTH_SECRET?.length || 0) >= 32
        },
        NEXTAUTH_URL: {
          exists: !!process.env.NEXTAUTH_URL,
          value: process.env.NEXTAUTH_URL
        },
        DATABASE_URL: {
          exists: !!process.env.DATABASE_URL,
          hasPassword: process.env.DATABASE_URL?.includes('password=') || false,
          hasHost: process.env.DATABASE_URL?.includes('host=') || false
        }
      },
      
      // Database connectivity test
      database: { connected: false, error: null },
      
      // User count test
      userCount: 0,
      
      // NextAuth handler test
      nextAuthHandler: { exists: false, error: null }
    };

    // Test database connection
    try {
      console.log('[DEBUG] Testing database connection');
      await prisma.$connect();
      const userCount = await prisma.user.count();
      debug.database = { connected: true, error: null };
      debug.userCount = userCount;
      console.log(`[DEBUG] Database connected, found ${userCount} users`);
    } catch (dbError) {
      console.error('[DEBUG] Database connection failed:', dbError);
      debug.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      };
    }

    // Test NextAuth handlers
    try {
      console.log('[DEBUG] Testing NextAuth handlers import');
      const { handlers } = await import('@/lib/auth');
      debug.nextAuthHandler = { exists: !!handlers, error: null };
      console.log('[DEBUG] NextAuth handlers imported successfully');
    } catch (authError) {
      console.error('[DEBUG] NextAuth handlers import failed:', authError);
      debug.nextAuthHandler = {
        exists: false,
        error: authError instanceof Error ? authError.message : 'Unknown auth error'
      };
    }

    // Environment recommendations
    const recommendations = [];
    
    if (!debug.envCheck.NEXTAUTH_SECRET.exists) {
      recommendations.push('Set NEXTAUTH_SECRET environment variable');
    } else if (!debug.envCheck.NEXTAUTH_SECRET.isValid) {
      recommendations.push('NEXTAUTH_SECRET should be at least 32 characters long');
    }
    
    if (!debug.envCheck.NEXTAUTH_URL.exists) {
      recommendations.push('Set NEXTAUTH_URL environment variable to your app URL');
    }
    
    if (!debug.database.connected) {
      recommendations.push('Fix database connection');
    }
    
    if (!debug.nextAuthHandler.exists) {
      recommendations.push('Fix NextAuth configuration');
    }

    console.log('[DEBUG] Debug complete, returning results');
    
    return NextResponse.json({
      status: 'debug-complete',
      debug,
      recommendations,
      ready: recommendations.length === 0
    });
    
  } catch (error) {
    console.error('[DEBUG] Debug endpoint error:', error);
    
    return NextResponse.json({
      status: 'debug-failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}