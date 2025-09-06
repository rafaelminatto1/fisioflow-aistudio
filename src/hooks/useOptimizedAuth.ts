"use client"

import { useSession } from "next-auth/react"
import useSWR from "swr"
import { Role } from "@prisma/client"

interface User {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
}

// Optimized auth hook with SWR caching
export function useOptimizedAuth(): AuthState {
  const { data: session, status } = useSession()
  
  // Use SWR for additional session caching and optimization
  const { data: cachedSession, error } = useSWR(
    session ? `/api/auth/session` : null,
    {
      fallbackData: session,
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      refreshInterval: 0, // Disable automatic refresh
    }
  )

  const isLoading = status === "loading"
  const activeSession = cachedSession || session
  
  const user: User | null = activeSession?.user ? {
    id: activeSession.user.id,
    email: activeSession.user.email!,
    name: activeSession.user.name!,
    role: activeSession.user.role,
    avatarUrl: activeSession.user.avatarUrl,
  } : null

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error: error || null,
  }
}

// Hook for checking specific roles
export function useRole(requiredRole: Role) {
  const { user, isLoading } = useOptimizedAuth()
  
  return {
    hasRole: user?.role === requiredRole,
    isLoading,
    user,
  }
}

// Hook for checking if user is admin/educator
export function useIsEducator() {
  return useRole(Role.EducadorFisico)
}

// Hook for checking if user is patient
export function useIsPatient() {
  return useRole(Role.Paciente)
}