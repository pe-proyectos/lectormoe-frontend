import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import type { Manga } from '../../util/landing/types';
import MangaCard3D from './MangaCard3D';
import ScrollableCardRow from './ScrollableCardRow';
import { callAPI } from '../../util/callApi';
import { nsfwUrl } from '../../util/nsfw-url';

interface TrendingSectionProps {
  user?: any;
  logged?: boolean;
  organization?: any;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

type Period = 'day' | 'week' | 'month';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const TrendingSection: React.FC<TrendingSectionProps> = ({ user, logged, organization, nsfwMode = false, contentKind }) => {
  const [period, setPeriod] = useState<Period>('day');
  const [cache, setCache] = useState<Record<string, Manga[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cacheKey = `${period}:${nsfwMode}:${contentKind}`;

  const load = async () => {
    if (cache[cacheKey]) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(false);
      const ckParam = contentKind ? `&contentKind=${contentKind}` : '';
      const result = await callAPI(`/api/landing/trending?period=${period}&limit=10&nsfw=${nsfwMode}${ckParam}`);
      setCache((prev) => ({ ...prev, [cacheKey]: Array.isArray(result) ? result : [] }));
    } catch (e) {
      console.error('Error fetching trending:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, nsfwMode, contentKind]);

  const mangas = cache[cacheKey] || [];

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 pt-16 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Flame size={12} fill="currentColor" /> Tendencias Globales
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Tendencias</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1.5 self-start md:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p.key ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="py-10 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
          <p className="text-zinc-500 text-sm font-bold mb-3">No se pudo cargar esta sección</p>
          <button onClick={load} className="text-cyan-400 hover:text-cyan-300 text-[10px] font-black uppercase tracking-widest">Reintentar</button>
        </div>
      ) : (
        <div className="min-h-[280px]">
          {!loading && mangas.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center">Sin datos para este período.</p>
          ) : (
          <ScrollableCardRow desktopCols="sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
                  <div className="aspect-[2/3] bg-zinc-800" />
                  <div className="p-4"><div className="h-4 bg-zinc-800 rounded mb-2" /><div className="h-3 bg-zinc-800 rounded" /></div>
                </div>
              ))
            ) : (
              mangas.map((manga) => {
                const userHasSubscription =
                  (logged && manga.organizationId && user?.subscriptions?.some(
                    (sub: any) => sub.active === true && sub?.subscriptionPlan?.organizationId === manga.organizationId,
                  )) || false;
                const mUrl = nsfwUrl(manga.mangaUrl && !manga.mangaUrl.includes('undefined') ? manga.mangaUrl : undefined, nsfwMode);
                return (
                  <MangaCard3D
                    user={user}
                    organization={organization}
                    nsfwMode={nsfwMode}
                    key={manga.id}
                    manga={{
                      id: manga.id,
                      title: manga.title,
                      cover: manga.cover,
                      scan: manga.scanName,
                      scanName: manga.scanName,
                      scanUrl: manga.scanUrl,
                      mangaUrl: mUrl,
                      status: 'Ongoing',
                      chapters: manga.chapters,
                      userHasSubscription,
                      organizationId: (manga as any).organizationId,
                      isNSFW: (manga as any).isNSFW || false,
                      views: (manga as any).views,
                    }}
                    onClick={() => { if (mUrl) window.location.href = mUrl; }}
                  />
                );
              })
            )}
          </ScrollableCardRow>
          )}
        </div>
      )}
    </section>
  );
};

export default TrendingSection;
