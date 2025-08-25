"use client"

import { useEffect } from "react"

interface ResourcePreloaderProps {
  resources?: string[]
}

export function ResourcePreloader({ resources = [] }: ResourcePreloaderProps) {
  useEffect(() => {
    // Preload critical CSS and fonts
    const criticalResources = [
      // Tailwind CSS (already loaded by Next.js)
      // Lucide React icons
      "/fonts/inter-var.woff2", // If using custom fonts
      ...resources
    ]

    criticalResources.forEach((resource) => {
      if (resource.endsWith(".css")) {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "style"
        link.href = resource
        document.head.appendChild(link)
      } else if (resource.endsWith(".woff2") || resource.endsWith(".woff")) {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "font"
        link.type = "font/woff2"
        link.crossOrigin = "anonymous"
        link.href = resource
        document.head.appendChild(link)
      } else if (resource.endsWith(".js")) {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "script"
        link.href = resource
        document.head.appendChild(link)
      }
    })

    // Session preloading is handled by NextAuth provider
  }, [resources])

  return null
}

// Hook for preloading critical resources
export function useResourcePreload(resources: string[]) {
  useEffect(() => {
    const preloadPromises = resources.map((resource) => {
      if (resource.startsWith("http") || resource.startsWith("/")) {
        return fetch(resource, {
          method: "HEAD",
          mode: "no-cors"
        }).catch(() => {
          // Silently fail for external resources
        })
      }
      return Promise.resolve()
    })

    Promise.allSettled(preloadPromises)
  }, [resources])
}