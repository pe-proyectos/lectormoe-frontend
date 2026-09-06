import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Send, EyeOff, BarChart3, Plus, Search, BookOpen } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import { uploadFile } from '../../../util/uploadFile'
import { resolveImg, type Post } from './postUtils'

interface Props {
  user: any
  language?: string
  onCreated: (post: Post) => void
  replyTo?: number
  asOrgSlug?: string | null
  placeholder?: string
  compact?: boolean
  autoFocus?: boolean
}

const MAX_IMAGES = 4

const PostComposer: React.FC<Props> = ({ user, language = 'es', onCreated, replyTo, asOrgSlug, placeholder, compact, autoFocus }) => {
  const en = language === 'en'
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [spoiler, setSpoiler] = useState(false)
  const [spoilerWork, setSpoilerWork] = useState<{ id: number; title: string } | null>(null)
  const [spoilerChapter, setSpoilerChapter] = useState('')
  const [workQ, setWorkQ] = useState('')
  const [workResults, setWorkResults] = useState<any[]>([])
  const [attachMode, setAttachMode] = useState(false)
  const [attachedWork, setAttachedWork] = useState<{ id: number; title: string; imageUrl?: string | null } | null>(null)
  const [attachQ, setAttachQ] = useState('')
  const [attachResults, setAttachResults] = useState<any[]>([])
  const [pollMode, setPollMode] = useState(false)
  const [pollOpts, setPollOpts] = useState<string[]>(['', ''])
  const [pollDur, setPollDur] = useState(24)
  const fileRef = useRef<HTMLInputElement>(null)
  const avatar = user?.imageUrl ? resolveImg(user.imageUrl) : null

  useEffect(() => {
    if (!spoiler || spoilerWork || workQ.trim().length < 2) { setWorkResults([]); return }
    const t = setTimeout(async () => {
      try { const d: any = await callAPI(`/api/socials/works/search?q=${encodeURIComponent(workQ.trim())}`); setWorkResults(d || []) } catch { setWorkResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [workQ, spoiler, spoilerWork])

  useEffect(() => {
    if (!attachMode || attachedWork || attachQ.trim().length < 2) { setAttachResults([]); return }
    const t = setTimeout(async () => {
      try { const d: any = await callAPI(`/api/socials/works/search?q=${encodeURIComponent(attachQ.trim())}`); setAttachResults(d || []) } catch { setAttachResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [attachQ, attachMode, attachedWork])

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list).filter((f) => f.type.startsWith('image/'))].slice(0, MAX_IMAGES))
  }

  const submit = async () => {
    if (busy) return
    const text = content.trim()
    const hasPoll = pollMode && pollOpts.filter((o) => o.trim()).length >= 2
    if (!text && files.length === 0 && !hasPoll) return
    setBusy(true)
    try {
      let images: string[] = []
      if (files.length) images = await Promise.all(files.map(async (f) => resolveImg(await uploadFile(f, undefined, 'posts'))))
      const post: any = await callAPI('/api/socials/posts', {
        method: 'POST',
        body: JSON.stringify({ content: text, images, parentId: replyTo ?? null, orgSlug: asOrgSlug ?? null, isSpoiler: spoiler, spoilerOfMangaCustomId: spoiler ? spoilerWork?.id ?? null : null, spoilerChapter: spoiler && spoilerChapter ? Number(spoilerChapter) : null, workMangaCustomId: attachedWork?.id ?? null, poll: pollMode && pollOpts.filter((o) => o.trim()).length >= 2 ? { options: pollOpts.filter((o) => o.trim()), durationHours: pollDur } : undefined }),
      })
      onCreated(post)
      setContent(''); setFiles([]); setSpoiler(false); setSpoilerWork(null); setSpoilerChapter(''); setWorkQ(''); setAttachMode(false); setAttachedWork(null); setAttachQ(''); setPollMode(false); setPollOpts(['', ''])
      if (!replyTo && !compact) toast.success(en ? 'Published' : 'Publicado')
    } catch (e: any) { toast.error(e?.message || 'No se pudo publicar') } finally { setBusy(false) }
  }

  return (
    <div className="flex gap-3 px-4 py-3">
      {avatar ? <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold shrink-0">{(user?.username || '?')[0]?.toUpperCase()}</div>}
      <div className="flex-1 min-w-0">
        {asOrgSlug && <div className="text-[11px] font-bold text-cyan-300 mb-1">{en ? 'Posting as' : 'Publicando como'} @{asOrgSlug}</div>}
        <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 5000))} rows={compact ? 1 : 2}
          autoFocus={autoFocus}
          placeholder={placeholder || (replyTo ? (en ? 'Post your reply' : 'Escribe tu respuesta') : (en ? "What's happening?" : '¿Qué está pasando?'))}
          className="w-full resize-none bg-transparent text-[16px] text-white placeholder-white/35 focus:outline-none" />
        {files.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/10">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label="Quitar" className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white cursor-pointer"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
        {pollMode && (
          <div className="mt-3 space-y-2 rounded-2xl border border-white/10 p-3">
            {pollOpts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={o} onChange={(e) => setPollOpts((p) => p.map((x, j) => (j === i ? e.target.value.slice(0, 60) : x)))} placeholder={`${en ? 'Option' : 'Opción'} ${i + 1}`}
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
                {pollOpts.length > 2 && <button type="button" onClick={() => setPollOpts((p) => p.filter((_, j) => j !== i))} className="text-white/30 hover:text-rose-400 cursor-pointer"><X size={15} /></button>}
              </div>
            ))}
            <div className="flex items-center justify-between">
              {pollOpts.length < 4 ? <button type="button" onClick={() => setPollOpts((p) => [...p, ''])} className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline cursor-pointer"><Plus size={13} /> {en ? 'Add option' : 'Añadir opción'}</button> : <span />}
              <select value={pollDur} onChange={(e) => setPollDur(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white cursor-pointer">
                <option value={1}>1h</option><option value={6}>6h</option><option value={24}>1d</option><option value={72}>3d</option><option value={168}>7d</option>
              </select>
            </div>
          </div>
        )}
        {spoiler && (
          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-400/80">{en ? 'Spoiler shield (optional)' : 'Escudo antspoiler (opcional)'}</p>
            {spoilerWork ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-sm text-white">{spoilerWork.title}<button type="button" onClick={() => { setSpoilerWork(null); setWorkQ('') }} className="text-white/40 hover:text-rose-400 cursor-pointer"><X size={13} /></button></span>
                <input value={spoilerChapter} onChange={(e) => setSpoilerChapter(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={en ? 'Chapter' : 'Capítulo'} inputMode="decimal"
                  className="w-24 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
                <span className="text-[11px] text-white/40">{en ? 'Auto-reveals to readers past this chapter' : 'Se revela solo a quien ya lo leyó'}</span>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                  <Search size={15} className="text-white/40" />
                  <input value={workQ} onChange={(e) => setWorkQ(e.target.value)} placeholder={en ? 'Which work is this about?' : '¿De qué obra es el spoiler?'} className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                </div>
                {workResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl py-1">
                    {workResults.map((w) => (
                      <button key={w.id} type="button" onClick={() => { setSpoilerWork({ id: w.id, title: w.title }); setWorkResults([]) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer text-left">
                        {w.imageUrl && <img src={resolveImg(w.imageUrl)} alt="" className="w-7 h-9 object-cover rounded" />}
                        <span className="text-sm text-white truncate">{w.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {attachMode && (
          <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
            {attachedWork ? (
              <div className="flex items-center gap-2">
                {attachedWork.imageUrl && <img src={resolveImg(attachedWork.imageUrl)} alt="" className="w-8 h-11 object-cover rounded" />}
                <span className="text-sm text-white flex-1 truncate">{attachedWork.title}</span>
                <button type="button" onClick={() => { setAttachedWork(null); setAttachQ('') }} className="text-white/40 hover:text-rose-400 cursor-pointer"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                  <Search size={15} className="text-white/40" />
                  <input value={attachQ} onChange={(e) => setAttachQ(e.target.value)} placeholder={en ? 'Attach a work…' : 'Adjuntar una obra…'} className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                </div>
                {attachResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl py-1">
                    {attachResults.map((w) => (
                      <button key={w.id} type="button" onClick={() => { setAttachedWork({ id: w.id, title: w.title, imageUrl: w.imageUrl }); setAttachResults([]) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer text-left">
                        {w.imageUrl && <img src={resolveImg(w.imageUrl)} alt="" className="w-7 h-9 object-cover rounded" />}
                        <span className="text-sm text-white truncate">{w.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_IMAGES} className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40 cursor-pointer"><ImagePlus size={19} /></button>
            <button type="button" onClick={() => setSpoiler((v) => !v)} title={en ? 'Mark as spoiler' : 'Marcar como spoiler'} className={`p-1.5 rounded-lg cursor-pointer ${spoiler ? 'text-amber-400 bg-amber-500/10' : 'text-white/50 hover:bg-white/5'}`}><EyeOff size={18} /></button>
            {!replyTo && <button type="button" onClick={() => setPollMode((v) => !v)} title={en ? 'Poll' : 'Encuesta'} className={`p-1.5 rounded-lg cursor-pointer ${pollMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/50 hover:bg-white/5'}`}><BarChart3 size={18} /></button>}
            <button type="button" onClick={() => setAttachMode((v) => !v)} title={en ? 'Attach work' : 'Adjuntar obra'} className={`p-1.5 rounded-lg cursor-pointer ${attachMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/50 hover:bg-white/5'}`}><BookOpen size={18} /></button>
          </div>
          <button type="button" onClick={submit} disabled={busy || (!content.trim() && files.length === 0)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 text-sm font-black hover:from-cyan-300 hover:to-cyan-400 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_6px_18px_-6px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition cursor-pointer">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {replyTo ? (en ? 'Reply' : 'Responder') : (en ? 'Post' : 'Publicar')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostComposer
