import React, { useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Send, Pin } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import { uploadFile } from '../../../util/uploadFile'
import { resolveImg, type Post } from './postUtils'

interface Props {
  user: any
  language?: string
  onCreated: (post: Post) => void
}

const MAX_IMAGES = 4

const PostComposer: React.FC<Props> = ({ user, language = 'es', onCreated }) => {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [pinned, setPinned] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const en = language === 'en'

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...imgs].slice(0, MAX_IMAGES))
  }

  const submit = async () => {
    if (busy) return
    const text = content.trim()
    if (!text && files.length === 0) return
    setBusy(true)
    try {
      let images: string[] = []
      if (files.length) {
        images = await Promise.all(files.map(async (f) => {
          const key = await uploadFile(f, undefined, 'posts')
          return resolveImg(key)
        }))
      }
      const post: any = await callAPI('/api/organization-post', {
        method: 'POST',
        body: JSON.stringify({ content: text, images, pinned }),
      })
      onCreated(post)
      setContent(''); setFiles([]); setPinned(false)
      toast.success(en ? 'Published' : 'Publicado')
    } catch (e: any) { toast.error(e?.message || 'No se pudo publicar') } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 4000))}
        placeholder={en ? 'Share an update with your community…' : 'Comparte un aviso o avance con tu comunidad…'}
        rows={3}
        className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />

      {files.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/10">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label="Quitar"
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_IMAGES}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold disabled:opacity-40 cursor-pointer">
            <ImagePlus size={16} /> {en ? 'Image' : 'Imagen'}
          </button>
          <button type="button" onClick={() => setPinned((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${pinned ? 'text-cyan-300 bg-cyan-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
            <Pin size={15} /> {en ? 'Pin' : 'Fijar'}
          </button>
        </div>
        <button type="button" onClick={submit} disabled={busy || (!content.trim() && files.length === 0)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 disabled:opacity-40 cursor-pointer">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {en ? 'Publish' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}

export default PostComposer
