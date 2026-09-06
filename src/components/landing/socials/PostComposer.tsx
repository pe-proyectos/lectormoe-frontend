import React, { useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Send, EyeOff } from 'lucide-react'
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
  const fileRef = useRef<HTMLInputElement>(null)
  const avatar = user?.imageUrl ? resolveImg(user.imageUrl) : null

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list).filter((f) => f.type.startsWith('image/'))].slice(0, MAX_IMAGES))
  }

  const submit = async () => {
    if (busy) return
    const text = content.trim()
    if (!text && files.length === 0) return
    setBusy(true)
    try {
      let images: string[] = []
      if (files.length) images = await Promise.all(files.map(async (f) => resolveImg(await uploadFile(f, undefined, 'posts'))))
      const post: any = await callAPI('/api/socials/posts', {
        method: 'POST',
        body: JSON.stringify({ content: text, images, parentId: replyTo ?? null, orgSlug: asOrgSlug ?? null, isSpoiler: spoiler }),
      })
      onCreated(post)
      setContent(''); setFiles([]); setSpoiler(false)
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
        <div className="mt-2 flex items-center justify-between">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_IMAGES} className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40 cursor-pointer"><ImagePlus size={19} /></button>
            <button type="button" onClick={() => setSpoiler((v) => !v)} title={en ? 'Mark as spoiler' : 'Marcar como spoiler'} className={`p-1.5 rounded-lg cursor-pointer ${spoiler ? 'text-amber-400 bg-amber-500/10' : 'text-white/50 hover:bg-white/5'}`}><EyeOff size={18} /></button>
          </div>
          <button type="button" onClick={submit} disabled={busy || (!content.trim() && files.length === 0)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 disabled:opacity-40 cursor-pointer">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {replyTo ? (en ? 'Reply' : 'Responder') : (en ? 'Post' : 'Publicar')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostComposer
