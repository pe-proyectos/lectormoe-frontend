// Service worker conservador (Tarea 19f).
// Cache-first SOLO para estáticos inmutables; NUNCA /api/ ni HTML de páginas.
const CACHE = 'capibara-static-v3';
const OFFLINE_URL = '/offline.html';

// Rutas que deben funcionar SIN conexión (leer descargas). Se cachean al
// visitarlas en línea y se sirven desde caché cuando no hay red. El contenido
// real (páginas cifradas) vive en IndexedDB; estas páginas solo montan el
// lector offline (su JS ya está cacheado como /_astro).
const OFFLINE_ROUTES = ['/descargas', '/app/offline'];
function isOfflineRoute(pathname) {
  return OFFLINE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

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
    const offlineRoute = isOfflineRoute(url.pathname);
    event.respondWith(
      fetch(new Request(req, { cache: 'reload' }))
        .then((res) => {
          // Guarda las rutas offline al visitarlas para poder servirlas sin red.
          if (offlineRoute && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          // Sin conexión: sirve la versión cacheada de esta ruta (si se visitó
          // antes) y, si no, la página de "sin conexión".
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
  }
});
