export const R2_PUBLIC_BASE = (import.meta.env.PUBLIC_R2_PUBLIC_URL || 'https://r2.capibaratraductor.com').replace(/\/$/, '')

export function resolveImg(key?: string | null): string {
  if (!key) return ''
  return /^https?:\/\//i.test(key) ? key : `${R2_PUBLIC_BASE}/${key.replace(/^\//, '')}`
}

export interface Author {
  kind: 'scan' | 'user'
  name: string
  slug: string | null
  avatar: string | null
  isNSFW?: boolean
  byUser?: string | null
}

export interface Post {
  id: number
  content: string
  images: string[]
  pinned: boolean
  parentId: number | null
  isReply: boolean
  likesCount: number
  commentsCount: number
  repostCount: number
  createdAt: string
  liked: boolean
  saved: boolean
  reposted: boolean
  author: Author
  repostOf: Post | null
  spoilerSafe?: boolean
  spoilerWork?: { mangaCustomId: number; title: string | null; chapter: number | null } | null
  poll?: { id: number; options: { text: string; votes: number }[]; votesCount: number; endsAt: string; myVote: number | null } | null
}

export function timeAgo(dateStr: string, lang = 'es'): string {
  const d = new Date(dateStr)
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  const en = lang === 'en'
  if (s < 60) return en ? 'now' : 'ahora'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`
  const h = Math.floor(s / 3600); if (h < 24) return `${h}h`
  const dd = Math.floor(s / 86400); if (dd < 7) return `${dd}d`
  return d.toLocaleDateString(en ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
}

export function orgHref(slug: string, isNSFW?: boolean): string {
  return isNSFW ? `/red/${slug}` : `/${slug}`
}

export function authorHref(a: Author): string {
  if (a.kind === 'scan' && a.slug) return orgHref(a.slug, a.isNSFW)
  if (a.kind === 'user' && a.slug) return `/profile/${a.slug}`
  return '#'
}

export function authorAvatar(a: Author): string {
  return a.avatar ? resolveImg(a.avatar) : (a.kind === 'scan' ? '/images/faviconcaptrad.png' : '')
}

export type Token = { type: 'text' | 'tag' | 'mention' | 'url'; value: string }

// Tokeniza el contenido en texto, #hashtags, @menciones y URLs para renderizar.
export function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = []
  const re = /(#[\p{L}\p{N}_]{1,80})|(@[a-zA-Z0-9_]{1,30})|(https?:\/\/[^\s]+)/gu
  let last = 0
  for (const m of content.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) tokens.push({ type: 'text', value: content.slice(last, idx) })
    if (m[1]) tokens.push({ type: 'tag', value: m[1] })
    else if (m[2]) tokens.push({ type: 'mention', value: m[2] })
    else if (m[3]) tokens.push({ type: 'url', value: m[3] })
    last = idx + m[0].length
  }
  if (last < content.length) tokens.push({ type: 'text', value: content.slice(last) })
  return tokens
}
