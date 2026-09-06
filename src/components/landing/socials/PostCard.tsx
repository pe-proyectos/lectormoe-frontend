import React, { useState } from 'react'
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Trash2, MoreHorizontal, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import { timeAgo, resolveImg, authorHref, authorAvatar, tokenizeContent, type Post } from './postUtils'

interface Props {
  post: Post
  user: any
  logged: boolean
  language?: string
  onDeleted?: (id: number) => void
  onLogin?: () => void
  asThreadRoot?: boolean
}

function AuthorAvatar({ post, size = 44 }: { post: Post; size?: number }) {
  const a = post.author
  const url = authorAvatar(a)
  const cls = a.kind === 'scan' ? 'rounded-xl' : 'rounded-full'
  return url ? (
    <img src={url} alt={a.name} width={size} height={size} className={`${cls} object-cover ring-1 ring-white/10 shrink-0`} style={{ width: size, height: size }} />
  ) : (
    <div className={`${cls} bg-white/10 flex items-center justify-center text-white/70 font-bold shrink-0`} style={{ width: size, height: size, fontSize: size * 0.42 }}>{(a.name || '?')[0]?.toUpperCase()}</div>
  )
}

function Content({ text }: { text: string }) {
  if (!text) return null
  return (
    <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap break-words">
      {tokenizeContent(text).map((tk, i) => {
        if (tk.type === 'tag') return <a key={i} href={`/socials/tag/${tk.value.slice(1).toLowerCase()}`} className="text-cyan-400 hover:underline">{tk.value}</a>
        if (tk.type === 'mention') return <a key={i} href={`/profile/${tk.value.slice(1)}`} className="text-cyan-400 hover:underline">{tk.value}</a>
        if (tk.type === 'url') return <a key={i} href={tk.value} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">{tk.value}</a>
        return <React.Fragment key={i}>{tk.value}</React.Fragment>
      })}
    </p>
  )
}

function Carousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return null
  if (images.length === 1) {
    return (
      <a href={resolveImg(images[0])} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-2xl overflow-hidden bg-black/30 ring-1 ring-white/10">
        <img src={resolveImg(images[0])} alt="" loading="lazy" className="w-full max-h-[560px] object-contain" />
      </a>
    )
  }
  return (
    <div className="mt-3 relative rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10">
      <img src={resolveImg(images[idx])} alt="" loading="lazy" className="w-full aspect-square object-cover" />
      <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white disabled:opacity-0 hover:bg-black/80 cursor-pointer"><ChevronLeft size={18} /></button>
      <button type="button" onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))} disabled={idx === images.length - 1}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white disabled:opacity-0 hover:bg-black/80 cursor-pointer"><ChevronRight size={18} /></button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/40'}`} />)}
      </div>
      <div className="absolute top-2 right-2 text-[11px] font-bold text-white bg-black/60 rounded-full px-2 py-0.5">{idx + 1}/{images.length}</div>
    </div>
  )
}

function QuotedPost({ post }: { post: Post }) {
  return (
    <a href={`/socials/${post.id}`} className="mt-3 block rounded-2xl border border-white/10 hover:border-white/20 p-3 transition-colors">
      <div className="flex items-center gap-2">
        <AuthorAvatar post={post} size={22} />
        <span className="text-[13px] font-bold text-white/90 truncate">{post.author.name}</span>
        {post.author.kind === 'scan' && <BadgeCheck size={13} className="text-cyan-400 shrink-0" />}
        <span className="text-[11px] text-white/35">· {timeAgo(post.createdAt)}</span>
      </div>
      {post.content && <p className="mt-1 text-[13px] text-white/75 line-clamp-4 whitespace-pre-wrap break-words">{post.content}</p>}
      {post.images.length > 0 && <img src={resolveImg(post.images[0])} alt="" className="mt-2 max-h-52 rounded-lg object-cover" />}
    </a>
  )
}

const PostCard: React.FC<Props> = ({ post, user, logged, language = 'es', onDeleted, onLogin, asThreadRoot }) => {
  const en = language === 'en'
  // Repost puro (sin texto): mostrar como "reposteó" + el post citado como principal.
  const isPureRepost = !post.content && !!post.repostOf && post.images.length === 0
  const main = isPureRepost ? (post.repostOf as Post) : post

  const [liked, setLiked] = useState(main.liked)
  const [likes, setLikes] = useState(main.likesCount)
  const [reposted, setReposted] = useState(main.reposted)
  const [reposts, setReposts] = useState(main.repostCount)
  const [saved, setSaved] = useState(main.saved)
  const [menuOpen, setMenuOpen] = useState(false)
  const [gone, setGone] = useState(false)
  if (gone) return null

  const canDelete = logged && (
    (post.author.kind === 'user' && post.author.slug && post.author.slug === user?.slug) ||
    (post.author.kind === 'scan' && !!user?.permissions?.some((p: any) => p.canSeeAdminPanel))
  )

  const guard = () => { if (!logged) { onLogin?.(); return false } return true }

  const toggleLike = async () => {
    if (!guard()) return
    const n = !liked; setLiked(n); setLikes((x) => x + (n ? 1 : -1))
    try { const r: any = await callAPI(`/api/posts/${main.id}/like`, { method: 'POST' }); setLiked(r.liked); setLikes(r.likesCount) }
    catch { setLiked(!n); setLikes((x) => x + (n ? -1 : 1)) }
  }
  const toggleRepost = async () => {
    if (!guard()) return
    const n = !reposted; setReposted(n); setReposts((x) => x + (n ? 1 : -1))
    try { const r: any = await callAPI(`/api/posts/${main.id}/repost`, { method: 'POST' }); setReposted(r.reposted); setReposts(r.repostCount) }
    catch { setReposted(!n); setReposts((x) => x + (n ? -1 : 1)) }
  }
  const toggleSave = async () => {
    if (!guard()) return
    const n = !saved; setSaved(n)
    try { const r: any = await callAPI(`/api/posts/${main.id}/save`, { method: 'POST' }); setSaved(r.saved) }
    catch { setSaved(!n) }
  }
  const share = async () => {
    const url = `${window.location.origin}/socials/${main.id}`
    try {
      if ((navigator as any).share) await (navigator as any).share({ url })
      else { await navigator.clipboard.writeText(url); toast.success(en ? 'Link copied' : 'Enlace copiado') }
    } catch { /* cancelado */ }
  }
  const del = async () => {
    setMenuOpen(false)
    if (!confirm(en ? 'Delete this post?' : '¿Eliminar esta publicación?')) return
    setGone(true)
    try { await callAPI(`/api/organization-post/${post.id}`, { method: 'DELETE' }); onDeleted?.(post.id) }
    catch { setGone(false); toast.error('No se pudo eliminar') }
  }
  const goThread = () => { window.location.href = `/socials/${main.id}` }

  const a = main.author
  const ActionBtn = ({ icon, count, active, color, onClick, label }: any) => (
    <button type="button" onClick={onClick} aria-label={label}
      className={`flex items-center gap-1.5 text-[13px] font-bold cursor-pointer transition ${active ? color : 'text-white/50 hover:text-white'}`}>
      {icon} {count > 0 ? count : ''}
    </button>
  )

  return (
    <article className={`border-b border-white/10 px-4 py-3.5 ${asThreadRoot ? '' : 'hover:bg-white/[0.015]'} transition-colors`}>
      {isPureRepost && (
        <div className="flex items-center gap-2 text-[12px] text-white/40 font-bold mb-1.5 pl-8">
          <Repeat2 size={14} /> {post.author.name} {en ? 'reposted' : 'reposteó'}
        </div>
      )}
      <div className="flex gap-3">
        <a href={authorHref(a)} className="shrink-0"><AuthorAvatar post={main} /></a>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <a href={authorHref(a)} className="text-[15px] font-black text-white hover:underline truncate">{a.name}</a>
            {a.kind === 'scan' && <BadgeCheck size={15} className="text-cyan-400 shrink-0" />}
            {a.kind === 'scan' && a.byUser && <span className="text-[12px] text-white/40 truncate">· {en ? 'by' : 'por'} @{a.byUser}</span>}
            <span className="text-[13px] text-white/35">· {timeAgo(main.createdAt, language)}</span>
            {main.pinned && <span className="text-[10px] text-cyan-300 font-bold uppercase ml-1">{en ? 'Pinned' : 'Fijado'}</span>}
            {canDelete && (
              <div className="relative ml-auto">
                <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Opciones" className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 cursor-pointer"><MoreHorizontal size={17} /></button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-36 rounded-xl bg-zinc-900 ring-1 ring-white/10 shadow-xl py-1">
                      <button type="button" onClick={del} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 cursor-pointer"><Trash2 size={15} /> {en ? 'Delete' : 'Eliminar'}</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-0.5" onClick={(e) => { if ((e.target as HTMLElement).closest('a,button')) return; if (!asThreadRoot) goThread() }} style={{ cursor: asThreadRoot ? 'default' : 'pointer' }}>
            <Content text={main.content} />
            <Carousel images={main.images} />
            {!isPureRepost && main.repostOf && <QuotedPost post={main.repostOf} />}
          </div>

          <div className="mt-3 flex items-center gap-6 max-w-md">
            <ActionBtn icon={<MessageCircle size={17} />} count={main.commentsCount} active={false} onClick={goThread} label="Responder" />
            <ActionBtn icon={<Repeat2 size={17} />} count={reposts} active={reposted} color="text-emerald-400" onClick={toggleRepost} label="Repostear" />
            <ActionBtn icon={<Heart size={17} className={liked ? 'fill-rose-400' : ''} />} count={likes} active={liked} color="text-rose-400" onClick={toggleLike} label="Me gusta" />
            <button type="button" onClick={toggleSave} aria-label="Guardar" className={`cursor-pointer transition ${saved ? 'text-cyan-400' : 'text-white/50 hover:text-white'}`}><Bookmark size={17} className={saved ? 'fill-cyan-400' : ''} /></button>
            <button type="button" onClick={share} aria-label="Compartir" className="text-white/50 hover:text-white cursor-pointer transition"><Share size={16} /></button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PostCard
