import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
  const onDeleted = (id: number) => setPosts((prev) => prev.filter((p) => p.id !== id))

  if (loading && posts.length === 0) return <div className="flex justify-center py-16 text-white/40"><Loader2 size={26} className="animate-spin" /></div>
  if (posts.length === 0) return <p className="text-center text-white/45 py-16 px-4">{emptyText || (language === 'en' ? 'Nothing here yet.' : 'Aún no hay nada por aquí.')}</p>

  return (
    <div>
      {posts.map((p) => <PostCard key={p.id} post={p} user={user} logged={logged} language={language} onDeleted={onDeleted} onLogin={onLogin} />)}
      {hasMore && <div ref={sentinel} className="flex justify-center py-8 text-white/40"><Loader2 size={20} className="animate-spin" /></div>}
      {!hasMore && posts.length > 0 && <p className="text-center text-xs text-white/25 py-8">·</p>}
    </div>
  )
}

export default PostFeed
