import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Bookmark, X, SlidersHorizontal } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import SortableMangaList, { READING_STATUS_META, READING_STATUS_KEYS, type ReadingStatus } from './SortableMangaList';
import { callAPI } from '../../util/callApi';

interface Props {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  // When present, renders the list for this user slug. If the caller matches,
  // `isOwner` lets us use the authenticated endpoint (richer filters, reorder).
  // Otherwise we fall back to the public /api/user/profile/:slug/user-list
  // endpoint, which is read-only.
  profileSlug?: string;
  isOwner?: boolean;
}

type SortKey = 'order' | 'recent' | 'title';
type TypeKey = 'all' | 'manga' | 'joint';
type StatusKey = 'all' | 'ongoing' | 'completed' | 'hiatus' | 'dropped';
type FinishedKey = 'all' | 'yes' | 'no';
type ReadingStatusKey = 'all' | ReadingStatus;

const PAGE_SIZE = 10;

interface FilterState {
  search: string;
  sort: SortKey;
  type: TypeKey;
  status: StatusKey;
  readingStatus: ReadingStatusKey;
  scan: string;
  finished: FinishedKey;
  favoritesOnly: boolean;
  page: number;
}

const isReadingStatusKey = (v: string | null): v is ReadingStatusKey =>
  v === 'all' || v === 'READING' || v === 'PLAN_TO_READ' || v === 'COMPLETED' || v === 'PAUSED' || v === 'DROPPED';

const readQuery = (): FilterState => {
  if (typeof window === 'undefined') return { search: '', sort: 'order', type: 'all', status: 'all', readingStatus: 'all', scan: '', finished: 'all', favoritesOnly: false, page: 1 };
  const p = new URLSearchParams(window.location.search);
  const sort = p.get('sort');
  const type = p.get('type');
  const status = p.get('status');
  const finished = p.get('finished');
  const rs = p.get('readingStatus');
  return {
    search: p.get('q') || '',
    sort: (sort === 'recent' || sort === 'title' || sort === 'order') ? sort : 'order',
    type: (type === 'manga' || type === 'joint') ? type : 'all',
    status: (status === 'ongoing' || status === 'completed' || status === 'hiatus' || status === 'dropped') ? status : 'all',
    readingStatus: isReadingStatusKey(rs) ? rs : 'all',
    scan: p.get('scan') || '',
    finished: (finished === 'yes' || finished === 'no') ? finished : 'all',
    favoritesOnly: p.get('favs') === '1',
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
  };
};

const writeQuery = (s: FilterState) => {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (s.search) p.set('q', s.search);
  if (s.sort !== 'order') p.set('sort', s.sort);
  if (s.type !== 'all') p.set('type', s.type);
  if (s.status !== 'all') p.set('status', s.status);
  if (s.readingStatus !== 'all') p.set('readingStatus', s.readingStatus);
  if (s.scan) p.set('scan', s.scan);
  if (s.finished !== 'all') p.set('finished', s.finished);
  if (s.favoritesOnly) p.set('favs', '1');
  if (s.page > 1) p.set('page', String(s.page));
  const qs = p.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? '?' + qs : ''}`);
};

const UserListPage: React.FC<Props> = ({ user, logged, nsfwMode = false, profileSlug, isOwner: isOwnerProp }) => {
  // Derive ownership client-side as a safety net (the Astro page already computed it,
  // but the prop may be stale if navigating client-side in the future).
  const isOwner = !!(isOwnerProp ?? (logged && user && profileSlug && user.slug === profileSlug));
  // Non-owners can't reorder or use filters beyond what the public endpoint returns.
  const usePublicEndpoint = !isOwner && !!profileSlug;
  const initial = useMemo(readQuery, []);
  const [search, setSearch] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [type, setType] = useState<TypeKey>(initial.type);
  const [status, setStatus] = useState<StatusKey>(initial.status);
  const [readingStatus, setReadingStatus] = useState<ReadingStatusKey>(initial.readingStatus);
  const [scan, setScan] = useState<string>(initial.scan);
  const [finished, setFinished] = useState<FinishedKey>(initial.finished);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(initial.favoritesOnly);
  const [page, setPage] = useState(initial.page);
  // Panel de filtros colapsable en móvil (siempre visible en desktop)
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Scan list for the filter dropdown — derived from whichever scans the user already has in their list.
  const [availableScans, setAvailableScans] = useState<{ slug: string; name: string }[]>([]);

  // Set of "favorited" resource keys (`m:${mangaCustomId}` / `j:${jointId}`). Used to
  // cross-reference each list entry — the star next to each row lights up when its
  // underlying manga/joint is also in the user's favorites.
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const favKey = (e: any) =>
    e.joint ? `j:${e.joint.id || e.jointId}` :
    e.mangaCustom ? `m:${e.mangaCustom.id || e.mangaCustomId}` :
    (e.jointId ? `j:${e.jointId}` : (e.mangaCustomId ? `m:${e.mangaCustomId}` : null));

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, sort, type, status, readingStatus, scan, finished, favoritesOnly]);

  // Fetch list — owner uses authenticated endpoint (full filters + reorder);
  // visitors use the read-only public endpoint and filter client-side.
  useEffect(() => {
    if (!profileSlug) return;
    const run = async () => {
      setLoading(true);
      try {
        if (usePublicEndpoint) {
          const API_URL = import.meta.env.PUBLIC_API_URL;
          // Pull the whole list in one go (capped at 500) — visitor filtering
          // happens client-side so we avoid a round-trip per pill click.
          const r = await fetch(`${API_URL}/api/user/profile/${profileSlug}/user-list?limit=500`);
          const json = await r.json();
          const items = json?.data?.items ?? [];

          // For the favoritesOnly pill on a visitor view, cross-reference against
          // the visited user's public favorites (one shot).
          let visitorFavKeys: Set<string> | null = null;
          if (favoritesOnly) {
            try {
              const rf = await fetch(`${API_URL}/api/user/profile/${profileSlug}/favorites?limit=500`);
              const fj = await rf.json();
              const favItems = fj?.data?.items ?? [];
              visitorFavKeys = new Set<string>();
              for (const f of favItems) {
                if (f.mangaCustomId || f.mangaCustom?.id) visitorFavKeys.add(`m:${f.mangaCustomId ?? f.mangaCustom.id}`);
                if (f.jointId || f.joint?.id) visitorFavKeys.add(`j:${f.jointId ?? f.joint.id}`);
              }
            } catch {}
          }

          const filtered = items.filter((e: any) => {
            if (type === 'manga' && !e.mangaCustom) return false;
            if (type === 'joint' && !e.joint) return false;
            if (status !== 'all' && e.mangaCustom && e.mangaCustom.status !== status) return false;
            if (readingStatus !== 'all' && (e.readingStatus || 'READING') !== readingStatus) return false;
            if (scan && e.mangaCustom?.organization?.slug !== scan) return false;
            if (finished === 'yes' && !e.finishedAt) return false;
            if (finished === 'no' && e.finishedAt) return false;
            if (favoritesOnly && visitorFavKeys) {
              const k = favKey(e);
              if (!k || !visitorFavKeys.has(k)) return false;
            }
            if (debouncedSearch) {
              const t = (e.mangaCustom?.title || e.joint?.title || '').toLowerCase();
              if (!t.includes(debouncedSearch.toLowerCase())) return false;
            }
            return true;
          });

          // Local sort
          if (sort === 'title') {
            filtered.sort((a: any, b: any) => {
              const at = (a.mangaCustom?.title || a.joint?.title || '').toLowerCase();
              const bt = (b.mangaCustom?.title || b.joint?.title || '').toLowerCase();
              return at.localeCompare(bt);
            });
          } else if (sort === 'recent') {
            filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          // else: 'order' is already how the endpoint returns them

          const pagedCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
          const start = (page - 1) * PAGE_SIZE;
          setEntries(filtered.slice(start, start + PAGE_SIZE));
          setTotal(filtered.length);
          setMaxPage(pagedCount);
        } else if (isOwner) {
          const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
          if (debouncedSearch) qs.set('search', debouncedSearch);
          if (type !== 'all') qs.set('type', type);
          if (status !== 'all') qs.set('status', status);
          if (readingStatus !== 'all') qs.set('readingStatus', readingStatus);
          if (scan) qs.set('scanSlug', scan);
          if (finished !== 'all') qs.set('finished', finished);
          if (favoritesOnly) qs.set('favoritesOnly', '1');

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
    writeQuery({ search: debouncedSearch, sort, type, status, readingStatus, scan, finished, favoritesOnly, page });
  }, [debouncedSearch, sort, type, status, readingStatus, scan, finished, favoritesOnly, page, profileSlug, isOwner, usePublicEndpoint]);

  // Populate the scan-filter dropdown from a single full pass on mount.
  // Uses limit=500 — profile lists are small and this only runs once.
  useEffect(() => {
    if (!profileSlug) return;
    (async () => {
      try {
        let items: any[] = [];
        if (usePublicEndpoint) {
          const API_URL = import.meta.env.PUBLIC_API_URL;
          const r = await fetch(`${API_URL}/api/user/profile/${profileSlug}/user-list?limit=500`);
          const json = await r.json();
          items = json?.data?.items ?? [];
        } else if (isOwner) {
          const result = await callAPI('/api/user-list?limit=500');
          items = result?.items ?? [];
        }
        const scans = new Map<string, string>();
        for (const it of items) {
          const org = it?.mangaCustom?.organization;
          if (org?.slug) scans.set(org.slug, org.name || org.slug);
        }
        setAvailableScans(Array.from(scans.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {}
    })();
  }, [profileSlug, isOwner, usePublicEndpoint]);

  // Load all of the user's favorites once so we can light up the star on rows that
  // are double-listed (both in their 'lista' and their favorites). Refetch when
  // the viewed profile changes.
  const reloadFavoriteKeys = async () => {
    if (!profileSlug) return;
    try {
      let items: any[] = [];
      if (isOwner) {
        const result = await callAPI('/api/favorites?limit=500');
        items = result?.items ?? [];
      } else if (usePublicEndpoint) {
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const r = await fetch(`${API_URL}/api/user/profile/${profileSlug}/favorites?limit=500`);
        const json = await r.json();
        items = json?.data?.items ?? [];
      }
      const s = new Set<string>();
      for (const f of items) {
        if (f.mangaCustomId || f.mangaCustom?.id) s.add(`m:${f.mangaCustomId ?? f.mangaCustom.id}`);
        if (f.jointId || f.joint?.id) s.add(`j:${f.jointId ?? f.joint.id}`);
      }
      setFavoriteKeys(s);
    } catch {}
  };
  useEffect(() => { reloadFavoriteKeys(); }, [profileSlug, isOwner, usePublicEndpoint]);

  const handleReorder = async (newIds: number[]) => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    setEntries(newIds.map((id, i) => ({ ...byId.get(id), order: i + 1 })));
    try {
      await callAPI('/api/user-list/reorder', { method: 'PATCH', body: JSON.stringify({ ids: newIds }) });
    } catch (e) {
      console.error('Error saving order:', e);
    }
  };

  const handleToggleFinished = async (entry: any, next: boolean) => {
    const before = entries;
    const now = next ? new Date().toISOString() : null;
    setEntries(entries.map((e: any) => e.id === entry.id ? { ...e, finishedAt: now } : e));
    try {
      await callAPI(`/api/user-list/${entry.id}/finished`, {
        method: 'PATCH',
        body: JSON.stringify({ finished: next }),
      });
    } catch (e) {
      console.error('Error toggling finished:', e);
      setEntries(before);
    }
  };

  const handleChangeReadingStatus = async (entry: any, next: ReadingStatus) => {
    const before = entries;
    setEntries(entries.map((e: any) => e.id === entry.id ? {
      ...e,
      readingStatus: next,
      finishedAt: next === 'COMPLETED' ? (e.finishedAt || new Date().toISOString()) : null,
    } : e));
    try {
      await callAPI(`/api/user-list/${entry.id}/reading-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
    } catch (e) {
      console.error('Error changing reading status:', e);
      setEntries(before);
    }
  };

  // Toggle the manga/joint in the user's favorites (add/remove). The underlying
  // endpoints are per-slug (not per-favorite-id), so we derive the right one.
  const handleToggleFavorite = async (entry: any, next: boolean) => {
    const key = favKey(entry);
    if (!key) return;
    const slug = entry.joint?.slug || entry.mangaCustom?.manga?.slug;
    if (!slug) return;
    const endpoint = entry.joint
      ? `/api/joint/${slug}/favorite`
      : `/api/favorites/manga-custom/${slug}`;

    // Optimistic update on the cached Set
    const before = new Set(favoriteKeys);
    const nextSet = new Set(favoriteKeys);
    if (next) nextSet.add(key); else nextSet.delete(key);
    setFavoriteKeys(nextSet);

    try {
      await callAPI(endpoint, { method: next ? 'POST' : 'DELETE' });
    } catch (e: any) {
      console.error('Error toggling favorite:', e);
      setFavoriteKeys(before);
    }
  };

  const clearAll = () => {
    setSearch('');
    setSort('order');
    setType('all');
    setFinished('all');
    setFavoritesOnly(false);
    setStatus('all');
    setReadingStatus('all');
    setScan('');
  };

  const hasFilters = !!debouncedSearch || sort !== 'order' || type !== 'all' || status !== 'all' || readingStatus !== 'all' || !!scan || finished !== 'all' || favoritesOnly;
  // Cuenta solo los filtros del panel colapsable (búsqueda y orden viven en la
  // barra sticky, no suman al contador del botón Filtros).
  const activeFilterCount = [
    type !== 'all',
    status !== 'all',
    readingStatus !== 'all',
    !!scan,
    finished !== 'all',
    favoritesOnly,
  ].filter(Boolean).length;
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
              <Bookmark size={10} /> {isOwner ? 'Biblioteca personal' : `Lista pública de @${profileSlug}`}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {isOwner ? <>Mi <span className="text-cyan-500">Lista</span></> : <>Lista de <span className="text-cyan-500">@{profileSlug}</span></>}
            </h1>
            <p className="mt-3 text-zinc-500 max-w-2xl text-base">
              {total > 0
                ? (isOwner
                  ? `${total} ${total === 1 ? 'manga guardado' : 'mangas guardados'}. Busca, filtra y reordena arrastrando.`
                  : `${total} ${total === 1 ? 'manga guardado' : 'mangas guardados'}. Busca y filtra para explorar.`)
                : (isOwner
                  ? 'Aún no tienes mangas en tu lista. Agrégalos desde la página de cada manga.'
                  : 'Este usuario aún no tiene mangas en su lista.')}
            </p>
          </div>
        </section>

        {/* Controls: barra compacta, la única parte sticky. En móvil los filtros
            viven en el panel colapsable de abajo para no tapar las tarjetas. */}
        <section className="border-b border-zinc-900 bg-zinc-950 sticky top-16 z-20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3">
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
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-colors ${
                    filtersOpen
                      ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                      : 'border-zinc-800 text-zinc-400 bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  {filtersOpen ? 'Ocultar' : 'Filtros'}
                  {!filtersOpen && activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-zinc-950 text-[9px]">{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Panel de filtros: colapsable en móvil (empuja el contenido, no es
            overlay ni sticky), siempre visible en desktop. */}
        <section className={`border-b border-zinc-900 bg-zinc-950 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 space-y-3">
            {/* Reading status pills — the user's own classification (owner-only filter) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mr-1">Mi estado</span>
              <FilterPill label="Todos" active={readingStatus === 'all'} onClick={() => setReadingStatus('all')} />
              {READING_STATUS_KEYS.map((k) => {
                const m = READING_STATUS_META[k];
                const active = readingStatus === k;
                return (
                  <button
                    key={k}
                    onClick={() => setReadingStatus(active ? 'all' : k)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      active
                        ? `${m.bg} ${m.text} ${m.border} shadow-lg`
                        : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                );
              })}
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
              <span className="w-px h-5 bg-zinc-800 mx-1" />
              <FilterPill label="★ Solo favoritos" active={favoritesOnly} onClick={() => setFavoritesOnly(v => !v)} />
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
                entries={entries
                  .filter((e: any) => {
                    const src = e.joint || e.mangaCustom || e;
                    const isNSFW = src.isNSFW || src.organization?.isNSFW || false;
                    return nsfwMode ? isNSFW : !isNSFW;
                  })
                  .map((e: any) => {
                    const k = favKey(e);
                    return { ...e, isFavorite: !!(k && favoriteKeys.has(k)) };
                  })}
                isOwner={isOwner}
                nsfwMode={nsfwMode}
                // Reorder only makes sense for the owner on the default 'Mi orden' sort.
                onReorder={isOwner && sort === 'order' ? handleReorder : undefined}
                onToggleFinished={isOwner ? handleToggleFinished : undefined}
                onChangeReadingStatus={isOwner ? handleChangeReadingStatus : undefined}
                showFavoriteIndicator
                onToggleFavorite={isOwner ? handleToggleFavorite : undefined}
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
