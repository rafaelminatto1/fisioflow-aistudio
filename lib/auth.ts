// src/lib/auth.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import redis from './redis';
import { Role } from '@prisma/client';

/**
 * @interface ExtendedUser
 * @description Estende a interface de usuário padrão do NextAuth para incluir propriedades personalizadas.
 * @property {string} id - O ID do usuário.
 * @property {Role} role - A função do usuário (ex: Admin, Fisioterapeuta).
 * @property {string | undefined} avatarUrl - A URL do avatar do usuário.
 */
interface ExtendedUser {
  id: string;
  role: Role;
  avatarUrl: string | undefined;
}

const RATE_LIMIT_PREFIX = 'rate_limit:login:';
const MAX_ATTEMPTS = 5;
const ATTEMPTS_WINDOW_SECONDS = 15 * 60; // 15 minutos

/**
 * @constant authOptions
 * @description Objeto de configuração para o NextAuth.js.
 * Define o adaptador Prisma, provedores de autenticação (Credentials), estratégia de sessão (JWT),
 * callbacks para manipulação de token e sessão, e outras configurações.
 * Inclui lógica de rate limiting para tentativas de login.
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
      /**
       * @function authorize
       * @description Função de autorização para o provedor de credenciais.
       * Valida as credenciais do usuário, verifica o rate limiting, compara a senha e retorna os dados do usuário se a autenticação for bem-sucedida.
       *
       * @param {Partial<Record<string, unknown>>} credentials - As credenciais fornecidas pelo usuário (email e senha).
       * @param {Request} req - O objeto da requisição.
       * @returns {Promise<any>} Os dados do usuário se a autorização for bem-sucedida.
       * @throws {Error} Se as credenciais forem inválidas, o rate limit for excedido, ou o usuário/senha estiverem incorretos.
       */
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
    /**
     * @callback jwt
     * @description Callback para manipular o token JWT.
     * Adiciona propriedades personalizadas (id, role, avatarUrl) ao token quando o usuário faz login.
     *
     * @param {{token: JWT, user?: User}} params - Os parâmetros do callback.
     * @returns {Promise<JWT>} O token JWT modificado.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    /**
     * @callback session
     * @description Callback para manipular o objeto de sessão.
     * Adiciona as propriedades personalizadas do token JWT (id, role, avatarUrl) ao objeto de sessão.
     *
     * @param {{session: Session, token: JWT}} params - Os parâmetros do callback.
     * @returns {Promise<Session>} O objeto de sessão modificado.
     */
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
 * Obtém os dados do usuário da sessão atual no lado do servidor.
 *
 * @returns {Promise<ExtendedUser | undefined>} Os dados do usuário estendido, ou undefined se não houver sessão.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};
