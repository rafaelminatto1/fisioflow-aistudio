const CACHE_NAME = 'fisioflow-v3';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx', // Caching the source file
  // Caching data sources for offline-first experience
  '/data/mockData.ts',
  '/data/mockClinicalMaterials.ts',
  '/data/mockExerciseLibrary.ts',
  '/data/mockSpecialtyAssessments.ts',
  '/data/mockSubscriptionData.ts',
  // Key dependencies from import map for basic app shell functionality
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/react-router-dom@^7.7.1',
  'https://esm.sh/lucide-react@^0.534.0',
  'https://esm.sh/@google/genai@^1.12.0',
];

// Install event: precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event: apply stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to apply this strategy to GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If the fetch is successful, update the cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response immediately if available, otherwise wait for the network
        // In the background, the network fetch will update the cache for the next visit.
        return response || fetchPromise;
      });
    })
  );
});
