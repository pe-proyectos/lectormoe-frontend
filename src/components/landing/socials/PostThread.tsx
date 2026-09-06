import React, { useEffect, useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { callAPI } from '../../../util/callApi'
import PostCard from './PostCard'
import PostComposer from './PostComposer'
import type { Post } from './postUtils'

interface Props { postId: number; user: any; logged: boolean; language?: string }

const PostThread: React.FC<Props> = ({ postId, user, logged, language = 'es' }) => {
  const en = language === 'en'
  const [post, setPost] = useState<Post | null>(null)
  const [ancestors, setAncestors] = useState<Post[]>([])
  const [replies, setReplies] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    callAPI(`/api/posts/${postId}/thread`).then((d: any) => {
      if (!alive) return
      if (!d?.post) { setNotFound(true); return }
      setPost(d.post); setAncestors(d.ancestors || []); setReplies(d.replies || [])
    }).catch(() => alive && setNotFound(true)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [postId])

  const onLogin = () => { window.location.href = '/login' }

  if (loading) return <div className="flex justify-center py-20 text-white/40"><Loader2 size={26} className="animate-spin" /></div>
  if (notFound || !post) return (
    <div className="text-center py-24 text-white/60"><p className="text-6xl mb-3">🦫</p><p className="font-bold">{en ? 'This post sank or was removed.' : 'Esta publicación se hundió o fue eliminada.'}</p><a href="/socials" className="inline-block mt-4 text-teal-400 hover:underline font-bold">{en ? 'Back to The Pond' : 'Volver a La Charca'}</a></div>
  )

  return (
    <div className="max-w-[600px] mx-auto border-x border-white/10 min-h-screen">
      <div className="sticky top-0 z-10 backdrop-blur bg-zinc-950/80 border-b border-white/10 flex items-center gap-4 px-4 py-3">
        <button type="button" onClick={() => history.back()} aria-label="Volver" className="text-white/70 hover:text-white cursor-pointer"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-black text-white">{en ? 'Post' : 'Publicación'}</h1>
      </div>

      {ancestors.map((a) => <PostCard key={a.id} post={a} user={user} logged={logged} language={language} onLogin={onLogin} />)}

      <div className="border-b border-white/10">
        <PostCard post={post} user={user} logged={logged} language={language} onLogin={onLogin} asThreadRoot />
      </div>

      {logged ? (
        <div className="border-b border-white/10">
          <PostComposer user={user} language={language} replyTo={post.id} autoFocus
            onCreated={(p) => { setReplies((r) => [p, ...r]); setPost((cur) => cur ? { ...cur, commentsCount: cur.commentsCount + 1 } : cur) }} />
        </div>
      ) : (
        <div className="px-4 py-4 border-b border-white/10 text-center">
          <a href="/login" className="text-teal-400 font-bold hover:underline">{en ? 'Join The Pond to reply' : 'Únete a la charca para responder'}</a>
        </div>
      )}

      {replies.map((r) => <PostCard key={r.id} post={r} user={user} logged={logged} language={language} onDeleted={(id) => setReplies((rs) => rs.filter((x) => x.id !== id))} onLogin={onLogin} />)}
      {replies.length === 0 && <p className="text-center text-sm text-white/35 py-10">{en ? 'No replies yet.' : 'Aún no hay respuestas.'}</p>}
    </div>
  )
}

export default PostThread
