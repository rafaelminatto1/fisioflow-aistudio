import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
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

// Configuração do NextAuth sem Redis (versão simplificada para produção)
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
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

          // Rate limiting removido para evitar dependência do Redis
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
    strategy: 'jwt' as const,
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
    async signIn(message) {
      console.log('[AUTH] SignIn event:', { 
        userId: message.user.id, 
        email: message.user.email, 
        isNewUser: message.isNewUser,
        timestamp: new Date().toISOString() 
      });
    },
    async signOut() {
      console.log('[AUTH] SignOut event:', { 
        timestamp: new Date().toISOString() 
      });
    },
    async session(message) {
      console.log('[AUTH] Session event:', { 
        userId: message.session?.user?.id,
        timestamp: new Date().toISOString() 
      });
    },
  },
};

const handler = NextAuth(authOptions);
const { auth, signIn, signOut } = handler;
const handlers = { GET: handler.handlers.GET, POST: handler.handlers.POST };

export { auth, handlers, signIn, signOut };

/**
 * Helper para obter a sessão do usuário no lado do servidor.
 */
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};