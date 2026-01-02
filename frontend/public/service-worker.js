// Service Worker for A3 Tech PWA
// Enables offline functionality, caching, and background features

const CACHE_NAME = 'a3-tech-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.png',
  '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[ServiceWorker] Cache addAll failed:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // For API requests: network first, then cache fallback
  if (url.pathname.includes('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[ServiceWorker] Serving from cache:', request.url);
              return cached;
            }
            // Return offline fallback for API endpoints
            if (url.pathname.includes('/api/')) {
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: 'Content not available offline. Please check your connection.',
                  timestamp: new Date().toISOString()
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            // For other resources, return offline page
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  } else {
    // For static assets: use network-first for scripts/styles to avoid serving stale bundles
    const isStaticAsset = request.destination === 'script' || request.destination === 'style' || /\.(js|css|map)$/.test(url.pathname);

    if (isStaticAsset) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            }
            return response;
          })
          .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
      );
      return;
    }

    // For other static assets: cache first, then network (fast load), with fallback
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Start a background fetch to update the cache
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        }).catch(() => {
          // Return offline placeholder if available
          return caches.match('/index.html');
        });
      })
    );
  }
});

// Background sync for failed requests (when app comes back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests() {
  try {
    const failedRequests = await getAllFailedRequests();
    for (const request of failedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await removeFailedRequest(request);
          notifyClients('sync-success', { message: 'Data synced successfully' });
        }
      } catch (err) {
        console.warn('[ServiceWorker] Sync retry failed:', err);
      }
    }
  } catch (err) {
    console.warn('[ServiceWorker] Background sync failed:', err);
  }
}

async function getAllFailedRequests() {
  const db = await openDB();
  return (await db.getAll('failedRequests')) || [];
}

async function removeFailedRequest(request) {
  const db = await openDB();
  await db.delete('failedRequests', request);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('a3-tech-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('failedRequests')) {
        db.createObjectStore('failedRequests');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notifyClients(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type, ...data });
    });
  });
}

// Message handler for cache updates, update checks, and other commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_UPDATE') {
    checkForUpdates();
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/api/version', { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      console.log('[ServiceWorker] Update check:', data);
      if (data.updateAvailable) {
        notifyClients('update-available', { version: data.version });
      }
    }
  } catch (err) {
    console.warn('[ServiceWorker] Update check failed:', err);
  }
}

console.log('[ServiceWorker] Service Worker loaded and ready');

