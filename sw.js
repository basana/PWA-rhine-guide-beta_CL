const CACHE_NAME = 'rhine-guide-v3';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-marksburg-192.png',
  './icon-marksburg-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: отдаём из кэша сразу (если есть), а сеть в фоне
// обновляет кэш на будущее. Это также постепенно закэширует Leaflet с CDN
// и уже просмотренные тайлы карты — бонусом к основному списку файлов.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if (cached) return cached;
      const fromNetwork = await networkFetch;
      return fromNetwork || new Response('Offline and not cached yet', { status: 503 });
    })
  );
});
