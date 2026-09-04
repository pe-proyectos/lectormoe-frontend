import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, GripVertical, Trash2, Quote, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react'
import { DndContext, type DragEndEvent, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { callAPI } from '../../util/callApi'
import { toast } from 'react-toastify'

// Panel lateral (desktop) con las frases guardadas del usuario: reordenar con
// drag, eliminar, alternar lista publica/privada y saltar al perfil.

export interface SavedQuote {
  id: number
  text: string
  note?: string | null
  mangaTitle: string
  chapterNumber: number
  displayNumber?: number | null
}

interface Props {
  open: boolean
  onClose: () => void
  userId?: number | null
  userSlug?: string | null
  publicList?: boolean
  accent?: string
  t: (k: string) => string
  refreshKey?: number
}

const Row: React.FC<{ q: SavedQuote; accent: string; onDelete: (id: number) => void }> = ({ q, accent, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 40 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}
      className="group relative flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/20 transition-colors">
      <button type="button" {...attributes} {...listeners} aria-label="Reordenar"
        className="mt-0.5 text-white/25 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-white/85 line-clamp-3" style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 8 }}>
          {q.text}
        </p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 truncate">
          {q.mangaTitle} · Cap. {q.displayNumber ?? q.chapterNumber}
        </p>
        {q.note?.trim() ? <p className="mt-1 text-[11px] italic text-white/45 line-clamp-1">“{q.note.trim()}”</p> : null}
      </div>
      <button type="button" onClick={() => onDelete(q.id)} aria-label="Eliminar"
        className="self-start text-white/25 hover:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

const QuotesSidePanel: React.FC<Props> = ({ open, onClose, userId, userSlug, publicList, accent = '#22d3ee', t, refreshKey }) => {
  const [items, setItems] = useState<SavedQuote[]>([])
  const [limit, setLimit] = useState(5)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isPublic, setIsPublic] = useState(!!publicList)
  const [togglingPub, setTogglingPub] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = async () => {
    setLoading(true)
    try {
      const data: any = await callAPI('/api/saved-quotes')
      setItems(data?.items || [])
      if (typeof data?.limit === 'number') setLimit(data.limit)
      setLoaded(true)
    } catch { /* noop */ } finally { setLoading(false) }
  }

  useEffect(() => { if (open) load() }, [open, refreshKey])
  useEffect(() => { setIsPublic(!!publicList) }, [publicList])

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    try {
      await callAPI('/api/saved-quotes/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((i) => i.id) }) })
    } catch { toast.error('No se pudo reordenar'); load() }
  }

  const remove = async (id: number) => {
    const prev = items
    setItems((it) => it.filter((i) => i.id !== id))
    try { await callAPI(`/api/saved-quotes/${id}`, { method: 'DELETE' }) }
    catch { toast.error('No se pudo eliminar'); setItems(prev) }
  }

  const togglePublic = async () => {
    if (!userId || togglingPub) return
    const next = !isPublic
    setIsPublic(next); setTogglingPub(true)
    try { await callAPI(`/api/user/${userId}`, { method: 'PATCH', body: JSON.stringify({ savedQuotesPublic: next }) }) }
    catch { setIsPublic(!next); toast.error('No se pudo actualizar') } finally { setTogglingPub(false) }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className={`fixed inset-0 z-[75] bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`fixed top-0 right-0 z-[76] h-full w-[360px] max-w-[90vw] bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog" aria-label={t('reader_quotes_panel_title')}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Quote size={16} style={{ color: accent }} />
            <h2 className="text-sm font-black text-white">{t('reader_quotes_panel_title')}</h2>
            <span className="text-[11px] font-bold text-white/40">{items.length}/{limit}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <button type="button" onClick={togglePublic} disabled={!userId || togglingPub}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white transition-colors disabled:opacity-50">
            {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
            {isPublic ? t('reader_quotes_public') : t('reader_quotes_private')}
          </button>
          {userSlug ? (
            <a href={`/profile/${userSlug}`} className="flex items-center gap-1.5 text-[11px] font-bold hover:underline" style={{ color: accent }}>
              {t('reader_quotes_view_profile')} <ExternalLink size={12} />
            </a>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading && !loaded ? (
            <div className="flex items-center justify-center py-10 text-white/40"><Loader2 size={20} className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
              <Quote size={28} className="mb-2 opacity-40" />
              <p className="text-xs font-semibold">{t('reader_quotes_empty')}</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((q) => <Row key={q.id} q={q} accent={accent} onDelete={remove} />)}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </aside>
    </>,
    document.body
  )
}

export default QuotesSidePanel
