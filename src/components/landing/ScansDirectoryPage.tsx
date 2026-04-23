import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users, ShieldCheck, AlertCircle, ExternalLink, Eye, EyeOff, ChevronLeft, ChevronRight, BookOpen, ArrowUpDown } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface Scan {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string | null;
  followerCount?: number;
  genres?: string[];
  totalMangas?: number;
  isNSFW?: boolean;
  url?: string;
}

type SortKey = 'followers' | 'name' | 'mangas';

interface Props {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
}

// Read initial state from the URL so deep-links to filtered views work.
const readQuery = () => {
  if (typeof window === 'undefined') return { search: '', sort: 'followers' as SortKey, page: 1, showNSFW: false };
  const p = new URLSearchParams(window.location.search);
  const sort = p.get('sort');
  return {
    search: p.get('q') || '',
    sort: (sort === 'name' || sort === 'mangas' || sort === 'followers') ? sort : 'followers' as SortKey,
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
    showNSFW: p.get('nsfw') === '1',
  };
};

const updateQuery = (next: { search: string; sort: SortKey; page: number; showNSFW: boolean }) => {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (next.search) p.set('q', next.search);
  if (next.sort !== 'followers') p.set('sort', next.sort);
  if (next.page > 1) p.set('page', String(next.page));
  if (next.showNSFW) p.set('nsfw', '1');
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? '?' + qs : ''}`;
  window.history.replaceState({}, '', url);
};

const PAGE_SIZE = 24;

const ScansDirectoryPage: React.FC<Props> = ({ user, logged, nsfwMode = false }) => {
  const initial = useMemo(readQuery, []);
  const [search, setSearch] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [showNSFW, setShowNSFW] = useState(initial.showNSFW);
  const [scans, setScans] = useState<Scan[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce search input so every keystroke doesn't refetch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters that affect results change
  useEffect(() => { setPage(1); }, [debouncedSearch, sort, showNSFW]);

  // Fetch
  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        if (showNSFW) qs.set('includeNSFW', 'true');

        const res = await fetch(`${API_URL}/api/landing/scans?${qs.toString()}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        const data = json?.data;
        setScans(Array.isArray(data?.items) ? data.items : []);
        setTotal(data?.total ?? 0);
        setMaxPage(data?.maxPage ?? 1);
      } catch (e) {
        console.error('Error fetching scans:', e);
        setScans([]);
        setTotal(0);
        setMaxPage(1);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
    updateQuery({ search: debouncedSearch, sort, page, showNSFW });
  }, [debouncedSearch, sort, page, showNSFW]);

  const toggleNSFW = () => {
    if (!showNSFW) {
      const ok = window.confirm('¿Eres mayor de 18 años? Estás a punto de habilitar la visualización de scans con contenido explícito (NSFW).');
      if (ok) setShowNSFW(true);
    } else {
      setShowNSFW(false);
    }
  };

  const go = (path: string) => {
    if (typeof window !== 'undefined') window.location.href = path;
  };

  const sortLabels: Record<SortKey, string> = {
    followers: 'Más seguidores',
    mangas: 'Más proyectos',
    name: 'Orden alfabético',
  };

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar
        onOpenRegister={() => go('/register')}
        onOpenLogin={() => go('/login')}
        onGoHome={() => go(nsfwMode ? '/red' : '/')}
        onGoExplore={() => go('/scans')}
        onGoSearch={() => go(nsfwMode ? '/red/search' : '/search')}
        activeView="explore"
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
      />

      <main className="pt-20">
        {/* Header */}
        <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-900/30 to-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Directorio Completo
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              Todos los <span className="text-cyan-500">Scans</span>
            </h1>
            <p className="mt-4 text-zinc-500 max-w-2xl font-medium text-lg">
              Explora los {total > 0 ? total : ''} equipos de traducción activos en la plataforma. Filtra, busca y descubre nuevos proyectos.
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="border-b border-zinc-900 bg-zinc-950 sticky top-16 z-20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:border-cyan-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1.5">
                <ArrowUpDown size={14} className="text-zinc-500 ml-2" />
                {(['followers', 'mangas', 'name'] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      sort === k ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {sortLabels[k]}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleNSFW}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  showNSFW
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                }`}
                title={showNSFW ? 'Mostrando scans NSFW' : 'Scans NSFW ocultos'}
              >
                {showNSFW ? <EyeOff size={14} /> : <Eye size={14} />}
                {showNSFW ? 'Ocultar NSFW' : 'Mostrar NSFW'}
              </button>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {loading && scans.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 animate-pulse">
                  <div className="h-20 bg-zinc-800 rounded-2xl mb-4" />
                  <div className="h-5 bg-zinc-800 rounded mb-2" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px]">
              <EyeOff size={40} className="mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">
                {debouncedSearch
                  ? `No hay scans que coincidan con "${debouncedSearch}"`
                  : 'No hay scans disponibles'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scans.map((scan) => (
                  <a
                    key={scan.id}
                    href={scan.url || `/${scan.id}`}
                    className={`group relative bg-zinc-900/50 border rounded-3xl overflow-hidden hover:bg-zinc-900 transition-all duration-500 ${
                      scan.isNSFW ? 'border-red-900/30 hover:border-red-500/30' : 'border-zinc-800 hover:border-cyan-500/30'
                    }`}
                  >
                    {scan.banner && (
                      <div className="h-20 w-full relative overflow-hidden">
                        <img src={scan.banner} alt="" className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />
                        <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${scan.isNSFW ? 'from-red-950/40' : 'from-zinc-900/50'}`} />
                      </div>
                    )}

                    <div className={`px-6 relative z-10 flex items-end justify-between mb-4 ${scan.banner ? '-mt-8' : 'pt-6'}`}>
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-800 shadow-2xl transition-colors ${scan.isNSFW ? 'group-hover:border-red-500/50' : 'group-hover:border-cyan-500/50'}`}>
                          <img
                            src={scan.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.name)}&background=27272a&color=fff&size=128`}
                            alt={scan.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-950 shadow-lg ${scan.isNSFW ? 'bg-red-500' : 'bg-cyan-500'}`}>
                          {scan.isNSFW ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
                        </div>
                      </div>
                      <div className="text-right pb-2">
                        <div className={`flex items-center justify-end gap-1 ${scan.isNSFW ? 'text-red-500' : 'text-cyan-500'}`}>
                          <Users size={12} />
                          <span className="text-base font-black tracking-tighter">{scan.followerCount?.toLocaleString() || '0'}</span>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Seguidores</span>
                      </div>
                    </div>

                    <div className="px-6 pb-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-xl font-black italic transition-colors ${scan.isNSFW ? 'text-red-400 group-hover:text-red-300' : 'text-white group-hover:text-cyan-400'}`}>
                          {scan.name}
                        </h3>
                        {scan.isNSFW && (
                          <span className="px-2 py-0.5 bg-red-500 text-zinc-950 text-[8px] font-black uppercase rounded tracking-tighter">18+</span>
                        )}
                      </div>
                      {scan.description && (
                        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{scan.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(scan.genres || []).slice(0, 2).map((genre, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-zinc-800/80 rounded-full text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                            {genre}
                          </span>
                        ))}
                        {(scan.totalMangas ?? 0) > 0 && (
                          <span className="px-2.5 py-0.5 bg-zinc-800/80 rounded-full text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                            <BookOpen size={10} /> {scan.totalMangas}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-zinc-800/50 flex items-center justify-between">
                      <span className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors ${
                        scan.isNSFW ? 'text-red-400 group-hover:text-red-200' : 'text-white group-hover:text-cyan-400'
                      }`}>
                        Visitar <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors animate-pulse ${scan.isNSFW ? 'bg-red-800 group-hover:bg-red-500' : 'bg-zinc-800 group-hover:bg-cyan-500'}`} />
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {maxPage > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-widest bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    Página {page} / {maxPage}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                    disabled={page >= maxPage || loading}
                    className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

export default ScansDirectoryPage;
