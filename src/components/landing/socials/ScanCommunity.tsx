import React, { useEffect, useState } from 'react'
import { Loader2, MessageSquareText } from 'lucide-react'
import { callAPI } from '../../../util/callApi'
import PostComposer from './PostComposer'
import PostCard from './PostCard'
import type { Post } from './postUtils'

interface Props {
  organization: any
  user: any
  logged: boolean
  language?: string
}

const ScanCommunity: React.FC<Props> = ({ organization, user, logged, language = 'es' }) => {
  const en = language === 'en'
  const isStaff = !!user?.permissions?.find((p: any) => p.organizationId === organization?.id)?.canSeeAdminPanel
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async (p: number, replace: boolean) => {
    setLoading(true)
    try {
      const data: any = await callAPI(`/api/organizations/${organization.slug}/posts?page=${p}&limit=10`)
      const items: Post[] = data?.items || []
      setPosts((prev) => (replace ? items : [...prev, ...items]))
      setHasMore(!!data?.hasMore)
    } catch { /* noop */ } finally { setLoading(false) }
  }

  useEffect(() => { if (organization?.slug) load(0, true) }, [organization?.slug])

  // Si no hay staff logueado y no hay posts, no ocupamos espacio.
  if (!loading && posts.length === 0 && !isStaff) return null

  const onLogin = () => { window.location.href = '/login' }

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareText className="text-cyan-400" size={22} />
        <h2 className="text-xl font-black text-white">{en ? 'Community' : 'Comunidad'}</h2>
      </div>

      {isStaff && (
        <div className="mb-4">
          <PostComposer user={user} language={language} onCreated={(post) => setPosts((prev) => [post, ...prev])} />
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-10 text-white/40"><Loader2 size={22} className="animate-spin" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-white/40 py-8">{en ? 'No posts yet. Share your first update!' : 'Aún no hay publicaciones. ¡Comparte tu primer aviso!'}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} user={user} logged={logged} canManage={isStaff} language={language}
              onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} onLogin={onLogin} />
          ))}
          {hasMore && (
            <button type="button" onClick={() => { const n = page + 1; setPage(n); load(n, false) }} disabled={loading}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : (en ? 'Load more' : 'Cargar más')}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default ScanCommunity
