// Service worker conservador (Tarea 19f).
// Cache-first SOLO para estáticos inmutables; NUNCA /api/ ni HTML de páginas.
const CACHE = 'capibara-static-v5';
const OFFLINE_URL = '/offline.html';

// Rutas que deben funcionar SIN conexión (leer descargas). Se cachean al
// visitarlas en línea y se sirven desde caché cuando no hay red. El contenido
// real (páginas cifradas) vive en IndexedDB; estas páginas solo montan el
// lector offline (su JS ya está cacheado como /_astro).
const OFFLINE_ROUTES = ['/descargas', '/app/offline'];
function isOfflineRoute(pathname) {
  return OFFLINE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

// Capitulos de novela: /writings/{scan}/{tipo}/{obra}/chapter/{n} (y su espejo
// /red/...). Se cachean al leerlos en linea (network-first: frescos con red) y
// se sirven desde cache sin conexion para poder reabrirlos offline.
function isNovelChapter(pathname) {
  return /^\/(red\/)?writings\/[^/]+\/[^/]+\/[^/]+\/chapter\/[^/]+\/?$/.test(pathname);
}

// Precache: además del offline.html, los SHELLS de las páginas offline. Antes
// solo se cacheaban "al visitarlas", así que si el usuario descargaba y se iba
// sin abrir el lector online, /descargas/leer no estaba en caché y al leer sin
// red rebotaba a offline. Estas páginas son client-only (leen de IndexedDB), así
// que el shell sin query sirve para cualquier ?w=.
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/descargas', '/descargas/leer', '/app/offline'];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Resiliente: si alguna ruta no existe, no rompe la instalación.
      Promise.allSettled(PRECACHE.map((u) => cache.add(new Request(u, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
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
    const cacheable = offlineRoute || isNovelChapter(url.pathname);
    event.respondWith(
      fetch(new Request(req, { cache: 'reload' }))
        .then((res) => {
          // Guarda las rutas offline al visitarlas para poder servirlas sin red.
          if (cacheable && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          // Sin conexión: sirve la versión cacheada de esta ruta. Para rutas
          // offline se ignora el query (?w=), así que el shell precacheado de
          // /descargas/leer sirve para leer cualquier obra descargada. Si no hay
          // nada, cae a la página de "sin conexión".
          caches.match(req, { ignoreSearch: offlineRoute }).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
  }
});
