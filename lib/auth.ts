import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
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

          // Buscar usuário no banco
          console.log('[AUTH] Searching for user:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) {
            console.error('[AUTH] User not found or no password hash:', credentials.email);
            throw new Error('Usuário ou senha inválidos.');
          }
          
          console.log('[AUTH] User found, verifying password for:', user.email);

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            console.error('[AUTH] Password verification failed for:', user.email);
            throw new Error('Usuário ou senha inválidos.');
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
    async session({ session, token }: any) {
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