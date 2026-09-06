import React, { useState } from 'react'
import { Heart, MessageCircle, Trash2, Pin, MoreHorizontal, BadgeCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import PostComments from './PostComments'
import { timeAgo, resolveImg, orgHref, orgAvatar, type Post } from './postUtils'

interface Props {
  post: Post
  user: any
  logged: boolean
  canManage: boolean
  showOrg?: boolean
  language?: string
  onDeleted?: (id: number) => void
  onLogin?: () => void
}

const ImageGrid: React.FC<{ images: string[] }> = ({ images }) => {
  if (!images.length) return null
  const n = images.length
  const cls = n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-2' : 'grid-cols-2'
  return (
    <div className={`mt-3 grid ${cls} gap-1.5 rounded-xl overflow-hidden`}>
      {images.slice(0, 4).map((im, i) => (
        <a key={i} href={resolveImg(im)} target="_blank" rel="noopener noreferrer"
          className={`block overflow-hidden bg-black/30 ${n === 3 && i === 0 ? 'row-span-2' : ''}`}>
          <img src={resolveImg(im)} alt="" loading="lazy" className={`w-full object-cover hover:opacity-95 transition ${n === 1 ? 'max-h-[520px]' : 'h-full aspect-square'}`} />
        </a>
      ))}
    </div>
  )
}

const PostCard: React.FC<Props> = ({ post, user, logged, canManage, showOrg, language = 'es', onDeleted, onLogin }) => {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likesCount)
  const [comments, setComments] = useState(post.commentsCount)
  const [showComments, setShowComments] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pinned, setPinned] = useState(post.pinned)
  const [deleted, setDeleted] = useState(false)
  const en = language === 'en'

  if (deleted) return null

  const toggleLike = async () => {
    if (!logged) { onLogin?.(); return }
    const nextLiked = !liked
    setLiked(nextLiked); setLikes((n) => n + (nextLiked ? 1 : -1))
    try {
      const r: any = await callAPI(`/api/posts/${post.id}/like`, { method: 'POST' })
      setLiked(r.liked); setLikes(r.likesCount)
    } catch { setLiked(!nextLiked); setLikes((n) => n + (nextLiked ? -1 : 1)) }
  }

  const del = async () => {
    setMenuOpen(false)
    if (!confirm(en ? 'Delete this post?' : '¿Eliminar esta publicación?')) return
    setDeleted(true)
    try { await callAPI(`/api/organization-post/${post.id}`, { method: 'DELETE' }); onDeleted?.(post.id) }
    catch { setDeleted(false); toast.error('No se pudo eliminar') }
  }

  const togglePin = async () => {
    setMenuOpen(false)
    const next = !pinned
    setPinned(next)
    try { await callAPI(`/api/organization-post/${post.id}`, { method: 'PATCH', body: JSON.stringify({ pinned: next }) }) }
    catch { setPinned(!next); toast.error('No se pudo actualizar') }
  }

  const author = post.author
  const org = post.org

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        {showOrg && org ? (
          <a href={orgHref(org.slug, org.isNSFW)} className="shrink-0">
            <img src={orgAvatar(org)} alt={org.name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10" />
          </a>
        ) : author?.imageUrl ? (
          <img src={resolveImg(author.imageUrl)} alt={author.username} width={44} height={44} className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold shrink-0">{(author?.username || '?')[0]?.toUpperCase()}</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {showOrg && org ? (
              <>
                <a href={orgHref(org.slug, org.isNSFW)} className="text-sm font-black text-white hover:underline truncate">{org.name}</a>
                <BadgeCheck size={14} className="text-cyan-400 shrink-0" />
                {author && <span className="text-[12px] text-white/45 truncate">· {en ? 'by' : 'por'} @{author.username}</span>}
              </>
            ) : (
              <span className="text-sm font-black text-white truncate">{author?.username || '—'}</span>
            )}
            {pinned && <Pin size={13} className="text-cyan-300 shrink-0" />}
          </div>
          <span className="text-[11px] text-white/40">{timeAgo(post.createdAt, language)}</span>
        </div>

        {canManage && (
          <div className="relative shrink-0">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Opciones"
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 cursor-pointer"><MoreHorizontal size={18} /></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-40 rounded-xl bg-zinc-900 ring-1 ring-white/10 shadow-xl overflow-hidden py-1">
                  {canManage && (
                    <button type="button" onClick={togglePin} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 cursor-pointer">
                      <Pin size={15} /> {pinned ? (en ? 'Unpin' : 'Desfijar') : (en ? 'Pin' : 'Fijar')}
                    </button>
                  )}
                  <button type="button" onClick={del} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 cursor-pointer">
                    <Trash2 size={15} /> {en ? 'Delete' : 'Eliminar'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {post.content && <p className="mt-3 text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap break-words">{post.content}</p>}
      <ImageGrid images={post.images} />

      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer transition ${liked ? 'text-rose-400' : 'text-white/55 hover:text-white'}`}>
          <Heart size={18} className={liked ? 'fill-rose-400' : ''} /> {likes > 0 ? likes : ''}
        </button>
        <button type="button" onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer transition ${showComments ? 'text-cyan-300' : 'text-white/55 hover:text-white'}`}>
          <MessageCircle size={18} /> {comments > 0 ? comments : ''}
        </button>
      </div>

      {showComments && (
        <PostComments postId={post.id} logged={logged} user={user} canModerate={canManage}
          language={language} onCountChange={(d) => setComments((n) => Math.max(0, n + d))} onLogin={onLogin} />
      )}
    </article>
  )
}

export default PostCard
