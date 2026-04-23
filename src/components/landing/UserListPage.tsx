import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Bookmark, X } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import SortableMangaList from './SortableMangaList';
import { callAPI } from '../../util/callApi';

interface Props {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
}

type SortKey = 'order' | 'recent' | 'title';
type TypeKey = 'all' | 'manga' | 'joint';
type StatusKey = 'all' | 'ongoing' | 'completed' | 'hiatus' | 'dropped';

const PAGE_SIZE = 10;

const readQuery = () => {
  if (typeof window === 'undefined') return { search: '', sort: 'order' as SortKey, type: 'all' as TypeKey, status: 'all' as StatusKey, scan: '', page: 1 };
  const p = new URLSearchParams(window.location.search);
  const sort = p.get('sort');
  const type = p.get('type');
  const status = p.get('status');
  return {
    search: p.get('q') || '',
    sort: (sort === 'recent' || sort === 'title' || sort === 'order') ? sort : 'order' as SortKey,
    type: (type === 'manga' || type === 'joint') ? type : 'all' as TypeKey,
    status: (status === 'ongoing' || status === 'completed' || status === 'hiatus' || status === 'dropped') ? status : 'all' as StatusKey,
    scan: p.get('scan') || '',
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
  };
};

const writeQuery = (s: { search: string; sort: SortKey; type: TypeKey; status: StatusKey; scan: string; page: number }) => {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (s.search) p.set('q', s.search);
  if (s.sort !== 'order') p.set('sort', s.sort);
  if (s.type !== 'all') p.set('type', s.type);
  if (s.status !== 'all') p.set('status', s.status);
  if (s.scan) p.set('scan', s.scan);
  if (s.page > 1) p.set('page', String(s.page));
  const qs = p.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? '?' + qs : ''}`);
};

const UserListPage: React.FC<Props> = ({ user, logged, nsfwMode = false }) => {
  const initial = useMemo(readQuery, []);
  const [search, setSearch] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [type, setType] = useState<TypeKey>(initial.type);
  const [status, setStatus] = useState<StatusKey>(initial.status);
  const [scan, setScan] = useState<string>(initial.scan);
  const [page, setPage] = useState(initial.page);

  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Scan list for the filter dropdown — derived from whichever scans the user already has in their list.
  const [availableScans, setAvailableScans] = useState<{ slug: string; name: string }[]>([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, sort, type, status, scan]);

  // Fetch list
  useEffect(() => {
    if (!logged) return;
    const run = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        if (type !== 'all') qs.set('type', type);
        if (status !== 'all') qs.set('status', status);
        if (scan) qs.set('scanSlug', scan);

        const result = await callAPI(`/api/user-list?${qs.toString()}`);
        if (result && typeof result === 'object' && Array.isArray(result.items)) {
          setEntries(result.items);
          setTotal(result.total ?? 0);
          setMaxPage(result.maxPage ?? 1);
        } else {
          setEntries([]);
          setTotal(0);
          setMaxPage(1);
        }
      } catch (e) {
        console.error('Error fetching user list:', e);
        setEntries([]);
        setTotal(0);
        setMaxPage(1);
      } finally {
        setLoading(false);
      }
    };
    run();
    writeQuery({ search: debouncedSearch, sort, type, status, scan, page });
  }, [debouncedSearch, sort, type, status, scan, page, logged]);

  // Populate the scan-filter dropdown from a single full pass on mount.
  // Uses limit=500 — profile lists are small and this only runs once.
  useEffect(() => {
    if (!logged) return;
    (async () => {
      try {
        const result = await callAPI('/api/user-list?limit=500');
        const items = result?.items ?? [];
        const scans = new Map<string, string>();
        for (const it of items) {
          const org = it?.mangaCustom?.organization;
          if (org?.slug) scans.set(org.slug, org.name || org.slug);
        }
        setAvailableScans(Array.from(scans.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {}
    })();
  }, [logged]);

  const handleReorder = async (newIds: number[]) => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    setEntries(newIds.map((id, i) => ({ ...byId.get(id), order: i + 1 })));
    try {
      await callAPI('/api/user-list/reorder', { method: 'PATCH', body: JSON.stringify({ ids: newIds }) });
    } catch (e) {
      console.error('Error saving order:', e);
    }
  };

  const clearAll = () => {
    setSearch('');
    setSort('order');
    setType('all');
    setStatus('all');
    setScan('');
  };

  const hasFilters = !!debouncedSearch || sort !== 'order' || type !== 'all' || status !== 'all' || !!scan;
  const go = (p: string) => { if (typeof window !== 'undefined') window.location.href = p; };

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar
        onOpenRegister={() => go('/register')}
        onOpenLogin={() => go('/login')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')}
        onGoExplore={() => go('/scans')}
        onGoSearch={() => go(nsfwMode ? '/red/search' : '/search')}
        activeView="home"
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
      />

      <main className="pt-20">
        <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-900/30 to-transparent">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
              <Bookmark size={10} /> Biblioteca personal
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              Mi <span className="text-cyan-500">Lista</span>
            </h1>
            <p className="mt-3 text-zinc-500 max-w-2xl text-base">
              {total > 0
                ? `${total} ${total === 1 ? 'manga guardado' : 'mangas guardados'}. Busca, filtra y reordena arrastrando.`
                : 'Aún no tienes mangas en tu lista. Agrégalos desde la página de cada manga.'}
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="border-b border-zinc-900 bg-zinc-950 sticky top-16 z-20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título…"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1.5">
                <ArrowUpDown size={14} className="text-zinc-500 ml-2" />
                {(['order', 'recent', 'title'] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      sort === k ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {k === 'order' ? 'Mi orden' : k === 'recent' ? 'Reciente' : 'A-Z'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pills row */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterPill label="Todos" active={type === 'all'} onClick={() => setType('all')} />
              <FilterPill label="Mangas" active={type === 'manga'} onClick={() => setType('manga')} />
              <FilterPill label="Joints" active={type === 'joint'} onClick={() => setType('joint')} />
              <span className="w-px h-5 bg-zinc-800 mx-1" />
              <FilterPill label="Cualquier estado" active={status === 'all'} onClick={() => setStatus('all')} />
              <FilterPill label="En curso" active={status === 'ongoing'} onClick={() => setStatus('ongoing')} />
              <FilterPill label="Completado" active={status === 'completed'} onClick={() => setStatus('completed')} />
              <FilterPill label="Hiatus" active={status === 'hiatus'} onClick={() => setStatus('hiatus')} />
              <FilterPill label="Dropped" active={status === 'dropped'} onClick={() => setStatus('dropped')} />
              {availableScans.length > 0 && (
                <>
                  <span className="w-px h-5 bg-zinc-800 mx-1" />
                  <select
                    value={scan}
                    onChange={(e) => setScan(e.target.value)}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-full px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest outline-none focus:border-cyan-500"
                  >
                    <option value="">Todos los scans</option>
                    {availableScans.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </>
              )}
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest ml-auto"
                >
                  <X size={12} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* List */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {loading && entries.length === 0 ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px]">
              <Bookmark size={40} className="mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500 font-bold">
                {hasFilters ? 'Sin resultados con los filtros actuales' : 'Tu lista está vacía'}
              </p>
              {hasFilters && (
                <button onClick={clearAll} className="mt-4 text-cyan-400 hover:text-cyan-300 text-[10px] font-black uppercase tracking-widest">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <SortableMangaList
                entries={entries.filter((e: any) => {
                  const src = e.joint || e.mangaCustom || e;
                  const isNSFW = src.isNSFW || src.organization?.isNSFW || false;
                  return nsfwMode ? isNSFW : !isNSFW;
                })}
                isOwner={true}
                nsfwMode={nsfwMode}
                // Reorder only makes sense on the default 'Mi orden' sort, so we disable
                // persistence for other sorts to avoid writing a misleading order.
                onReorder={sort === 'order' ? handleReorder : undefined}
              />

              {maxPage > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    Página {page} / {maxPage}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                    disabled={page >= maxPage || loading}
                    className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer onNavigate={(p) => { if (p === 'explore') go('/scans'); else if (p === 'home') go('/'); }} />
    </div>
  );
};

const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
      active
        ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/10'
        : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
    }`}
  >
    {label}
  </button>
);

export default UserListPage;
