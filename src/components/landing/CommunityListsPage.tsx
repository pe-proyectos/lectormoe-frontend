import React, { useEffect, useState } from 'react';
import { ListChecks, Search } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';

interface Props { user?: any; logged?: boolean; nsfwMode?: boolean; }

const CommunityListsPage: React.FC<Props> = ({ user, logged, nsfwMode = false }) => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    setLoading(true);
    callAPI(`/api/lists/community${debounced ? `?search=${encodeURIComponent(debounced)}` : ''}`)
      .then((d: any) => setLists(Array.isArray(d) ? d : []))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  const go = (p: string) => { window.location.href = p; };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} logged={logged} nsfwMode={nsfwMode} activeView="home"
        onOpenLogin={() => go('/login')} onOpenRegister={() => go('/register')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')} onGoExplore={() => go('/scans')} onGoSearch={() => go('/search')} />
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-3 md:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1"><ListChecks size={12} /> Comunidad</div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mural de listas</h1>
          <p className="text-zinc-500 mt-2">Listas públicas creadas por la comunidad.</p>
        </div>
        <div className="relative mb-8 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar listas…" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-white text-sm focus:border-cyan-500 outline-none" />
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse" />)}</div>
        ) : lists.length === 0 ? (
          <p className="text-zinc-500 text-center py-20">No hay listas públicas todavía.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => {
              const covers = (l.items || []).map((it: any) => it.mangaCustom?.imageUrl || it.mangaCustom?.manga?.imageUrl || it.joint?.imageUrl).filter(Boolean).slice(0, 4);
              return (
                <a key={l.id} href={`/list/${l.user?.slug}/${l.slug}`} className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all">
                  <div className="grid grid-cols-2 grid-rows-2 h-28 bg-zinc-950">
                    {covers.length > 0 ? covers.map((c: string, i: number) => <img key={i} src={c} alt="" className="w-full h-full object-cover" />) : <div className="col-span-2 row-span-2 flex items-center justify-center text-zinc-700"><ListChecks size={28} /></div>}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-black truncate group-hover:text-cyan-400 transition-colors">{l.name}</h3>
                    <p className="text-zinc-500 text-xs mt-1">por @{l.user?.slug} · {l._count?.items ?? 0} obras</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CommunityListsPage;
