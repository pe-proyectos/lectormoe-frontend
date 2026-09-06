import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Waves, RefreshCw } from 'lucide-react'
import PostCard from './PostCard'
import type { Post } from './postUtils'

interface Props {
  fetcher: (page: number) => Promise<{ items: Post[]; hasMore: boolean }>
  reloadKey?: string | number
  user: any
  logged: boolean
  language?: string
  emptyText?: string
  emptyAction?: React.ReactNode
  prepend?: Post[]
  onTopId?: (id: number) => void
}

export interface PostFeedHandle { prepend: (p: Post) => void }

const PostFeed: React.FC<Props> = ({ fetcher, reloadKey, user, logged, language = 'es', emptyText, emptyAction, onTopId }) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const reqId = useRef(0)

  const load = useCallback(async (p: number, replace: boolean) => {
    const my = ++reqId.current
    setLoading(true); setError(false)
    try {
      const { items, hasMore } = await fetcher(p)
      if (my !== reqId.current) return
      setPosts((prev) => (replace ? items : [...prev, ...items]))
      setHasMore(hasMore)
      if (replace && items[0]) onTopId?.(items[0].id)
    } catch { if (my === reqId.current) { setHasMore(false); if (p === 0) setError(true) } } finally { if (my === reqId.current) setLoading(false) }
  }, [fetcher])

  useEffect(() => { setPosts([]); setPage(0); setHasMore(true); load(0, true) }, [reloadKey, load])

  useEffect(() => {
    if (!hasMore || loading) return
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { const n = page + 1; setPage(n); load(n, false) } }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, page, load])

  const onLogin = () => { window.location.href = '/login' }

  const Skeleton = () => (
    <div className="border-b border-white/[0.06] px-4 py-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-3 w-40 bg-white/[0.06] rounded" />
          <div className="h-3 w-full bg-white/[0.06] rounded" />
          <div className="h-3 w-3/4 bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  )
  const onDeleted = (id: number) => setPosts((prev) => prev.filter((p) => p.id !== id))

  if (loading && posts.length === 0) return <div>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
  if (error && posts.length === 0) return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8">
      <p className="text-5xl mb-3">🌫️</p>
      <p className="text-white/70 font-bold">{language === 'en' ? 'The water got murky.' : 'Se enturbió el agua.'}</p>
      <button type="button" onClick={() => load(0, true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 text-sm font-bold cursor-pointer"><RefreshCw size={15} /> {language === 'en' ? 'Retry' : 'Reintentar'}</button>
    </div>
  )
  if (posts.length === 0) return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8 max-w-sm mx-auto">
      <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-teal-500/10 animate-ping" style={{ animationDelay: '200ms' }} />
        <span className="relative text-5xl">🦫</span>
      </div>
      <p className="text-white/70 font-bold">{emptyText || (language === 'en' ? 'The pond is quiet.' : 'La charca está tranquila.')}</p>
      {emptyAction && <div className="mt-4">{emptyAction}</div>}
    </div>
  )

  return (
    <div>
      {posts.map((p) => <PostCard key={p.id} post={p} user={user} logged={logged} language={language} onDeleted={onDeleted} onLogin={onLogin} />)}
      {hasMore && <div ref={sentinel} className="flex justify-center py-8 text-white/40"><Loader2 size={20} className="animate-spin" /></div>}
      {!hasMore && posts.length > 0 && <div className="flex items-center justify-center gap-2 text-white/30 py-8 text-sm"><Waves size={16} /> {language === 'en' ? 'You reached the bottom of the pond.' : 'Llegaste al fondo de la charca.'}</div>}
    </div>
  )
}

export default PostFeed
