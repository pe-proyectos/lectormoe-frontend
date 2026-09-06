import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Users, Compass, MessageSquareText } from 'lucide-react'
import { callAPI } from '../../util/callApi'
import PostCard from './socials/PostCard'
import type { Post } from './socials/postUtils'

interface Props {
  user: any
  logged: boolean
  nsfwMode?: boolean
  language?: string
}

type Scope = 'following' | 'discover'

const SocialsPage: React.FC<Props> = ({ user, logged, nsfwMode, language = 'es' }) => {
  const en = language === 'en'
  const [scope, setScope] = useState<Scope>(logged ? 'following' : 'discover')
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const reqId = useRef(0)

  const load = useCallback(async (p: number, replace: boolean, sc: Scope) => {
    const my = ++reqId.current
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(p), limit: '10', scope: sc })
      if (nsfwMode) q.set('nsfw', '1')
      const data: any = await callAPI(`/api/socials/feed?${q.toString()}`)
      if (my !== reqId.current) return
      const items: Post[] = data?.items || []
      setPosts((prev) => (replace ? items : [...prev, ...items]))
      setHasMore(!!data?.hasMore)
    } catch { if (my === reqId.current) setHasMore(false) } finally { if (my === reqId.current) setLoading(false) }
  }, [nsfwMode])

  useEffect(() => { setPosts([]); setPage(0); setHasMore(true); load(0, true, scope) }, [scope, load])

  const loadMore = () => { const next = page + 1; setPage(next); load(next, false, scope) }
  const onLogin = () => { window.location.href = '/login' }

  const Tab: React.FC<{ id: Scope; icon: React.ReactNode; label: string }> = ({ id, icon, label }) => (
    <button type="button" onClick={() => setScope(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition cursor-pointer ${scope === id ? 'bg-white text-zinc-950' : 'text-white/60 hover:text-white bg-white/5'}`}>
      {icon} {label}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareText className="text-cyan-400" size={26} />
          <h1 className="text-2xl font-black text-white">{en ? 'Community' : 'Comunidad'}</h1>
        </div>
        <p className="text-sm text-white/50">{en ? 'Updates, announcements and posts from your favorite scans.' : 'Avances, avisos y publicaciones de tus scans favoritos.'}</p>
      </header>

      <div className="flex items-center gap-2 mb-6">
        {logged && <Tab id="following" icon={<Users size={15} />} label={en ? 'Following' : 'Siguiendo'} />}
        <Tab id="discover" icon={<Compass size={15} />} label={en ? 'Discover' : 'Descubrir'} />
      </div>

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16 text-white/40"><Loader2 size={26} className="animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquareText size={40} className="mx-auto mb-3 text-white/25" />
          <p className="text-white/50 font-semibold">
            {scope === 'following'
              ? (en ? 'Follow scans to see their posts here.' : 'Sigue scans para ver sus publicaciones aquí.')
              : (en ? 'No posts yet.' : 'Aún no hay publicaciones.')}
          </p>
          {scope === 'following' && (
            <button type="button" onClick={() => setScope('discover')} className="mt-3 text-cyan-400 hover:underline text-sm font-bold cursor-pointer">
              {en ? 'Discover posts' : 'Descubrir publicaciones'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} user={user} logged={logged} canManage={false} showOrg language={language} onLogin={onLogin} />
          ))}
          {hasMore ? (
            <button type="button" onClick={loadMore} disabled={loading}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (en ? 'Load more' : 'Cargar más')}
            </button>
          ) : (
            <p className="text-center text-xs text-white/30 py-4">{en ? "That's all for now." : 'Eso es todo por ahora.'}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SocialsPage
