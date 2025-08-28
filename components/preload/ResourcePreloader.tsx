"use client"

import { useEffect } from "react"

interface ResourcePreloaderProps {
  resources?: string[]
}

// Função para verificar se um recurso existe (apenas para recursos estáticos)
async function checkResourceExists(url: string): Promise<boolean> {
  try {
    // Não verificar APIs ou rotas dinâmicas
    if (url.includes('/api/') || url.includes('?') || url.includes('#')) {
      console.warn(`[ResourcePreloader] Ignorando verificação de API/rota dinâmica: ${url}`)
      return false
    }

    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    return response.ok
  } catch (error) {
    console.warn(`[ResourcePreloader] Erro ao verificar recurso ${url}:`, error)
    return false
  }
}

// Função para precarregar um recurso com tratamento de erro
function preloadResource(resource: string): void {
  try {
    let link: HTMLLinkElement
    
    if (resource.endsWith(".css")) {
      link = document.createElement("link")
      link.rel = "preload"
      link.as = "style"
      link.href = resource
    } else if (resource.endsWith(".woff2") || resource.endsWith(".woff")) {
      link = document.createElement("link")
      link.rel = "preload"
      link.as = "font"
      link.type = "font/woff2"
      link.crossOrigin = "anonymous"
      link.href = resource
    } else if (resource.endsWith(".js")) {
      link = document.createElement("link")
      link.rel = "preload"
      link.as = "script"
      link.href = resource
    } else {
      console.warn(`[ResourcePreloader] Tipo de recurso não suportado: ${resource}`)
      return
    }

    // Adicionar handlers de erro
    link.onerror = () => {
      console.warn(`[ResourcePreloader] Falha ao carregar recurso: ${resource}`)
    }
    
    link.onload = () => {
      console.debug(`[ResourcePreloader] Recurso carregado com sucesso: ${resource}`)
    }

    document.head.appendChild(link)
  } catch (error) {
    console.error(`[ResourcePreloader] Erro ao precarregar recurso ${resource}:`, error)
  }
}

export function ResourcePreloader({ resources = [] }: ResourcePreloaderProps) {
  useEffect(() => {
    // Preload critical CSS and fonts
    const criticalResources = [
      // Tailwind CSS (already loaded by Next.js)
      // Lucide React icons
      "/fonts/inter-var.woff2", // Custom Inter font
      ...resources
    ]

    // Precarregar recursos de forma assíncrona com verificação
    const preloadResources = async () => {
      for (const resource of criticalResources) {
        try {
          // Para recursos locais, tentar precarregar diretamente
          if (resource.startsWith('/')) {
            preloadResource(resource)
          } else {
            // Para recursos externos, verificar se existem primeiro
            const exists = await checkResourceExists(resource)
            
            if (exists) {
              preloadResource(resource)
            } else {
              console.warn(`[ResourcePreloader] Recurso não encontrado, ignorando: ${resource}`)
            }
          }
        } catch (error) {
          console.error(`[ResourcePreloader] Erro ao verificar recurso ${resource}:`, error)
        }
      }
    }

    preloadResources()

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