export const R2_PUBLIC_BASE = (import.meta.env.PUBLIC_R2_PUBLIC_URL || 'https://r2.capibaratraductor.com').replace(/\/$/, '')

export function resolveImg(key: string): string {
  if (!key) return ''
  return /^https?:\/\//i.test(key) ? key : `${R2_PUBLIC_BASE}/${key.replace(/^\//, '')}`
}

export interface Post {
  id: number
  content: string
  images: string[]
  pinned: boolean
  likesCount: number
  commentsCount: number
  createdAt: string
  updatedAt: string
  liked: boolean
  author: { username: string; slug?: string | null; imageUrl?: string | null } | null
  org: { slug: string; name: string; faviconUrl?: string | null; imageUrl?: string | null; isNSFW?: boolean } | null
}

export interface PostComment {
  id: number
  comment: string
  imageUrl?: string | null
  createdAt: string
  userId: number
  user: { username: string; slug?: string | null; imageUrl?: string | null } | null
}

export function timeAgo(dateStr: string, lang = 'es'): string {
  const d = new Date(dateStr)
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  const en = lang === 'en'
  if (s < 60) return en ? 'now' : 'ahora'
  const m = Math.floor(s / 60)
  if (m < 60) return en ? `${m}m` : `hace ${m} min`
  const h = Math.floor(s / 3600)
  if (h < 24) return en ? `${h}h` : `hace ${h} h`
  const dd = Math.floor(s / 86400)
  if (dd < 7) return en ? `${dd}d` : `hace ${dd} d`
  return d.toLocaleDateString(en ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
}

export function orgHref(slug: string, isNSFW?: boolean): string {
  return isNSFW ? `/red/${slug}` : `/${slug}`
}

export function orgAvatar(org: Post['org']): string {
  if (!org) return '/images/faviconcaptrad.png'
  return org.faviconUrl ? resolveImg(org.faviconUrl) : org.imageUrl ? resolveImg(org.imageUrl) : '/images/faviconcaptrad.png'
}
