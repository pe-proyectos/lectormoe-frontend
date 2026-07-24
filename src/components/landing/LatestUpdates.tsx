import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MangaCard3D from './MangaCard3D';
import { callAPI } from '../../util/callApi';

interface LatestUpdatesProps {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

const WRITING_TYPES = new Set(['novel', 'light-novel', 'book', 'short-story']);

const LatestUpdates: React.FC<LatestUpdatesProps> = ({ user, logged, nsfwMode = false, contentKind }) => {
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        // The list endpoint uses ?type=<bookType.code>; for writings we still
        // want the union (all 4 codes). Without server-side OR support we just
        // ask the server unfiltered then filter client-side. Limit is generous.
        const result = await callAPI(`/api/manga-custom?order=latest&limit=30&nsfw=${nsfwMode}`);
        if (result && typeof result === 'object' && Array.isArray(result.items)) {
          let items = result.items;
          if (contentKind === 'writing') {
            items = items.filter((m: any) => WRITING_TYPES.has(m?.manga?.bookType?.code));
          } else if (contentKind === 'manga') {
            items = items.filter((m: any) => !WRITING_TYPES.has(m?.manga?.bookType?.code));
          }
          setMangas(items.map((m: any) => {
            const orgSlug = m.organization?.slug;
            const mangaSlug = m.manga?.slug || m.slug || m.id;
            const code = m?.manga?.bookType?.code;
            const isWritingItem = WRITING_TYPES.has(code);
            const urlPrefix = nsfwMode ? `/red/${orgSlug}` : `/${orgSlug}`;
            const writingsPrefix = nsfwMode ? `/red/writings/${orgSlug}` : `/writings/${orgSlug}`;
            const detailUrl = m._jointSlug
              ? `/joint/manga/${m._jointSlug}`
              : isWritingItem
              ? `${writingsPrefix}/${code}/${mangaSlug}`
              : `${urlPrefix}/manga/${mangaSlug}`;
            return {
              id: mangaSlug,
              title: m.title,
              cover: m.imageUrl || '',
              scanName: m.organization?.name || '',
              scanUrl: orgSlug ? `/${orgSlug}` : '',
              mangaUrl: orgSlug && mangaSlug ? detailUrl : undefined,
              status: m.status || 'Ongoing',
              chapters: (m.chapters || []).map((ch: any) => ({
                ...ch,
                chapterUrl: orgSlug && mangaSlug
                  ? (ch._jointSlug
                    ? `/joint/manga/${ch._jointSlug}/chapters/${ch.number}`
                    : isWritingItem
                    ? `${detailUrl}/chapter/${ch.number}`
                    : `${urlPrefix}/manga/${mangaSlug}/chapters/${ch.number}`)
                  : '#',
              })),
              organizationId: m.organization?.id,
              isNSFW: m.isNSFW || m.organization?.isNSFW || false,
              contentKind: isWritingItem ? 'writing' : 'manga',
              userHasSubscription: logged && user?.subscriptions?.some(
                (sub: any) => sub?.subscriptionPlan?.organizationId === m.organization?.id
              ) || false,
            };
          }));
        }
      } catch (error) {
        console.error('Error fetching latest updates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [nsfwMode, contentKind]);

  if (loading) {
    return (
      <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-16">
        <div className="space-y-1 mb-8">
          <div className="h-3 bg-zinc-800 rounded w-32 animate-pulse" />
          <div className="h-8 bg-zinc-800 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
              <div className="aspect-[2/3] bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-800 rounded" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (mangas.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            <RefreshCw size={12} /> Todos los scans
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
            Últimas Actualizaciones
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {mangas.map((manga) => (
          <MangaCard3D
            key={manga.id}
            user={user}
            manga={manga}
            nsfwMode={nsfwMode}
          />
        ))}
      </div>
    </section>
  );
};

export default LatestUpdates;
