// Service Worker for Clay Workshop
const CACHE_NAME = 'krealoftet-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  '/assets/images/krealoftet_logo.png',
  '/assets/images/ceramic-workshop-creation.jpg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Shantell+Sans:wght@500&display=swap'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        // Return a fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

