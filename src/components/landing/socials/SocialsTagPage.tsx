import React, { useCallback } from 'react'
import { Hash, ArrowLeft } from 'lucide-react'
import { callAPI } from '../../../util/callApi'
import PostFeed from './PostFeed'

interface Props { tag: string; user: any; logged: boolean; nsfwMode?: boolean; language?: string }

const SocialsTagPage: React.FC<Props> = ({ tag, user, logged, language = 'es' }) => {
  const en = language === 'en'
  const clean = (tag || '').toLowerCase()
  const fetcher = useCallback(async (page: number) => {
    const d: any = await callAPI(`/api/socials/tag/${encodeURIComponent(clean)}?page=${page}`)
    return { items: d?.items || [], hasMore: !!d?.hasMore }
  }, [clean])

  return (
    <div className="max-w-[600px] mx-auto border-x border-white/10 min-h-screen">
      <div className="sticky top-0 z-10 backdrop-blur bg-zinc-950/80 border-b border-white/10 flex items-center gap-4 px-4 py-3">
        <a href="/socials" aria-label="Volver" className="text-white/70 hover:text-white"><ArrowLeft size={20} /></a>
        <h1 className="text-lg font-black text-white flex items-center gap-1"><Hash size={18} className="text-cyan-400" />{clean}</h1>
      </div>
      <PostFeed fetcher={fetcher} reloadKey={clean} user={user} logged={logged} language={language}
        emptyText={en ? 'No posts with this tag yet.' : 'Aún no hay publicaciones con esta etiqueta.'} />
    </div>
  )
}

export default SocialsTagPage
