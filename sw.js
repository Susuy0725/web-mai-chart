// Consolidated service worker for web-mai-chart
// Precache important assets (fonts, core scripts) and provide a simple runtime

const CACHE_VERSION = 'v1';
const CACHE_NAME = `web-mai-chart-cache-${CACHE_VERSION}`;

// Adjust list to include important static assets used by the app
const PRECACHE_URLS = [
  './',
  './Sounds/',
  './Skins/',
  './index.html',
  './Styles/main.css',
  './Js/main.js',
  './Js/render.js',
  './Fonts/Inter.ttf',
  './Fonts/ChironGoRoundTC-VariableFont_wght.ttf',
  './Fonts/GoogleSansCode-Medium.ttf',
  './Fonts/SUSE-VariableFont_wght.ttf',
  './Fonts/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('Some resources failed to pre-cache:', err);
      })
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    if (self.clients && self.clients.claim) await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // Font files: cache-first strategy (fast and offline-friendly)
  if (url.pathname.startsWith('/Fonts/') || url.pathname.endsWith('.ttf') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.woff2')) {
    event.respondWith(caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(resp => resp || fetch(event.request).then(fetchResp => {
        try { cache.put(event.request, fetchResp.clone()); } catch (e) { /* ignore */ }
        return fetchResp;
      }).catch(() => resp))
    ));
    return;
  }

  // Other requests: network-first, fallback to cache
  event.respondWith((async () => {
    try {
      const networkResp = await fetch(event.request);
      if (event.request.method === 'GET') {
        try { const cache = await caches.open(CACHE_NAME); cache.put(event.request, networkResp.clone()); } catch (e) { }
      }
      return networkResp;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      // fallback to index.html for navigation requests
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('/index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
