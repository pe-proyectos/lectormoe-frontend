import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import ScanHero from "./ScanHero";
import ScanStatsBar from "./ScanStatsBar";
import ScanTopThree from "./ScanTopThree";
import ScanPopular24h from "./ScanPopular24h";
import ScanRecentUpdates from "./ScanRecentUpdates";
import ScanSidebar from "./ScanSidebar";
import Footer from "./Footer";
import { callAPI } from "../../util/callApi";

interface ScanLandingProps {
  // Required props
  organization: any;
  
  // Optional props
  user?: any;
  logged?: boolean;
}

const ScanLanding: React.FC<ScanLandingProps> = ({
  organization,
  user,
  logged,
}) => {
  // Get user permissions for the current organization
  const userPermissions = user?.permissions?.find(
    (permission: any) => permission.organizationId === organization?.id
  ) || {};
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
    const userHasSubscription =
      (logged &&
        user?.subscriptions?.some(
          (sub: any) =>
            sub?.subscriptionPlan?.organizationId === organization?.id
        )) ||
      false;

    // Check if user has read each chapter
    // El API devuelve 'chapters' (no 'lastChapters'), así que usamos 'chapters' con fallback a 'lastChapters' para compatibilidad
    const chaptersWithReadStatus = (m.chapters || m.lastChapters || []).map(
      (chapter: any) => {
        const isRead =
          (logged &&
            user?.history?.some(
              (historyItem: any) =>
                historyItem.chapterId === chapter.id && historyItem.finishedAt
            )) ||
          false;

        // El slug está en m.manga.slug (relación anidada del mangaCustom)
        const mangaSlug = m.manga?.slug || m.slug || m.id;
        
        return {
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          releasedAt: chapter.releasedAt,
          subscribersOnly: chapter.subscribersOnly,
          chapterUrl: mangaSlug && mangaSlug !== 'undefined' 
            ? `/${organization?.slug}/manga/${mangaSlug}/chapters/${chapter.number}`
            : '#',
          isRead,
        };
      }
    );

    // El slug está en m.manga.slug (relación anidada del mangaCustom)
    const mangaSlug = m.manga?.slug || m.slug || m.id;
    const mangaUrl = mangaSlug && mangaSlug !== 'undefined' 
      ? `/${organization?.slug}/manga/${mangaSlug}`
      : undefined;

    return {
      id: mangaSlug,
      title: m.title,
      cover: m.imageUrl || m.cover || "",
      scan: organization?.name || "",
      scanName: organization?.name || "",
      scanUrl: `/${organization?.slug}`,
      mangaUrl: mangaUrl,
      status: m.status || "Ongoing",
      chapters: chaptersWithReadStatus,
      userHasSubscription: userHasSubscription || false,
    };
  };

  // Fetch all mangas in parallel for better performance
  useEffect(() => {
    const fetchAllMangas = async () => {
      if (!organization || !organization?.slug) return;

      // Set all loading states
      setLoadingHero(true);
      setLoadingTopThree(true);
      setLoadingPopular(true);
      setLoadingRecent(true);

      try {
        // Fetch all data in parallel
        const [heroResult, topThreeResult, popularResult, recentResult] =
          await Promise.allSettled([
            callAPI('/api/manga-custom?order=latest&limit=5'),
            callAPI('/api/manga-custom?order=featured&limit=3'),
            callAPI('/api/manga-custom?order=popular&limit=9'),
            callAPI('/api/manga-custom?order=latest&limit=18'),
          ]);

        // Process hero mangas
        if (heroResult.status === "fulfilled" && heroResult.value && typeof heroResult.value === 'object' && !Array.isArray(heroResult.value) && Array.isArray(heroResult.value.items)) {
          setFeaturedMangas(
            heroResult.value.items.map((m: any) => {
              const mangaSlug = m.manga?.slug || m.slug || m.id;
              return {
                id: mangaSlug,
                title: m.title,
                cover: m.bannerUrl || m.imageUrl || "",
                description: m.shortDescription || m.description || "",
                chapter: "Cap. 01",
                status: m.status || "Ongoing",
                demography: m.demography?.name || null,
              };
            })
          );
        } else if (heroResult.status === "rejected") {
          console.error("Error fetching hero mangas:", heroResult.reason);
        }

        // Process top three mangas
        if (topThreeResult.status === "fulfilled" && topThreeResult.value && typeof topThreeResult.value === 'object' && !Array.isArray(topThreeResult.value) && Array.isArray(topThreeResult.value.items)) {
          setTopThreeMangas(
            topThreeResult.value.items.map((m: any) => {
              const mangaSlug = m.manga?.slug || m.slug || m.id;
              return {
                id: mangaSlug,
                title: m.title,
                cover: m.bannerUrl || m.imageUrl || "",
                description: m.shortDescription || "",
                chapter: "Cap. 01",
                status: m.status || "Ongoing",
                views: m.views || 0,
              };
            })
          );
        } else if (topThreeResult.status === "rejected") {
          console.error(
            "Error fetching top three mangas:",
            topThreeResult.reason
          );
        }

        // Process popular mangas
        if (popularResult.status === "fulfilled" && popularResult.value && typeof popularResult.value === 'object' && !Array.isArray(popularResult.value) && Array.isArray(popularResult.value.items)) {
          setPopular24h(
            popularResult.value.items.map((m: any) => mapMangaData(m))
          );
        } else if (popularResult.status === "rejected") {
          console.error("Error fetching popular mangas:", popularResult.reason);
        }

        // Process recent updates
        if (recentResult.status === "fulfilled" && recentResult.value && typeof recentResult.value === 'object' && !Array.isArray(recentResult.value) && Array.isArray(recentResult.value.items)) {
          setRecentUpdates(
            recentResult.value.items.map((m: any) => mapMangaData(m))
          );
        } else if (recentResult.status === "rejected") {
          console.error("Error fetching recent mangas:", recentResult.reason);
        }
      } catch (error) {
        console.error("Error fetching mangas:", error);
      } finally {
        // Set all loading states to false
        setLoadingHero(false);
        setLoadingTopThree(false);
        setLoadingPopular(false);
        setLoadingRecent(false);
      }
    };

    fetchAllMangas();
  }, [organization, logged, user]);

  const handleGoToSub = () => {
    window.location.href = `/${organization?.slug}/subscriptions`;
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
        onOpenRegister={() => navigateTo(`/${organization?.slug}/register`)}
        onOpenLogin={() => navigateTo(`/${organization?.slug}/login`)}
        onGoHome={() => navigateTo(`/${organization?.slug}`)}
        onGoExplore={() => navigateTo("/scans")}
        onGoSearch={() => navigateTo(`/${organization?.slug}/search`)}
        onGoSubscriptions={handleGoToSub}
        activeView="scan"
        user={user}
        logged={logged}
        activeScan={organization}
        organization={organization}
      />

      {/* Hero with independent skeleton */}
      {loadingHero ? (
        <div className="relative h-[450px] md:h-[650px] w-full bg-zinc-900 animate-pulse" />
      ) : (
        <ScanHero mangas={featuredMangas} organization={organization} />
      )}

      <ScanStatsBar
        organization={organization}
        user={user}
        logged={logged}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
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
          <ScanTopThree
            mangas={topThreeMangas}
            organization={organization}
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-8 space-y-20">
            {/* Popular 24h with independent skeleton */}
            {loadingPopular ? (
              <div className="space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
                <div className="w-full h-0.5 bg-zinc-800" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse"
                    >
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
              <ScanPopular24h
                mangas={popular24h}
                user={user}
                organization={organization}
              />
            )}

            {/* Recent Updates with independent skeleton */}
            {loadingRecent ? (
              <div className="space-y-6">
                <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
                <div className="w-full h-0.5 bg-zinc-800" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(18)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 animate-pulse"
                    >
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
                user={user}
                organization={organization}
              />
            )}
          </div>

          {/* SIDEBAR DERECHO */}
          <ScanSidebar
            onSubscribeClick={handleGoToSub}
            user={user}
            logged={logged}
            organization={organization}
            discordUrl={organization?.discordUrl}
          />
        </div>
      </div>

      <Footer
        organization={organization}
        onNavigate={(page) => {
          if (page === "explore") navigateTo("/scans");
          else if (page === "home") navigateTo("/");
        }}
      />
    </div>
  );
};

export default ScanLanding;
