// Gestor de descargas offline cifradas.
//
// Seguridad: las páginas de los capítulos se guardan CIFRADAS en el dispositivo
// con AES-GCM (Web Crypto). La clave se genera una vez por dispositivo y se
// guarda como CryptoKey no exportable en IndexedDB (el navegador/WebView no la
// entrega en claro a JS). Las imágenes solo se descifran en memoria al momento
// de leer, así en el almacenamiento nunca hay nada legible.
//
// Límites (cuenta OBRAS, capítulos ilimitados dentro): gratis 6, premium 24.
// Funciona igual en la app Android (Capacitor) y en el navegador (IndexedDB
// persiste en ambos WebViews).

export const DOWNLOAD_LIMITS = { free: 6, premium: 24 } as const;

const DB_NAME = 'capibara-offline';
const DB_VERSION = 1;
const STORE_META = 'works'; // manifiesto por obra
const STORE_PAGES = 'pages'; // blobs cifrados
const STORE_KEYS = 'keys'; // CryptoKey del dispositivo

export interface DownloadedChapter {
  number: number;
  title: string;
  pageCount: number;
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

let dbPromise: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORE_PAGES)) db.createObjectStore(STORE_PAGES);
      if (!db.objectStoreNames.contains(STORE_KEYS)) db.createObjectStore(STORE_KEYS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
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
let keyPromise: Promise<CryptoKey> | null = null;
async function getDeviceKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    const existing = await tx<CryptoKey | undefined>(STORE_KEYS, 'readonly', (s) => s.get('device'));
    if (existing) return existing;
    // extractable:false — la clave nunca sale en claro de la CryptoKey.
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await tx(STORE_KEYS, 'readwrite', (s) => s.put(key, 'device'));
    return key;
  })();
  return keyPromise;
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
export async function canDownloadNewWork(isPremium: boolean, existingKey?: string): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = isPremium ? DOWNLOAD_LIMITS.premium : DOWNLOAD_LIMITS.free;
  const all = await getDownloads();
  const isExisting = existingKey ? all.some((w) => w.key === existingKey) : false;
  const used = all.length;
  return { ok: isExisting || used < limit, used, limit };
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
  chapter: { number: number; title: string };
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
  chapters.push({ number: chapter.number, title: chapter.title, pageCount: pageUrls.length });
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
  const urls: string[] = [];
  for (let i = 0; i < ch.pageCount; i++) {
    const packed = await tx<ArrayBuffer | undefined>(STORE_PAGES, 'readonly', (s) => s.get(pageId(wk, chapter, i)));
    if (!packed) continue;
    const plain = await decrypt(packed);
    urls.push(URL.createObjectURL(new Blob([plain])));
  }
  return urls;
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
