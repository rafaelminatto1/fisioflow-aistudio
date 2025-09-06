import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        console.log("[AUTH] Tentativa de login:", { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Credenciais faltando")
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

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
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.avatarUrl = user.avatarUrl
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as Role
        session.user.avatarUrl = token.avatarUrl as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
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

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions)

// Helper function to get current user
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}