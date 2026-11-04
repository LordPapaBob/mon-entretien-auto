const BASE_URL = new URL('./', self.location.href);
const CACHE = 'mea-v021-test-900723af0797';
const ASSETS = ["./","assets/index-BjXdT9E1.js","assets/index-Cv5RZXlP.css","icons/icon-192.png","icons/icon-512.png","icons/icon.svg","index.html","manifest.webmanifest"].map(path => new URL(path, BASE_URL).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mea-') && key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Le serveur de développement doit toujours fournir les sources actuelles.
  if (['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname)) return;
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith(BASE_URL.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(new URL('index.html', BASE_URL).href, response.clone());
      }
      return response;
    }).catch(() => caches.match(new URL('index.html', BASE_URL).href)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match(new URL('index.html', BASE_URL).href);
        return Response.error();
      });
    })
  );
});
