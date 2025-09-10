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
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.password !== 'string' ||
          typeof credentials.email !== 'string'
        ) {
          throw new Error('Credenciais inválidas.');
        }

        const ip =
          req.headers?.get('x-forwarded-for') ||
          req.headers?.get('remote_addr') ||
          'unknown';
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${credentials.email}`;

        const attempts = await redis.get(rateLimitKey);
        if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
          // Rate limit exceeded - log removed as auditLog model doesn't exist
          throw new Error(
            'Muitas tentativas de login. Tente novamente em 15 minutos.'
          );
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
  debug: process.env.NODE_ENV === 'development',
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
