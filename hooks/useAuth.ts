"use client"

import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"

interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  role: Role
  avatarUrl?: string
}

interface UseAuthReturn {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  
  const isLoading = status === "loading"
  const isAuthenticated = !!session?.user
  
  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    avatarUrl: session.user.avatarUrl
  } : null
  
  return {
    user,
    isAuthenticated,
    isLoading
  }
}