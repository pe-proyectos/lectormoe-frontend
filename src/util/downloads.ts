// Gestor de descargas offline cifradas.
//
// Seguridad: las páginas de los capítulos se guardan CIFRADAS en el dispositivo
// con AES-GCM (Web Crypto). La clave se genera una vez por dispositivo y se
// guarda como CryptoKey no exportable en IndexedDB (el navegador/WebView no la
// entrega en claro a JS). Las imágenes solo se descifran en memoria al momento
// de leer, así en el almacenamiento nunca hay nada legible.
//
// Límites (cuenta OBRAS, capítulos ilimitados dentro): los decide el plan.
// Funciona igual en la app Android (Capacitor) y en el navegador (IndexedDB
// persiste en ambos WebViews).
//
// Por CUENTA: cada usuario tiene su propia base (y su propia clave), así otra
// cuenta en el mismo teléfono no ve ni gasta las descargas ajenas. La base
// anterior (compartida) se asigna a la primera cuenta que la abre.
//
// Capítulos ANTICIPADOS (Premium o plan con lectura anticipada): se pueden
// descargar, pero se abren solo mientras la "licencia" esté vigente. La
// licencia se renueva cada vez que se entra con conexión y dura 7 días sin
// ella. Si el plan vence, el capítulo queda bloqueado hasta su salida pública.

export const DOWNLOAD_LIMITS = { free: 6, premium: 24 } as const;

const DB_BASE = 'capibara-offline';
const CLAVE_DUENO_LEGADO = 'capi-descargas-dueno';
const LICENCIA_DIAS = 7;
const DB_VERSION = 1;
const STORE_META = 'works'; // manifiesto por obra
const STORE_PAGES = 'pages'; // blobs cifrados
const STORE_KEYS = 'keys'; // CryptoKey del dispositivo

export interface DownloadedChapter {
  number: number;
  title: string;
  pageCount: number;
  /** Capítulo de lectura anticipada al descargarlo. */
  anticipado?: boolean;
  /** Fecha (ms) en que el capítulo pasa a ser público; desde ahí no se bloquea. */
  liberaEn?: number | null;
}

export interface DownloadedWork {
  key: string; // identificador estable de la obra (ver workKey)
  title: string;
  cover: string; // dataURL pequeño (portada, no sensible)
  scanSlug: string;
  mangaSlug: string;
  isJoint: boolean;
  chapters: DownloadedChapter[];
  bytes: number;
  downloadedAt: number;
}

// Clave estable de una obra a partir de su URL de lectura.
export function workKey(scanSlug: string, mangaSlug: string, isJoint = false): string {
  return isJoint ? `joint:${mangaSlug}` : `${scanSlug}:${mangaSlug}`;
}

// Cuenta actual, leída de la cookie `user` (también disponible sin conexión).
export function cuentaActual(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const raw = (document.cookie.match(/(?:^|; )user=([^;]*)/) || [])[1];
    if (raw) {
      const u = JSON.parse(decodeURIComponent(raw));
      if (u?.id != null) return String(u.id);
    }
  } catch {}
  const slug = (document.cookie.match(/(?:^|; )userSlug=([^;]*)/) || [])[1];
  return slug ? `s:${decodeURIComponent(slug)}` : null;
}

function nombreDB(cuenta: string): string {
  // La base compartida de antes pasa a ser de la primera cuenta que la abre.
  const dueno = localStorage.getItem(CLAVE_DUENO_LEGADO);
  if (!dueno) {
    localStorage.setItem(CLAVE_DUENO_LEGADO, cuenta);
    return DB_BASE;
  }
  return dueno === cuenta ? DB_BASE : `${DB_BASE}-u${cuenta}`;
}

const dbs = new Map<string, Promise<IDBDatabase>>();
function openDB(): Promise<IDBDatabase> {
  const cuenta = cuentaActual();
  if (!cuenta) return Promise.reject(new SinCuenta());
  const name = nombreDB(cuenta);
  const abierta = dbs.get(name);
  if (abierta) return abierta;
  const p = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORE_PAGES)) db.createObjectStore(STORE_PAGES);
      if (!db.objectStoreNames.contains(STORE_KEYS)) db.createObjectStore(STORE_KEYS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbs.set(name, p);
  return p;
}

/** Sin sesión no hay descargas que mostrar (son de cada cuenta). */
export class SinCuenta extends Error {
  constructor() {
    super('Inicia sesión para ver tus descargas.');
    this.name = 'SinCuenta';
  }
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── Clave de cifrado del dispositivo ──────────────────────────────────────────
const keys = new Map<string, Promise<CryptoKey>>();
async function getDeviceKey(): Promise<CryptoKey> {
  const cuenta = cuentaActual() || '';
  const previa = keys.get(cuenta);
  if (previa) return previa;
  const keyPromise = (async () => {
    const existing = await tx<CryptoKey | undefined>(STORE_KEYS, 'readonly', (s) => s.get('device'));
    if (existing) return existing;
    // extractable:false — la clave nunca sale en claro de la CryptoKey.
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await tx(STORE_KEYS, 'readwrite', (s) => s.put(key, 'device'));
    return key;
  })();
  keys.set(cuenta, keyPromise);
  return keyPromise;
}

// ── Licencia de capítulos anticipados ─────────────────────────────────────────

/** ¿El plan del usuario incluye lectura anticipada? (Premium o plan del scan). */
export function tieneLecturaAnticipada(user: any): boolean {
  return (user?.subscriptions || []).some(
    (s: any) =>
      s?.active === true &&
      s?.subscriptionPlan?.active !== false &&
      ((s?.subscriptionPlan?.isPlatform === true && s?.subscriptionPlan?.tier === 'premium') ||
        s?.subscriptionPlan?.canReadUnreleased === true)
  );
}

/**
 * Renueva (o retira) la licencia de anticipados con los datos del plan. Solo
 * se llama con conexión y con el usuario fresco del servidor.
 */
export async function actualizarLicencia(user: any): Promise<void> {
  if (!user || typeof navigator === 'undefined' || navigator.onLine === false) return;
  const hasta = tieneLecturaAnticipada(user) ? Date.now() + LICENCIA_DIAS * 86400_000 : 0;
  try { await tx(STORE_KEYS, 'readwrite', (s) => s.put({ hasta, revisada: Date.now() }, 'licencia')); } catch {}
}

async function licenciaHasta(): Promise<number> {
  try {
    const l = await tx<{ hasta: number } | undefined>(STORE_KEYS, 'readonly', (s) => s.get('licencia'));
    return l?.hasta || 0;
  } catch {
    return 0;
  }
}

/** ¿Está bloqueado este capítulo descargado? Solo aplica a los anticipados. */
export function capituloBloqueado(ch: DownloadedChapter, hasta: number, ahora = Date.now()): boolean {
  if (!ch.anticipado) return false;
  if (ch.liberaEn && ch.liberaEn <= ahora) return false; // ya es público
  return hasta < ahora;
}

/** Estado de la licencia para pintar la biblioteca y el lector. */
export async function estadoLicencia(): Promise<{ hasta: number; vigente: boolean }> {
  const hasta = await licenciaHasta();
  return { hasta, vigente: hasta > Date.now() };
}

async function encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Empaqueta iv (12 bytes) + ciphertext en un solo blob.
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), 12);
  return out.buffer;
}

async function decrypt(packed: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await getDeviceKey();
  const arr = new Uint8Array(packed);
  const iv = arr.slice(0, 12);
  const ct = arr.slice(12);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
}

const pageId = (wk: string, ch: number, i: number) => `${wk}|${ch}|${i}`;

// ── API pública ───────────────────────────────────────────────────────────────

export async function getDownloads(): Promise<DownloadedWork[]> {
  if (!cuentaActual()) return [];
  const all = await tx<DownloadedWork[]>(STORE_META, 'readonly', (s) => (s as any).getAll());
  return (all || []).sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function getDownload(key: string): Promise<DownloadedWork | undefined> {
  return tx<DownloadedWork | undefined>(STORE_META, 'readonly', (s) => s.get(key));
}

export async function isChapterDownloaded(wk: string, chapter: number): Promise<boolean> {
  const w = await getDownload(wk);
  return !!w?.chapters.some((c) => c.number === chapter);
}

export async function downloadCount(): Promise<number> {
  const all = await getDownloads();
  return all.length;
}

// ¿Puede el usuario descargar UNA obra NUEVA? (si ya está descargada, siempre sí:
// añadir capítulos a una obra existente no cuenta contra el límite).
export async function canDownloadNewWork(user: any, existingKey?: string): Promise<{ ok: boolean; used: number; limit: number | null }> {
  const limit = limiteDescargas(user);
  const all = await getDownloads();
  const isExisting = existingKey ? all.some((w) => w.key === existingKey) : false;
  const used = all.length;
  return { ok: isExisting || limit === null || used < limit, used, limit };
}

/**
 * Tope de obras descargadas para este usuario. Lo decide el API segun su plan
 * (user.capibara.limites). `null` = ilimitado. Si el dato no llega (API vieja,
 * sin sesion) se cae al esquema anterior: gratis 6, con suscripcion 24.
 */
export function limiteDescargas(user: any): number | null {
  const desdeApi = user?.capibara?.limites?.descargas;
  if (desdeApi === null || typeof desdeApi === 'number') return desdeApi;
  const pagando = Array.isArray(user?.subscriptions) && user.subscriptions.some((s: any) => s?.active === true);
  return pagando ? DOWNLOAD_LIMITS.premium : DOWNLOAD_LIMITS.free;
}

async function fetchAsBuffer(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { credentials: 'omit', signal });
  if (!res.ok) throw new Error(`No se pudo descargar una imagen (${res.status})`);
  return res.arrayBuffer();
}

// Error que se lanza al cancelar una descarga (el UI lo trata como no-error).
export class DownloadCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'DownloadCancelled';
  }
}

async function toSmallCover(url: string): Promise<string> {
  try {
    const res = await fetch(url, { credentials: 'omit' });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result));
      r.onerror = () => resolve('');
      r.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// Descarga un capítulo (sus páginas cifradas) y actualiza el manifiesto.
export async function downloadChapter(args: {
  work: { key: string; title: string; coverUrl: string; scanSlug: string; mangaSlug: string; isJoint: boolean };
  chapter: { number: number; title: string; anticipado?: boolean; liberaEn?: number | null };
  pageUrls: string[];
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { work, chapter, pageUrls, signal } = args;
  let bytes = 0;
  for (let i = 0; i < pageUrls.length; i++) {
    if (signal?.aborted) throw new DownloadCancelled();
    const buf = await fetchAsBuffer(pageUrls[i], signal);
    const enc = await encrypt(buf);
    bytes += enc.byteLength;
    await tx(STORE_PAGES, 'readwrite', (s) => s.put(enc, pageId(work.key, chapter.number, i)));
    args.onProgress?.(i + 1, pageUrls.length);
  }
  const existing = await getDownload(work.key);
  const cover = existing?.cover || (await toSmallCover(work.coverUrl));
  const chapters = (existing?.chapters || []).filter((c) => c.number !== chapter.number);
  chapters.push({
    number: chapter.number,
    title: chapter.title,
    pageCount: pageUrls.length,
    ...(chapter.anticipado ? { anticipado: true, liberaEn: chapter.liberaEn ?? null } : {}),
  });
  chapters.sort((a, b) => a.number - b.number);
  const manifest: DownloadedWork = {
    key: work.key,
    title: work.title,
    cover,
    scanSlug: work.scanSlug,
    mangaSlug: work.mangaSlug,
    isJoint: work.isJoint,
    chapters,
    bytes: (existing?.bytes || 0) + bytes,
    downloadedAt: Date.now(),
  };
  await tx(STORE_META, 'readwrite', (s) => s.put(manifest));
}

// Devuelve las páginas de un capítulo descargado como object URLs (descifradas
// en memoria). El lector debe revocarlas al salir con revokePageUrls().
export async function getDecryptedChapterPages(wk: string, chapter: number): Promise<string[]> {
  const w = await getDownload(wk);
  const ch = w?.chapters.find((c) => c.number === chapter);
  if (!w || !ch) throw new Error('Capítulo no descargado');
  if (capituloBloqueado(ch, await licenciaHasta())) throw new CapituloBloqueado(ch);
  const urls: string[] = [];
  for (let i = 0; i < ch.pageCount; i++) {
    const packed = await tx<ArrayBuffer | undefined>(STORE_PAGES, 'readonly', (s) => s.get(pageId(wk, chapter, i)));
    if (!packed) continue;
    const plain = await decrypt(packed);
    urls.push(URL.createObjectURL(new Blob([plain])));
  }
  return urls;
}

/** Capítulo anticipado cuya licencia venció (plan inactivo y aún no es público). */
export class CapituloBloqueado extends Error {
  liberaEn: number | null;
  constructor(ch: DownloadedChapter) {
    super(
      ch.liberaEn
        ? `Capítulo anticipado: se libera el ${new Date(ch.liberaEn).toLocaleDateString('es')}. Con Premium activo puedes leerlo ya (conéctate una vez para renovar el acceso).`
        : 'Capítulo anticipado: necesitas un plan con lectura anticipada activo. Conéctate una vez para renovar el acceso.'
    );
    this.name = 'CapituloBloqueado';
    this.liberaEn = ch.liberaEn ?? null;
  }
}

export function revokePageUrls(urls: string[]): void {
  for (const u of urls) URL.revokeObjectURL(u);
}

export async function deleteChapter(wk: string, chapter: number): Promise<void> {
  const w = await getDownload(wk);
  if (!w) return;
  const ch = w.chapters.find((c) => c.number === chapter);
  if (ch) {
    for (let i = 0; i < ch.pageCount; i++) {
      await tx(STORE_PAGES, 'readwrite', (s) => s.delete(pageId(wk, chapter, i)));
    }
  }
  w.chapters = w.chapters.filter((c) => c.number !== chapter);
  if (w.chapters.length === 0) {
    await tx(STORE_META, 'readwrite', (s) => s.delete(wk));
  } else {
    await tx(STORE_META, 'readwrite', (s) => s.put(w));
  }
}

export async function deleteWork(wk: string): Promise<void> {
  const w = await getDownload(wk);
  if (!w) return;
  for (const ch of w.chapters) {
    for (let i = 0; i < ch.pageCount; i++) {
      await tx(STORE_PAGES, 'readwrite', (s) => s.delete(pageId(wk, ch.number, i)));
    }
  }
  await tx(STORE_META, 'readwrite', (s) => s.delete(wk));
}

// ¿La app corre dentro de Capacitor (Android)? Habilita la UI de descargas.
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
}
