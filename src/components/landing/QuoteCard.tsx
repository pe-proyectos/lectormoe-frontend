import React, { useEffect, useRef, useState } from 'react'
import { X, Share2, Download, Copy, Check } from 'lucide-react'

// Tarjeta de cita: convierte un fragmento seleccionado de la novela en una
// imagen compartible (canvas, sin dependencias) con el titulo de la obra y el
// capitulo. Compartir via Web Share (con archivo) o descargar como PNG.

interface Props {
  text: string
  title: string
  chapterLabel: string
  accent?: string
  onClose: () => void
}

const W = 1080
const H = 1350
const PAD = 96
const MAX_CHARS = 480

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function draw(canvas: HTMLCanvasElement, text: string, title: string, chapterLabel: string, accent: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // Fondo degradado oscuro elegante.
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0d1520')
  g.addColorStop(1, '#05080c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // Barra de acento a la izquierda.
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, 12, H)

  // Comilla decorativa.
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.25
  ctx.font = '700 220px Georgia, "Times New Roman", serif'
  ctx.textBaseline = 'top'
  ctx.fillText('“', PAD - 10, PAD - 60)
  ctx.globalAlpha = 1

  // Texto de la cita (serif, ajustado).
  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS).trimEnd() + '…' : text
  const fontSize = clipped.length > 300 ? 40 : clipped.length > 160 ? 46 : 54
  const lineH = Math.round(fontSize * 1.42)
  ctx.font = `400 ${fontSize}px Georgia, "Times New Roman", serif`
  ctx.fillStyle = '#e9ecef'
  const maxW = W - PAD * 2
  const lines = wrapLines(ctx, clipped, maxW)
  const blockH = lines.length * lineH
  let y = Math.max(PAD + 140, (H - 260 - blockH) / 2)
  for (const ln of lines) {
    ctx.fillText(ln, PAD, y)
    y += lineH
  }

  // Divisor + atribucion abajo.
  const footY = H - 220
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, footY)
  ctx.lineTo(W - PAD, footY)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 34px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.fillText(title, PAD, footY + 28)
  ctx.fillStyle = accent
  ctx.font = '600 26px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.fillText(chapterLabel, PAD, footY + 76)

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '500 22px "Plus Jakarta Sans", Georgia, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('capibaratraductor.com', W - PAD, footY + 120)
  ctx.textAlign = 'left'
}

const QuoteCard: React.FC<Props> = ({ text, title, chapterLabel, accent = '#22d3ee', onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, text, title, chapterLabel, accent)
  }, [text, title, chapterLabel, accent])

  const toBlob = (): Promise<Blob | null> =>
    new Promise((res) => canvasRef.current?.toBlob((b) => res(b), 'image/png') ?? res(null))

  const fileName = `cita-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'novela'}.png`

  const share = async () => {
    setBusy(true)
    try {
      const blob = await toBlob()
      if (!blob) throw new Error('no blob')
      const file = new File([blob], fileName, { type: 'image/png' })
      const nav = navigator as any
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: `"${text}" — ${title}, ${chapterLabel}` })
      } else {
        downloadBlob(blob)
      }
    } catch {
      // usuario cancelo o no soportado: intentar descargar
      const blob = await toBlob()
      if (blob) downloadBlob(blob)
    } finally {
      setBusy(false)
    }
  }

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const download = async () => {
    const blob = await toBlob()
    if (blob) downloadBlob(blob)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`"${text}" — ${title}, ${chapterLabel}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // sin permiso de portapapeles
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={share} disabled={busy}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 transition-colors disabled:opacity-50">
            <Share2 size={16} /> Compartir
          </button>
          <button type="button" onClick={download}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors">
            <Download size={16} /> PNG
          </button>
          <button type="button" onClick={copy}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="mt-3 w-full flex items-center justify-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest">
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  )
}

export default QuoteCard
