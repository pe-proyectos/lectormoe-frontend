import React, { useState, useMemo, useEffect } from 'react';
import MangaCard3D from './MangaCard3D';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List as ListIcon, Clock, Book, ArrowRight, User, X } from 'lucide-react';
import { translateStatus } from '../../util/landing/translateStatus';
import { callAPI } from '../../util/callApi';

interface Manga {
  id: string;
  title: string;
  cover: string;
  scan?: string;
  scanName?: string;
  scanUrl?: string;
  mangaUrl?: string;
  status?: string;
  author?: string;
  genres?: string[];
  chapter?: string;
  chapterTitle?: string;
  lastUpdate?: string;
  chapters?: any[];
  userHasSubscription?: boolean;
  isNSFW?: boolean;
}

interface MangaListItemProps {
  manga: Manga;
  hideScan?: boolean;
  nsfwMode?: boolean;
}

const MangaListItem: React.FC<MangaListItemProps> = ({ manga, hideScan, nsfwMode = false }) => {

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (manga.mangaUrl) {
      window.location.href = manga.mangaUrl;
    }
  };

  const handleReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (manga.chapters && manga.chapters.length > 0) {
      const lastChapter = manga.chapters[manga.chapters.length - 1];
      if (lastChapter.chapterUrl) {
        window.location.href = lastChapter.chapterUrl;
      }
    }
  };

  return (
    <div className="group relative bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-6 hover:bg-zinc-900 hover:border-cyan-500/30 transition-all duration-300">
      {/* Cover */}
      <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/5 relative">
        <img src={manga.cover} alt={manga.title} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${!nsfwMode && manga.isNSFW ? 'blur-xl scale-110' : ''}`} />
        {!nsfwMode && manga.isNSFW && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-red-500/90 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">+18</span>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0 flex flex-col py-1">
        {/* Title and Status Area */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors leading-tight break-words">
              {manga.title}
            </h3>
            {manga.status && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${manga.status === 'Ongoing' || manga.status === 'En emisión' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
                {translateStatus(manga.status)}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mb-3">
          {manga.author && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              <User size={12} /> {manga.author}
            </div>
          )}
          {!hideScan && manga.scan && (
            <div className="flex items-center gap-1.5 text-cyan-500 text-[10px] font-black uppercase tracking-widest">
              <span className="text-zinc-700">|</span> {manga.scan}
            </div>
          )}
        </div>

        {/* Genres */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {manga.genres.slice(0, 4).map((genre, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] font-bold rounded uppercase">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chapters & Date (Desktop) */}
      {manga.chapters && manga.chapters.length > 0 && (
        <div className="hidden lg:flex flex-col items-end gap-2 shrink-0 pr-6 border-r border-zinc-800 min-w-[180px]">
          <div className="text-right">
            <p className="text-white font-black text-base uppercase">Cap. {manga.chapters[manga.chapters.length - 1].number}</p>
            {manga.chapters[manga.chapters.length - 1].title && (
              <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[150px]">"{manga.chapters[manga.chapters.length - 1].title}"</p>
            )}
          </div>
          {manga.chapters[manga.chapters.length - 1].releasedAt && (
            <div className="flex items-center gap-1.5 text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
              <Clock size={12} /> {new Date(manga.chapters[manga.chapters.length - 1].releasedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="shrink-0 flex items-center gap-3">
        <button 
          onClick={handleInfoClick}
          className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-cyan-500 hover:text-zinc-950 transition-all" 
          title="Ver Info"
        >
          <Book size={18} />
        </button>
        {manga.chapters && manga.chapters.length > 0 && (
          <button 
            onClick={handleReadClick}
            className="hidden sm:flex items-center gap-2 bg-white text-zinc-950 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg shadow-black/20"
          >
            Leer <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

interface ExplorePageProps {
  organization?: any;
  organizationSlug?: string;
  user?: any;
  logged?: boolean;
  initialScan?: string;
  nsfwMode?: boolean;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ organization, organizationSlug, user, logged, nsfwMode = false }) => {
  const initialAuthor = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('author') ?? '' : '';
  const [search, setSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [authorSlug, setAuthorSlug] = useState<string>(initialAuthor);
  const [authorName, setAuthorName] = useState<string>('');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<any[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [joints, setJoints] = useState<any[]>([]);
  const showNSFW = nsfwMode;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus, selectedGenre, sortBy, authorSlug]);

  // Look up the author's display name when filtering by author (so the pill
  // shows "Por: Akasaka Aka" instead of the raw slug). Best-effort — falls back
  // to the slug if the fetch fails.
  useEffect(() => {
    if (!authorSlug) { setAuthorName(''); return; }
    callAPI(`/api/author/${encodeURIComponent(authorSlug)}`)
      .then((a: any) => setAuthorName(a?.name ?? authorSlug))
      .catch(() => setAuthorName(authorSlug));
  }, [authorSlug]);

  // Sync author filter into the URL so refresh / share preserves it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    if (authorSlug) u.searchParams.set('author', authorSlug);
    else u.searchParams.delete('author');
    window.history.replaceState({}, '', u.toString());
  }, [authorSlug]);

  const isScanBranded = organization && organizationSlug;

  // Track page view
  useEffect(() => {
    callAPI('/api/analytics', {
      method: 'POST',
      includeIp: true,
      body: JSON.stringify({
        event: 'view_manga_search',
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        payload: {},
      }),
    }).catch(() => {})
  }, [])

  // Track search actions (debounced)
  useEffect(() => {
    if (!search || search.length < 2) return
    const timer = setTimeout(() => {
      callAPI('/api/analytics', {
        method: 'POST',
        includeIp: true,
        body: JSON.stringify({
          event: 'action_search_manga',
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
          payload: { query: search },
        }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [search])

  // Si hay organización, establecer el scan seleccionado automáticamente
  useEffect(() => {
    if (isScanBranded && organization) {
      setSelectedScan(organization.name || organization.title);
    }
  }, [isScanBranded, organization]);

  // Fetch scans for filter — load enough to cover the whole catalog (max 100)
  useEffect(() => {
    const fetchScans = async () => {
      try {
        const result = await callAPI('/api/landing/scans?limit=100&sort=name');
        const items = result?.items ?? result?.data?.items ?? (Array.isArray(result) ? result : []);
        setScans(items);
      } catch (error) {
        console.error('Error fetching scans:', error);
      }
    };

    if (!isScanBranded) {
      fetchScans();
    }
  }, [isScanBranded]);

  // Fetch joints for global catalog
  useEffect(() => {
    if (isScanBranded) return;
    const fetchJoints = async () => {
      try {
        const result = await callAPI('/api/joint/list?limit=20&page=1');
        if (result && Array.isArray(result.data)) {
          setJoints(result.data);
        }
      } catch {
        // joints section is best-effort
      }
    };
    fetchJoints();
  }, [isScanBranded]);

  // Fetch mangas
  useEffect(() => {
    const fetchMangas = async () => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '24',
          order: sortBy,
          nsfw: nsfwMode ? 'true' : 'false',
        });

        if (search) {
          queryParams.set('search', search);
        }

        if (selectedStatus !== 'All') {
          // The DB stores statuses lowercase ("ongoing"/"completed"/"hiatus"),
          // but the dropdown values are TitleCase. Normalize before sending so
          // the filter actually matches.
          queryParams.set('status', selectedStatus.toLowerCase());
        }

        if (selectedGenre !== 'All') {
          queryParams.set('genre', selectedGenre);
        }

        if (authorSlug) {
          queryParams.set('author', authorSlug);
        }

        const result = await callAPI(`/api/manga-custom?${queryParams}`);

        // El API retorna { items: [...], maxPage: X, total: Y }
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          const mappedMangas = result.items.map((m: any) => {
            const mangaOrg = m.organization || organization;
            const mangaOrgSlug = mangaOrg?.slug || organizationSlug;
            // El slug está en m.manga.slug (relación anidada del mangaCustom)
            const mangaSlug = m.manga?.slug || m.slug || m.id;
            
            // Solo construir mangaUrl si tenemos un slug válido
            const mangaOrgPrefix = mangaOrgSlug ? (nsfwMode ? `/red/${mangaOrgSlug}` : `/${mangaOrgSlug}`) : null;
            const mangaUrl = mangaSlug && mangaSlug !== 'undefined'
              ? (mangaOrgPrefix ? `${mangaOrgPrefix}/manga/${mangaSlug}` : `/manga/${mangaSlug}`)
              : undefined;
            
            return {
              id: mangaSlug,
              title: m.title,
              cover: m.imageUrl || m.cover || '',
              scan: mangaOrg?.name || '',
              scanName: mangaOrg?.name || '',
              scanUrl: mangaOrgSlug ? `/${mangaOrgSlug}` : '',
              mangaUrl: mangaUrl,
              status: m.status || 'Ongoing',
              author: m.author?.name || m.author,
              genres: m.genres?.map((g: any) => g.name || g) || [],
              chapters: (m.chapters || m.lastChapters || []).map((ch: any) => ({
                ...ch,
                chapterUrl: ch._jointSlug
                  ? `/joint/manga/${ch._jointSlug}/chapters/${ch.number}`
                  : mangaSlug && mangaSlug !== 'undefined' && mangaOrgSlug
                  ? `${mangaOrgPrefix}/manga/${mangaSlug}/chapters/${ch.number}`
                  : '#',
              })),
              userHasSubscription: logged && user?.subscriptions?.some(
                (sub: any) => sub?.subscriptionPlan?.organizationId === mangaOrg?.id
              ) || false,
              isNSFW: m.isNSFW || mangaOrg?.isNSFW || false,
            };
          });
          setMangas(mappedMangas);
          setMaxPage(result.maxPage || 1);
        }
      } catch (error) {
        console.error('Error fetching mangas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMangas();
  }, [search, selectedStatus, selectedGenre, sortBy, authorSlug, page, organizationSlug, organization, user, logged]);

  // Load genres: from API for org-specific pages, from all loaded mangas for global
  useEffect(() => {
    if (isScanBranded) {
      // Org-specific: fetch from genre API
      const fetchGenres = async () => {
        try {
          const result = await callAPI('/api/genre');
          if (Array.isArray(result)) {
            setGenres(result.map((g: any) => g.name).sort());
          }
        } catch {
          // Fallback: extract from mangas
          const uniqueGenres = new Set<string>();
          mangas.forEach(manga => {
            manga.genres?.forEach(genre => uniqueGenres.add(genre));
          });
          setGenres(Array.from(uniqueGenres).sort());
        }
      };
      fetchGenres();
    }
  }, [organizationSlug, isScanBranded]);

  // For global search: accumulate genres from all loaded mangas
  useEffect(() => {
    if (!isScanBranded) {
      setGenres(prev => {
        const allGenres = new Set<string>(prev);
        mangas.forEach(manga => {
          manga.genres?.forEach(genre => allGenres.add(genre));
        });
        return Array.from(allGenres).sort();
      });
    }
  }, [mangas, isScanBranded]);


  const filteredMangas = useMemo(() => {
    // Solo filtros que no se aplican server-side
    return mangas.filter(manga => {
      const matchesScan = isScanBranded || selectedScan === 'All' || manga.scan === selectedScan;
      const matchesNSFW = showNSFW || !manga.isNSFW;
      return matchesScan && matchesNSFW;
    });
  }, [mangas, selectedScan, isScanBranded, showNSFW]);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {!isScanBranded ? (
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                  Explorar <span className="text-cyan-500">Biblioteca</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium">
                  Descubre las mejores historias.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-[0.3em]">
                  Catálogo Exclusivo
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Resultados de <span className="text-cyan-500">Búsqueda</span>
                </h2>
              </div>
            )}
            
            <div className={`relative flex-1 group transition-all duration-300 ${!isScanBranded ? 'max-w-xl' : 'max-w-2xl'}`}>
              <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-cyan-500 transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text"
                placeholder={`Buscar en ${selectedScan !== 'All' ? selectedScan : 'la biblioteca'}...`}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all shadow-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Active author pill — only shown when searching by author */}
          {authorSlug && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Autor:</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                {authorName || authorSlug}
                <button
                  onClick={() => setAuthorSlug('')}
                  className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-cyan-500/20 text-cyan-200 hover:text-white transition-colors"
                  title="Quitar filtro de autor"
                  aria-label="Quitar filtro de autor"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-zinc-400 mr-2 border-r border-zinc-800 pr-4">
              <SlidersHorizontal size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Filtros</span>
            </div>

            {!isScanBranded && scans.length > 0 && (
              <select 
                value={selectedScan}
                onChange={(e) => setSelectedScan(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
              >
                <option value="All">Todos los Scans</option>
                {scans.map(scan => <option key={scan.id} value={scan.name}>{scan.name}</option>)}
              </select>
            )}

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="All">Cualquier Estado</option>
              <option value="Ongoing">En publicación</option>
              <option value="Completed">Finalizado</option>
              <option value="Hiatus">En pausa</option>
            </select>

            {genres.length > 0 && (
              <select 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 hover:border-cyan-500/50 focus:outline-none transition-all cursor-pointer"
              >
                <option value="All">Géneros</option>
                {genres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
              </select>
            )}


            <div className="flex-1" />

            {/* Sort Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ordenar</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-cyan-500 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                <option value="latest">Últimos</option>
                <option value="popular">Popularidad</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info & View Toggle */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {loading ? 'Cargando...' : `${filteredMangas.length} Resultados encontrados`}
          </p>
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
                <div className="aspect-[2/3] bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMangas.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredMangas.map((manga) => (
                <MangaCard3D
                  user={user}
                  organization={organization}
                  key={manga.id}
                  nsfwMode={nsfwMode}
                  manga={{
                    ...manga,
                    // The DB stores status lowercase ("completed", "hiatus", "ongoing")
                    // but MangaCard3D's prop type is TitleCase. Normalize so a
                    // completed manga doesn't fall through to 'Ongoing' and end up
                    // displaying the "En emisión" badge.
                    status: ((): 'Ongoing' | 'Completed' | 'Hiatus' => {
                      const s = (manga.status || '').toLowerCase();
                      if (s === 'completed') return 'Completed';
                      if (s === 'hiatus') return 'Hiatus';
                      return 'Ongoing';
                    })(),
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredMangas.map((manga) => (
                <MangaListItem key={manga.id} manga={manga} hideScan={!!isScanBranded} nsfwMode={nsfwMode} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-700">
              <Filter size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-white uppercase italic">No se hallaron resultados</h3>
              <p className="text-zinc-500 text-sm">Intenta ajustar los filtros.</p>
            </div>
            <button 
              onClick={() => {
                setSearch('');
                if (!isScanBranded) setSelectedScan('All');
                setSelectedGenre('All');
                setSelectedStatus('All');
                setAuthorSlug('');
              }}
              className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] border-b border-cyan-500/30 pb-1 hover:border-cyan-500 transition-all"
            >
              Resetear Filtros
            </button>
          </div>
        )}

        {/* Joints Section — only shown when the user is browsing the unfiltered
            global catalog. Hidden as soon as any search/filter is active so the
            joints don't masquerade as "results" for a filter that returned 0. */}
        {!isScanBranded && !search && !authorSlug && selectedStatus === 'All' && selectedGenre === 'All' && selectedScan === 'All' && joints.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Mangas <span className="text-purple-400">Joint</span>
              </h2>
              <span className="bg-purple-500/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                Multi-scan
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {joints.map((joint: any) => (
                <a
                  key={joint.id}
                  href={`/joint/manga/${joint.slug}`}
                  className="group block bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <img
                      src={joint.imageUrl || 'https://via.placeholder.com/300x420'}
                      alt={joint.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-purple-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Joint
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-black text-xs uppercase italic tracking-tight truncate group-hover:text-purple-400 transition-colors">
                      {joint.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {(joint.members || []).slice(0, 3).map((m: any) => (
                        m.organization.logoUrl ? (
                          <img
                            key={m.organization.id}
                            src={m.organization.logoUrl}
                            alt={m.organization.name}
                            title={m.organization.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            key={m.organization.id}
                            className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[7px] text-zinc-400"
                            title={m.organization.name}
                          >
                            {m.organization.name[0]}
                          </div>
                        )
                      ))}
                      {(joint.members || []).length > 3 && (
                        <span className="text-zinc-500 text-[8px]">+{joint.members.length - 3}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {maxPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Página {page} de {maxPage}
            </span>
            <button
              onClick={() => setPage(p => Math.min(maxPage, p + 1))}
              disabled={page === maxPage}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExplorePage;

