// src/lib/auth.ts
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import redis from './redis';
import { Role } from '@prisma/client';

const RATE_LIMIT_PREFIX = "rate_limit:login:";
const MAX_ATTEMPTS = 5;
const ATTEMPTS_WINDOW_SECONDS = 15 * 60; // 15 minutos

/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas.');
        }

        const ip = req.headers?.['x-forwarded-for'] || req.headers?.['remote_addr'] || 'unknown';
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${credentials.email}`;
        
        const attempts = await redis.get(rateLimitKey);
        if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
          await prisma.auditLog.create({
            data: { action: "LOGIN_RATE_LIMITED", details: `Tentativa de login bloqueada para ${credentials.email}`, ipAddress: ip }
          });
          throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, deletedAt: null }
        });

        if (!user || !user.hashedPassword) {
            await redis.incr(rateLimitKey);
            await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
            await prisma.auditLog.create({ data: { action: "LOGIN_FAILURE", details: `Usuário não encontrado: ${credentials.email}`, ipAddress: ip } });
            throw new Error('Usuário ou senha inválidos.');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isPasswordCorrect) {
          await redis.incr(rateLimitKey);
          await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          await prisma.auditLog.create({ data: { action: "LOGIN_FAILURE", details: `Senha incorreta para usuário ${user.email}`, ipAddress: ip, userId: user.id } });
          throw new Error('Usuário ou senha inválidos.');
        }
        
        await redis.del(rateLimitKey);
        await prisma.auditLog.create({ data: { action: "LOGIN_SUCCESS", ipAddress: ip, userId: user.id } });
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        };
      }
    })
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
        const sessionUser = session.user as any;
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
        sessionUser.avatarUrl = token.avatarUrl as string;
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


/**
 * Helper para obter a sessão do usuário no lado do servidor.
 */
export const getCurrentUser = async () => {
    const session = await getServerSession(authOptions);
    return session?.user;
};
