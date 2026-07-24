import React, { useState } from 'react';
import { Lock, Globe, Trash2, Edit3, X, Loader2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';

interface Props { list: any; owner: any; user?: any; logged?: boolean; nsfwMode?: boolean; isOwner?: boolean; }

const CustomListPage: React.FC<Props> = ({ list: initialList, owner, user, logged, nsfwMode = false, isOwner = false }) => {
  const [list, setList] = useState(initialList);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialList?.name || '');
  const [desc, setDesc] = useState(initialList?.description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = (p: string) => { window.location.href = p; };

  const items = (list?.items || []).filter((it: any) => {
    const src = it.mangaCustom;
    const isNSFW = src?.isNSFW || src?.organization?.isNSFW || false;
    return nsfwMode ? isNSFW : !isNSFW;
  });

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

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} logged={logged} nsfwMode={nsfwMode} activeView="home"
        onOpenLogin={() => go('/login')} onOpenRegister={() => go('/register')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')} onGoExplore={() => go('/scans')} onGoSearch={() => go('/search')} />
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-3 md:px-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter break-words">{list.name}</h1>
            {list.description && <p className="text-zinc-400 mt-2">{list.description}</p>}
            <a href={`/profile/${owner?.slug}`} className="inline-flex items-center gap-2 mt-3 text-zinc-500 hover:text-cyan-400">
              <img src={owner?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.username || 'U')}&background=27272a&color=fff`} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-bold">@{owner?.slug}</span>
            </a>
            <p className="text-zinc-600 text-xs mt-1">{items.length} obras{!list.isPublic && ' · Oculta'}</p>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setEditing(true)} title="Editar" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"><Edit3 size={16} /></button>
              <button onClick={toggleVisibility} title={list.isPublic ? 'Hacer privada' : 'Hacer pública'} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">{list.isPublic ? <Globe size={16} /> : <Lock size={16} />}</button>
              <button onClick={remove} title="Eliminar" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((it: any) => {
            const mc = it.mangaCustom;
            const url = mc ? `${nsfwMode ? '/red' : ''}/${mc.organization?.slug}/manga/${mc.manga?.slug}` : it.joint ? `/joint/manga/${it.joint.slug}` : '#';
            const cover = mc?.imageUrl || mc?.manga?.imageUrl || it.joint?.imageUrl;
            const title = mc?.title || it.joint?.title;
            return (
              <a key={it.id} href={url} className="group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-cyan-500/50 transition-all">
                  {cover && <img src={cover} alt={title} className="w-full h-full object-cover" />}
                </div>
                <p className="text-zinc-300 text-xs font-bold mt-1.5 truncate group-hover:text-cyan-400">{title}</p>
              </a>
            );
          })}
        </div>
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
