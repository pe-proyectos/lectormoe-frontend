// Resaltado de la seleccion mediante rectangulos de overlay (posicion absoluta
// en coordenadas de documento). Funciona en TODOS los navegadores (no depende
// de la CSS Custom Highlight API). Se reposiciona en resize; con scroll vertical
// se mueve solo (coordenadas de documento).
let overlays: HTMLElement[] = []
let current: { range: Range; color: string } | null = null
let listening = false

function clearOverlays() {
  for (const d of overlays) d.remove()
  overlays = []
}

function render() {
  clearOverlays()
  if (!current) return
  const rects = current.range.getClientRects()
  const sx = window.scrollX
  const sy = window.scrollY
  for (const r of Array.from(rects)) {
    if (r.width < 1 || r.height < 2) continue
    const d = document.createElement('div')
    d.setAttribute('data-quote-hl', '')
    d.style.cssText = `position:absolute;left:${r.left + sx}px;top:${r.top + sy}px;width:${r.width}px;height:${r.height}px;background:${current.color};pointer-events:none;z-index:5;border-radius:3px;`
    document.body.appendChild(d)
    overlays.push(d)
  }
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('resize', () => { if (current) render() })
}

export function paintRange(range: Range, color = 'rgba(34,211,238,0.32)'): () => void {
  ensureListener()
  try {
    current = { range: range.cloneRange(), color }
    render()
  } catch {
    current = null
  }
  return clearHighlight
}

export function clearHighlight(): void {
  current = null
  clearOverlays()
}

export const supportsHighlight = (): boolean => true
