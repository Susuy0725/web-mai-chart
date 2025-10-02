const CACHE_VERSION = 'v1';
const CACHE_NAME = `wmc-cache-${CACHE_VERSION}`;

// assets to cache on install - include fonts and key static assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/Styles/main.css',
  '/Js/main.js',
  '/Js/render.js',
  '/Fonts/Inter.ttf',
  '/Fonts/Handlee-Regular.ttf',
  '/Fonts/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('Some resources failed to pre-cache:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // only handle same-origin requests
  if (url.origin !== location.origin) return;

  // For font requests, use cache-first strategy
  if (url.pathname.startsWith('/Fonts/') || url.pathname.endsWith('.ttf') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(resp => resp || fetch(event.request).then(fetchResp => {
          // store a copy in cache
          try { cache.put(event.request, fetchResp.clone()); } catch (e) { /* ignore */ }
          return fetchResp;
        }).catch(() => resp))
      )
    );
    return;
  }

  // For other requests, try network first then fallback to cache
  event.respondWith(
    fetch(event.request).then(networkResp => {
      // update cache for future
      if (event.request.method === 'GET') {
        caches.open(CACHE_NAME).then(cache => {
          try { cache.put(event.request, networkResp.clone()); } catch (e) { /* ignore */ }
        });
      }
      return networkResp.clone();
    }).catch(() => caches.match(event.request).then(resp => resp || caches.match('/index.html')))
  );
});
