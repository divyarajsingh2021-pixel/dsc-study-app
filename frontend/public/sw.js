// StudyMate AI Service Worker for PWA
const CACHE_NAME = 'studymate-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API requests pass directly to backend
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // If offline and requesting document, return cached root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        })
      );
    })
  );
});
