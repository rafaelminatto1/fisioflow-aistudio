import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import edgeLogger from './edge-logger';
import type { Role } from '@prisma/client';

// Tipos estendidos para NextAuth
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  avatarUrl?: string | null;
}

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    avatarUrl?: string | null;
  }

  interface Session {
    user: ExtendedUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    avatarUrl?: string | null;
  }
}

// Configuração simplificada do NextAuth sem Redis
export const authOptions = {
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          edgeLogger.info('Starting authorization process');
          
          if (
            !credentials?.email ||
            !credentials?.password ||
            typeof credentials.password !== 'string' ||
            typeof credentials.email !== 'string'
          ) {
            edgeLogger.warn('Invalid credentials format provided');
            throw new Error('Credenciais inválidas.');
          }
          
          edgeLogger.info('Credentials format validated', { email: credentials.email });

          // Buscar usuário no banco
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) {
            edgeLogger.warn('User authentication failed - user not found or no password', { email: credentials.email });
            throw new Error('Usuário ou senha inválidos.');
          }
          
          edgeLogger.debug('User found, verifying password');

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            edgeLogger.warn('Password verification failed', { email: user.email });
            throw new Error('Usuário ou senha inválidos.');
          }
          
          edgeLogger.info('Authentication successful', { email: user.email, role: user.role });
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl || undefined,
          };
          
        } catch (error) {
          edgeLogger.error('Authorization error', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 8 * 60 * 60, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }: any) {
      try {
        if (user) {
          edgeLogger.debug('JWT callback - adding user data to token');
          token.id = user.id;
          token.role = user.role;
          token.avatarUrl = user.avatarUrl;
        }
        return token;
      } catch (error) {
        edgeLogger.error('JWT callback error', error);
        throw error;
      }
    },
    async session({ session, token }: any) {
      try {
        if (session.user) {
          edgeLogger.debug('Session callback - building session', { userId: token.id });
          const extendedUser = session.user as ExtendedUser;
          extendedUser.id = token.id as string;
          extendedUser.role = token.role as Role;
          extendedUser.avatarUrl = token.avatarUrl as string;
        }
        return session;
      } catch (error) {
        edgeLogger.error('Session callback error', error);
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export const { auth, signIn, signOut } = handler;

// Legacy export for compatibility with older NextAuth versions
export const getServerSession = (req?: any, res?: any) => {
  return auth();
};

/**
 * Helper para obter a sessão do usuário no lado do servidor.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};