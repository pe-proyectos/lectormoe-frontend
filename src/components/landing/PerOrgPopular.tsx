import React, { useState, useEffect } from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import MangaCard3D from './MangaCard3D';

interface PerOrgPopularProps {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
}

interface OrgPopularData {
  organization: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  mangas: any[];
}

const PerOrgPopular: React.FC<PerOrgPopularProps> = ({ user, logged, nsfwMode = false }) => {
  const [orgData, setOrgData] = useState<OrgPopularData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerOrgPopular = async () => {
      try {
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/landing/per-org-popular?nsfw=${nsfwMode}`);
        const result = await response.json();

        if (result?.status === true && Array.isArray(result?.data)) {
          setOrgData(result.data);
        }
      } catch (error) {
        console.error('Error fetching per-org popular:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerOrgPopular();
  }, []);

  if (!loading && orgData.length === 0) return null;

  if (loading) {
    return (
      <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-16">
        <div className="space-y-1 mb-8">
          <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Flame size={12} fill="currentColor" /> Por Organizacion
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares por Scan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 animate-pulse">
              <div className="h-6 bg-zinc-800 rounded w-40 mb-6" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="aspect-[2/3] bg-zinc-800 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-16">
      <div className="space-y-1 mb-8">
        <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">
          <Flame size={12} fill="currentColor" /> Por Organizacion
        </div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares por Scan</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {orgData.map((item) => (
          <div
            key={item.organization.id}
            className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 hover:border-zinc-700 transition-colors"
          >
            {/* Org Header */}
            <div className="flex items-center justify-between mb-6">
              <a
                href={`/${item.organization.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  {item.organization.logoUrl ? (
                    <img
                      src={item.organization.logoUrl}
                      alt={item.organization.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-black text-sm">
                      {item.organization.name[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                  {item.organization.name}
                </h3>
              </a>
              <a
                href={`/${item.organization.slug}`}
                className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                Ver mas <ChevronRight size={12} />
              </a>
            </div>

            {/* Manga Grid */}
            <div className="grid grid-cols-3 gap-4">
              {item.mangas.map((manga: any) => {
                const orgSlug = item.organization.slug;
                const mangaSlug = manga.mangaSlug;

                const userHasSubscription = logged && user?.subscriptions?.some(
                  (sub: any) =>
                    sub.active === true &&
                    sub?.subscriptionPlan?.organizationId === item.organization.id
                ) || false;

                const chaptersWithReadStatus = (manga.chapters || []).map((chapter: any) => {
                  const isRead = logged && user?.history?.some(
                    (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt
                  ) || false;

                  return {
                    id: chapter.id,
                    number: chapter.number,
                    title: chapter.title,
                    releasedAt: chapter.releasedAt,
                    chapterUrl: `/${orgSlug}/manga/${mangaSlug}/chapters/${chapter.number}`,
                    isRead,
                  };
                });

                return (
                  <MangaCard3D
                    key={manga.id}
                    user={user}
                    organization={item.organization}
                    nsfwMode={nsfwMode}
                    manga={{
                      id: manga.id?.toString() || '',
                      title: manga.title,
                      cover: manga.imageUrl,
                      scan: item.organization.name,
                      scanName: item.organization.name,
                      scanUrl: `/${orgSlug}`,
                      mangaUrl: `/${orgSlug}/manga/${mangaSlug}`,
                      status: manga.status || 'Ongoing',
                      chapters: chaptersWithReadStatus,
                      userHasSubscription,
                      subscriptionPlansCanReadUnreleased: manga.subscriptionPlansCanReadUnreleased,
                      subscriptionPlansCanReadReleased: manga.subscriptionPlansCanReadReleased,
                      isNSFW: manga.isNSFW || false,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PerOrgPopular;
