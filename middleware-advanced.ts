/**
 * FisioFlow - Next.js Middleware para Railway
 *
 * Middleware principal que integra:
 * - Logs estruturados
 * - Monitoramento de performance
 * - Health checks
 * - Rate limiting
 * - CORS
 * - Segurança
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  simpleLogger as edgeLogger,
  measurePerformance,
} from './lib/simple-logger';
import { cache } from './lib/cache';
import crypto from 'crypto';

// Configurações do middleware
const MIDDLEWARE_CONFIG = {
  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // CORS
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    methods: process.env.CORS_METHODS?.split(',') || [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    headers: process.env.CORS_HEADERS?.split(',') || [
      'Content-Type',
      'Authorization',
    ],
  },

  // Health check
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    path: process.env.HEALTH_CHECK_PATH || '/health',
  },

  // Security
  security: {
    helmet: process.env.HELMET_ENABLED === 'true',
    csrf: process.env.CSRF_PROTECTION === 'true',
  },
};

// Cache para rate limiting (em produção usar Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Route cache configuration
const ROUTE_CACHE_CONFIG = {
  enabled: process.env.ROUTE_CACHE_ENABLED === 'true',
  defaultTTL: parseInt(process.env.ROUTE_CACHE_TTL || '300'), // 5 minutes

  // Routes that should be cached
  cacheableRoutes: [
    '/api/patients',
    '/api/appointments',
    '/api/reports',
    '/api/analytics',
    '/api/health',
  ],

  // Routes that should never be cached
  excludeRoutes: ['/api/auth', '/api/session', '/api/upload', '/api/webhook'],

  // Methods to cache
  cacheableMethods: ['GET', 'HEAD'],

  // TTL overrides for specific routes
  routeTTL: {
    '/api/health': 60, // 1 minute
    '/api/reports': 1800, // 30 minutes
    '/api/analytics': 600, // 10 minutes
    '/api/patients': 300, // 5 minutes
    '/api/appointments': 120, // 2 minutes
  } as Record<string, number>,
};

// Função para limpar cache expirado
function cleanupRateLimitCache() {
  const now = Date.now();
  Array.from(rateLimitCache.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      rateLimitCache.delete(key);
    }
  });
}

// Rate limiting
function checkRateLimit(request: NextRequest): boolean {
  if (!MIDDLEWARE_CONFIG.rateLimit.enabled) return true;

  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const windowMs = MIDDLEWARE_CONFIG.rateLimit.windowMs;
  const maxRequests = MIDDLEWARE_CONFIG.rateLimit.maxRequests;

  // Limpar cache periodicamente
  if (Math.random() < 0.01) {
    cleanupRateLimitCache();
  }

  const key = `rate_limit:${ip}`;
  const current = rateLimitCache.get(key);

  if (!current || now > current.resetTime) {
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// CORS headers
function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  if (!MIDDLEWARE_CONFIG.cors.enabled) return response;

  const origin = request.headers.get('origin');
  const { origins, methods, headers } = MIDDLEWARE_CONFIG.cors;

  // Verificar origem
  if (origins.includes('*') || (origin && origins.includes(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }

  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  if (!MIDDLEWARE_CONFIG.security.helmet) return response;

  // Helmet-like security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // CSP para Railway
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.neon.tech https://*.railway.app",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

// Health check
function handleHealthCheck(request: NextRequest): NextResponse | null {
  if (!MIDDLEWARE_CONFIG.healthCheck.enabled) return null;

  const { pathname } = new URL(request.url);

  if (pathname === MIDDLEWARE_CONFIG.healthCheck.path) {
    const metrics = edgeLogger.getMetrics();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV,
      service: process.env.RAILWAY_SERVICE_NAME || 'fisioflow',
      version: process.env.npm_package_version || '1.0.0',
      commit: process.env.RAILWAY_GIT_COMMIT_SHA,
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
      metrics: {
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        errorRate: metrics.errorRate,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      checks: {
        database: 'healthy', // TODO: Implementar check real do DB
        redis: 'healthy', // TODO: Implementar check real do Redis
      },
    };

    edgeLogger.info('Health check executado', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }

  return null;
}

// Generate cache key for route
function generateRouteCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // Sort query parameters for consistent caching
  const sortedParams = Array.from(searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const baseKey = `${request.method}:${pathname}`;
  const queryKey = sortedParams
    ? `:${crypto.createHash('md5').update(sortedParams).digest('hex')}`
    : '';

  return `route_cache:${baseKey}${queryKey}`;
}

// Check if route should be cached
function shouldCacheRoute(request: NextRequest): boolean {
  if (!ROUTE_CACHE_CONFIG.enabled) return false;

  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // Check method
  if (!ROUTE_CACHE_CONFIG.cacheableMethods.includes(method)) {
    return false;
  }

  // Check exclude list
  if (
    ROUTE_CACHE_CONFIG.excludeRoutes.some(route => pathname.startsWith(route))
  ) {
    return false;
  }

  // Check include list
  return ROUTE_CACHE_CONFIG.cacheableRoutes.some(route =>
    pathname.startsWith(route)
  );
}

// Get TTL for specific route
function getRouteTTL(pathname: string): number {
  // Check for specific route TTL
  for (const [route, ttl] of Object.entries(ROUTE_CACHE_CONFIG.routeTTL)) {
    if (pathname.startsWith(route)) {
      return ttl;
    }
  }

  return ROUTE_CACHE_CONFIG.defaultTTL;
}

// Try to serve from cache
async function tryServeFromCache(
  request: NextRequest
): Promise<NextResponse | null> {
  if (!shouldCacheRoute(request)) return null;

  try {
    const cacheKey = generateRouteCacheKey(request);
    const cached = await cache.get<{
      body: string;
      headers: Record<string, string>;
      status: number;
      timestamp: number;
    }>(cacheKey, { layer: 'both' });

    if (cached) {
      const response = new NextResponse(cached.body, {
        status: cached.status,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
          'X-Cache-Timestamp': new Date(cached.timestamp).toISOString(),
        },
      });

      edgeLogger.debug('Route served from cache', {
        url: request.url,
        cacheKey,
        age: Date.now() - cached.timestamp,
      });

      return response;
    }
  } catch (error) {
    edgeLogger.error(`Cache retrieval error for ${request.url}`, error as Error);
  }

  return null;
}

// Store response in cache
async function storeInCache(
  request: NextRequest,
  response: NextResponse | Response
): Promise<void> {
  if (!shouldCacheRoute(request)) return;

  // Only cache successful responses
  if (response.status < 200 || response.status >= 300) return;

  // Don't cache responses with certain headers
  if (response.headers.get('cache-control')?.includes('no-cache')) return;
  if (response.headers.get('cache-control')?.includes('private')) return;

  try {
    const url = new URL(request.url);
    const cacheKey = generateRouteCacheKey(request);
    const ttl = getRouteTTL(url.pathname);

    // Clone the response to read the body
    const responseClone = response.clone();
    const body = await responseClone.text();

    // Extract relevant headers
    const headers: Record<string, string> = {};
    const headersToCache = [
      'content-type',
      'content-encoding',
      'etag',
      'last-modified',
    ];

    for (const headerName of headersToCache) {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    }

    const cacheData = {
      body,
      headers,
      status: response.status,
      timestamp: Date.now(),
    };

    await cache.set(cacheKey, cacheData, {
      ttl,
      tags: ['route-cache', `method:${request.method}`, `path:${url.pathname}`],
      layer: 'both',
      compress: body.length > 1024,
    });

    edgeLogger.debug('Response cached', {
      url: request.url,
      cacheKey,
      ttl,
      size: body.length,
    });
  } catch (error) {
    edgeLogger.error(`Cache storage error for ${request.url}`, error as Error);
  }
}

// Middleware principal
export async function middleware(request: NextRequest) {
  return measurePerformance('middleware_execution', async () => {
    const startTime = Date.now();

    // Criar contexto de logging
    const logRequest = edgeLogger.createRequestMiddleware();
    const logResponse = logRequest(request);

    try {
      // Health check
      const healthResponse = handleHealthCheck(request);
      if (healthResponse) {
        logResponse(200);
        return healthResponse;
      }

      // Try to serve from cache
      const cachedResponse = await tryServeFromCache(request);
      if (cachedResponse) {
        logResponse(cachedResponse.status);
        return cachedResponse;
      }

      // Rate limiting
      if (!checkRateLimit(request)) {
        edgeLogger.warn('Rate limit excedido', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          url: request.url,
        });

        const response = NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );

        logResponse(429);
        return addCorsHeaders(addSecurityHeaders(response), request);
      }

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        logResponse(200);
        return addCorsHeaders(addSecurityHeaders(response), request);
      }

      // Continuar com a requisição
      const response = NextResponse.next();

      // Store in cache if applicable (this is a simplified approach)
      // In a real scenario, you'd want to cache the actual API response
      if (shouldCacheRoute(request) && response.status === 200) {
        // Note: This is a basic implementation. For full route caching,
        // you'd need to implement this at the API route level or use
        // a more sophisticated caching strategy
        try {
          await storeInCache(request, response.clone());
        } catch (error) {
          edgeLogger.error('Failed to store response in cache', error as Error);
        }
      }

      // Adicionar headers de segurança e CORS
      const finalResponse = addCorsHeaders(
        addSecurityHeaders(response),
        request
      );

      // Adicionar headers customizados do Railway
      finalResponse.headers.set(
        'X-Railway-Service',
        process.env.RAILWAY_SERVICE_NAME || 'fisioflow'
      );
      finalResponse.headers.set(
        'X-Railway-Environment',
        process.env.RAILWAY_ENVIRONMENT || 'development'
      );
      finalResponse.headers.set('X-Cache', cachedResponse ? 'HIT' : 'MISS');

      if (process.env.RAILWAY_DEPLOYMENT_ID) {
        finalResponse.headers.set(
          'X-Railway-Deployment',
          process.env.RAILWAY_DEPLOYMENT_ID
        );
      }

      // Log da resposta
      const duration = Date.now() - startTime;
      logResponse(finalResponse.status);

      // Log de performance se demorou muito
      if (duration > 1000) {
        edgeLogger.warn('Requisição lenta detectada', {
          url: request.url,
          method: request.method,
          duration,
          cached: cachedResponse ? 'HIT' : 'MISS',
        });
      }

      // Log cache performance metrics
      if (duration > 0) {
        edgeLogger.debug('Request processed', {
          url: request.url,
          method: request.method,
          duration,
          status: finalResponse.status,
          cached: cachedResponse ? 'HIT' : 'MISS',
          cacheEligible: shouldCacheRoute(request),
        });
      }

      return finalResponse;
    } catch (error) {
      edgeLogger.error(`Erro no middleware para ${request.url} (${request.method})`, error as Error);

      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );

      logResponse(500, error as Error);
      return addCorsHeaders(addSecurityHeaders(errorResponse), request);
    }
  });
}

// Configuração do matcher
// Cache management utilities for middleware
export const MiddlewareCache = {
  /**
   * Invalidate route cache by pattern
   */
  async invalidateRoutePattern(pattern: string): Promise<void> {
    try {
      await cache.invalidateTag(`path:${pattern}`);
      edgeLogger.info('Route cache invalidated', { pattern });
    } catch (error) {
      edgeLogger.error(`Failed to invalidate route cache for pattern ${pattern}`, error as Error);
    }
  },

  /**
   * Invalidate all route cache
   */
  async invalidateAllRoutes(): Promise<void> {
    try {
      await cache.invalidateTag('route-cache');
      edgeLogger.info('All route cache invalidated');
    } catch (error) {
      edgeLogger.error('Failed to invalidate all route cache', error as Error);
    }
  },

  /**
   * Get cache statistics
   */
  async getStats() {
    return cache.getMetrics();
  },
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * But include API routes for caching
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
