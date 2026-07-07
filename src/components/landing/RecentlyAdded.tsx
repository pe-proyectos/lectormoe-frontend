import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Manga } from '../../util/landing/types';
import MangaCard3D from './MangaCard3D';
import ScrollableCardRow from './ScrollableCardRow';
import { callAPI } from '../../util/callApi';

interface RecentlyAddedProps {
  user?: any;
  logged?: boolean;
  organization?: any;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ user, organization, nsfwMode = false, contentKind }) => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(false);
      const ckParam = contentKind ? `&contentKind=${contentKind}` : '';
      const result = await callAPI(`/api/landing/recently-added?limit=10&nsfw=${nsfwMode}${ckParam}`);
      setMangas(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error('Error fetching recently added:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [nsfwMode, contentKind]);

  if (!loading && !error && mangas.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Sparkles size={12} fill="currentColor" /> Recién llegados
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Últimos Añadidos</h2>
        </div>
      </div>

      {error ? (
        <div className="py-10 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
          <p className="text-zinc-500 text-sm font-bold mb-3">No se pudo cargar esta sección</p>
          <button onClick={load} className="text-cyan-400 hover:text-cyan-300 text-[10px] font-black uppercase tracking-widest">Reintentar</button>
        </div>
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
            mangas.map((manga) => (
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
                  mangaUrl: manga.mangaUrl && !manga.mangaUrl.includes('undefined') ? manga.mangaUrl : undefined,
                  status: 'Ongoing',
                  chapters: [],
                  organizationId: (manga as any).organizationId,
                  isNSFW: (manga as any).isNSFW || false,
                }}
                onClick={() => { if (manga.mangaUrl) window.location.href = manga.mangaUrl; }}
              />
            ))
          )}
        </ScrollableCardRow>
      )}
    </section>
  );
};

export default RecentlyAdded;
