// lib/security.ts
import { NextResponse } from 'next/server';

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  corsOrigins: string[];
  enableCSRF: boolean;
  enableHelmet: boolean;
}

const defaultConfig: SecurityConfig = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  corsOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fisioflow.railway.app',
  ],
  enableCSRF: true,
  enableHelmet: true,
};

// Rate limiting store (in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP Header
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

export function checkRateLimit(
  clientId: string,
  config: SecurityConfig = defaultConfig
): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const windowMs = config.rateLimiting.windowMs;
  const maxRequests = config.rateLimiting.maxRequests;

  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // First request or window reset
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (clientData.count >= maxRequests) {
    return { 
      allowed: false, 
      resetTime: clientData.resetTime 
    };
  }

  // Increment count
  rateLimitStore.set(clientId, {
    ...clientData,
    count: clientData.count + 1,
  });

  return { allowed: true };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  
  // Basic API key validation
  return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
}

export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple CSRF validation - in production, use more sophisticated methods
  return token === sessionToken && token.length > 0;
}

// Cleanup old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export { defaultConfig };