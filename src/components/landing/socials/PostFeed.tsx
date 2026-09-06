import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquareText } from 'lucide-react'
import PostCard from './PostCard'
import type { Post } from './postUtils'

interface Props {
  fetcher: (page: number) => Promise<{ items: Post[]; hasMore: boolean }>
  reloadKey?: string | number
  user: any
  logged: boolean
  language?: string
  emptyText?: string
  prepend?: Post[]
}

export interface PostFeedHandle { prepend: (p: Post) => void }

const PostFeed: React.FC<Props> = ({ fetcher, reloadKey, user, logged, language = 'es', emptyText }) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const sentinel = useRef<HTMLDivElement>(null)
  const reqId = useRef(0)

  const load = useCallback(async (p: number, replace: boolean) => {
    const my = ++reqId.current
    setLoading(true)
    try {
      const { items, hasMore } = await fetcher(p)
      if (my !== reqId.current) return
      setPosts((prev) => (replace ? items : [...prev, ...items]))
      setHasMore(hasMore)
    } catch { if (my === reqId.current) setHasMore(false) } finally { if (my === reqId.current) setLoading(false) }
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
  if (posts.length === 0) return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] flex items-center justify-center mb-4">
        <MessageSquareText size={30} className="text-white/25" />
      </div>
      <p className="text-white/60 font-bold">{emptyText || (language === 'en' ? 'Nothing here yet.' : 'Aún no hay nada por aquí.')}</p>
    </div>
  )

  return (
    <div>
      {posts.map((p) => <PostCard key={p.id} post={p} user={user} logged={logged} language={language} onDeleted={onDeleted} onLogin={onLogin} />)}
      {hasMore && <div ref={sentinel} className="flex justify-center py-8 text-white/40"><Loader2 size={20} className="animate-spin" /></div>}
      {!hasMore && posts.length > 0 && <p className="text-center text-xs text-white/25 py-8">·</p>}
    </div>
  )
}

export default PostFeed
