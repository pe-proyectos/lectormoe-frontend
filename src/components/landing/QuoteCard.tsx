import React, { useEffect, useRef, useState } from 'react'
import { X, Share2, Download, Copy, Check, Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../util/callApi'

// Tarjeta de cita: convierte un fragmento seleccionado en una imagen compartible
// (canvas, sin dependencias) con la cita, el titulo de la obra y el capitulo.
// Permite compartir (Web Share), descargar PNG, copiar y guardar en el perfil.

export interface SaveInfo {
  mangaSlug: string
  mangaTitle: string
  chapterNumber: number
  displayNumber?: number | null
  orgSlug?: string | null
  workType?: string | null
}

interface Props {
  text: string
  title: string
  chapterLabel: string
  accent?: string
  logged?: boolean
  saveInfo?: SaveInfo
  t: (k: string) => string
  onClose: () => void
}

type Theme = 'dark' | 'paper'
const W = 1080
const H = 1350
const MAX_CHARS = 460

interface Palette { bg1: string; bg2: string; text: string; sub: string; frame: string }
const THEMES: Record<Theme, (accent: string) => Palette> = {
  dark: () => ({ bg1: '#111a27', bg2: '#070b11', text: '#eef1f4', sub: 'rgba(255,255,255,0.45)', frame: 'rgba(255,255,255,0.10)' }),
  paper: () => ({ bg1: '#f8f3e8', bg2: '#efe6d3', text: '#2b2318', sub: 'rgba(43,35,24,0.5)', frame: 'rgba(43,35,24,0.14)' }),
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function draw(canvas: HTMLCanvasElement, text: string, title: string, chapterLabel: string, accent: string, theme: Theme) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const pal = THEMES[theme](accent)
  const PAD = 112

  // Fondo (gradiente radial sutil).
  const rg = ctx.createRadialGradient(W * 0.3, H * 0.25, 120, W * 0.5, H * 0.6, H)
  rg.addColorStop(0, pal.bg1)
  rg.addColorStop(1, pal.bg2)
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, W, H)

  // Marco interior fino.
  ctx.strokeStyle = pal.frame
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // Comilla decorativa arriba.
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.16
  ctx.font = '700 300px Georgia, "Times New Roman", serif'
  ctx.textBaseline = 'top'
  ctx.fillText('“', PAD - 20, PAD - 40)
  ctx.globalAlpha = 1

  // Cita.
  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS).trimEnd() + '…' : text
  const fontSize = clipped.length > 300 ? 42 : clipped.length > 150 ? 50 : 58
  const lineH = Math.round(fontSize * 1.5)
  ctx.font = `400 ${fontSize}px Georgia, "Times New Roman", serif`
  ctx.fillStyle = pal.text
  const maxW = W - PAD * 2
  const lines = wrapLines(ctx, `“${clipped}”`, maxW)
  const blockH = lines.length * lineH
  let y = Math.max(PAD + 170, (H - 300 - blockH) / 2)
  for (const ln of lines) { ctx.fillText(ln, PAD, y); y += lineH }

  // Pie: linea de acento + titulo + capitulo + marca.
  const footY = H - 232
  ctx.fillStyle = accent
  ctx.fillRect(PAD, footY, 76, 5)

  ctx.fillStyle = pal.text
  ctx.font = '800 38px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.fillText(title, PAD, footY + 26)

  ctx.fillStyle = accent
  ctx.font = '700 26px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.fillText(chapterLabel.toUpperCase(), PAD, footY + 82)

  ctx.fillStyle = pal.sub
  ctx.font = '600 22px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('capibaratraductor.com', W - PAD, footY + 130)
  ctx.textAlign = 'left'
}

const QuoteCard: React.FC<Props> = ({ text, title, chapterLabel, accent = '#22d3ee', logged, saveInfo, t, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blobRef = useRef<Blob | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Redibuja cuando el tema cambia y cuando las fuentes estan listas.
  useEffect(() => {
    let cancelled = false
    const gen = () => canvasRef.current?.toBlob((bl) => { if (!cancelled) blobRef.current = bl }, 'image/png')
    const render = () => {
      if (cancelled || !canvasRef.current) return
      draw(canvasRef.current, text, title, chapterLabel, accent, theme)
      gen()
    }
    render()
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(render).catch(() => {})
    }
    return () => { cancelled = true }
  }, [text, title, chapterLabel, accent, theme])

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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

  const shareText = `"${text}" — ${title}, ${chapterLabel}`
  const share = () => {
    const nav = navigator as any
    const blob = blobRef.current
    if (blob) {
      const file = new File([blob], fileName, { type: 'image/png' })
      if (nav.canShare && nav.canShare({ files: [file] })) {
        // Llamada SIN await previo para conservar el gesto de usuario (iOS/Android).
        nav.share({ files: [file], text: shareText }).catch((e: any) => {
          if (e?.name !== 'AbortError') downloadBlob(blob)
        })
        return
      }
      if (nav.share) {
        nav.share({ text: shareText }).catch(() => downloadBlob(blob))
        return
      }
      downloadBlob(blob)
      return
    }
    // La imagen aun no esta lista: generarla y descargar/compartir.
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
      await navigator.clipboard.writeText(`"${text}" — ${title}, ${chapterLabel}`)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch { /* sin permiso */ }
  }

  const save = async () => {
    if (!logged) { toast.info(t('reader_quote_login')); return }
    if (!saveInfo || saving || saved) return
    setSaving(true)
    try {
      const res: any = await callAPI('/api/saved-quotes', {
        method: 'POST',
        body: JSON.stringify({
          text,
          mangaSlug: saveInfo.mangaSlug,
          mangaTitle: saveInfo.mangaTitle,
          chapterNumber: saveInfo.chapterNumber,
          displayNumber: saveInfo.displayNumber ?? null,
          orgSlug: saveInfo.orgSlug ?? null,
          workType: saveInfo.workType ?? null,
        }),
      })
      // callAPI ya lanza si status === false; si llegamos aqui, se guardo.
      if (res?.quote || res?.deduped) { setSaved(true); toast.success(t('reader_quote_saved')) }
      else { setSaved(true); toast.success(t('reader_quote_saved')) }
    } catch (e: any) {
      if (String(e?.message || '').includes('QUOTE_LIMIT')) toast.error(t('reader_quote_limit'))
      else toast.error(e?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Selector de tema */}
        <div className="flex items-center justify-center gap-1 mb-3 p-0.5 rounded-full bg-white/5 border border-white/10 w-max mx-auto">
          {([['dark', t('reader_quote_theme_dark')], ['paper', t('reader_quote_theme_paper')]] as [Theme, string][]).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTheme(k)}
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-colors ${theme === k ? 'bg-white text-zinc-950' : 'text-white/60 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" role="img" aria-label={text} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button type="button" onClick={share} disabled={busy}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 text-[11px] font-black hover:bg-cyan-400 transition-colors disabled:opacity-50">
            <Share2 size={17} /> {t('reader_quote_share')}
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors disabled:opacity-50">
            {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {saved ? t('reader_quote_saved') : t('reader_quote_save')}
          </button>
          <button type="button" onClick={download}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors">
            <Download size={17} /> PNG
          </button>
          <button type="button" onClick={copy}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-[11px] font-bold hover:bg-white/10 transition-colors">
            {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? t('reader_quote_copied') : t('reader_quote_copy')}
          </button>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="mt-3 w-full flex items-center justify-center gap-2 text-white/55 hover:text-white text-xs font-bold uppercase tracking-widest">
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  )
}

export default QuoteCard
