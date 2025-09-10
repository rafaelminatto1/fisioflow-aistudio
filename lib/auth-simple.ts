// Simplified, production-ready authentication configuration
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// Simplified types
interface ExtendedUser {
  id: string;
  role: Role;
  avatarUrl: string | undefined;
}

const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Starting authorization process');
        
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          console.log(`[AUTH] Looking up user: ${credentials.email}`);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.passwordHash) {
            console.log('[AUTH] User not found or no password hash');
            return null;
          }

          console.log('[AUTH] Verifying password');
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) {
            console.log('[AUTH] Invalid password');
            return null;
          }

          console.log('[AUTH] Authentication successful');
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl || undefined,
          };
          
        } catch (error) {
          console.error('[AUTH] Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
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
      try {
        if (session.user) {
          const extendedUser = session.user as ExtendedUser;
          extendedUser.id = token.id as string;
          extendedUser.role = token.role as Role;
          extendedUser.avatarUrl = token.avatarUrl as string;
        }
        return session;
      } catch (error) {
        console.error('[AUTH] Session callback error:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Important for production deployment
};

const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

export { auth, handlers, signIn, signOut };

export const getCurrentUser = async () => {
  try {
    const session = await auth();
    return session?.user;
  } catch (error) {
    console.error('[AUTH] Error getting current user:', error);
    return null;
  }
};