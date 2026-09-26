// Monetag (push). Tiene que vivir en /sw.js, que es tambien el service worker
// de la PWA, asi que se importa aqui en vez de sustituir el archivo: si se
// reemplazara se perderia la cache offline de descargas y novelas.
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11870309
}
self.lary = ""
// PAUSADO hasta nuevo aviso:
// try { importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw') } catch (e) {}

// ============================================================================
// Service worker de la PWA.
//
// Tres caches:
//   - STATIC: estaticos inmutables (/_astro, /icons, /images). Cache-first.
//   - PAGES:  HTML de las paginas visitadas. Network-first; sin conexion se
//             sirve la ultima copia. Asi se puede volver a abrir sin internet
//             lo que ya se vio (portada, fichas de obras, perfiles...).
//   - API:    respuestas GET del API que alimentan esas paginas (catalogo,
//             fichas, capitulos, Mi lista). Network-first con copia de respaldo.
// Las descargas cifradas viven en IndexedDB y se leen desde /descargas.
//
// Nunca se guarda: nada que no sea GET, paginas de cuenta/pago/admin, ni
// endpoints de sesion, pagos o administracion.
// ============================================================================

const STATIC = 'capibara-static-v6';
const PAGES = 'capibara-pages-v1';
const API = 'capibara-api-v1';
const KEEP = [STATIC, PAGES, API];
const MAX_PAGES = 80;
const MAX_API = 500;
const OFFLINE_URL = '/offline.html';
const INDEX_URL = '/__offline-pages.json';

// Rutas que deben funcionar SIN conexion aunque no se hayan visitado (lector de
// descargas). Son client-only: el shell sin query sirve para cualquier ?w=.
const OFFLINE_ROUTES = ['/descargas', '/app/offline'];
const PRECACHE = [OFFLINE_URL, '/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/descargas', '/descargas/leer', '/app/offline'];

// Paginas que NO se guardan: cuenta, pagos, administracion y sesion.
const NO_CACHE_PAGE = [
  /^\/(red\/)?(login|register|forgot-password|reset-password|logout|verify-email|unsubscribe)(\/|$)/,
  /^\/(red\/)?[^/]+\/(login|register|forgot-password|reset-password)(\/|$)/,
  /^\/(red\/)?(settings|eliminar-cuenta|subscriptions|superadmin|admin|sso|mensajes|luckys)(\/|$)/,
  /^\/(red\/)?[^/]+\/(admin|subscriptions)(\/|$)/,
];

// API: solo lectura de contenido. Lo personal se guarda separado por cuenta.
const API_PUBLICO = [
  /^\/api\/landing\//,
  /^\/api\/manga-custom(\/|\?|$)/,
  /^\/api\/genre(\/|\?|$)/,
  /^\/api\/recommendation\//,
  /^\/api\/organization\/[^/]+\/?(\?|$)/,
  /^\/api\/joint(\/|\?|$)/,
  /^\/api\/manga-review(\/|\?|$)/,
  /^\/api\/manga-volume(\/|\?|$)/,
];
const API_PERSONAL = [
  /^\/api\/user-list(\/|\?|$)/,
  /^\/api\/favorites(\/|\?|$)/,
  /^\/api\/user\/continue-reading(\/|\?|$)/,
  /^\/api\/user\/profile(\/|\?|$)/,
];

const esRutaOffline = (p) => OFFLINE_ROUTES.some((r) => p === r || p.startsWith(r + '/'));
const esEstatico = (u) => u.pathname.startsWith('/_astro/') || u.pathname.startsWith('/icons/') || u.pathname.startsWith('/images/');
const paginaGuardable = (p) => !NO_CACHE_PAGE.some((re) => re.test(p));
const apiGuardable = (path) => API_PUBLICO.some((re) => re.test(path)) || API_PERSONAL.some((re) => re.test(path));

// Huella corta del token: separa la copia de cada cuenta sin guardar el token.
function huella(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
function claveApi(req) {
  const auth = req.headers.get('Authorization') || '';
  const u = new URL(req.url);
  if (auth) u.searchParams.set('__u', huella(auth));
  return new Request(u.toString(), { method: 'GET' });
}

// Recorta una cache a sus N entradas mas recientes (se re-insertan al usarse).
async function recortar(nombre, max) {
  const cache = await caches.open(nombre);
  // El indice de paginas no cuenta ni se recorta.
  const keys = (await cache.keys()).filter((k) => !k.url.endsWith(INDEX_URL));
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}
async function guardar(nombre, key, res, max) {
  const cache = await caches.open(nombre);
  await cache.delete(key);
  await cache.put(key, res);
  await recortar(nombre, max);
}

// Indice de paginas guardadas (url + titulo) para listarlas en offline.html.
async function registrarPagina(url, res) {
  try {
    const html = await res.text();
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const titulo = (m ? m[1] : url).replace(/\s+/g, ' ').trim().slice(0, 120);
    const cache = await caches.open(PAGES);
    const prev = await cache.match(INDEX_URL);
    let lista = prev ? await prev.json().catch(() => []) : [];
    lista = [{ url, titulo, at: Date.now() }, ...lista.filter((x) => x.url !== url)].slice(0, MAX_PAGES);
    await cache.put(INDEX_URL, new Response(JSON.stringify(lista), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC).then((cache) =>
      // Resiliente: si alguna ruta falla, no rompe la instalacion.
      Promise.allSettled(PRECACHE.map((u) => cache.add(new Request(u, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La pagina pide guardar su propia URL (primera visita, antes de que este
// service worker la controlara).
self.addEventListener('message', (event) => {
  const d = event.data || {};
  // Cambio de sesion: fuera las paginas y datos guardados de la cuenta anterior.
  if (d.type === 'limpiar-sesion') {
    event.waitUntil(Promise.all([caches.delete(PAGES), caches.delete(API)]));
    return;
  }
  if (d.type !== 'guardar-pagina' || !d.url) return;
  const url = new URL(d.url);
  if (url.origin !== self.location.origin || !paginaGuardable(url.pathname)) return;
  event.waitUntil(
    fetch(new Request(url.toString(), { credentials: 'include', cache: 'reload' }))
      .then((res) => {
        if (!res || !res.ok || !(res.headers.get('Content-Type') || '').includes('text/html')) return;
        const paraIndice = res.clone();
        return guardar(PAGES, url.toString(), res, MAX_PAGES).then(() =>
          esRutaOffline(url.pathname) ? null : registrarPagina(url.pathname + url.search, paraIndice)
        );
      })
      .catch(() => {})
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Indice de paginas guardadas (lo consulta offline.html).
  if (url.pathname === INDEX_URL) {
    event.respondWith(
      caches.open(PAGES).then((c) => c.match(INDEX_URL)).then((r) => r || new Response('[]', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // API
  if (url.pathname.startsWith('/api/')) {
    if (!apiGuardable(url.pathname)) return;
    const key = claveApi(req);
    const deCache = () => caches.open(API).then((c) => c.match(key));
    const sinConexion = () => new Response(JSON.stringify({ status: false, message: 'Sin conexión' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
    // Sin red conocida: directo a la copia, sin esperar un fetch que va a fallar.
    if (self.navigator && self.navigator.onLine === false) {
      event.respondWith(deCache().then((r) => r || sinConexion()));
      return;
    }
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && (res.headers.get('Content-Type') || '').includes('application/json')) {
            const copia = res.clone();
            event.waitUntil(guardar(API, key, copia, MAX_API));
          }
          return res;
        })
        .catch(() => deCache().then((r) => r || sinConexion()))
    );
    return;
  }

  // Estaticos inmutables: cache-first.
  if (esEstatico(url)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          event.waitUntil(caches.open(STATIC).then((cache) => cache.put(req, copy)));
        }
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Navegaciones (HTML): network-first sin la cache HTTP del WebView (cache:
  // 'reload'), que si no sirve HTML viejo con bundles viejos. Se guarda una
  // copia de cada pagina visitada para abrirla sin conexion.
  if (req.mode === 'navigate') {
    const offlineRoute = esRutaOffline(url.pathname);
    const guardable = paginaGuardable(url.pathname);
    event.respondWith(
      fetch(new Request(req, { cache: 'reload' }))
        .then((res) => {
          if (guardable && res && res.ok && res.type === 'basic') {
            const copia = res.clone();
            const paraIndice = res.clone();
            event.waitUntil(
              guardar(PAGES, req.url, copia, MAX_PAGES).then(() =>
                offlineRoute ? null : registrarPagina(url.pathname + url.search, paraIndice)
              )
            );
          }
          return res;
        })
        .catch(async () => {
          const pages = await caches.open(PAGES);
          const exacta = await pages.match(req.url);
          if (exacta) return exacta;
          // Rutas offline: el shell precacheado sirve para cualquier query.
          const shell = await caches.match(req, { ignoreSearch: offlineRoute });
          if (shell) return shell;
          return caches.match(OFFLINE_URL);
        })
    );
  }
});
