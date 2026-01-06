import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ScanHero from './ScanHero';
import ScanStatsBar from './ScanStatsBar';
import ScanTopThree from './ScanTopThree';
import ScanPopular24h from './ScanPopular24h';
import ScanRecentUpdates from './ScanRecentUpdates';
import ScanSidebar from './ScanSidebar';
import Footer from './Footer';

interface ScanLandingProps {
  organization: any;
  organizationSlug: string;
  user?: any;
  logged?: boolean;
  userPermissions?: any;
}

const ScanLanding: React.FC<ScanLandingProps> = ({ organization, organizationSlug, user, logged, userPermissions }) => {
  const [featuredMangas, setFeaturedMangas] = useState<any[]>([]);
  const [topThreeMangas, setTopThreeMangas] = useState<any[]>([]);
  const [popular24h, setPopular24h] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingTopThree, setLoadingTopThree] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Helper function to map manga data
  const mapMangaData = (m: any) => {
    // Check if user has subscription to this organization
    const userHasSubscription = logged && user?.subscriptions?.some(
      (sub: any) => sub?.subscriptionPlan?.organizationId && organization?.id
    ) || false;

    // Check if user has read each chapter
    const chaptersWithReadStatus = (m.lastChapters || []).map((chapter: any) => {
      const isRead = logged && user?.history?.some(
        (historyItem: any) => historyItem.chapterId === chapter.id && historyItem.finishedAt
      ) || false;
      
      return {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        releasedAt: chapter.releasedAt,
        subscribersOnly: chapter.subscribersOnly,
        chapterUrl: `/${organizationSlug}/manga/${m.slug}/chapter/${chapter.number}`,
        isRead,
      };
    });

    return {
      id: m.slug || m.id,
      title: m.title,
      cover: m.imageUrl || m.cover || '',
      scan: organization?.name || '',
      scanName: organization?.name || '',
      scanUrl: `/${organizationSlug}`,
      mangaUrl: `/${organizationSlug}/manga/${m.slug}`,
      status: m.status || 'Ongoing',
      chapters: chaptersWithReadStatus,
      userHasSubscription: userHasSubscription || false,
    };
  };

  // Fetch hero mangas
  useEffect(() => {
    const fetchHeroMangas = async () => {
      try {
        setLoadingHero(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        const heroResponse = await fetch(`${API_URL}/api/manga-custom?order=latest&limit=5`, {
          headers: {
            'x-organization': organizationSlug,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const heroResult = await heroResponse.json();
        
        if (heroResult?.status === true && heroResult?.data?.data) {
          setFeaturedMangas(heroResult.data.data.map((m: any) => ({
            id: m.slug || m.id,
            title: m.title,
            cover: m.bannerUrl || m.imageUrl || '',
            description: m.shortDescription || m.description || '',
            chapter: 'Cap. 01',
            status: m.status || 'Ongoing',
            demography: m.demography?.name || null,
          })));
        }
      } catch (error) {
        console.error('Error fetching hero mangas:', error);
      } finally {
        setLoadingHero(false);
      }
    };

    if (organization && organizationSlug) {
      fetchHeroMangas();
    }
  }, [organization, organizationSlug]);

  // Fetch top 3 mangas
  useEffect(() => {
    const fetchTopThree = async () => {
      try {
        setLoadingTopThree(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        const topThreeResponse = await fetch(`${API_URL}/api/manga-custom?order=featured&limit=3`, {
          headers: {
            'x-organization': organizationSlug,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const topThreeResult = await topThreeResponse.json();
        
        if (topThreeResult?.status === true && topThreeResult?.data?.data) {
          setTopThreeMangas(topThreeResult.data.data.map((m: any) => ({
            id: m.slug || m.id,
            title: m.title,
            cover: m.imageUrl || m.cover || '',
            description: m.shortDescription || '',
            chapter: 'Cap. 01',
            status: m.status || 'Ongoing',
            views: m.views || 0,
          })));
        }
      } catch (error) {
        console.error('Error fetching top three mangas:', error);
      } finally {
        setLoadingTopThree(false);
      }
    };

    if (organization && organizationSlug) {
      fetchTopThree();
    }
  }, [organization, organizationSlug]);

  // Fetch popular 24h mangas
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        setLoadingPopular(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        const popularResponse = await fetch(`${API_URL}/api/manga-custom?order=popular&limit=9`, {
          headers: {
            'x-organization': organizationSlug,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const popularResult = await popularResponse.json();
        
        if (popularResult?.status === true && popularResult?.data?.data) {
          setPopular24h(popularResult.data.data.map((m: any) => mapMangaData(m)));
        }
      } catch (error) {
        console.error('Error fetching popular mangas:', error);
      } finally {
        setLoadingPopular(false);
      }
    };

    if (organization && organizationSlug) {
      fetchPopular();
    }
  }, [organization, organizationSlug, logged, user]);

  // Fetch recent updates mangas
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoadingRecent(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        const recentResponse = await fetch(`${API_URL}/api/manga-custom?order=latest&limit=18`, {
          headers: {
            'x-organization': organizationSlug,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const recentResult = await recentResponse.json();
        
        if (recentResult?.status === true && recentResult?.data?.data) {
          setRecentUpdates(recentResult.data.data.map((m: any) => mapMangaData(m)));
        }
      } catch (error) {
        console.error('Error fetching recent mangas:', error);
      } finally {
        setLoadingRecent(false);
      }
    };

    if (organization && organizationSlug) {
      fetchRecent();
    }
  }, [organization, organizationSlug, logged, user]);

  const handleGoToSub = () => {
    window.location.href = `/${organizationSlug}/subscriptions`;
  };

  const handleGoToExplore = () => {
    window.location.href = `/scans`;
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar 
        onOpenRegister={() => navigateTo(`/${organizationSlug}/register`)}
        onOpenLogin={() => navigateTo(`/${organizationSlug}/login`)}
        onGoHome={() => navigateTo(`/${organizationSlug}`)} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(`/${organizationSlug}/search`)}
        onGoSubscriptions={handleGoToSub}
        activeView="scan"
        user={user}
        logged={logged}
        activeScan={organization}
        userPermissions={userPermissions}
      />
      
      {/* Hero with independent skeleton */}
      {loadingHero ? (
        <div className="relative h-[450px] md:h-[650px] w-full bg-zinc-900 animate-pulse" />
      ) : (
        <ScanHero mangas={featuredMangas} organizationSlug={organizationSlug} />
      )}
      
      <ScanStatsBar 
        organization={organization} 
        organizationSlug={organizationSlug}
        user={user}
        logged={logged}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8 space-y-20">
            {/* Top Three with independent skeleton */}
            {loadingTopThree ? (
              <div className="space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 h-[650px] bg-zinc-900 rounded-[32px] border border-zinc-800 animate-pulse" />
                  <div className="lg:col-span-5 flex flex-col gap-6 h-[650px]">
                    <div className="flex-1 bg-zinc-900 rounded-[32px] border border-zinc-800 animate-pulse" />
                    <div className="flex-1 bg-zinc-900 rounded-[32px] border border-zinc-800 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <ScanTopThree mangas={topThreeMangas} organizationSlug={organizationSlug} />
            )}

            {/* Popular 24h with independent skeleton */}
            {loadingPopular ? (
              <div className="space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
                <div className="w-full h-0.5 bg-zinc-800" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
                      <div className="aspect-[2/3] bg-zinc-800" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-zinc-800 rounded" />
                        <div className="h-3 bg-zinc-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ScanPopular24h mangas={popular24h} userPermissions={userPermissions} />
            )}

            {/* Recent Updates with independent skeleton */}
            {loadingRecent ? (
              <div className="space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
                <div className="w-full h-0.5 bg-zinc-800" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse">
                      <div className="aspect-[2/3] bg-zinc-800" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-zinc-800 rounded" />
                        <div className="h-3 bg-zinc-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-14 bg-zinc-800 rounded-2xl w-64 mx-auto animate-pulse" />
              </div>
            ) : (
              <ScanRecentUpdates 
                mangas={recentUpdates} 
                onExploreClick={handleGoToExplore}
                organizationSlug={organizationSlug}
                userPermissions={userPermissions}
              />
            )}
          </div>

          {/* SIDEBAR DERECHO */}
          <ScanSidebar 
            onSubscribeClick={handleGoToSub}
            user={user}
            logged={logged}
            organizationSlug={organizationSlug}
            discordUrl={organization?.discordUrl}
          />
        </div>
      </div>

      <Footer 
        organization={organization}
        organizationSlug={organizationSlug}
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default ScanLanding;

