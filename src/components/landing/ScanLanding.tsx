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
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

const WRITING_TYPES = new Set(['novel', 'light-novel', 'book', 'short-story']);

const ScanLanding: React.FC<ScanLandingProps> = ({
  organization,
  user,
  logged,
  nsfwMode = false,
  contentKind = 'manga',
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

  const orgPrefix = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;

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

    const code = m?.manga?.bookType?.code;
    const isWritingItem = WRITING_TYPES.has(code);
    const writingsPrefix = nsfwMode ? `/red/writings/${organization?.slug}` : `/writings/${organization?.slug}`;
    const detailBase = isWritingItem ? `${writingsPrefix}/${code}` : `${orgPrefix}/manga`;
    const chapterPathSegment = isWritingItem ? 'chapter' : 'chapters';

    // Check if user has read each chapter
    const chaptersWithReadStatus = (m.chapters || m.lastChapters || []).map(
      (chapter: any) => {
        const isRead =
          (logged &&
            user?.history?.some(
              (historyItem: any) =>
                historyItem.chapterId === chapter.id && historyItem.finishedAt
            )) ||
          false;

        const mangaSlug = m.manga?.slug || m.slug || m.id;

        return {
          id: chapter.id,
          number: chapter.number,
          title: chapter.title,
          releasedAt: chapter.releasedAt,
          chapterUrl: chapter._jointSlug
            ? `/joint/manga/${chapter._jointSlug}/chapters/${chapter.number}`
            : mangaSlug && mangaSlug !== 'undefined'
            ? `${detailBase}/${mangaSlug}/${chapterPathSegment}/${chapter.number}`
            : '#',
          isRead,
        };
      }
    );

    const mangaSlug = m.manga?.slug || m.slug || m.id;
    const mangaUrl = m._jointSlug
      ? `/joint/manga/${m._jointSlug}`
      : mangaSlug && mangaSlug !== 'undefined'
      ? `${detailBase}/${mangaSlug}`
      : undefined;

    return {
      id: mangaSlug,
      title: m.title,
      cover: m.imageUrl || m.cover || "",
      scan: organization?.name || "",
      scanName: organization?.name || "",
      scanUrl: orgPrefix,
      mangaUrl: mangaUrl,
      status: m.status || "Ongoing",
      chapters: chaptersWithReadStatus,
      userHasSubscription: userHasSubscription || false,
      subscriptionPlansCanReadUnreleased: m.subscriptionPlansCanReadUnreleased,
      subscriptionPlansCanReadReleased: m.subscriptionPlansCanReadReleased,
      isNSFW: m.isNSFW || organization?.isNSFW || false,
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
        const nsfwParam = nsfwMode ? '&nsfw=true' : '&nsfw=false';
        // For writings landing we over-fetch and post-filter — the list endpoint
        // accepts a single ?type, but writings is the union of 4 types.
        const fetchLimit = contentKind === 'writing' ? 50 : 18;
        const [heroResult, topThreeResult, popularResult, recentResult] =
          await Promise.allSettled([
            callAPI(`/api/manga-custom?order=latest&limit=${contentKind === 'writing' ? 30 : 5}${nsfwParam}`),
            callAPI(`/api/manga-custom?order=featured&limit=${contentKind === 'writing' ? 30 : 3}${nsfwParam}`),
            callAPI(`/api/manga-custom?order=popular&limit=${contentKind === 'writing' ? 30 : 9}${nsfwParam}`),
            callAPI(`/api/manga-custom?order=latest&limit=${fetchLimit}${nsfwParam}`),
          ]);

        const filterByKind = (items: any[]) =>
          contentKind === 'writing'
            ? items.filter((m) => WRITING_TYPES.has(m?.manga?.bookType?.code))
            : contentKind === 'manga'
            ? items.filter((m) => !WRITING_TYPES.has(m?.manga?.bookType?.code))
            : items;

        // Process hero mangas
        if (heroResult.status === "fulfilled" && heroResult.value && typeof heroResult.value === 'object' && !Array.isArray(heroResult.value) && Array.isArray(heroResult.value.items)) {
          setFeaturedMangas(
            filterByKind(heroResult.value.items).slice(0, 5).map((m: any) => {
              const mangaSlug = m.manga?.slug || m.slug || m.id;
              const mangaUrl = m._jointSlug
                ? `/joint/manga/${m._jointSlug}`
                : `${orgPrefix}/manga/${mangaSlug}`;
              return {
                id: mangaSlug,
                title: m.title,
                cover: m.bannerUrl || m.imageUrl || "",
                description: m.shortDescription || m.description || "",
                chapter: "Cap. 01",
                status: m.status || "Ongoing",
                demography: m.demography?.name || null,
                mangaUrl,
              };
            })
          );
        } else if (heroResult.status === "rejected") {
          console.error("Error fetching hero mangas:", heroResult.reason);
        }

        // Process top three mangas
        if (topThreeResult.status === "fulfilled" && topThreeResult.value && typeof topThreeResult.value === 'object' && !Array.isArray(topThreeResult.value) && Array.isArray(topThreeResult.value.items)) {
          setTopThreeMangas(
            filterByKind(topThreeResult.value.items).slice(0, 3).map((m: any) => {
              const mangaSlug = m.manga?.slug || m.slug || m.id;
              const mangaUrl = m._jointSlug
                ? `/joint/manga/${m._jointSlug}`
                : `${orgPrefix}/manga/${mangaSlug}`;
              return {
                id: mangaSlug,
                title: m.title,
                cover: m.bannerUrl || m.imageUrl || "",
                description: m.shortDescription || "",
                chapter: "Cap. 01",
                status: m.status || "Ongoing",
                views: m.views || 0,
                mangaUrl,
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
            filterByKind(popularResult.value.items).slice(0, 9).map((m: any) => mapMangaData(m))
          );
        } else if (popularResult.status === "rejected") {
          console.error("Error fetching popular mangas:", popularResult.reason);
        }

        // Process recent updates
        if (recentResult.status === "fulfilled" && recentResult.value && typeof recentResult.value === 'object' && !Array.isArray(recentResult.value) && Array.isArray(recentResult.value.items)) {
          setRecentUpdates(
            filterByKind(recentResult.value.items).slice(0, 18).map((m: any) => mapMangaData(m))
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
  }, [organization, logged, user, nsfwMode, contentKind]);

  const subUrl = `${orgPrefix}/subscriptions`;
  const exploreUrl = organization?.slug ? `${orgPrefix}/search` : (nsfwMode ? `/red/search` : `/search`);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        onOpenRegister={() => navigateTo(`/${organization?.slug}/register`)}
        onOpenLogin={() => navigateTo(`/${organization?.slug}/login`)}
        onGoHome={() => navigateTo(orgPrefix)}
        onGoExplore={() => navigateTo("/scans")}
        onGoSearch={() => navigateTo(`${orgPrefix}/search`)}
        onGoSubscriptions={() => navigateTo(subUrl)}
        activeView="scan"
        user={user}
        logged={logged}
        activeScan={organization}
        organization={organization}
        nsfwMode={nsfwMode}
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
                nsfwMode={nsfwMode}
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
                exploreUrl={exploreUrl}
                user={user}
                organization={organization}
                nsfwMode={nsfwMode}
              />
            )}
          </div>

          {/* SIDEBAR DERECHO */}
          <ScanSidebar
            subscribeUrl={subUrl}
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
          else if (page === "home") navigateTo(nsfwMode ? "/red" : "/");
        }}
      />
    </div>
  );
};

export default ScanLanding;
