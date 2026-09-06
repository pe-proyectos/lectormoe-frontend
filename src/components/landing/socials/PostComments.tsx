import React, { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import { timeAgo, resolveImg, type PostComment } from './postUtils'

interface Props {
  postId: number
  logged: boolean
  user: any
  canModerate: boolean
  language?: string
  onCountChange?: (delta: number) => void
  onLogin?: () => void
}

const Avatar: React.FC<{ url?: string | null; name?: string | null; size?: number }> = ({ url, name, size = 30 }) => (
  url ? (
    <img src={resolveImg(url)} alt={name || ''} width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  )
)

const PostComments: React.FC<Props> = ({ postId, logged, user, canModerate, language = 'es', onCountChange, onLogin }) => {
  const [items, setItems] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data: any = await callAPI(`/api/posts/${postId}/comments`)
        if (alive) setItems(Array.isArray(data) ? data : [])
      } catch { /* noop */ } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [postId])

  const submit = async () => {
    if (!logged) { onLogin?.(); return }
    const c = text.trim()
    if (!c || sending) return
    setSending(true)
    try {
      const created: any = await callAPI(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ comment: c }) })
      setItems((prev) => [...prev, created])
      setText('')
      onCountChange?.(1)
    } catch (e: any) { toast.error(e?.message || 'No se pudo comentar') } finally { setSending(false) }
  }

  const del = async (id: number) => {
    const prev = items
    setItems((it) => it.filter((c) => c.id !== id))
    onCountChange?.(-1)
    try { await callAPI(`/api/posts/comments/${id}`, { method: 'DELETE' }) }
    catch { setItems(prev); onCountChange?.(1); toast.error('No se pudo eliminar') }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      {logged && (
        <div className="flex items-start gap-2 mb-3">
          <Avatar url={user?.imageUrl} name={user?.username} />
          <div className="flex-1 flex items-end gap-2">
            <textarea ref={taRef} value={text} onChange={(e) => setText(e.target.value.slice(0, 600))}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
              placeholder={language === 'en' ? 'Write a comment…' : 'Escribe un comentario…'} rows={1}
              className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
            <button type="button" onClick={submit} disabled={sending || !text.trim()} aria-label="Enviar"
              className="p-2 rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:opacity-40 cursor-pointer shrink-0">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4 text-white/40"><Loader2 size={18} className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-xs text-white/35 py-3">{language === 'en' ? 'No comments yet.' : 'Aún no hay comentarios.'}</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group">
              <Avatar url={c.user?.imageUrl} name={c.user?.username} />
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl bg-white/[0.04] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-white/90 truncate">{c.user?.username || '—'}</span>
                    <span className="text-[10px] text-white/35">{timeAgo(c.createdAt, language)}</span>
                  </div>
                  <p className="text-[13px] text-white/80 whitespace-pre-wrap break-words mt-0.5">{c.comment}</p>
                </div>
                {c.imageUrl ? <img src={resolveImg(c.imageUrl)} alt="" className="mt-1.5 max-h-48 rounded-lg" /> : null}
              </div>
              {(canModerate || c.userId === user?.id) && (
                <button type="button" onClick={() => del(c.id)} aria-label="Eliminar"
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition cursor-pointer shrink-0"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PostComments
