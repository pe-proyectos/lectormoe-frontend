// Cliente de navegador para hilos.rest (patron BFF): el page token vive SOLO en
// memoria y se renueva contra la API de CapibaraTraductor, que es quien guarda
// la secret key. Mismo modelo que usa lacharca.com.
const API = import.meta.env['PUBLIC_API_URL'] || ''

let token: string | null = null
let expMs = 0
let inflight: Promise<string | null> | null = null
let base = 'https://hilos.rest'

function authHeader(): Record<string, string> {
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {}
}

async function fetchToken(): Promise<string | null> {
  const res = await fetch(`${API}/api/hilos/token`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeader(),
  })
  const json: any = await res.json().catch(() => ({}))
  if (!json?.status || !json?.data?.token) return null
  token = json.data.token
  expMs = Date.now() + Math.max(30, (json.data.expiresIn || 900) - 60) * 1000
  if (json.data.hilosBase) base = json.data.hilosBase
  return token
}

async function getToken(): Promise<string | null> {
  if (token && Date.now() < expMs) return token
  if (!inflight) inflight = fetchToken().finally(() => { inflight = null })
  return inflight
}

export function clearHilosToken() { token = null; expMs = 0 }

// Lectura publica: no necesita sesion, usa la publishable key del sitio.
const PUBLIC_KEY = import.meta.env['PUBLIC_HILOS_KEY'] || ''

export async function hilosPublic(path: string): Promise<any> {
  const res = await fetch(`${base}/v1${path}`, { headers: PUBLIC_KEY ? { Authorization: `Bearer ${PUBLIC_KEY}` } : {} })
  const json: any = await res.json().catch(() => ({}))
  if (json?.error) throw new Error(json.error)
  return json?.data
}

export async function hilosFetch(path: string, init: RequestInit = {}, retry = true): Promise<any> {
  const t = await getToken()
  if (!t) throw new Error('unauthenticated')
  const res = await fetch(`${base}/v1${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${t}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
  })
  const json: any = await res.json().catch(() => ({}))
  if (json?.error === 'unauthorized' && retry) { clearHilosToken(); return hilosFetch(path, init, false) }
  if (json?.error) throw new Error(json.error)
  return json?.data
}

export const hilosApi = {
  postRef: async (ref: string): Promise<number | null> => {
    const res = await fetch(`${API}/api/hilos/post-ref?ref=${encodeURIComponent(ref)}`)
    const json: any = await res.json().catch(() => ({}))
    return json?.data?.postId ?? null
  },
  comments: (postId: number, page = 0, limit = 100) => hilosFetch(`/posts/${postId}/comments?page=${page}&limit=${limit}`),
  comment: (postId: number, content: string, parentCommentId?: number) =>
    hilosFetch(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content, ...(parentCommentId ? { parentCommentId } : {}) }) }),
  likeComment: (id: number) => hilosFetch(`/comments/${id}/like`, { method: 'POST' }),
  removeComment: (id: number) => hilosFetch(`/comments/${id}`, { method: 'DELETE' }),
  hideComment: async (id: number, hidden: boolean, orgSlug?: string) => {
    const res = await fetch(`${API}/api/hilos/comments/${id}/hide`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(orgSlug ? { 'x-organization': orgSlug } : {}), ...authHeader() },
      body: JSON.stringify({ hidden }),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!json?.status) throw new Error(json?.message || 'error')
    return json.data
  },
}
