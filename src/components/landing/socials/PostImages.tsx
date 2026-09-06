import React, { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { resolveImg } from './postUtils'

// Grid inteligente de 1-4 imágenes + lightbox propio (teclado, flechas, swipe-down).
function Lightbox({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [idx, setIdx] = useState(start)
  const [drag, setDrag] = useState(0)
  const startY = React.useRef<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1))
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
      onPointerDown={(e) => { startY.current = e.clientY }}
      onPointerMove={(e) => { if (startY.current != null) setDrag(e.clientY - startY.current) }}
      onPointerUp={() => { if (Math.abs(drag) > 120) onClose(); setDrag(0); startY.current = null }}>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer z-10"><X size={22} /></button>
      {images.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-sm font-bold text-white/80 bg-black/50 rounded-full px-3 py-1 tabular-nums">{idx + 1} / {images.length}</div>
      )}
      {idx > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); setIdx(idx - 1) }} aria-label="Anterior" className="absolute left-3 md:left-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer z-10"><ChevronLeft size={26} /></button>}
      {idx < images.length - 1 && <button type="button" onClick={(e) => { e.stopPropagation(); setIdx(idx + 1) }} aria-label="Siguiente" className="absolute right-3 md:right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer z-10"><ChevronRight size={26} /></button>}
      <img src={resolveImg(images[idx])} alt="" onClick={(e) => e.stopPropagation()}
        className="max-w-[94vw] max-h-[90vh] object-contain rounded-lg select-none"
        style={{ transform: `translateY(${drag}px)`, opacity: 1 - Math.min(0.6, Math.abs(drag) / 400), transition: startY.current == null ? 'transform 200ms, opacity 200ms' : 'none' }} />
    </div>
  )
}

const Cell: React.FC<{ src: string; className?: string; onOpen: () => void }> = ({ src, className, onOpen }) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen() }} className={`relative overflow-hidden bg-zinc-900 cursor-zoom-in group ${className || ''}`}>
      <img src={resolveImg(src)} alt="" loading="lazy" onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition duration-500 group-hover:scale-[1.02] ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  )
}

const PostImages: React.FC<{ images: string[] }> = ({ images }) => {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(0)
  if (!images.length) return null
  const openAt = (i: number) => { setStart(i); setOpen(true) }
  const n = images.length

  let grid: React.ReactNode
  if (n === 1) {
    grid = (
      <button type="button" onClick={(e) => { e.stopPropagation(); openAt(0) }} className="block w-full cursor-zoom-in rounded-2xl overflow-hidden ring-1 ring-white/[0.06] bg-zinc-900">
        <img src={resolveImg(images[0])} alt="" loading="lazy" className="w-full max-h-[540px] object-contain" />
      </button>
    )
  } else if (n === 2) {
    grid = <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">{images.map((im, i) => <Cell key={i} src={im} className="aspect-[4/5]" onOpen={() => openAt(i)} />)}</div>
  } else if (n === 3) {
    grid = (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden ring-1 ring-white/[0.06] h-[380px]">
        <Cell src={images[0]} className="row-span-2 h-full" onOpen={() => openAt(0)} />
        <Cell src={images[1]} className="h-full" onOpen={() => openAt(1)} />
        <Cell src={images[2]} className="h-full" onOpen={() => openAt(2)} />
      </div>
    )
  } else {
    grid = <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">{images.slice(0, 4).map((im, i) => <Cell key={i} src={im} className="aspect-video" onOpen={() => openAt(i)} />)}</div>
  }

  return (
    <div className="mt-3">
      {grid}
      {open && <Lightbox images={images} start={start} onClose={() => setOpen(false)} />}
    </div>
  )
}

export default PostImages
