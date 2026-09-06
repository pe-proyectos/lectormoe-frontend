import React, { useState } from 'react'
import { Heart, MessageCircle, Repeat2, Bookmark, Share, Trash2, MoreHorizontal, BadgeCheck, ChevronLeft, ChevronRight, Flag, Ban, Link2, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import PostImages from './PostImages'
import PostPoll from './PostPoll'
import { timeAgo, resolveImg, authorHref, authorAvatar, orgHref, tokenizeContent, type Post } from './postUtils'

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
        if (tk.type === 'mention') return <a key={i} href={`/profile/${tk.value.slice(1).toLowerCase()}`} className="text-cyan-400 hover:underline">{tk.value}</a>
        if (tk.type === 'url') return <a key={i} href={tk.value} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">{tk.value}</a>
        return <React.Fragment key={i}>{tk.value}</React.Fragment>
      })}
    </p>
  )
}

function QuotedPost({ post }: { post: Post }) {
  return (
    <a href={`/socials/${post.id}`} className="mt-3 block rounded-2xl border border-white/10 hover:border-white/20 p-3 transition-colors">
      <div className="flex items-center gap-2">
        <AuthorAvatar post={post} size={22} />
        <span className="text-[13px] font-bold text-white/90 truncate">{post.author.name}</span>
        {post.author.kind === 'scan' && <BadgeCheck size={13} className="text-amber-400 shrink-0" />}
        <span className="text-[11px] text-white/35">· {timeAgo(post.createdAt)}</span>
      </div>
      {post.content && <p className="mt-1 text-[13px] text-white/75 line-clamp-4 whitespace-pre-wrap break-words">{post.content}</p>}
      {post.images.length > 0 && <img src={resolveImg(post.images[0])} alt="" className="mt-2 max-h-52 rounded-lg object-cover" />}
    </a>
  )
}

function WorkCard({ work, en }: { work: NonNullable<Post['work']>; en: boolean }) {
  const href = work.orgSlug && work.mangaSlug ? `${orgHref(work.orgSlug, work.isNSFW)}/manga/${work.mangaSlug}` : null
  const Wrap: any = href ? 'a' : 'div'
  return (
    <Wrap href={href || undefined} onClick={(e: any) => e.stopPropagation()} className={`mt-3 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.02] p-2.5 transition-colors group/w ${href ? 'hover:border-teal-400/40' : 'opacity-80'}`}>
      {work.imageUrl ? <img src={resolveImg(work.imageUrl)} alt="" className="w-12 h-16 object-cover rounded-lg shrink-0" /> : <div className="w-12 h-16 rounded-lg bg-white/10 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-wider text-cyan-400/80">{en ? 'Work' : 'Obra'}</p>
        <p className="text-sm font-bold text-white truncate">{work.title}</p>
      </div>
      {href && <span className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 group-hover/w:bg-teal-500 group-hover/w:text-zinc-950 text-white text-xs font-black transition-colors">{en ? 'Read' : 'Leer'}</span>}
    </Wrap>
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
  const [revealed, setRevealed] = useState(false)
  const [reportMode, setReportMode] = useState(false)
  const [burst, setBurst] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  if (gone) return null

  const canDelete = logged && (
    (post.author.kind === 'user' && post.author.slug && post.author.slug === user?.slug) ||
    (post.author.kind === 'scan' && !!user?.permissions?.some((p: any) => p.canSeeAdminPanel))
  )

  const guard = () => { if (!logged) { onLogin?.(); return false } return true }

  const toggleLike = async () => {
    if (!guard()) return
    const n = !liked; setLiked(n); setLikes((x) => x + (n ? 1 : -1))
    if (n) { setBurst(true); setTimeout(() => setBurst(false), 550) }
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
    if (!confirmDel) { setConfirmDel(true); return }
    setMenuOpen(false); setConfirmDel(false)
    setGone(true)
    try { await callAPI(`/api/organization-post/${post.id}`, { method: 'DELETE' }); onDeleted?.(post.id) }
    catch { setGone(false); toast.error('No se pudo eliminar') }
  }
  const goThread = () => { window.location.href = `/socials/${main.id}` }
  const report = async (category: string) => {
    setMenuOpen(false); setReportMode(false)
    try { await callAPI(`/api/posts/${main.id}/report`, { method: 'POST', body: JSON.stringify({ category }) }); toast.success(en ? 'Report sent' : 'Reporte enviado') }
    catch (e: any) { toast.error(e?.message || 'No se pudo') }
  }
  const copyLink = async () => { setMenuOpen(false); try { await navigator.clipboard.writeText(`${window.location.origin}/socials/${main.id}`); toast.success(en ? 'Link copied' : 'Enlace copiado') } catch {} }
  const blockAuthor = async () => {
    setMenuOpen(false)
    if (a.kind !== 'user' || !a.slug) return
    try { await callAPI(`/api/users/${a.slug}/block`, { method: 'POST' }); toast.success(en ? `Bloqueaste a @${a.slug}` : `Bloqueaste a @${a.slug}`); setGone(true) } catch { toast.error('No se pudo') }
  }

  const a = main.author
  const ActionBtn = ({ icon, count, active, color, halo, onClick, label, children }: any) => (
    <button type="button" onClick={onClick} aria-label={label}
      className={`group/act flex items-center gap-1 text-[13px] font-medium cursor-pointer transition ${active ? color : 'text-white/50 hover:text-white'}`}>
      <span className={`relative flex items-center justify-center p-2 -m-2 rounded-full transition ${halo}`}>{icon}{children}</span>
      <span className="tabular-nums min-w-[12px] text-left">{count > 0 ? count : ''}</span>
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
            {a.kind === 'scan' && <BadgeCheck size={15} className="text-amber-400 shrink-0" />}
            {a.kind === 'scan' && a.byUser && <span className="text-[12px] text-white/40 truncate">· {en ? 'by' : 'por'} @{a.byUser}</span>}
            <span className="text-[13px] text-white/35">· {timeAgo(main.createdAt, language)}</span>
            {main.pinned && <span className="text-[10px] text-cyan-300 font-bold uppercase ml-1">{en ? 'Pinned' : 'Fijado'}</span>}
            <div className="relative ml-auto">
              <button type="button" onClick={() => { setMenuOpen((v) => !v); setReportMode(false) }} aria-label="Opciones" className="p-1.5 -m-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 cursor-pointer"><MoreHorizontal size={17} /></button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setReportMode(false); setConfirmDel(false) }} />
                  <div className="absolute right-0 top-9 z-20 w-52 rounded-2xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl py-1.5">
                    {reportMode ? (
                      <>
                        <div className="px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/40">{en ? 'Report reason' : 'Motivo del reporte'}</div>
                        {([['spam','Spam'],['harassment',en?'Harassment':'Acoso'],['nsfw_unmarked',en?'NSFW not marked':'NSFW sin marcar'],['spoiler_unmarked',en?'Unmarked spoiler':'Spoiler sin marcar'],['other',en?'Other':'Otro']] as [string,string][]).map(([c,l]) => (
                          <button key={c} type="button" onClick={() => report(c)} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 cursor-pointer">{l}</button>
                        ))}
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={copyLink} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 cursor-pointer"><Link2 size={15} /> {en ? 'Copy link' : 'Copiar enlace'}</button>
                        {logged && <button type="button" onClick={() => setReportMode(true)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 cursor-pointer"><Flag size={15} /> {en ? 'Report' : 'Reportar'}</button>}
                        {logged && a.kind === 'user' && a.slug && a.slug !== user?.slug && <button type="button" onClick={blockAuthor} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 cursor-pointer"><Ban size={15} /> {en ? 'Block' : 'Bloquear'} @{a.slug}</button>}
                        {canDelete && <div className="my-1 h-px bg-white/10" />}
                        {canDelete && <button type="button" onClick={del} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${confirmDel ? 'text-white bg-rose-500/90 hover:bg-rose-500' : 'text-rose-400 hover:bg-white/5'}`}><Trash2 size={15} /> {confirmDel ? (en ? 'Confirm delete' : 'Confirmar eliminar') : (en ? 'Delete' : 'Eliminar')}</button>}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-0.5" role={asThreadRoot ? undefined : 'link'} tabIndex={asThreadRoot ? undefined : 0}
            onKeyDown={(e) => { if (!asThreadRoot && (e.key === 'Enter')) goThread() }}
            onClick={(e) => { if ((e.target as HTMLElement).closest('a,button')) return; if (!asThreadRoot) goThread() }} style={{ cursor: asThreadRoot ? 'default' : 'pointer' }}>
            {main.isSpoiler && !revealed && !main.spoilerSafe ? (
              <div className="relative mt-1 rounded-2xl overflow-hidden">
                <div className="pointer-events-none blur-md select-none opacity-60"><Content text={main.content} /><PostImages images={main.images} /></div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setRevealed(true) }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/50 backdrop-blur-md cursor-pointer">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/90 ring-1 ring-white/15 text-sm font-bold text-white"><EyeOff size={15} /> {en ? 'Spoiler — tap to reveal' : 'Spoiler — toca para mostrar'}</span>
                  {main.spoilerWork?.title && <span className="text-[11px] text-white/60">{main.spoilerWork.title}{main.spoilerWork.chapter != null ? ` · ${en ? 'ch.' : 'cap.'} ${main.spoilerWork.chapter}` : ''}</span>}
                </button>
              </div>
            ) : (
              <>
                <Content text={main.content} />
                <PostImages images={main.images} />
                {main.work && <WorkCard work={main.work} en={en} />}
                {main.poll && <PostPoll poll={main.poll} logged={logged} language={language} onLogin={onLogin} />}
              </>
            )}
            {!isPureRepost && main.repostOf && <QuotedPost post={main.repostOf} />}
          </div>

          <div className="mt-2 flex items-center justify-between max-w-[340px]">
            <ActionBtn icon={<MessageCircle size={18} />} count={main.commentsCount} active={false} halo="group-hover/act:bg-cyan-400/10 group-hover/act:text-cyan-400" onClick={goThread} label="Responder" />
            <ActionBtn icon={<Repeat2 size={18} />} count={reposts} active={reposted} color="text-emerald-400" halo="group-hover/act:bg-emerald-400/10 group-hover/act:text-emerald-400" onClick={toggleRepost} label="Repostear" />
            <ActionBtn icon={<Heart size={18} className={`transition-transform ${liked ? 'fill-amber-400' : ''} ${burst ? 'scale-125' : 'scale-100'}`} />} count={likes} active={liked} color="text-amber-400" halo="group-hover/act:bg-amber-400/10 group-hover/act:text-amber-400" onClick={toggleLike} label="Me gusta">
              {burst && <><span className="absolute inset-0 rounded-full ring-2 ring-amber-400/50 animate-ping" /><span className="absolute inset-0 rounded-full ring-2 ring-amber-400/30 animate-ping" style={{ animationDelay: '150ms' }} /></>}
            </ActionBtn>
            <button type="button" onClick={toggleSave} aria-label="Guardar" className={`p-2 -m-2 rounded-full cursor-pointer transition hover:bg-cyan-400/10 ${saved ? 'text-cyan-400' : 'text-white/50 hover:text-cyan-400'}`}><Bookmark size={18} className={saved ? 'fill-cyan-400' : ''} /></button>
            <button type="button" onClick={share} aria-label="Compartir" className="p-2 -m-2 rounded-full text-white/50 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer transition"><Share size={17} /></button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PostCard
