// public/sw.js - Service Worker com Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

if (workbox) {
  console.log('Workbox carregado com sucesso')
  
  // Configurações do Workbox
  workbox.setConfig({
    debug: false
  })

  // Precache de arquivos estáticos
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

  // Cache de páginas HTML com Network First
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 horas
        })
      ]
    })
  )

  // Cache de APIs com Network First e fallback
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 5 * 60 // 5 minutos
        }),
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            // Remove parâmetros de timestamp para melhor cache
            const url = new URL(request.url)
            url.searchParams.delete('_t')
            return url.href
          }
        }
      ]
    })
  )

  // Cache de imagens com Cache First
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 dias
        })
      ]
    })
  )

  // Cache de arquivos estáticos (CSS, JS) com Stale While Revalidate
  workbox.routing.registerRoute(
    ({ request }) => 
      request.destination === 'script' || 
      request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )

  // Cache de fontes com Cache First
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
        })
      ]
    })
  )

  // Cache offline para dados críticos
  const criticalDataCache = 'critical-data-v1'
  
  // Interceptar requests para dados críticos
  workbox.routing.registerRoute(
    ({ url }) => 
      url.pathname.includes('/api/patients') ||
      url.pathname.includes('/api/appointments') ||
      url.pathname.includes('/api/dashboard'),
    async ({ event }) => {
      try {
        const response = await fetch(event.request)
        const cache = await caches.open(criticalDataCache)
        cache.put(event.request, response.clone())
        return response
      } catch (error) {
        const cache = await caches.open(criticalDataCache)
        const cachedResponse = await cache.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        // Retorna dados offline básicos
        return new Response(JSON.stringify({
          offline: true,
          message: 'Dados não disponíveis offline'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  )

  // Background sync para dados pendentes
  const QUEUE_NAME = 'fisioflow-queue'
  const queue = new workbox.backgroundSync.Queue(QUEUE_NAME)

  // Interceptar requests POST/PUT/DELETE para queue
  workbox.routing.registerRoute(
    ({ request }) => 
      (request.method === 'POST' || 
       request.method === 'PUT' || 
       request.method === 'DELETE') &&
      request.url.includes('/api/'),
    async ({ event }) => {
      try {
        return await fetch(event.request)
      } catch (error) {
        await queue.pushRequest({ request: event.request })
        return new Response(JSON.stringify({
          queued: true,
          message: 'Operação será sincronizada quando a conexão for restaurada'
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  )

  // Push notifications
  self.addEventListener('push', event => {
    if (!event.data) return

    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'Ver detalhes'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ],
      requireInteraction: true,
      tag: data.tag || 'fisioflow-notification'
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  })

  // Clique em notificação
  self.addEventListener('notificationclick', event => {
    event.notification.close()

    if (event.action === 'view') {
      event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
      )
    }
  })

  // Limpeza periódica de cache
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAN_CACHE') {
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames
              .filter(cacheName => cacheName.includes('old-'))
              .map(cacheName => caches.delete(cacheName))
          )
        })
      )
    }
  })

  // Skip waiting para atualizações
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting()
    }
  })

} else {
  console.log('Workbox não foi carregado')
}

// Fallback para browsers sem Workbox
if (!workbox) {
  const CACHE_NAME = 'fisioflow-cache-v1'
  const urlsToCache = [
    '/',
    '/dashboard',
    '/pacientes',
    '/agenda',
    '/static/js/bundle.js',
    '/static/css/main.css'
  ]

  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    )
  })

  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response
          }
          return fetch(event.request)
        })
    )
  })
}