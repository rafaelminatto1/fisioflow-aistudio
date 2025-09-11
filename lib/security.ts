// lib/security.ts
import { NextResponse } from 'next/server';

/**
 * @interface SecurityConfig
 * @description Configurações de segurança para a aplicação.
 */
export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  corsOrigins: string[];
  enableCSRF: boolean;
  enableHelmet: boolean;
}

/**
 * @constant defaultConfig
 * @description Configurações de segurança padrão.
 */
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

/**
 * @constant rateLimitStore
 * @description Armazenamento em memória para o rate limiting (adequado para desenvolvimento).
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Adiciona cabeçalhos de segurança a uma resposta HTTP.
 * @param {NextResponse} response - O objeto de resposta do Next.js.
 * @returns {NextResponse} A resposta com os cabeçalhos de segurança adicionados.
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

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

/**
 * Verifica se um cliente excedeu o limite de requisições.
 * @param {string} clientId - Um identificador único para o cliente (ex: endereço IP).
 * @param {SecurityConfig} [config=defaultConfig] - As configurações de segurança a serem usadas.
 * @returns {{ allowed: boolean; resetTime?: number }} Um objeto indicando se a requisição é permitida.
 */
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
      resetTime: clientData.resetTime,
    };
  }

  // Increment count
  rateLimitStore.set(clientId, {
    ...clientData,
    count: clientData.count + 1,
  });

  return { allowed: true };
}

/**
 * Sanitiza uma string de entrada, removendo caracteres potencialmente perigosos.
 * @param {string} input - A string a ser sanitizada.
 * @returns {string} A string sanitizada.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Valida uma chave de API.
 * @param {string | null} apiKey - A chave de API a ser validada.
 * @returns {boolean} `true` se a chave de API for válida.
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;

  // Basic API key validation
  return apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
}

/**
 * Gera um token CSRF simples.
 * @returns {string} O token CSRF gerado.
 */
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Valida um token CSRF.
 * @param {string} token - O token recebido na requisição.
 * @param {string} sessionToken - O token armazenado na sessão.
 * @returns {boolean} `true` se o token for válido.
 */
export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  // Simple CSRF validation - in production, use more sophisticated methods
  return token === sessionToken && token.length > 0;
}

// Cleanup old rate limit entries
setInterval(
  () => {
    const now = Date.now();
    Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  },
  5 * 60 * 1000
); // Cleanup every 5 minutes

export { defaultConfig };
