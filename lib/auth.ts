// lib/auth.ts
import { AuthOptions, getServerSession, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import redis from './redis';

const RATE_LIMIT_PREFIX = "rate_limit:login:";
const MAX_ATTEMPTS = 5;
const ATTEMPTS_WINDOW_SECONDS = 15 * 60; // 15 minutos

/**
 * Opções de configuração para o NextAuth.js.
 * Centraliza toda a lógica de autenticação.
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
        
        // --- Rate Limiting ---
        const attempts = await redis.get(rateLimitKey);
        if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
          await prisma.auditLog.create({
            data: {
              action: "LOGIN_RATE_LIMITED",
              details: `Tentativa de login bloqueada para ${credentials.email} por excesso de tentativas.`,
              ipAddress: ip,
              userId: "system" // Ou um ID de usuário anônimo se tiver
            }
          });
          throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
        }

        // --- Lógica de Autenticação ---
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
            await redis.incr(rateLimitKey);
            await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
            
            await prisma.auditLog.create({ data: { action: "LOGIN_FAILURE", details: `Usuário não encontrado: ${credentials.email}`, ipAddress: ip, userId: "system" } });
            throw new Error('Usuário não encontrado.');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isPasswordCorrect) {
          await redis.incr(rateLimitKey);
          await redis.expire(rateLimitKey, ATTEMPTS_WINDOW_SECONDS);
          
          await prisma.auditLog.create({ data: { action: "LOGIN_FAILURE", details: `Senha incorreta para usuário ${user.email}`, ipAddress: ip, userId: user.id } });
          throw new Error('Senha incorreta.');
        }
        
        // --- Autenticação bem-sucedida ---
        await redis.del(rateLimitKey); // Reseta o contador de tentativas
        await prisma.auditLog.create({ data: { action: "LOGIN_SUCCESS", ipAddress: ip, userId: user.id } });
        
        // TODO: Implementar lógica de 2FA aqui.
        // Se user.twoFactorEnabled for true, não retorne o usuário ainda.
        // Em vez disso, retorne um objeto indicando que o 2FA é necessário.
        // A página de login então redirecionaria para uma página de verificação de 2FA.
        
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
      // Na primeira vez que o JWT é criado (após o login), o objeto 'user' está disponível.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // 'user' aqui pode não ter o tipo Role, então usamos 'any'
        token.avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      // Transfere os dados do token para o objeto da sessão.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout',
    // error: '/auth/error', 
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};


/**
 * Helper para obter a sessão do usuário no lado do servidor (Server Components, API Routes).
 */
export const getCurrentUser = async () => {
    const session = await getServerSession(authOptions);
    return session?.user;
};
