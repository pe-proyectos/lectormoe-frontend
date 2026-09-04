import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Share2, Download, Copy, Check, Bookmark, BookmarkCheck, Link2, Type, Palette, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../util/callApi'

// Studio de tarjeta de cita: convierte un fragmento en una imagen compartible
// (canvas puro) totalmente configurable: formato (vertical/horizontal), color
// de acento, tema, fuente, limite de caracteres y nota personal (dentro de la
// imagen con atribucion, o como pie fuera del PNG).

export interface SaveInfo {
  mangaSlug: string
  mangaTitle: string
  chapterNumber: number
  displayNumber?: number | null
  orgSlug?: string | null
  workType?: string | null
}

export interface CardConfig {
  format: FormatKey
  theme: ThemeKey
  accent: string
  font: FontKey
  maxChars: number
  note: string
  noteMode: NoteMode
}

interface Props {
  text: string
  title: string
  chapterLabel: string
  accent?: string
  logged?: boolean
  saveInfo?: SaveInfo
  scanName?: string | null
  username?: string | null
  initialConfig?: Partial<CardConfig>
  refLink?: string | null
  onCopyRef?: () => void
  onSaved?: () => void
  t: (k: string) => string
  onClose: () => void
}

type ThemeKey = 'dark' | 'paper' | 'ink' | 'midnight'
type FontKey = 'serif' | 'sans' | 'display'
type NoteMode = 'none' | 'image' | 'caption'
type FormatKey = 'story' | 'post' | 'square' | 'wide' | 'hd'

interface Format { w: number; h: number; label: string; vertical: boolean }
const FORMATS: Record<FormatKey, Format> = {
  story: { w: 1080, h: 1920, label: '9:16', vertical: true },
  post: { w: 1080, h: 1350, label: '4:5', vertical: true },
  square: { w: 1080, h: 1080, label: '1:1', vertical: true },
  wide: { w: 1200, h: 630, label: '1.91:1', vertical: false },
  hd: { w: 1920, h: 1080, label: '16:9', vertical: false },
}

const FONTS: Record<FontKey, { body: string; head: string; label: string }> = {
  serif: { body: 'Georgia, "Times New Roman", serif', head: '"Plus Jakarta Sans", Georgia, sans-serif', label: 'Serif' },
  sans: { body: '"Plus Jakarta Sans", system-ui, sans-serif', head: '"Plus Jakarta Sans", system-ui, sans-serif', label: 'Sans' },
  display: { body: '"Times New Roman", Georgia, serif', head: 'Georgia, serif', label: 'Display' },
}

interface Palette { bg1: string; bg2: string; text: string; sub: string; frame: string }
const THEMES: Record<ThemeKey, Palette> = {
  dark: { bg1: '#111a27', bg2: '#070b11', text: '#eef1f4', sub: 'rgba(255,255,255,0.45)', frame: 'rgba(255,255,255,0.10)' },
  paper: { bg1: '#f8f3e8', bg2: '#efe6d3', text: '#2b2318', sub: 'rgba(43,35,24,0.5)', frame: 'rgba(43,35,24,0.14)' },
  ink: { bg1: '#1a1a1a', bg2: '#000000', text: '#f5f5f5', sub: 'rgba(255,255,255,0.4)', frame: 'rgba(255,255,255,0.12)' },
  midnight: { bg1: '#1e1b4b', bg2: '#0b1020', text: '#eef2ff', sub: 'rgba(226,232,255,0.5)', frame: 'rgba(199,210,254,0.14)' },
}

const ACCENTS = ['#22d3ee', '#a78bfa', '#fb7185', '#f59e0b', '#34d399', '#38bdf8', '#f472b6']

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    if (!words.length) { out.push(''); continue }
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = w } else line = test
    }
    if (line) out.push(line)
  }
  return out
}

function draw(canvas: HTMLCanvasElement, cfg: CardConfig, text: string, title: string, chapterLabel: string, scanName: string, username: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const fmt = FORMATS[cfg.format]
  const W = fmt.w, H = fmt.h
  canvas.width = W; canvas.height = H
  const pal = THEMES[cfg.theme]
  const font = FONTS[cfg.font]
  const accent = cfg.accent
  const PAD = Math.round(Math.min(W, H) * 0.095)

  // Fondo (gradiente radial sutil).
  const rg = ctx.createRadialGradient(W * 0.3, H * 0.25, 120, W * 0.5, H * 0.6, Math.max(W, H))
  rg.addColorStop(0, pal.bg1)
  rg.addColorStop(1, pal.bg2)
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, W, H)

  // Marco interior fino.
  const m = Math.round(PAD * 0.36)
  ctx.strokeStyle = pal.frame
  ctx.lineWidth = 2
  ctx.strokeRect(m, m, W - m * 2, H - m * 2)

  // Comilla decorativa.
  const qSize = Math.round(Math.min(W, H) * 0.26)
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.15
  ctx.font = `700 ${qSize}px Georgia, serif`
  ctx.textBaseline = 'top'
  ctx.fillText('“', PAD - qSize * 0.06, PAD - qSize * 0.14)
  ctx.globalAlpha = 1

  // Zonas: cabecera (comilla), cita (centro), pie.
  const footZone = Math.round(H * (fmt.vertical ? 0.17 : 0.24))
  const footY = H - footZone
  const noteInImage = cfg.noteMode === 'image' && cfg.note.trim().length > 0
  const noteReserve = noteInImage ? Math.round(H * 0.11) : 0
  const topLimit = PAD + Math.round(qSize * 0.42)
  const bottomLimit = footY - Math.round(PAD * 0.5) - noteReserve
  const maxW = W - PAD * 2
  const clipped = text.length > cfg.maxChars ? text.slice(0, cfg.maxChars).trimEnd() + '…' : text
  const body = `“${clipped}”`

  // Ajuste de fuente: elige el mayor tamano que quepa en la zona de cita.
  const region = bottomLimit - topLimit
  let fontSize = fmt.vertical ? 60 : 52
  let lines: string[] = []
  let lineH = 0
  for (fontSize = fmt.vertical ? 62 : 54; fontSize >= 24; fontSize -= 2) {
    ctx.font = `400 ${fontSize}px ${font.body}`
    lineH = Math.round(fontSize * 1.46)
    lines = wrapLines(ctx, body, maxW)
    if (lines.length * lineH <= region) break
  }
  // Si aun no cabe al minimo, recorta lineas con puntos suspensivos.
  if (lines.length * lineH > region) {
    const maxLines = Math.max(1, Math.floor(region / lineH))
    lines = lines.slice(0, maxLines)
    if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/[\s”]*$/, '') + '…”'
  }
  ctx.font = `400 ${fontSize}px ${font.body}`
  ctx.fillStyle = pal.text
  ctx.textAlign = 'left'
  const blockH = lines.length * lineH
  let y = topLimit + Math.max(0, (region - blockH) / 2)
  for (const ln of lines) { ctx.fillText(ln, PAD, y); y += lineH }

  // Nota personal dentro de la imagen (con atribucion).
  if (noteInImage) {
    const noteSize = Math.round(fontSize * 0.62)
    ctx.font = `italic 400 ${noteSize}px ${font.body}`
    ctx.fillStyle = pal.sub
    const nLines = wrapLines(ctx, cfg.note.trim(), maxW).slice(0, 3)
    let ny = footY - noteReserve + Math.round(noteSize * 0.4)
    for (const ln of nLines) { ctx.fillText(ln, PAD, ny); ny += Math.round(noteSize * 1.4) }
    if (username) {
      ctx.fillStyle = pal.sub
      ctx.font = `700 ${Math.round(noteSize * 0.85)}px ${font.head}`
      ctx.fillText(`— ${username}`, PAD, ny)
    }
  }

  // Pie: linea de acento + titulo + capitulo (izq) + scan/marca (der).
  const fTop = footY + Math.round(footZone * 0.14)
  ctx.textAlign = 'left'
  ctx.fillStyle = accent
  ctx.fillRect(PAD, fTop, Math.round(PAD * 0.7), 5)

  const titleSize = Math.round(Math.min(W, H) * (fmt.vertical ? 0.036 : 0.045))
  const brandSize = Math.round(titleSize * 0.6)
  const scanSize = Math.round(titleSize * 0.66)

  // Medir el bloque derecho (scan sobre marca) para reservar su ancho.
  ctx.textAlign = 'right'
  ctx.font = `700 ${scanSize}px ${font.head}`
  const scanW = scanName ? ctx.measureText(scanName).width : 0
  ctx.font = `600 ${brandSize}px ${font.head}`
  const brandW = ctx.measureText('capibaratraductor.com').width
  const rightW = Math.max(scanW, brandW)
  const availLeft = (W - PAD * 2) - rightW - Math.round(PAD * 0.6)

  // Ajustar el titulo: achica la fuente y permite hasta 2 lineas con elipsis.
  let tSize = titleSize
  let tLines: string[] = []
  for (tSize = titleSize; tSize >= Math.round(titleSize * 0.62); tSize -= 2) {
    ctx.font = `800 ${tSize}px ${font.head}`
    tLines = wrapLines(ctx, title, availLeft)
    if (tLines.length <= 2) break
  }
  if (tLines.length > 2) {
    tLines = tLines.slice(0, 2)
    ctx.font = `800 ${tSize}px ${font.head}`
    let last = tLines[1]
    while (last.length > 1 && ctx.measureText(last + '…').width > availLeft) last = last.slice(0, -1)
    tLines[1] = last.replace(/\s+$/, '') + '…'
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = pal.text
  ctx.font = `800 ${tSize}px ${font.head}`
  let ty = fTop + Math.round(tSize * 0.85)
  for (const ln of tLines) { ctx.fillText(ln, PAD, ty); ty += Math.round(tSize * 1.16) }

  ctx.fillStyle = accent
  ctx.font = `700 ${Math.round(titleSize * 0.62)}px ${font.head}`
  ctx.fillText(chapterLabel.toUpperCase(), PAD, ty + Math.round(titleSize * 0.15))

  // Bloque derecho: nombre del scan sobre capibaratraductor.com.
  ctx.textAlign = 'right'
  if (scanName) {
    ctx.fillStyle = pal.text
    ctx.font = `700 ${scanSize}px ${font.head}`
    ctx.fillText(scanName, W - PAD, fTop + Math.round(titleSize * 0.85))
  }
  ctx.fillStyle = pal.sub
  ctx.font = `600 ${brandSize}px ${font.head}`
  ctx.fillText('capibaratraductor.com', W - PAD, fTop + Math.round(titleSize * (scanName ? 1.75 : 1.0)))
  ctx.textAlign = 'left'
}

const QuoteCard: React.FC<Props> = ({ text, title, chapterLabel, accent = '#22d3ee', logged, saveInfo, scanName, username, initialConfig, refLink, onCopyRef, onSaved, t, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobRef = useRef<Blob | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState<'estilo' | 'texto'>('estilo')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const clampPan = (x: number, y: number, z: number) => {
    const el = previewRef.current
    const maxX = el ? (el.clientWidth * (z - 1)) / 2 : 0
    const maxY = el ? (el.clientHeight * (z - 1)) / 2 : 0
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }
  const setZoomClamped = (z: number) => {
    const nz = Math.max(1, Math.min(4, z))
    setZoom(nz)
    setPan((p) => (nz === 1 ? { x: 0, y: 0 } : clampPan(p.x, p.y, nz)))
  }
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const onPreviewWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoomClamped(zoom * (e.deltaY < 0 ? 1.15 : 0.87))
  }
  const onPreviewDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    setDragging(true)
  }
  const onPreviewMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const d = dragRef.current
    setPan(clampPan(d.px + (e.clientX - d.x), d.py + (e.clientY - d.y), zoom))
  }
  const onPreviewUp = (e: React.PointerEvent) => {
    dragRef.current = null
    setDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const accents = useMemo(() => {
    const base = accent && !ACCENTS.includes(accent) ? [accent, ...ACCENTS] : ACCENTS
    return Array.from(new Set(base)).slice(0, 8)
  }, [accent])

  const [cfg, setCfg] = useState<CardConfig>({
    format: initialConfig?.format ?? 'post',
    theme: initialConfig?.theme ?? 'dark',
    accent: initialConfig?.accent ?? accent,
    font: initialConfig?.font ?? 'serif',
    maxChars: initialConfig?.maxChars ?? 460,
    note: initialConfig?.note ?? '',
    noteMode: initialConfig?.noteMode ?? 'none',
  })
  const set = <K extends keyof CardConfig>(k: K, v: CardConfig[K]) => setCfg((c) => ({ ...c, [k]: v }))

  const scan = (scanName || '').trim()
  const uname = (username || '').trim()

  // Redibuja cuando cambia la config o cuando las fuentes estan listas.
  useEffect(() => {
    let cancelled = false
    const gen = () => canvasRef.current?.toBlob((bl) => { if (!cancelled) blobRef.current = bl }, 'image/png')
    const render = () => {
      if (cancelled || !canvasRef.current) return
      draw(canvasRef.current, cfg, text, title, chapterLabel, scan, uname)
      gen()
    }
    render()
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(render).catch(() => {})
    }
    return () => { cancelled = true }
  }, [cfg, text, title, chapterLabel, scan, uname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Al cambiar de formato (cambian las dimensiones) resetea el zoom/pan.
  useEffect(() => { resetZoom() }, [cfg.format])

  const toBlob = (): Promise<Blob | null> =>
    new Promise((res) => { canvasRef.current ? canvasRef.current.toBlob((b) => res(b), 'image/png') : res(null) })

  const fileName = `cita-${title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'novela'}.png`

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const caption = cfg.noteMode === 'caption' && cfg.note.trim() ? cfg.note.trim() : ''
  const shareText = `"${text}" — ${title}, ${chapterLabel}${caption ? `\n\n${caption}` : ''}`
  const share = () => {
    const nav = navigator as any
    const blob = blobRef.current
    if (blob) {
      const file = new File([blob], fileName, { type: 'image/png' })
      if (nav.canShare && nav.canShare({ files: [file] })) {
        nav.share({ files: [file], text: shareText }).catch((e: any) => { if (e?.name !== 'AbortError') downloadBlob(blob) })
        return
      }
      if (nav.share) { nav.share({ text: shareText }).catch(() => downloadBlob(blob)); return }
      downloadBlob(blob)
      return
    }
    toBlob().then((b) => {
      if (!b) return
      const file = new File([b], fileName, { type: 'image/png' })
      const n = navigator as any
      if (n.canShare && n.canShare({ files: [file] })) n.share({ files: [file], text: shareText }).catch(() => downloadBlob(b))
      else downloadBlob(b)
    })
  }

  const download = async () => { const b = await toBlob(); if (b) downloadBlob(b) }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch { /* sin permiso */ }
  }

  const save = async () => {
    if (!logged) { toast.info(t('reader_quote_login')); return }
    if (!saveInfo || saving || saved) return
    setSaving(true)
    try {
      await callAPI('/api/saved-quotes', {
        method: 'POST',
        body: JSON.stringify({
          text,
          note: cfg.noteMode !== 'none' ? cfg.note.trim() || null : null,
          cardConfig: cfg,
          mangaSlug: saveInfo.mangaSlug,
          mangaTitle: saveInfo.mangaTitle,
          chapterNumber: saveInfo.chapterNumber,
          displayNumber: saveInfo.displayNumber ?? null,
          orgSlug: saveInfo.orgSlug ?? null,
          workType: saveInfo.workType ?? null,
        }),
      })
      setSaved(true); toast.success(t('reader_quote_saved')); onSaved?.()
    } catch (e: any) {
      if (String(e?.message || '').includes('QUOTE_LIMIT')) toast.error(t('reader_quote_limit'))
      else toast.error(e?.message || 'No se pudo guardar')
    } finally { setSaving(false) }
  }

  const pill = 'px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer'
  const chip = (active: boolean) => `${pill} ${active ? 'bg-white text-zinc-950' : 'text-white/55 hover:text-white bg-white/5'}`

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl xl:max-w-5xl 2xl:max-w-6xl my-auto rounded-2xl bg-zinc-950 ring-1 ring-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* Vista previa */}
          <div className="p-4 sm:p-5 flex flex-col items-center justify-center bg-black/40 border-b md:border-b-0 md:border-r border-white/10">
            <div ref={previewRef}
              onWheel={onPreviewWheel} onPointerDown={onPreviewDown} onPointerMove={onPreviewMove} onPointerUp={onPreviewUp} onPointerCancel={onPreviewUp}
              className="relative w-full flex items-center justify-center overflow-hidden rounded-xl"
              style={{ touchAction: 'none', cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}>
              <canvas ref={canvasRef}
                className="block max-w-full max-h-[46vh] md:max-h-[60vh] xl:max-h-[72vh] w-auto h-auto rounded-xl shadow-2xl ring-1 ring-white/10 select-none"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? 'none' : 'transform 120ms', transformOrigin: 'center' }}
                role="img" aria-label={text} />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-1 py-1 ring-1 ring-white/15">
                <button type="button" onClick={() => setZoomClamped(zoom - 0.4)} disabled={zoom <= 1} aria-label="Alejar"
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"><ZoomOut size={16} /></button>
                <span className="text-[10px] font-bold text-white/70 w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoomClamped(zoom + 0.4)} disabled={zoom >= 4} aria-label="Acercar"
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"><ZoomIn size={16} /></button>
                <button type="button" onClick={resetZoom} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label="Restablecer zoom"
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer"><Maximize2 size={15} /></button>
              </div>
            </div>
            {caption ? (
              <p className="mt-3 text-center text-[12px] italic text-white/60 max-w-sm">{caption}{uname ? ` — ${uname}` : ''}</p>
            ) : null}
          </div>

          {/* Controles */}
          <div className="p-4 sm:p-5 flex flex-col">
            <div className="flex items-center gap-1 mb-4 p-0.5 rounded-full bg-white/5 border border-white/10 w-max">
              <button type="button" onClick={() => setPanel('estilo')} className={chip(panel === 'estilo')}><Palette size={12} className="inline mr-1 -mt-0.5" />{t('reader_quote_tab_style')}</button>
              <button type="button" onClick={() => setPanel('texto')} className={chip(panel === 'texto')}><Type size={12} className="inline mr-1 -mt-0.5" />{t('reader_quote_tab_text')}</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[46vh] md:max-h-[54vh]">
              {panel === 'estilo' ? (
                <>
                  {/* Formato */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{t('reader_quote_format')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(FORMATS) as FormatKey[]).map((k) => (
                        <button key={k} type="button" onClick={() => set('format', k)} className={chip(cfg.format === k)}>
                          {FORMATS[k].vertical ? '▮' : '▬'} {FORMATS[k].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tema */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{t('reader_quote_theme')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                        <button key={k} type="button" onClick={() => set('theme', k)} aria-label={k}
                          className={`w-8 h-8 rounded-lg border-2 transition cursor-pointer ${cfg.theme === k ? 'border-white scale-105' : 'border-white/15'}`}
                          style={{ background: `linear-gradient(135deg, ${THEMES[k].bg1}, ${THEMES[k].bg2})` }} />
                      ))}
                    </div>
                  </div>
                  {/* Color de acento */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{t('reader_quote_color')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {accents.map((c) => (
                        <button key={c} type="button" onClick={() => set('accent', c)} aria-label={c}
                          className={`w-8 h-8 rounded-full border-2 transition cursor-pointer ${cfg.accent === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  {/* Fuente */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{t('reader_quote_font')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(FONTS) as FontKey[]).map((k) => (
                        <button key={k} type="button" onClick={() => set('font', k)} className={chip(cfg.font === k)}>{FONTS[k].label}</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Limite de caracteres */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('reader_quote_maxchars')}</p>
                      <span className="text-[11px] font-bold text-white/70">{cfg.maxChars}</span>
                    </div>
                    <input type="range" min={120} max={600} step={20} value={cfg.maxChars}
                      onChange={(e) => set('maxChars', Number(e.target.value))}
                      className="w-full" style={{ accentColor: cfg.accent }} />
                    {text.length > cfg.maxChars ? (
                      <p className="text-[10px] text-amber-400/80 mt-1">{t('reader_quote_truncated')}</p>
                    ) : null}
                  </div>
                  {/* Nota personal */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{t('reader_quote_note')}</p>
                    <textarea value={cfg.note} onChange={(e) => set('note', e.target.value.slice(0, 240))}
                      placeholder={t('reader_quote_note_ph')} rows={3}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none" />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {([['none', t('reader_quote_note_none')], ['image', t('reader_quote_note_image')], ['caption', t('reader_quote_note_caption')]] as [NoteMode, string][]).map(([k, label]) => (
                        <button key={k} type="button" onClick={() => set('noteMode', k)} className={chip(cfg.noteMode === k)}>{label}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-4 gap-2">
                <button type="button" onClick={share}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-zinc-950 text-[11px] font-black transition-opacity hover:opacity-90 cursor-pointer" style={{ background: cfg.accent }}>
                  <Share2 size={17} /> {t('reader_quote_share')}
                </button>
                <button type="button" onClick={save} disabled={saving}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer">
                  {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {saved ? t('reader_quote_saved') : t('reader_quote_save')}
                </button>
                <button type="button" onClick={download}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors cursor-pointer">
                  <Download size={17} /> PNG
                </button>
                <button type="button" onClick={copy}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors cursor-pointer">
                  {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? t('reader_quote_copied') : t('reader_quote_copy')}
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                {onCopyRef ? (
                  <button type="button" onClick={onCopyRef} className="flex items-center gap-1.5 text-white/55 hover:text-white text-[11px] font-bold uppercase tracking-widest cursor-pointer">
                    <Link2 size={13} /> {t('reader_quote_copy_ref')}
                  </button>
                ) : <span />}
                <button type="button" onClick={onClose} aria-label="Cerrar" className="flex items-center gap-1.5 text-white/55 hover:text-white text-[11px] font-bold uppercase tracking-widest cursor-pointer">
                  <X size={13} /> Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuoteCard
