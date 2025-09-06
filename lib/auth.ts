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
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
<<<<<<< HEAD
      async authorize(credentials: any) {
        console.log("[AUTH] Tentativa de login:", { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Credenciais faltando")
          return null
=======
      async authorize(credentials, req) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.password !== 'string' ||
          typeof credentials.email !== 'string'
        ) {
          throw new Error('Credenciais inválidas.');
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3
        }

        const ip =
          req.headers?.get('x-forwarded-for') ||
          req.headers?.get('remote_addr') ||
          'unknown';
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${credentials.email}`;

<<<<<<< HEAD
          console.log("[AUTH] Usuário encontrado:", { 
            found: !!user, 
            hasPassword: !!user?.passwordHash,
            email: user?.email 
          })

          if (!user || !user.passwordHash) {
            console.log("[AUTH] Usuário não encontrado ou sem senha")
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          console.log("[AUTH] Validação de senha:", { valid: isPasswordValid })

          if (!isPasswordValid) {
            console.log("[AUTH] Senha inválida")
            return null
          }

          console.log("[AUTH] Login bem-sucedido para:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl || undefined
          }
        } catch (error) {
          console.error("[AUTH] Erro durante autenticação:", error)
          return null
=======
        const attempts = await redis.get(rateLimitKey);
        if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
          // Rate limit exceeded - log removed as auditLog model doesn't exist
          throw new Error(
            'Muitas tentativas de login. Tente novamente em 15 minutos.'
          );
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          await redis.incr(rateLimitKey);
          await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          // Login failure - log removed as auditLog model doesn't exist
          throw new Error('Usuário ou senha inválidos.');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          await redis.incr(rateLimitKey);
          await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          // Login failure - log removed as auditLog model doesn't exist
          throw new Error('Usuário ou senha inválidos.');
        }

        await redis.del(rateLimitKey);
        // Login success - log removed as auditLog model doesn't exist

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const extendedUser = session.user as ExtendedUser;
        extendedUser.id = token.id as string;
        extendedUser.role = token.role as Role;
        extendedUser.avatarUrl = token.avatarUrl as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
<<<<<<< HEAD
  trustHost: true,
  useSecureCookies: false,
  debug: true,
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  skipCSRFCheck: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
   },
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error]", code, metadata)
    },
    warn(code) {
      console.warn("[NextAuth Warning]", code)
    },
    debug(code, metadata) {
      console.log("[NextAuth Debug]", code, metadata)
    }
  }
}
=======
  debug: process.env.NODE_ENV === 'development',
};
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3

const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

export { auth, handlers, signIn, signOut };

/**
 * Helper para obter a sessão do usuário no lado do servidor.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};
