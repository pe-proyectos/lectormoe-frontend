import React, { useCallback, useEffect, useState } from 'react'
import { UserPlus, UserCheck, MoreHorizontal, Ban, VolumeX, Loader2, MessageSquareText } from 'lucide-react'
import { toast } from 'react-toastify'
import { callAPI } from '../../../util/callApi'
import PostFeed from './PostFeed'

interface Props { profileSlug: string; currentUser: any; logged: boolean; language?: string }

interface Social { username: string; slug: string; followersCount: number; followingCount: number; postsCount: number; isFollowing: boolean; isBlocked: boolean; isMuted: boolean; isSelf: boolean }

const ProfileSocial: React.FC<Props> = ({ profileSlug, currentUser, logged, language = 'es' }) => {
  const en = language === 'en'
  const [s, setS] = useState<Social | null>(null)
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => { callAPI(`/api/users/${profileSlug}/social`).then((d: any) => setS(d)).catch(() => {}) }, [profileSlug])

  const fetcher = useCallback(async (page: number) => {
    const d: any = await callAPI(`/api/users/${profileSlug}/posts?page=${page}`)
    return { items: d?.items || [], hasMore: !!d?.hasMore }
  }, [profileSlug])

  const toggleFollow = async () => {
    if (!logged) { window.location.href = '/login'; return }
    if (!s || busy) return
    const n = !s.isFollowing; setS({ ...s, isFollowing: n, followersCount: s.followersCount + (n ? 1 : -1) }); setBusy(true)
    try { const r: any = await callAPI(`/api/users/${profileSlug}/follow`, { method: 'POST' }); setS((cur) => cur ? { ...cur, isFollowing: r.following } : cur) }
    catch { setS((cur) => cur ? { ...cur, isFollowing: !n, followersCount: cur.followersCount + (n ? -1 : 1) } : cur); toast.error('No se pudo') } finally { setBusy(false) }
  }
  const toggleBlock = async () => {
    setMenu(false); if (!s) return
    try { const r: any = await callAPI(`/api/users/${profileSlug}/block`, { method: 'POST' }); setS({ ...s, isBlocked: r.blocked, isFollowing: false }); toast.success(r.blocked ? (en ? 'Blocked' : 'Bloqueado') : (en ? 'Unblocked' : 'Desbloqueado')) } catch { toast.error('No se pudo') }
  }
  const toggleMute = async () => {
    setMenu(false); if (!s) return
    try { const r: any = await callAPI(`/api/users/${profileSlug}/mute`, { method: 'POST' }); setS({ ...s, isMuted: r.muted }); toast.success(r.muted ? (en ? 'Muted' : 'Silenciado') : (en ? 'Unmuted' : 'Reactivado')) } catch { toast.error('No se pudo') }
  }

  const Count = ({ n, label }: { n: number; label: string }) => (
    <div className="text-center"><span className="text-lg font-black text-white tabular-nums">{n ?? 0}</span> <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span></div>
  )

  return (
    <div className="mb-10">
      <div className="flex items-center flex-wrap gap-6 mb-6 bg-zinc-900/40 border border-zinc-800 rounded-[32px] px-8 py-5">
        <div className="flex items-center gap-6">
          <Count n={s?.postsCount ?? 0} label={en ? 'posts' : 'posts'} />
          <a href="#" className="hover:opacity-80"><Count n={s?.followersCount ?? 0} label={en ? 'followers' : 'seguidores'} /></a>
          <Count n={s?.followingCount ?? 0} label={en ? 'following' : 'siguiendo'} />
        </div>
        {s && !s.isSelf && (
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={toggleFollow} disabled={busy}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition cursor-pointer disabled:opacity-60 ${s.isFollowing ? 'bg-zinc-800 text-white hover:bg-rose-500/20 hover:text-rose-300' : 'bg-gradient-to-b from-cyan-400 to-cyan-500 text-zinc-950 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_8px_24px_-8px_rgba(34,211,238,0.5)]'}`}>
              {s.isFollowing ? <><UserCheck size={16} /> {en ? 'Following' : 'Siguiendo'}</> : <><UserPlus size={16} /> {en ? 'Follow' : 'Seguir'}</>}
            </button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Más" className="p-2.5 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 cursor-pointer"><MoreHorizontal size={17} /></button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl py-1.5">
                    <button type="button" onClick={toggleMute} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 cursor-pointer"><VolumeX size={15} /> {s.isMuted ? (en ? 'Unmute' : 'Reactivar') : (en ? 'Mute' : 'Silenciar')}</button>
                    <button type="button" onClick={toggleBlock} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-white/5 cursor-pointer"><Ban size={15} /> {s.isBlocked ? (en ? 'Unblock' : 'Desbloquear') : (en ? 'Block' : 'Bloquear')}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <MessageSquareText size={20} className="text-cyan-400" />
        <h2 className="text-xl font-black text-white">{en ? 'Posts' : 'Publicaciones'}</h2>
      </div>
      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/20 overflow-hidden">
        {s?.isBlocked ? (
          <p className="text-center text-zinc-500 py-12 text-sm">{en ? 'You blocked this user.' : 'Bloqueaste a este usuario.'}</p>
        ) : (
          <PostFeed fetcher={fetcher} reloadKey={profileSlug} user={currentUser} logged={logged} language={language}
            emptyText={en ? 'No posts yet.' : 'Aún no hay publicaciones.'} />
        )}
      </div>
    </div>
  )
}

export default ProfileSocial
