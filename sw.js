/* PokopiaDex Service Worker — Offline-first PWA */
const CACHE_NAME = 'pokopia-dex-v1';
const DATA_CACHE = 'pokopia-data-v1';
const IMG_CACHE = 'pokopia-images-v1';

// Core app shell files to cache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/detail.html',
  '/habitats.html',
  '/habitat-detail.html',
  '/badges.html',
  '/settings.html',
  '/app.js',
  '/styles.css',
  '/styles-badges.css',
  '/styles-settings.css',
  '/data/habitat-data.js',
  '/manifest.json'
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE && key !== IMG_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip cross-origin (except fonts)
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Data files (pokemon.json, habitat-data.json, etc.) — cache-first
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) {
            // Stale-while-revalidate: return cached, update in background
            fetch(event.request).then((response) => {
              if (response.ok) cache.put(event.request, response);
            }).catch(() => {});
            return cached;
          }
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Sprite/habitat images — cache-first
  if (url.pathname.includes('/sprites/') || url.pathname.includes('/habitats/')) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => {
            return new Response('', { status: 404, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // Icons — cache-first
  if (url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Google Fonts — stale-while-revalidate
  if (url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        });
      })
    );
    return;
  }

  // App shell — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetched;
      });
    })
  );
});