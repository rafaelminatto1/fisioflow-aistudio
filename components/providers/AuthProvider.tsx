"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { SWRProvider } from "./SWRProvider"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SWRProvider>
      <SessionProvider
        // Optimize session refetch interval
        refetchInterval={5 * 60} // 5 minutes
        refetchOnWindowFocus={true}
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </SWRProvider>
  )
}