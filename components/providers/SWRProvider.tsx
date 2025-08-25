"use client"

import { SWRConfig } from "swr"
import { ReactNode } from "react"

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
  
  if (!res.ok) {
    throw new Error("Failed to fetch")
  }
  
  return res.json()
}

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // Cache session data for 5 minutes
        dedupingInterval: 5 * 60 * 1000,
        // Revalidate on focus for better UX
        revalidateOnFocus: true,
        // Revalidate on reconnect
        revalidateOnReconnect: true,
        // Retry on error
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // Cache configuration
        refreshInterval: 0, // Disable automatic refresh
        // Optimistic updates
        revalidateIfStale: true,
        // Performance optimizations
        shouldRetryOnError: (error) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return true
        },
        // Custom cache provider for better performance
        provider: () => {
          // Use Map for better performance than default cache
          const map = new Map()
          return map
        },
        // Fallback data for offline scenarios
        fallbackData: undefined,
        // Keep previous data while revalidating
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}