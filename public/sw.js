// Service worker conservador (Tarea 19f).
// Cache-first SOLO para estáticos inmutables; NUNCA /api/ ni HTML de páginas.
const CACHE = 'capibara-static-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function isImmutableStatic(url) {
  return url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Nunca tocar API ni orígenes externos.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Estáticos inmutables: cache-first.
  if (isImmutableStatic(url)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Navegaciones (HTML): network-first SIN caché HTTP del WebView. Usamos
  // cache:'reload' para saltarnos la caché del WebView de Android, que si no
  // sirve HTML viejo con hashes de bundles viejos → la app muestra comportamiento
  // desactualizado aunque prod ya esté al día. Fallback a offline sin conexión.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(req, { cache: 'reload' })).catch(() =>
        fetch(req).catch(() => caches.match(OFFLINE_URL))
      )
    );
  }
});
