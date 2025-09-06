// components/PWAProvider.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePWA, usePushNotifications } from '../hooks/usePWA'
import { Button } from './ui/button'
import { Toast } from './ui/Toast'
import { X, Download, RefreshCw, Bell, BellOff } from 'lucide-react'

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    hasUpdate,
    isUpdating,
    install,
    update,
    showInstallPrompt
  } = usePWA()

  const {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  } = usePushNotifications()

  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  // Mostrar banner de instalação
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const hasShownBanner = localStorage.getItem('pwa-install-banner-shown')
      if (!hasShownBanner) {
        setShowInstallBanner(true)
      }
    }
  }, [isInstallable, isInstalled])

  // Mostrar banner de atualização
  useEffect(() => {
    if (hasUpdate) {
      setShowUpdateBanner(true)
    }
  }, [hasUpdate])

  // Mostrar banner offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true)
    } else {
      setShowOfflineBanner(false)
    }
  }, [isOnline])

  const handleInstall = async () => {
    await install()
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-banner-shown', 'true')
  }

  const handleUpdate = async () => {
    await update()
    setShowUpdateBanner(false)
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-banner-shown', 'true')
  }

  const handleNotificationToggle = async () => {
    if (permission === 'granted' && subscription) {
      await unsubscribe()
    } else {
      const result = await requestPermission()
      if (result === 'granted') {
        await subscribe()
      }
    }
  }

  return (
    <>
      {children}
      
      {/* Banner de instalação PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Instalar FisioFlow
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Instale o app para acesso rápido e funcionalidades offline
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissInstall}
                className="flex-shrink-0 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
              >
                Instalar
              </Button>
              <Button
                onClick={handleDismissInstall}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de atualização */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Atualização disponível
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Uma nova versão do FisioFlow está disponível
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar agora'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner offline */}
      {showOfflineBanner && (
        <div className="fixed top-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Modo offline
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Algumas funcionalidades podem estar limitadas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante de notificações (apenas se PWA estiver instalado) */}
      {isInstalled && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={handleNotificationToggle}
            size="sm"
            variant={permission === 'granted' && subscription ? 'default' : 'outline'}
            className="rounded-full h-12 w-12 p-0 shadow-lg"
            title={permission === 'granted' && subscription ? 'Desativar notificações' : 'Ativar notificações'}
          >
            {permission === 'granted' && subscription ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}

      {/* Toast para feedback de ações */}
      <Toast />
    </>
  )
}

// Componente para status PWA no header
export function PWAStatus() {
  const { isInstalled, isOnline } = usePWA()
  
  if (!isInstalled) return null

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`h-2 w-2 rounded-full ${
        isOnline ? 'bg-green-400' : 'bg-yellow-400'
      }`}></div>
      <span className="text-gray-600 dark:text-gray-400">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

// Hook para preload de recursos críticos
export function useResourcePreload() {
  useEffect(() => {
    // Preload de imagens críticas
    const criticalImages = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]

    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })

    // Preload de rotas críticas
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Preload das rotas mais acessadas
        const criticalRoutes = ['/dashboard', '/pacientes', '/agenda']
        criticalRoutes.forEach(route => {
          fetch(route, { method: 'HEAD' }).catch(() => {})
        })
      })
    }
  }, [])
}