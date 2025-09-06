// hooks/usePWA.ts
import { useState, useEffect, useCallback } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  hasUpdate: boolean
  isUpdating: boolean
}

interface PWAActions {
  install: () => Promise<void>
  update: () => Promise<void>
  skipWaiting: () => void
  showInstallPrompt: () => void
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    isUpdating: false
  })

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg)
          setRegistration(reg)

          // Verificar atualizações
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, hasUpdate: true }))
                }
              })
            }
          })

          // Verificar se já está controlado
          if (navigator.serviceWorker.controller) {
            setState(prev => ({ ...prev, isInstalled: true }))
          }
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error)
        })
    }
  }, [])

  // Listener para prompt de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Listener para status online/offline
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Verificar se já está instalado (modo standalone)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
    
    if (isStandalone) {
      setState(prev => ({ ...prev, isInstalled: true }))
    }
  }, [])

  // Função para instalar PWA
  const install = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      const result = await deferredPrompt.prompt()
      console.log('Resultado da instalação:', result)
      
      if (result.outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }, [deferredPrompt])

  // Função para atualizar Service Worker
  const update = useCallback(async () => {
    if (!registration) return

    setState(prev => ({ ...prev, isUpdating: true }))

    try {
      await registration.update()
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      
      // Recarregar página após atualização
      window.location.reload()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }))
    }
  }, [registration])

  // Função para pular espera da atualização
  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [registration])

  // Função para mostrar prompt de instalação
  const showInstallPrompt = useCallback(() => {
    if (state.isInstallable && deferredPrompt) {
      install()
    }
  }, [state.isInstallable, deferredPrompt, install])

  return {
    ...state,
    install,
    update,
    skipWaiting,
    showInstallPrompt
  }
}

// Hook para notificações push
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }, [])

  const subscribe = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })
        
        setSubscription(sub)
        
        // Enviar subscription para o servidor
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sub)
        })
        
        return sub
      } catch (error) {
        console.error('Erro ao se inscrever para notificações:', error)
        return null
      }
    }
    return null
  }, [])

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe()
        setSubscription(null)
        
        // Remover subscription do servidor
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })
      } catch (error) {
        console.error('Erro ao cancelar inscrição:', error)
      }
    }
  }, [subscription])

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  }
}

// Hook para cache offline
export function useOfflineCache() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [cachedData, setCachedData] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const cacheData = useCallback((key: string, data: any) => {
    setCachedData(prev => new Map(prev.set(key, data)))
    
    // Salvar no localStorage também
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data))
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error)
    }
  }, [])

  const getCachedData = useCallback((key: string) => {
    // Primeiro tenta do estado
    if (cachedData.has(key)) {
      return cachedData.get(key)
    }
    
    // Depois tenta do localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const data = JSON.parse(stored)
        setCachedData(prev => new Map(prev.set(key, data)))
        return data
      }
    } catch (error) {
      console.warn('Erro ao ler do localStorage:', error)
    }
    
    return null
  }, [cachedData])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCachedData(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
      localStorage.removeItem(`cache_${key}`)
    } else {
      setCachedData(new Map())
      // Limpar todo cache do localStorage
      Object.keys(localStorage)
        .filter(k => k.startsWith('cache_'))
        .forEach(k => localStorage.removeItem(k))
    }
  }, [])

  return {
    isOffline,
    cacheData,
    getCachedData,
    clearCache
  }
}