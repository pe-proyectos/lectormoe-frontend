// Render de novelas: fuente unica de verdad para el lector y el preview del
// editor. Convierte el markdown a HTML sanitizado con el MISMO pipeline que ve
// el lector (markdown-it + DOMPurify), respetando el marcador de ancho de las
// ilustraciones (w40 | w70 | w100) y limitando las imagenes al R2 propio.
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const R2_IMG_BASE = (
  import.meta.env.PUBLIC_R2_PUBLIC_URL || 'https://r2.capibaratraductor.com'
).replace(/\/$/, '')

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false })

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx]
  const src = token?.attrGet('src') || ''
  if (!src.startsWith(`${R2_IMG_BASE}/`)) return ''
  const alt = token?.content || ''
  const title = token?.attrGet('title') || ''
  const marker = /^w(40|70|100)$/.test(title) ? title : 'w100'
  const escAlt = alt.replace(/"/g, '&quot;')
  return `<img class="nr-img nr-img-${marker}" src="${src}" alt="${escAlt}" loading="lazy" decoding="async" />`
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'blockquote', 'hr', 'a', 'code', 'pre', 'span', 'div', 'img',
]
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'src', 'alt', 'loading', 'decoding']
const FORBID_TAGS = ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button']
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']

export interface TocEntry {
  id: string
  level: number
  text: string
}

// Devuelve el HTML sanitizado y el indice (TOC) por encabezados. Los ids se
// inyectan tras sanitizar (son propios, no del contenido del usuario).
export function renderNovelHtml(markdown: string): { html: string; toc: TocEntry[] } {
  const raw = markdown || ''
  if (!raw) return { html: '', toc: [] }
  const rendered = md.render(raw)
  const sanitized = DOMPurify.sanitize(rendered, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    FORBID_ATTR,
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|#)/i,
    ADD_ATTR: ['target', 'rel'],
  })
  const withLinks = sanitized.replace(/<a\s+([^>]*?)>/gi, (_m, attrs) => {
    const cleaned = attrs.replace(/\s*(target|rel)\s*=\s*"[^"]*"/gi, '').trim()
    return `<a ${cleaned} target="_blank" rel="noopener noreferrer nofollow">`
  })
  const toc: TocEntry[] = []
  let idx = 0
  const withIds = withLinks.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/gi, (_m, lvl: string, inner: string) => {
    const id = `nr-h-${idx++}`
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (text) toc.push({ id, level: Number(lvl), text })
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`
  })
  return { html: withIds, toc }
}
