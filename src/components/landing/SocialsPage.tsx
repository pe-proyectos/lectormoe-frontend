import React, { useCallback, useEffect, useState } from 'react'
import { Search, TrendingUp, Sparkles, Users, Flame, Bookmark, X, ArrowUp, Home, Compass, Bell, User as UserIcon } from 'lucide-react'
import { callAPI } from '../../util/callApi'
import PostComposer from './socials/PostComposer'
import PostCard from './socials/PostCard'
import PostFeed from './socials/PostFeed'
import type { Post } from './socials/postUtils'

interface Props { user: any; logged: boolean; nsfwMode?: boolean; language?: string }
type Tab = 'foryou' | 'following' | 'popular' | 'saved'

const SocialsPage: React.FC<Props> = ({ user, logged, nsfwMode, language = 'es' }) => {
  const en = language === 'en'
  const [tab, setTab] = useState<Tab>('foryou')
  const [extra, setExtra] = useState<Post[]>([])
  const [trending, setTrending] = useState<{ tag: string; count: number }[]>([])
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [topId, setTopId] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [nonce, setNonce] = useState(0)

  useEffect(() => { setExtra([]); setNewCount(0) }, [tab, search])
  useEffect(() => { callAPI('/api/socials/trending').then((d: any) => setTrending(d || [])).catch(() => {}) }, [])

  useEffect(() => {
    if (search || tab === 'saved' || !topId) return
    const poll = async () => {
      if (document.hidden) return
      try { const d: any = await callAPI(`/api/socials/feed/updates?sinceId=${topId}${nsfwParam}`); setNewCount(d?.count || 0) } catch {}
    }
    const iv = setInterval(poll, 45000)
    return () => clearInterval(iv)
  }, [topId, search, tab, nsfwParam])

  const showNew = () => { setNewCount(0); setExtra([]); setNonce((n) => n + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const nsfwParam = nsfwMode ? '&nsfw=1' : ''
  const feedFetcher = useCallback(async (page: number) => {
    if (search) { const d: any = await callAPI(`/api/socials/search?q=${encodeURIComponent(search)}&page=${page}`); return { items: d?.items || [], hasMore: !!d?.hasMore } }
    if (tab === 'saved') { const d: any = await callAPI(`/api/socials/saved?page=${page}`); return { items: d?.items || [], hasMore: !!d?.hasMore } }
    const d: any = await callAPI(`/api/socials/feed?scope=${tab}&page=${page}${nsfwParam}`)
    return { items: d?.items || [], hasMore: !!d?.hasMore }
  }, [tab, search, nsfwParam])

  const doSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(q.trim()) }
  const clearSearch = () => { setSearch(''); setQ('') }
  const onLogin = () => { window.location.href = '/login' }

  const TabBtn = ({ id, icon, label }: { id: Tab; icon: React.ReactNode; label: string }) => (
    <button type="button" onClick={() => { setSearch(''); setTab(id) }}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${tab === id && !search ? 'text-white border-cyan-400' : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.03]'}`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <div className="max-w-[1100px] mx-auto flex gap-6 px-0 sm:px-4">
      {/* Nav izquierda estilo X (desktop) */}
      <nav className="hidden xl:flex flex-col w-[220px] shrink-0 sticky top-0 h-screen py-4 pr-2">
        {([
          { icon: <Home size={22} />, label: en ? 'Home' : 'Inicio', onClick: () => { setSearch(''); setTab('foryou'); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
          { icon: <Compass size={22} />, label: en ? 'Explore' : 'Explorar', onClick: () => { setTab('popular'); setSearch('') } },
          { icon: <Bell size={22} />, label: en ? 'Notifications' : 'Notificaciones', href: '/notifications' },
          { icon: <Bookmark size={22} />, label: en ? 'Saved' : 'Guardados', onClick: () => { setSearch(''); setTab('saved') }, hide: !logged },
          { icon: <UserIcon size={22} />, label: en ? 'Profile' : 'Perfil', href: user?.slug ? `/profile/${user.slug}` : '/login' },
        ] as any[]).filter((it) => !it.hide).map((it, i) => (
          it.href
            ? <a key={i} href={it.href} className="flex items-center gap-4 px-4 py-2.5 rounded-full text-[18px] font-bold text-white/90 hover:bg-white/[0.06] transition-colors cursor-pointer">{it.icon} {it.label}</a>
            : <button key={i} type="button" onClick={it.onClick} className="flex items-center gap-4 px-4 py-2.5 rounded-full text-[18px] font-bold text-white/90 hover:bg-white/[0.06] transition-colors cursor-pointer text-left">{it.icon} {it.label}</button>
        ))}
        {logged && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-3 py-3 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 font-black text-[15px] hover:from-cyan-300 hover:to-cyan-400 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_8px_24px_-8px_rgba(34,211,238,0.5)] active:scale-[0.98] transition cursor-pointer">{en ? 'Post' : 'Publicar'}</button>}
      </nav>

      {/* Columna principal */}
      <div className="flex-1 min-w-0 max-w-[600px] mx-auto border-x border-white/10 min-h-screen">
        <div className="sticky top-0 z-10 backdrop-blur bg-zinc-950/80 border-b border-white/10">
          <h1 className="px-4 pt-4 pb-2 text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-cyan-400" /> {en ? 'Community' : 'Comunidad'}</h1>
          {search ? (
            <div className="flex items-center gap-2 px-4 pb-3 text-sm text-white/60">
              <span>{en ? 'Results for' : 'Resultados de'} <span className="font-bold text-white">"{search}"</span></span>
              <button type="button" onClick={clearSearch} className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"><X size={13} /> {en ? 'clear' : 'limpiar'}</button>
            </div>
          ) : (
            <div className="flex">
              <TabBtn id="foryou" icon={<Sparkles size={15} />} label={en ? 'For you' : 'Para ti'} />
              {logged && <TabBtn id="following" icon={<Users size={15} />} label={en ? 'Following' : 'Siguiendo'} />}
              <TabBtn id="popular" icon={<Flame size={15} />} label={en ? 'Popular' : 'Populares'} />
              {logged && <TabBtn id="saved" icon={<Bookmark size={15} />} label={en ? 'Saved' : 'Guardados'} />}
            </div>
          )}
        </div>

        {/* búsqueda móvil */}
        <form onSubmit={doSearch} className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-white/10">
          <Search size={16} className="text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? 'Search posts, #tags…' : 'Buscar posts, #tags…'}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
        </form>

        {newCount > 0 && !search && tab !== 'saved' && (
          <div className="sticky top-[112px] z-20 flex justify-center pointer-events-none">
            <button type="button" onClick={showNew} className="pointer-events-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 text-sm font-black shadow-[0_8px_24px_-8px_rgba(34,211,238,0.6)] hover:from-cyan-300 hover:to-cyan-400 active:scale-95 transition cursor-pointer">
              <ArrowUp size={16} /> {newCount} {en ? 'new posts' : 'posts nuevos'}
            </button>
          </div>
        )}
        {logged && !search && tab !== 'saved' && (
          <div className="border-b border-white/10">
            <PostComposer user={user} language={language} onCreated={(p) => setExtra((e) => [p, ...e])} />
          </div>
        )}

        {extra.map((p) => <PostCard key={`x-${p.id}`} post={p} user={user} logged={logged} language={language} onDeleted={(id) => setExtra((e) => e.filter((x) => x.id !== id))} onLogin={onLogin} />)}

        <PostFeed
          fetcher={feedFetcher}
          reloadKey={`${tab}|${search}|${nonce}`}
          onTopId={setTopId}
          user={user} logged={logged} language={language}
          emptyText={
            search ? (en ? 'No results.' : 'Sin resultados.')
              : tab === 'following' ? (en ? 'Follow scans to see their posts.' : 'Sigue scans para ver sus publicaciones.')
              : tab === 'saved' ? (en ? 'You have no saved posts.' : 'No has guardado publicaciones.')
              : (en ? 'No posts yet. Be the first!' : 'Aún no hay publicaciones. ¡Sé el primero!')
          }
        />
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 py-4">
        <div className="sticky top-4 space-y-4">
          <form onSubmit={doSearch} className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 focus-within:border-white/30">
            <Search size={17} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? 'Search' : 'Buscar'} className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
          </form>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <h2 className="text-base font-black text-white flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-cyan-400" /> {en ? 'Trending' : 'Tendencias'}</h2>
            {trending.length === 0 ? (
              <p className="text-sm text-white/40">{en ? 'Nothing trending yet.' : 'Nada en tendencia aún.'}</p>
            ) : (
              <ul className="space-y-2.5">
                {trending.map((t) => (
                  <li key={t.tag}>
                    <a href={`/socials/tag/${t.tag}`} className="block hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors">
                      <div className="text-sm font-bold text-white">#{t.tag}</div>
                      <div className="text-[11px] text-white/40">{t.count} {en ? 'posts' : 'publicaciones'}</div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default SocialsPage
