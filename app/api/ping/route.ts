import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    
    // Basic env check without importing anything
    env_status: {
      nextauth_secret: process.env.NEXTAUTH_SECRET ? 'present' : 'missing',
      nextauth_url: process.env.NEXTAUTH_URL ? 'present' : 'missing', 
      database_url: process.env.DATABASE_URL ? 'present' : 'missing'
    }
  });
}