import React, { useState, useEffect } from 'react';
import { Dices } from 'lucide-react';
import MangaCard3D from './MangaCard3D';
import ScrollableCardRow from './ScrollableCardRow';
import { callAPI } from '../../util/callApi';
import { nsfwUrl } from '../../util/nsfw-url';

interface DailyPicksProps {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

// Recomendaciones de la página: 12 obras al azar que cambian cada día a las
// 00:00 (hora de Lima), sin mirar lecturas, comentarios ni popularidad.
const DailyPicks: React.FC<DailyPicksProps> = ({ user, nsfwMode = false, contentKind }) => {
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ckParam = contentKind ? `&contentKind=${contentKind}` : '';
    setLoading(true);
    callAPI(`/api/landing/featured-manga?limit=12&nsfw=${nsfwMode}&sort=daily${ckParam}`)
      .then((result) => setMangas(Array.isArray(result) ? result : []))
      .catch((e) => console.error('Error fetching daily picks:', e))
      .finally(() => setLoading(false));
  }, [nsfwMode, contentKind]);

  if (!loading && mangas.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-8">
      <div className="space-y-1 mb-8">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-[0.2em] text-[10px]">
          <Dices size={12} /> Cambian cada día
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Recomendaciones de hoy</h2>
      </div>

      <ScrollableCardRow desktopCols="sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6">
        {loading
          ? [...Array(12)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
                <div className="aspect-[2/3] bg-zinc-800" />
                <div className="p-4"><div className="h-4 bg-zinc-800 rounded mb-2" /><div className="h-3 bg-zinc-800 rounded" /></div>
              </div>
            ))
          : mangas.map((manga) => {
              const mUrl = nsfwUrl(manga.mangaUrl, nsfwMode);
              return (
                <MangaCard3D
                  key={manga.id}
                  user={user}
                  nsfwMode={nsfwMode}
                  manga={{
                    id: manga.id,
                    title: manga.title,
                    cover: manga.cover,
                    scan: manga.scanName,
                    scanName: manga.scanName,
                    scanUrl: manga.scanUrl,
                    mangaUrl: mUrl,
                    status: 'Ongoing',
                    chapters: [],
                    isNSFW: nsfwMode
                  }}
                  onClick={() => { if (mUrl) window.location.href = mUrl; }}
                />
              );
            })}
      </ScrollableCardRow>
    </section>
  );
};

export default DailyPicks;
