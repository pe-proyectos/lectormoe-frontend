import React, { useState, useEffect } from 'react';
import type { Manga } from '../../util/landing/types';
import { FEATURED_MANGA } from '../../util/landing/constants';
import { callAPI } from '../../util/callApi';
import MangaCard3D from './MangaCard3D';

interface FeaturedMangaProps {
  user?: any;
  logged?: boolean;
}

const FeaturedManga: React.FC<FeaturedMangaProps> = ({ user, logged }) => {
  const [featuredManga, setFeaturedManga] = useState<Manga[]>(FEATURED_MANGA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedManga = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/landing/featured-manga?limit=5`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result?.status === true && Array.isArray(result.data)) {
          setFeaturedManga(result.data);
        } else {
          console.warn('Featured manga response format unexpected:', result);
        }
      } catch (error) {
        console.error('Error fetching featured manga:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedManga();
  }, []);

  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
            <div className="aspect-[2/3] bg-zinc-800"></div>
            <div className="p-4 bg-zinc-900/90">
              <div className="h-4 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {featuredManga.map((manga) => {
        // Check if user has subscription to this specific organization/scan
        const userHasSubscription = logged && user?.subscriptions?.some(
          (sub: any) => sub?.subscriptionPlan?.organizationId && manga.scanSlug
        ) || false;

        // Check if user has read each chapter
        // Note: This would ideally come from the API, but for now we check user's history
        const chaptersWithReadStatus = manga.chapters?.map((chapter) => {
          const isRead = logged && user?.history?.some(
            (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt
          ) || false;
          
          return {
            ...chapter,
            isRead,
          };
        });

        return (
          <MangaCard3D
            key={manga.id}
            manga={{
              id: manga.id,
              title: manga.title,
              cover: manga.cover,
              scan: manga.scanName,
              scanName: manga.scanName,
              scanUrl: manga.scanUrl,
              mangaUrl: manga.mangaUrl || (manga.scanSlug && manga.mangaSlug ? `/${manga.scanSlug}/manga/${manga.mangaSlug}` : undefined),
              status: 'Ongoing',
              chapters: chaptersWithReadStatus,
              userHasSubscription: userHasSubscription || false,
            }}
            onClick={() => {
              // Prefer mangaUrl (direct link to manga page), fallback to scanUrl
              const url = manga.mangaUrl || (manga.scanSlug && manga.mangaSlug ? `/${manga.scanSlug}/manga/${manga.mangaSlug}` : manga.scanUrl);
              if (url) {
                window.location.href = url;
              }
            }}
          />
        );
      })}
    </>
  );
};

export default FeaturedManga;

