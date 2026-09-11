import React, { useEffect, useState } from 'react'
import { ExternalLink, MessageCircle, Users, Loader2 } from 'lucide-react'
import { hilosPublic, CHARCA_URL } from '../../../util/hilosClient'

interface Props { profileSlug: string; currentUser: any; logged: boolean }

interface Page {
  handle: string; displayName: string | null; avatarUrl: string | null; bio: string | null
  followersCount: number; followingCount: number; postsCount: number
}
interface Post { id: number; content: string; createdAt: string; likesCount: number; commentsCount: number }

const n = (v: any) => Number(v || 0).toLocaleString('es')
const isImg = (u: string) => /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(u)

// La parte social de un perfil vive en La Charca. Aquí mostramos un resumen
// real leído de hilos.rest, con enlace para seguir la conversación allí.
const CharcaProfileTab: React.FC<Props> = ({ profileSlug }) => {
  const [page, setPage] = useState<Page | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const p = await hilosPublic(`/pages/${encodeURIComponent(profileSlug)}`)
        if (!alive) return
        setPage(p)
        const d = await hilosPublic(`/pages/${encodeURIComponent(profileSlug)}/posts?limit=5`)
        if (alive) setPosts(d?.items || [])
      } catch { if (alive) setPage(null) } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [profileSlug])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-zinc-900 rounded animate-pulse" />
            <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse" />
          </div>
        </div>
        {[0, 1].map((i) => <div key={i} className="h-20 bg-zinc-900/60 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center py-12 px-6 bg-zinc-950/60 border border-zinc-900 rounded-3xl">
        <Users size={26} className="mx-auto text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-400">Este lector todavía no tiene actividad en La Charca.</p>
        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
          La Charca es la comunidad de CapibaraTraductor: allí se siguen scans, se publica y se comenta.
        </p>
        <a href={CHARCA_URL} target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-sm transition-colors">
          Ir a La Charca <ExternalLink size={14} />
        </a>
      </div>
    )
  }

  const profileUrl = `${CHARCA_URL}/@${page.handle}`

  return (
    <div className="space-y-5">
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-5">
        <div className="flex items-start gap-4">
          {page.avatarUrl
            ? <img src={page.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            : <div className="w-16 h-16 rounded-2xl bg-zinc-800 grid place-items-center text-xl font-black text-zinc-500 shrink-0">
                {(page.displayName || page.handle)[0]?.toUpperCase()}
              </div>}
          <div className="min-w-0 flex-1">
            <p className="font-black text-white truncate">{page.displayName || page.handle}</p>
            <p className="text-xs text-zinc-500">@{page.handle} · en La Charca</p>
            {page.bio && <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{page.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <span><b className="text-zinc-200 tabular-nums">{n(page.followersCount)}</b> {page.followersCount === 1 ? 'seguidor' : 'seguidores'}</span>
              <span><b className="text-zinc-200 tabular-nums">{n(page.followingCount)}</b> siguiendo</span>
              <span><b className="text-zinc-200 tabular-nums">{n(page.postsCount)}</b> {page.postsCount === 1 ? 'publicación' : 'publicaciones'}</span>
            </div>
          </div>
        </div>

        <a href={profileUrl} target="_blank" rel="noopener"
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-sm transition-colors">
          Ver perfil en La Charca <ExternalLink size={14} />
        </a>
      </div>

      {posts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-600">Últimas publicaciones</p>
          {posts.map((p) => {
            const imgs = (p.content || '').split(/\s+/).filter((w) => /^https?:\/\//.test(w) && isImg(w))
            const body = (p.content || '').split('\n').filter((l) => !imgs.includes(l.trim())).join('\n')
            return (
              <a key={p.id} href={`${CHARCA_URL}/post/${p.id}`} target="_blank" rel="noopener"
                className="block bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 transition-colors">
                {body.trim() && <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words line-clamp-4">{body}</p>}
                {imgs[0] && <img src={imgs[0]} alt="" loading="lazy" className="mt-2 rounded-xl max-h-48 w-full object-cover" />}
                <p className="flex items-center gap-3 text-xs text-zinc-600 mt-2.5">
                  <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {n(p.commentsCount)}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString('es')}</span>
                </p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default CharcaProfileTab
