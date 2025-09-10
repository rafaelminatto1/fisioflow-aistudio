import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    status: 'starting-debug',
    environment: process.env.NODE_ENV || 'unknown',
    
    // Basic environment check
    env: {
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length || 0,
      has_nextauth_url: !!process.env.NEXTAUTH_URL,
      nextauth_url: process.env.NEXTAUTH_URL || 'not-set',
      has_database_url: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV || 'not-set'
    },
    
    // Test results
    tests: {
      env_check: 'pending',
      db_check: 'pending', 
      auth_check: 'pending'
    },
    
    recommendations: [] as string[]
  };

  try {
    // Environment validation
    debug.tests.env_check = 'running';
    
    if (!process.env.NEXTAUTH_SECRET) {
      debug.recommendations.push('MISSING: NEXTAUTH_SECRET environment variable');
    } else if (process.env.NEXTAUTH_SECRET.length < 32) {
      debug.recommendations.push('INVALID: NEXTAUTH_SECRET must be at least 32 characters');
    }
    
    if (!process.env.NEXTAUTH_URL) {
      debug.recommendations.push('MISSING: NEXTAUTH_URL environment variable');
    }
    
    if (!process.env.DATABASE_URL) {
      debug.recommendations.push('MISSING: DATABASE_URL environment variable');
    }
    
    debug.tests.env_check = 'completed';
    
    // Database test
    debug.tests.db_check = 'running';
    try {
      const { default: prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      debug.tests.db_check = 'success';
    } catch (dbError) {
      debug.tests.db_check = 'failed';
      debug.recommendations.push(`DATABASE: ${dbError instanceof Error ? dbError.message : 'Connection failed'}`);
    }
    
    // Auth test
    debug.tests.auth_check = 'running';
    try {
      const authModule = await import('@/lib/auth');
      debug.tests.auth_check = authModule.auth ? 'success' : 'failed';
      if (!authModule.auth) {
        debug.recommendations.push('AUTH: NextAuth configuration failed to load');
      }
    } catch (authError) {
      debug.tests.auth_check = 'failed';
      debug.recommendations.push(`AUTH: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`);
    }

    // Summary
    debug.status = 'completed';
    const isHealthy = debug.recommendations.length === 0;
    
    return NextResponse.json({
      healthy: isHealthy,
      debug,
      summary: {
        total_issues: debug.recommendations.length,
        critical_issues: debug.recommendations.filter(r => r.includes('MISSING')).length,
        ready_for_auth: isHealthy
      }
    }, { 
      status: isHealthy ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('[SIMPLE-DEBUG] Error:', error);
    
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug,
      message: 'Debug endpoint failed - check server logs'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}