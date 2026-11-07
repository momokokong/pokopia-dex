/* PokopiaDex Service Worker — Offline-first PWA */
const CACHE_NAME = 'pokopia-dex-v3';
const DATA_CACHE = 'pokopia-data-v1';
const IMG_CACHE = 'pokopia-images-v1';
const AUDIO_CACHE = 'pokopia-audio-v1';
const MAX_AUDIO_CACHE_ITEMS = 150;

// Core app shell files to cache on install (relative paths for root, GitHub Pages, and Capacitor)
const APP_SHELL = [
  './',
  './index.html',
  './detail.html',
  './habitats.html',
  './habitat-detail.html',
  './badges.html',
  './quiz.html',
  './settings.html',
  './app.js',
  './js/i18n.js',
  './js/storage.js',
  './js/speech.js',
  './js/quiz-engine.js',
  './js/badges-engine.js',
  './scripts/quiz.js',
  './scripts/qrcode.min.js',
  './styles.css',
  './styles-badges.css',
  './styles-settings.css',
  './data/habitat-data.js',
  './manifest.json'
];

/**
 * LRU cache trimming helper: evicts oldest entries when cache size exceeds maxItems
 * @param {string} cacheName
 * @param {number} maxItems
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}

/**
 * Check if a URL pathname targets karaoke audio or timestamp assets
 * @param {string} pathname
 * @returns {boolean}
 */
function isAudioRoute(pathname) {
  return (
    pathname.includes('/output/karaoke/') ||
    pathname.includes('/output/habitat_karaoke/')
  );
}

/**
 * Cache-first handler for karaoke audio (.mp3) and word-timing (.json) files
 * Falls back to immediate 404 JSON response when offline so Web Speech API triggers immediately
 * @param {Request|string} request
 * @returns {Promise<Response>}
 */
async function handleAudioFetch(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      await trimCache(AUDIO_CACHE, MAX_AUDIO_CACHE_ITEMS);
    }
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ offline: true }), {
      status: 404,
      statusText: 'Offline Audio Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
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
    const validCaches = [CACHE_NAME, DATA_CACHE, IMG_CACHE, AUDIO_CACHE];
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => !validCaches.includes(key))
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

    // Karaoke audio & timing files (.mp3 and .json) — cache-first with LRU eviction & fast offline fallback
    if (isAudioRoute(url.pathname)) {
      event.respondWith(handleAudioFetch(event.request));
      return;
    }

    // Data files (pokemon.json, habitat-data.json, etc.) — cache-first with stale-while-revalidate
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
    if (url.pathname.includes('/sprites/') || url.pathname.includes('/habitats/') || url.pathname.includes('/assets/sprites/') || url.pathname.includes('/assets/habitats/')) {
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
    if (url.pathname.includes('/icons/') || url.pathname.includes('/assets/icons/')) {
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

    // App shell (html/css/js) — network-first so updates always apply, fallback to cache offline
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_NAME,
    DATA_CACHE,
    IMG_CACHE,
    AUDIO_CACHE,
    MAX_AUDIO_CACHE_ITEMS,
    APP_SHELL,
    trimCache,
    isAudioRoute,
    handleAudioFetch
  };
}