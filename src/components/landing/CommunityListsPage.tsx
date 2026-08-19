import React, { useEffect, useState } from 'react';
import { ListChecks, Search, Plus, Lock, Bookmark, Loader2, X, Users } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';
import { notify } from '../../util/feedback';
import { isSubscriber } from '../../util/isSubscriber';

interface Props { user?: any; logged?: boolean; nsfwMode?: boolean; }

type Tab = 'explore' | 'mine' | 'saved';
const SUBSCRIBE_CTA = '/scans';

const ListCard: React.FC<{ l: any }> = ({ l }) => {
  // Se ocultan las portadas +18 (solo cuentan las obras no-+18 para la miniatura).
  const covers = (l.items || [])
    .filter((it: any) => !(it.mangaCustom?.isNSFW || it.mangaCustom?.organization?.isNSFW))
    .map((it: any) => it.mangaCustom?.imageUrl || it.mangaCustom?.manga?.imageUrl || it.joint?.imageUrl)
    .filter(Boolean)
    .slice(0, 4);
  const ownerSlug = l.user?.slug;
  return (
    <a href={`/list/${ownerSlug}/${l.slug}`} className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all">
      <div className="grid grid-cols-2 grid-rows-2 h-28 bg-zinc-950">
        {covers.length > 0 ? covers.map((c: string, i: number) => <img key={i} src={c} alt="" className="w-full h-full object-cover" />) : <div className="col-span-2 row-span-2 flex items-center justify-center text-zinc-700"><ListChecks size={28} /></div>}
      </div>
      <div className="p-4">
        <h3 className="text-white font-black truncate group-hover:text-cyan-400 transition-colors">{l.name}</h3>
        <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
          {ownerSlug && <span>por @{ownerSlug}</span>}
          <span>· {l._count?.items ?? 0} obras</span>
          {(l._count?.followers ?? 0) > 0 && <span className="inline-flex items-center gap-0.5">· <Users size={11} /> {l._count.followers}</span>}
          {l.isPublic === false && <span>· Oculta</span>}
        </p>
      </div>
    </a>
  );
};

const CommunityListsPage: React.FC<Props> = ({ user, logged, nsfwMode = false }) => {
  const [tab, setTab] = useState<Tab>('explore');
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const subscriber = isSubscriber(user);
  const go = (p: string) => { window.location.href = p; };

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    setLoading(true);
    const url =
      tab === 'explore'
        ? `/api/lists/community${debounced ? `?search=${encodeURIComponent(debounced)}` : ''}`
        : tab === 'mine'
          ? `/api/lists/${user?.slug}`
          : '/api/lists/followed';
    callAPI(url)
      .then((d: any) => setLists(Array.isArray(d) ? d : []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, [tab, debounced, user?.slug]);

  const openCreate = () => {
    if (!logged) return go('/login');
    if (!subscriber) { notify.error('Crear listas es un beneficio para suscriptores. Suscríbete a cualquier scan.'); return go(SUBSCRIBE_CTA); }
    setNewName(''); setNewDesc(''); setCreating(true);
  };
  const create = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await callAPI('/api/lists', { method: 'POST', body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }) });
      if (created?.slug && user?.slug) go(`/list/${user.slug}/${created.slug}`);
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo crear la lista.');
    } finally { setSaving(false); }
  };

  const tabs: { id: Tab; label: string; auth?: boolean }[] = [
    { id: 'explore', label: 'Explorar' },
    { id: 'mine', label: 'Mis listas', auth: true },
    { id: 'saved', label: 'Guardadas', auth: true },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} logged={logged} nsfwMode={nsfwMode} activeView="home"
        onOpenLogin={() => go('/login')} onOpenRegister={() => go('/register')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')} onGoExplore={() => go('/scans')} onGoSearch={() => go('/search')} />
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-3 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1"><ListChecks size={12} /> Listas</div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Listas de la comunidad</h1>
            <p className="text-zinc-500 mt-2">Colecciones de obras creadas por suscriptores. Verlas y guardarlas es gratis para todos.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-black text-[11px] uppercase tracking-widest bg-cyan-500 text-zinc-950 hover:bg-white transition-colors shrink-0 self-start sm:self-auto">
            {subscriber ? <Plus size={16} /> : <Lock size={15} className="text-zinc-900" />} Nueva lista
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-1.5 mb-6 border-b border-zinc-800/70">
          {tabs.filter((t) => !t.auth || logged).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 font-black text-xs uppercase tracking-widest border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-cyan-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'explore' && (
          <div className="relative mb-8 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar listas…" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" />
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            {tab === 'explore' && <p>No hay listas públicas todavía.</p>}
            {tab === 'mine' && <div className="space-y-3"><p>Todavía no creaste ninguna lista.</p>{subscriber ? <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2 font-black text-[11px] uppercase tracking-widest"><Plus size={15} /> Crear mi primera lista</button> : <a href={SUBSCRIBE_CTA} className="inline-flex items-center gap-2 text-cyan-400 font-bold text-sm"><Lock size={14} /> Suscríbete para crear listas</a>}</div>}
            {tab === 'saved' && <div className="space-y-2"><Bookmark size={28} className="mx-auto text-zinc-700" /><p>No has guardado ninguna lista. Explora y guarda las que te gusten.</p></div>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => <ListCard key={l.id} l={l} />)}
          </div>
        )}
      </main>

      {creating && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !saving && setCreating(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-black text-white">Nueva lista pública</h3><button onClick={() => setCreating(false)}><X size={18} className="text-zinc-500" /></button></div>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 60))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-2 focus:border-cyan-500 outline-none" placeholder="Nombre de la lista" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value.slice(0, 500))} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm mb-3 focus:border-cyan-500 outline-none resize-none" placeholder="Descripción (opcional)" />
            <button onClick={create} disabled={saving || !newName.trim()} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">{saving && <Loader2 size={14} className="animate-spin" />} Crear lista</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default CommunityListsPage;
