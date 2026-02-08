// ============================================
// Service Worker – Krealoftet by Sommer
// ============================================
// Cache-busting strategy: Update CACHE_VERSION on every deploy.
// This forces the SW to activate a new cache and purge old ones.
// Assets in HTML use ?v=X.X.X query params for browser-level busting.
// ============================================

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `krealoftet-v${CACHE_VERSION}`;

// Static assets to pre-cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  '/assets/images/krealoftet_logo.png',
  '/assets/images/krealoftet_hero_800.webp',
  '/assets/images/krealoftet_hero_1280.webp',
  '/assets/images/krealoftet_hero_1920.webp'
];

// ---- Install: Pre-cache app shell ----
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((error) => console.error('Pre-cache failed:', error))
  );
});

// ---- Activate: Purge outdated caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('krealoftet-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// ---- Fetch: Network-first for HTML/CSS/JS, cache-first for images ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // HTML pages → Network-first (always get latest)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // CSS & JS → Network-first (cache-busted via ?v= but SW ensures freshness)
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images & fonts → Cache-first (immutable by filename)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else → Network-first
  event.respondWith(networkFirst(request));
});

// ---- Strategies ----

// Network-first: Try network, fall back to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Cache-first: Try cache, fall back to network (and cache the result)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
