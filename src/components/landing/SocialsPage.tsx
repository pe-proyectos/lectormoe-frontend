import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, TrendingUp, Droplet, Waves, Users, Bookmark, X, ArrowUp, Home, Bell, User as UserIcon, PenLine } from 'lucide-react'
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
      try { const d: any = await callAPI(`/api/socials/feed/updates?sinceId=${topId}${nsfwMode ? '&nsfw=1' : ''}`); setNewCount(d?.count || 0) } catch { /* silencio */ }
    }
    const onVisible = () => { if (!document.hidden) poll() }
    const iv = setInterval(poll, 45000)
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVisible) }
  }, [topId, search, tab, nsfwMode])

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

  // Abre el composer: limpia búsqueda, va al feed y enfoca el textarea.
  const openComposer = () => {
    if (!logged) { onLogin(); return }
    setSearch(''); if (tab === 'saved') setTab('foryou')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    requestAnimationFrame(() => setTimeout(() => (document.querySelector('#socials-feed textarea') as HTMLTextAreaElement | null)?.focus(), 60))
  }

  const foryouLabel = logged ? (en ? 'The current' : 'La corriente') : (en ? "What's new" : 'Novedades')
  const TabBtn = ({ id, icon, label }: { id: Tab; icon: React.ReactNode; label: string }) => (
    <button type="button" onClick={() => { setSearch(''); setTab(id) }}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${tab === id && !search ? 'text-white border-teal-400' : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.03]'}`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )

  const navItems = ([
    { icon: <Home size={22} />, label: en ? 'Home' : 'Inicio', onClick: () => { setSearch(''); setTab('foryou'); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
    { icon: <Waves size={22} />, label: en ? 'Waves' : 'Olas', onClick: () => { setSearch(''); setTab('popular') } },
    { icon: <Bell size={22} />, label: en ? 'Notifications' : 'Notificaciones', href: '/notifications', hide: !logged },
    { icon: <Bookmark size={22} />, label: en ? 'Shore' : 'Orilla', onClick: () => { setSearch(''); setTab('saved') }, hide: !logged },
    { icon: <UserIcon size={22} />, label: en ? 'Profile' : 'Perfil', href: user?.slug ? `/profile/${user.slug}` : '/login' },
  ] as any[]).filter((it) => !it.hide)

  return (
    <div className="bg-[#0a1214] min-h-screen">
      <div className="max-w-[1100px] mx-auto flex gap-6 px-0 sm:px-4">
        {/* Nav izquierda (desktop) */}
        <nav className="hidden xl:flex flex-col w-[220px] shrink-0 sticky top-0 h-screen py-4 pr-2">
          <div className="flex items-center gap-2 px-4 py-3 mb-1">
            <Droplet size={24} className="text-teal-400 fill-teal-400/30" />
            <span className="text-lg font-black text-white">{en ? 'The Pond' : 'La Charca'}</span>
          </div>
          {navItems.map((it, i) => (
            it.href
              ? <a key={i} href={it.href} className="flex items-center gap-4 px-4 py-2.5 rounded-full text-[18px] font-bold text-white/90 hover:bg-teal-400/[0.08] transition-colors cursor-pointer">{it.icon} {it.label}</a>
              : <button key={i} type="button" onClick={it.onClick} className="flex items-center gap-4 px-4 py-2.5 rounded-full text-[18px] font-bold text-white/90 hover:bg-teal-400/[0.08] transition-colors cursor-pointer text-left">{it.icon} {it.label}</button>
          ))}
          {logged && <button type="button" onClick={openComposer} className="mt-3 py-3 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-zinc-950 font-black text-[15px] hover:from-teal-300 hover:to-cyan-400 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_8px_24px_-8px_rgba(45,212,191,0.55)] active:scale-[0.98] transition cursor-pointer">{en ? 'Post' : 'Publicar'}</button>}
        </nav>

        {/* Columna principal */}
        <div id="socials-feed" className="flex-1 min-w-0 max-w-[600px] mx-auto border-x border-white/[0.06] min-h-screen">
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a1214]/80 border-b border-white/[0.06]">
            <h1 className="px-4 pt-4 pb-2 text-xl font-black text-white flex items-center gap-2"><Droplet size={20} className="text-teal-400 fill-teal-400/30" /> {en ? 'The Pond' : 'La Charca'}</h1>
            {search ? (
              <div className="flex items-center gap-2 px-4 pb-3 text-sm text-white/60">
                <span>{en ? 'Results for' : 'Resultados de'} <span className="font-bold text-white">"{search}"</span></span>
                <button type="button" onClick={clearSearch} className="text-teal-400 hover:underline cursor-pointer flex items-center gap-1"><X size={13} /> {en ? 'clear' : 'limpiar'}</button>
              </div>
            ) : (
              <div className="flex">
                <TabBtn id="foryou" icon={<Droplet size={15} />} label={foryouLabel} />
                {logged && <TabBtn id="following" icon={<Users size={15} />} label={en ? 'Your pack' : 'Tu manada'} />}
                <TabBtn id="popular" icon={<Waves size={15} />} label={en ? 'Waves' : 'Olas'} />
                {logged && <TabBtn id="saved" icon={<Bookmark size={15} />} label={en ? 'Shore' : 'Orilla'} />}
              </div>
            )}
          </div>
          {/* waterline (firma) */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          {/* búsqueda móvil */}
          <form onSubmit={doSearch} className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
            <Search size={16} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? 'Search posts, #tags…' : 'Buscar posts, #tags…'}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
          </form>

          {newCount > 0 && !search && tab !== 'saved' && (
            <div className="sticky top-[110px] z-20 flex justify-center pointer-events-none">
              <button type="button" onClick={showNew} className="pointer-events-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-zinc-950 text-sm font-black shadow-[0_8px_24px_-8px_rgba(45,212,191,0.6)] hover:from-teal-300 hover:to-cyan-400 active:scale-95 transition cursor-pointer">
                <ArrowUp size={16} /> {newCount} {en ? 'new' : 'nuevas'}
              </button>
            </div>
          )}
          {logged && !search && tab !== 'saved' && (
            <div className="border-b border-white/[0.06]">
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
                : tab === 'following' ? (en ? 'Your pack is small. Follow scans and readers.' : 'Tu manada aún es pequeña. Sigue scans y lectores.')
                : tab === 'saved' ? (en ? 'Nothing on the shore yet. Tap the bookmark on a post.' : 'Nada en la orilla todavía. Toca el marcador en un post para guardarlo.')
                : (en ? 'The pond is quiet. Break the silence.' : 'La charca está tranquila. Rompe el silencio.')
            }
            emptyAction={tab === 'following' ? <a href="/scans" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-zinc-950 text-sm font-black hover:from-teal-300 hover:to-cyan-400 cursor-pointer">{en ? 'Discover scans' : 'Descubrir scans'}</a> : undefined}
          />

          {/* CTA de registro para anónimos */}
          {!logged && (
            <div className="m-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-400/20 p-5 text-center">
              <p className="text-white font-black text-lg">{en ? 'Join the pond' : 'Únete a la charca'}</p>
              <p className="text-white/60 text-sm mt-1">{en ? 'Follow scans and readers, save posts and join the conversation.' : 'Sigue scans y lectores, guarda posts y súmate a la conversación.'}</p>
              <a href="/register" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-zinc-950 font-black text-sm hover:from-teal-300 hover:to-cyan-400 cursor-pointer">{en ? 'Sign up' : 'Crear cuenta'}</a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 shrink-0 py-4">
          <div className="sticky top-4 space-y-4">
            <form onSubmit={doSearch} className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 focus-within:border-teal-400/40">
              <Search size={17} className="text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={en ? 'Search the pond' : 'Buscar en la charca'} className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
            </form>

            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-teal-400" /> {en ? 'Making waves' : 'Haciendo olas'}</h2>
              {trending.length === 0 ? (
                <p className="text-sm text-white/40">{en ? 'Calm waters for now.' : 'Aguas tranquilas por ahora.'}</p>
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

      {/* FAB móvil para publicar */}
      {logged && (
        <button type="button" onClick={openComposer} aria-label={en ? 'Post' : 'Publicar'}
          className="xl:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-zinc-950 flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(45,212,191,0.6)] active:scale-95 transition cursor-pointer">
          <PenLine size={24} />
        </button>
      )}
    </div>
  )
}

export default SocialsPage
