import React, { useState, useEffect } from 'react';
import type { Manga } from '../../util/landing/types';
import MangaCard3D from './MangaCard3D';
import { callAPI } from '../../util/callApi';

interface PopularTodayProps {
  user?: any;
  logged?: boolean;
  organization?: any;
  nsfwMode?: boolean;
}

const PopularToday: React.FC<PopularTodayProps> = ({ user, logged, organization, nsfwMode = false }) => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await callAPI(`/api/landing/popular-today?limit=5&nsfw=${nsfwMode}`);
        if (Array.isArray(result)) setMangas(result);
      } catch (error) {
        console.error('Error fetching popular today:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [nsfwMode]);

  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
            <div className="aspect-[2/3] bg-zinc-800" />
            <div className="p-4 bg-zinc-900/90">
              <div className="h-4 bg-zinc-800 rounded mb-2" />
              <div className="h-3 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (mangas.length === 0) return null;

  return (
    <>
      {mangas.map((manga) => {
        const userHasSubscription =
          (logged && manga.organizationId && user?.subscriptions?.some(
            (sub: any) => sub.active === true && sub?.subscriptionPlan?.organizationId === manga.organizationId,
          )) || false;

        const chaptersWithReadStatus = manga.chapters?.map((chapter) => {
          const isRead =
            (logged && user?.history?.some(
              (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt,
            )) || false;
          return { ...chapter, isRead };
        });

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
              mangaUrl:
                manga.mangaUrl && !manga.mangaUrl.includes('undefined')
                  ? manga.mangaUrl
                  : manga.scanSlug && manga.mangaSlug && manga.mangaSlug !== 'undefined'
                  ? `/${manga.scanSlug}/manga/${manga.mangaSlug}`
                  : undefined,
              status: 'Ongoing',
              chapters: chaptersWithReadStatus,
              userHasSubscription,
              organizationId: (manga as any).organizationId,
              subscriptionPlansCanReadUnreleased: (manga as any).subscriptionPlansCanReadUnreleased,
              subscriptionPlansCanReadReleased: (manga as any).subscriptionPlansCanReadReleased,
              isNSFW: (manga as any).isNSFW || false,
            }}
            onClick={() => {
              const url =
                manga.mangaUrl ||
                (manga.scanSlug && manga.mangaSlug ? `/${manga.scanSlug}/manga/${manga.mangaSlug}` : manga.scanUrl);
              if (url) window.location.href = url;
            }}
          />
        );
      })}
    </>
  );
};

export default PopularToday;
