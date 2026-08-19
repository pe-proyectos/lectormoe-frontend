import React, { useState } from 'react';
import { Lock, Globe, Trash2, Edit3, X, Loader2, Bookmark, BookmarkCheck, Copy, Users, ArrowUp, ArrowDown } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';
import { notify } from '../../util/feedback';
import { isSubscriber } from '../../util/isSubscriber';

interface Props { list: any; owner: any; user?: any; logged?: boolean; nsfwMode?: boolean; isOwner?: boolean; }

// Suscribirse a cualquier scan desbloquea crear/editar/clonar listas.
const SUBSCRIBE_CTA = '/scans';

// Estados de lectura que el follower marca en SU versión de la lista.
const STATUSES: { v: string; label: string; cls: string }[] = [
  { v: 'READING', label: 'Leyendo', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { v: 'COMPLETED', label: 'Leído', cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
  { v: 'PLAN_TO_READ', label: 'Pendiente', cls: 'bg-zinc-600/20 text-zinc-300 border-zinc-600/40' },
  { v: 'PAUSED', label: 'En pausa', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { v: 'DROPPED', label: 'Abandonado', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
];

const CustomListPage: React.FC<Props> = ({ list: initialList, owner, user, logged, nsfwMode = false, isOwner = false }) => {
  // Un item es +18 si su obra o su scan lo son.
  const itemIsNsfw = (it: any) => {
    const src = it.mangaCustom;
    return !!(src?.isNSFW || src?.organization?.isNSFW);
  };
  // En el modo normal (la ficha de lista no tiene /red) NO escondemos la obra +18:
  // mostramos su nombre pero SIN portada.
  const hideCover = (it: any) => itemIsNsfw(it) && !nsfwMode;

  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialList?.name || '');
  const [desc, setDesc] = useState(initialList?.description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(!!initialList?.isFollowing);
  const [followBusy, setFollowBusy] = useState(false);
  const [cloneBusy, setCloneBusy] = useState(false);
  // Todos los items de la lista, ya ordenados por el backend (los +18 se muestran
  // sin portada en modo normal; ver hideCover).
  const [items, setItems] = useState<any[]>(initialList?.items || []);
  const go = (p: string) => { window.location.href = p; };

  const subscriber = isSubscriber(user);
  const canEdit = isOwner && (list?.canEdit ?? subscriber);
  const isFollower = following && !isOwner;
  const followerCount = list?._count?.followers ?? 0;

  const keyBody = (it: any) => (it.mangaCustom ? { mangaCustomId: it.mangaCustom.id } : { jointId: it.joint?.id });

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const updated = await callAPI(`/api/lists/${list.id}`, { method: 'PATCH', body: JSON.stringify({ name, description: desc || null }) });
      setList({ ...list, ...updated }); setEditing(false);
    } catch (e: any) { setError(e?.message || 'No se pudo guardar.'); } finally { setBusy(false); }
  };
  const toggleVisibility = async () => {
    const updated = await callAPI(`/api/lists/${list.id}`, { method: 'PATCH', body: JSON.stringify({ isPublic: !list.isPublic }) }).catch(() => null);
    if (updated) setList({ ...list, isPublic: updated.isPublic });
  };
  const remove = async () => {
    if (!confirm('¿Eliminar esta lista?')) return;
    await callAPI(`/api/lists/${list.id}`, { method: 'DELETE' }).catch(() => {});
    go(`/list/${owner?.slug}`);
  };

  const toggleFollow = async () => {
    if (!logged) return go('/login');
    setFollowBusy(true);
    try {
      if (following) {
        await callAPI(`/api/lists/${list.id}/follow`, { method: 'DELETE' });
        setFollowing(false);
      } else {
        await callAPI(`/api/lists/${list.id}/follow`, { method: 'POST' });
        setFollowing(true);
        notify.success('Lista guardada en "Guardadas". Aquí puedes marcar tu progreso y ordenarla a tu gusto.');
      }
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo guardar la lista.');
    } finally { setFollowBusy(false); }
  };

  const clone = async () => {
    if (!logged) return go('/login');
    if (!subscriber) { notify.error('Clonar listas es para suscriptores. Suscríbete a cualquier scan.'); return go(SUBSCRIBE_CTA); }
    setCloneBusy(true);
    try {
      const created = await callAPI(`/api/lists/${list.id}/clone`, { method: 'POST' });
      notify.success('Lista clonada. Ya es tuya y puedes editarla.');
      if (created?.slug && user?.slug) go(`/list/${user.slug}/${created.slug}`);
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo clonar la lista.');
    } finally { setCloneBusy(false); }
  };

  // Owner: quitar obra de la lista (cambia la membresía).
  const removeItem = async (it: any) => {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    try {
      await callAPI(`/api/lists/${list.id}/items`, { method: 'DELETE', body: JSON.stringify(keyBody(it)) });
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo quitar la obra.');
      setItems((initialList?.items || []));
    }
  };

  // Follower: marcar estado de lectura en SU versión (no toca la membresía).
  const setItemStatus = async (it: any, status: string) => {
    const newStatus = status || null;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, myStatus: newStatus } : x)));
    try {
      await callAPI(`/api/lists/${list.id}/my-item`, { method: 'PATCH', body: JSON.stringify({ ...keyBody(it), readingStatus: newStatus }) });
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo actualizar el estado.');
    }
  };

  // Reordenar (owner cambia el orden real; follower reordena SU versión).
  const moveItem = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    const endpoint = isOwner ? `/api/lists/${list.id}/items/reorder` : `/api/lists/${list.id}/my-reorder`;
    const body = isOwner
      ? { ids: next.map((it) => it.id) }
      : { items: next.map((it) => keyBody(it)) };
    try { await callAPI(endpoint, { method: 'PATCH', body: JSON.stringify(body) }); }
    catch { setItems((initialList?.items || [])); }
  };

  const canReorder = canEdit || isFollower;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} logged={logged} nsfwMode={nsfwMode} activeView="home"
        onOpenLogin={() => go('/login')} onOpenRegister={() => go('/register')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')} onGoExplore={() => go('/scans')} onGoSearch={() => go('/search')} />
      <main className="pt-24 pb-20 max-w-4xl mx-auto px-3 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter break-words">{list.name}</h1>
            {list.description && <p className="text-zinc-400 mt-2">{list.description}</p>}
            <a href={`/profile/${owner?.slug}`} className="inline-flex items-center gap-2 mt-3 text-zinc-500 hover:text-cyan-400">
              <img src={owner?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.username || 'U')}&background=27272a&color=fff`} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-bold">@{owner?.slug}</span>
            </a>
            <p className="text-zinc-600 text-xs mt-1 flex items-center gap-2">
              <span>{items.length} obras</span>
              {followerCount > 0 && <span className="inline-flex items-center gap-1"><Users size={12} /> {followerCount}</span>}
              {!list.isPublic && <span>· Oculta</span>}
            </p>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && <button onClick={() => setEditing(true)} title="Editar" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"><Edit3 size={16} /></button>}
              <button onClick={toggleVisibility} title={list.isPublic ? 'Hacer privada' : 'Hacer pública'} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">{list.isPublic ? <Globe size={16} /> : <Lock size={16} />}</button>
              <button onClick={remove} title="Eliminar" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        {/* Acciones para consumir la lista */}
        {!isOwner && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button onClick={toggleFollow} disabled={followBusy} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 ${following ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-500 text-zinc-950 hover:bg-white'}`}>
              {followBusy ? <Loader2 size={15} className="animate-spin" /> : following ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              {following ? 'Guardada' : 'Guardar y seguir'}
            </button>
            <button onClick={clone} disabled={cloneBusy} title={subscriber ? 'Clonar como lista tuya' : 'Clonar es para suscriptores'} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-[11px] uppercase tracking-widest bg-zinc-800 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50">
              {cloneBusy ? <Loader2 size={15} className="animate-spin" /> : subscriber ? <Copy size={15} /> : <Lock size={15} className="text-amber-400" />}
              Clonar
            </button>
          </div>
        )}

        {isFollower && (
          <div className="mb-6 flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-cyan-200/90 text-xs">
            <BookmarkCheck size={14} className="shrink-0" />
            <span>Esta es <b>tu versión</b> de la lista: marca tu progreso y ordénala a tu gusto. No puedes agregar ni quitar obras (eso lo decide @{owner?.slug}).</span>
          </div>
        )}
        {isOwner && !canEdit && (
          <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300/90 text-xs">
            <Lock size={14} className="shrink-0" />
            <span>Para editar el nombre y agregar/quitar obras necesitas una suscripción activa. <a href={SUBSCRIBE_CTA} className="underline font-bold">Suscríbete a un scan</a>. Puedes seguir ocultándola o eliminándola.</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 text-zinc-600"><p>Esta lista todavía no tiene obras.</p></div>
        ) : isFollower ? (
          // Vista del follower: filas con estado + reordenar.
          <div className="space-y-2">
            {items.map((it, i) => {
              const mc = it.mangaCustom;
              const url = mc ? `${nsfwMode ? '/red' : ''}/${mc.organization?.slug}/manga/${mc.manga?.slug}` : it.joint ? `/joint/manga/${it.joint.slug}` : '#';
              const cover = mc?.imageUrl || mc?.manga?.imageUrl || it.joint?.imageUrl;
              const title = mc?.title || it.joint?.title;
              const st = STATUSES.find((s) => s.v === it.myStatus);
              return (
                <div key={it.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2.5">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"><ArrowDown size={14} /></button>
                  </div>
                  <a href={url} className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                    {hideCover(it) ? <Lock size={14} className="text-zinc-600" /> : (cover && <img src={cover} alt={title} className="w-full h-full object-cover" />)}
                  </a>
                  <a href={url} className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate hover:text-cyan-400">{title}</p>
                    {st && <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider rounded-full border px-2 py-0.5 ${st.cls}`}>{st.label}</span>}
                  </a>
                  <select
                    value={it.myStatus || ''}
                    onChange={(e) => setItemStatus(it, e.target.value)}
                    className="shrink-0 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 py-1.5 px-2 focus:border-cyan-500 outline-none"
                  >
                    <option value="">Sin marcar</option>
                    {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          // Vista normal (dueño o visitante sin seguir): grilla de portadas.
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((it, i) => {
              const mc = it.mangaCustom;
              const url = mc ? `${nsfwMode ? '/red' : ''}/${mc.organization?.slug}/manga/${mc.manga?.slug}` : it.joint ? `/joint/manga/${it.joint.slug}` : '#';
              const cover = mc?.imageUrl || mc?.manga?.imageUrl || it.joint?.imageUrl;
              const title = mc?.title || it.joint?.title;
              return (
                <div key={it.id} className="group relative">
                  <a href={url}>
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-cyan-500/50 transition-all flex items-center justify-center">
                      {hideCover(it) ? (
                        <div className="text-center text-zinc-600 px-2">
                          <Lock size={22} className="mx-auto" />
                          <span className="block text-[9px] font-black mt-1 tracking-widest">+18</span>
                        </div>
                      ) : (cover && <img src={cover} alt={title} className="w-full h-full object-cover" />)}
                    </div>
                    <p className="text-zinc-300 text-xs font-bold mt-1.5 truncate group-hover:text-cyan-400">{title}</p>
                  </a>
                  {canEdit && (
                    <>
                      <button onClick={() => removeItem(it)} title="Quitar de la lista" className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/70 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-30"><ArrowUp size={12} /></button>
                        <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-1 rounded bg-black/70 text-zinc-300 hover:text-white disabled:opacity-30"><ArrowDown size={12} /></button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && setEditing(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-black text-white">Editar lista</h3><button onClick={() => setEditing(false)}><X size={18} className="text-zinc-500" /></button></div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-2 focus:border-cyan-500 outline-none" placeholder="Nombre" />
            <p className="text-zinc-600 text-[10px] mb-2">La URL no cambia al renombrar.</p>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 500))} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm mb-3 focus:border-cyan-500 outline-none resize-none" placeholder="Descripción (opcional)" />
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
            <button onClick={save} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />} Guardar</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default CustomListPage;
