const CACHE_NAME = 'anatomiq-v1';
const STATIC_CACHE = 'anatomiq-static-v1';
const DYNAMIC_CACHE = 'anatomiq-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/topics',
  '/profile',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== CACHE_NAME
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/api/exam-results') {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        await queueExamResult(request.clone());
        await registerExamResultSync();
        return new Response(JSON.stringify({ queued: true, offline: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Network first for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch((err) => {
          console.error('[SW] API request failed:', err);
          return new Response(
            JSON.stringify({ error: 'Offline - request failed' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches
      .match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache dynamic content
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Network failed, return offline page
        if (request.destination === 'document') {
          return caches.match('/offline');
        }
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-exam-results') {
    event.waitUntil(syncExamResults());
  }
});

async function syncExamResults() {
  const queued = await readQueuedExamResults();

  for (const item of queued) {
    try {
      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        await deleteQueuedExamResult(item.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync exam result:', error);
    }
  }
}

function openExamResultQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('anatomiq-offline', 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore('exam-results', {
        keyPath: 'id',
        autoIncrement: true,
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueExamResult(request) {
  const db = await openExamResultQueue();
  const body = await request.text();
  const headers = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'content-length') {
      headers[key] = value;
    }
  });

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exam-results', 'readwrite');
    transaction.objectStore('exam-results').add({
      url: request.url,
      body,
      headers,
      createdAt: new Date().toISOString(),
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function readQueuedExamResults() {
  const db = await openExamResultQueue();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exam-results', 'readonly');
    const request = transaction.objectStore('exam-results').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function deleteQueuedExamResult(id) {
  const db = await openExamResultQueue();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exam-results', 'readwrite');
    transaction.objectStore('exam-results').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function registerExamResultSync() {
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-exam-results');
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'AcademIQ Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
