// src/lib/auth.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import redis from './redis';
import { Role } from '@prisma/client';

// Tipos para estender a sessão do NextAuth
interface ExtendedUser {
  id: string;
  role: Role;
  avatarUrl: string | undefined;
}

const RATE_LIMIT_PREFIX = 'rate_limit:login:';
const MAX_ATTEMPTS = 5;
const ATTEMPTS_WINDOW_SECONDS = 15 * 60; // 15 minutos

/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          console.log('[AUTH] Starting authorization process');
          
          if (
            !credentials?.email ||
            !credentials?.password ||
            typeof credentials.password !== 'string' ||
            typeof credentials.email !== 'string'
          ) {
            console.error('[AUTH] Invalid credentials format');
            throw new Error('Credenciais inválidas.');
          }
          
          console.log('[AUTH] Credentials format validated for:', credentials.email);

        const ip =
          req.headers?.get('x-forwarded-for') ||
          req.headers?.get('remote_addr') ||
          'unknown';
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${credentials.email}`;

        try {
          const attempts = await redis.get(rateLimitKey);
          if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
            // Rate limit exceeded - log removed as auditLog model doesn't exist
            throw new Error(
              'Muitas tentativas de login. Tente novamente em 15 minutos.'
            );
          }
        } catch (redisError) {
          // Se Redis não estiver disponível, continue sem rate limiting
          console.warn('Redis não disponível para rate limiting:', redisError);
        }

        console.log('[AUTH] Searching for user:', credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          console.error('[AUTH] User not found or no password hash:', credentials.email);
          try {
            await redis.incr(rateLimitKey);
            await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          } catch (redisError) {
            console.warn('[AUTH] Redis não disponível para incrementar tentativas:', redisError);
          }
          // Login failure - log removed as auditLog model doesn't exist
          throw new Error('Usuário ou senha inválidos.');
        }
        
        console.log('[AUTH] User found, verifying password for:', user.email);

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          console.error('[AUTH] Password verification failed for:', user.email);
          try {
            await redis.incr(rateLimitKey);
            await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          } catch (redisError) {
            console.warn('[AUTH] Redis não disponível para incrementar tentativas:', redisError);
          }
          // Login failure - log removed as auditLog model doesn't exist
          throw new Error('Usuário ou senha inválidos.');
        }

        try {
          await redis.del(rateLimitKey);
        } catch (redisError) {
          console.warn('[AUTH] Redis não disponível para limpar tentativas:', redisError);
        }
        
        console.log('[AUTH] Authentication successful for:', user.email);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || undefined,
        };
        
        } catch (error) {
          console.error('[AUTH] Authorization error:', error);
          
          // Log detailed error information in production
          if (process.env.NODE_ENV === 'production') {
            console.error('[AUTH] Production error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : 'No stack trace',
              email: credentials?.email,
              timestamp: new Date().toISOString()
            });
          }
          
          // Re-throw the error to maintain NextAuth's error handling
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          console.log('[AUTH] JWT callback - adding user data to token');
          token.id = user.id;
          token.role = user.role;
          token.avatarUrl = user.avatarUrl;
        }
        return token;
      } catch (error) {
        console.error('[AUTH] JWT callback error:', error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          console.log('[AUTH] Session callback - building session for user:', token.id);
          const extendedUser = session.user as ExtendedUser;
          extendedUser.id = token.id as string;
          extendedUser.role = token.role as Role;
          extendedUser.avatarUrl = token.avatarUrl as string;
        }
        return session;
      } catch (error) {
        console.error('[AUTH] Session callback error:', error);
        throw error;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login?error=auth-error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Production specific settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60, // 8 hours
      },
    },
  },
  // Events for debugging production issues
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('[AUTH] SignIn event:', { 
        userId: user.id, 
        email: user.email, 
        isNewUser,
        timestamp: new Date().toISOString() 
      });
    },
    async signOut() {
      console.log('[AUTH] SignOut event:', { 
        timestamp: new Date().toISOString() 
      });
    },
    async session({ session, token }) {
      console.log('[AUTH] Session event:', { 
        userId: token?.id || session?.user?.id,
        timestamp: new Date().toISOString() 
      });
    },
  },
};

const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

export { auth, handlers, signIn, signOut };

/**
 * Helper para obter a sessão do usuário no lado do servidor.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};
