import React, { useState, useEffect } from "react";
import {
  Star,
  Share2,
  Eye,
  Download,
  EyeOff,
  Lock,
  LockOpen,
} from "lucide-react";
import { callAPI } from "../../util/callApi";
import { translateStatus } from "../../util/landing/translateStatus";
import { formatDate as formatDateUtil } from "../../util/date";
import CommentsSection from "./CommentsSection";

interface Chapter {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
  subscribersOnly: boolean;
  imageUrl?: string | null;
  isRead?: boolean;
  hasAccess?: boolean;
}

interface Genre {
  id: number;
  name: string;
  slug: string;
}

interface MangaDetailPageProps {
  manga: {
    id: number;
    slug: string;
    title: string;
    description?: string | null;
    shortDescription?: string | null;
    imageUrl?: string | null;
    bannerUrl?: string | null;
    status: string;
    demography?: {
      name: string;
      slug: string;
    } | null;
    genres?: Genre[];
    chapters?: Chapter[];
    authors?: Array<{ name: string }>;
    subscriptionPlans?: Array<{ id: number; name: string }>;
    requireLogin?: boolean;
    isSimulRelease?: boolean;
    nextChapterAt?: string | null;
    nextChapterAtMessage?: string | null;
    usersAlsoReadMangaCustomIds?: string | null;
  };
  organization?: any;
  user?: any;
  logged?: boolean;
}

const MangaDetailPage: React.FC<MangaDetailPageProps> = ({
  manga,
  organization,
  user,
  logged,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userChapterHistory, setUserChapterHistory] = useState<any[]>([]);
  const [selectedChapterGroup, setSelectedChapterGroup] = useState("");
  const [chapterGroups, setChapterGroups] = useState<
    Record<
      string,
      { label: string; from: number; to: number; chapters: Chapter[] }
    >
  >({});
  const [isDownloadingChapter, setIsDownloadingChapter] = useState<
    number | null
  >(null);
  const [favoriteFeedback, setFavoriteFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [readFeedback, setReadFeedback] = useState<{
    chapterNumber: number;
    message: string;
  } | null>(null);
  const [recommendedMangas, setRecommendedMangas] = useState<any[]>([]);

  // Check if manga is favorite
  useEffect(() => {
    if (logged) {
      callAPI(`/api/favorites/manga-custom/${manga.slug}`)
        .then((value) => {
          setIsFavorite(value);
        })
        .catch(() => {
          // Not favorite or error
        });
    }
  }, [logged, manga.slug]);

  // Fetch user chapter history
  useEffect(() => {
    if (logged) {
      callAPI(
        `/api/user-chapter-history?limit=1000&include_finished=true&manga_slug=${manga.slug}`
      )
        .then((result) => {
          // callAPI returns { data: [...], maxPage, total }
          // We need to extract the data array
          if (result?.data && Array.isArray(result.data)) {
            setUserChapterHistory(result.data);
          } else if (Array.isArray(result)) {
            // Fallback: if result is directly an array
            setUserChapterHistory(result);
          } else {
            setUserChapterHistory([]);
          }
        })
        .catch(() => {
          // Error fetching history
          setUserChapterHistory([]);
        });
    } else {
      setUserChapterHistory([]);
    }
  }, [logged, manga.slug]);

  // Fetch recommended mangas
  useEffect(() => {
    if (manga.usersAlsoReadMangaCustomIds) {
      const ids = manga.usersAlsoReadMangaCustomIds
        .split(",")
        .filter((id) => id.trim())
        .slice(0, 3);
      if (ids.length > 0) {
        callAPI(`/api/manga-custom?ids=${ids.join(",")}&limit=3`)
          .then((result) => {
            if (result?.data?.data && Array.isArray(result.data.data)) {
              setRecommendedMangas(result.data.data);
            } else if (result?.data && Array.isArray(result.data)) {
              setRecommendedMangas(result.data);
            } else {
              setRecommendedMangas([]);
            }
          })
          .catch(() => {
            setRecommendedMangas([]);
          });
      }
    } else {
      setRecommendedMangas([]);
    }
  }, [manga.usersAlsoReadMangaCustomIds]);

  // Group chapters
  useEffect(() => {
    if (!manga.chapters || manga.chapters.length === 0) return;

    const sortedChapters = [...manga.chapters].sort(
      (a, b) => b.number - a.number
    );
    const highestChapterNumber = sortedChapters[0]?.number || 0;
    const highestChapterNumberCeiled =
      Math.ceil(highestChapterNumber / 10) * 10;
    const groups: Record<
      string,
      { label: string; from: number; to: number; chapters: Chapter[] }
    > = {};
    let lastLabel = "";

    for (let i = 10; i <= highestChapterNumberCeiled; i += 10) {
      const chapters = sortedChapters.filter(
        (chapter) => chapter.number >= i - 9 && chapter.number < i + 1
      );
      if (chapters.length === 0) continue;
      const label = `${i - 9}-${i}`;
      groups[label] = {
        label,
        from: i - 9,
        to: i,
        chapters,
      };
      lastLabel = label;
    }

    // Handle chapter 0
    const chapterZero = sortedChapters.find((chapter) => chapter.number === 0);
    if (chapterZero) {
      if (Object.keys(groups).length > 0) {
        const firstGroup = Object.keys(groups)[0];
        groups[firstGroup].chapters.push(chapterZero);
      } else {
        groups["0"] = {
          label: "0",
          from: 0,
          to: 0,
          chapters: [chapterZero],
        };
        lastLabel = "0";
      }
    }

    setChapterGroups(groups);
    setSelectedChapterGroup(lastLabel);
  }, [manga.chapters]);

  // Check chapter access
  const userHasAccessToChapter = (chapter: Chapter): boolean => {
    if (!logged && manga.requireLogin) return false;

    // If chapter is released and not subscriber-only, user has access
    if (
      new Date(chapter.releasedAt).getTime() < new Date().getTime() &&
      !chapter.subscribersOnly
    ) {
      return true;
    }

    if (!logged) return false;

    // Check user permissions
    // userPermissions ya viene filtrado por el middleware para la organización actual
    const permissions =
      user.permissions.find(
        (permission: any) => permission.organizationId === organization?.id
      ) || {};
    if (permissions.canReadUnreleased === true) return true;
    if (permissions.canEditChapter === true) return true;
    if (permissions.canEditPage === true) return true;

    // Check subscriptions
    for (const subscription of user?.subscriptions || []) {
      if (subscription?.subscriptionPlan?.canReadUnreleased === true) {
        return true;
      }
      if (
        manga.subscriptionPlans?.find(
          (plan) => plan.id === subscription?.subscriptionPlan?.id
        )
      ) {
        return true;
      }
    }

    return false;
  };

  // Get chapter history
  const getChapterHistory = (chapterNumber: number) => {
    if (!logged || !Array.isArray(userChapterHistory)) return null;
    return userChapterHistory.find((c) => c?.chapter?.number === chapterNumber);
  };

  // Check if chapter is read
  const isChapterRead = (chapterNumber: number): boolean => {
    const history = getChapterHistory(chapterNumber);
    return !!history?.finishedAt;
  };

  // Get chapter label
  const getChapterLabel = (chapter: Chapter): string => {
    if (!userHasAccessToChapter(chapter)) {
      return manga.requireLogin
        ? "Inicia sesión para leer"
        : "Solo para suscriptores";
    }

    if (!logged) {
      return "Leer";
    }

    const history = getChapterHistory(chapter.number);
    if (!history) {
      return "Leer";
    }
    if (!history.finishedAt) {
      return "Continuar leyendo";
    }
    return "Ya leído";
  };

  // Navigate to chapter
  const goToReadChapter = (chapter: Chapter) => {
    if (!logged && manga.requireLogin) {
      window.location.href = `/${organization?.slug || ""}/login?mangaSlug=${
        manga.slug
      }&chapterNumber=${chapter.number}&redirect=${
        window.location.pathname
      }`.replace("//", "/");
      return;
    }

    if (!userHasAccessToChapter(chapter)) {
      window.location.href = `/${
        organization?.slug || ""
      }/subscriptions?mangaSlug=${manga.slug}&chapterNumber=${
        chapter.number
      }`.replace("//", "/");
      return;
    }

    if (logged) {
      const history = getChapterHistory(chapter.number);
      if (history && !history.finishedAt && history.pageNumber) {
        const chapterUrl = organization?.slug
          ? `/${organization?.slug}/manga/${manga.slug}/chapters/${chapter.number}?page=${history.pageNumber}`
          : `/manga/${manga.slug}/chapters/${chapter.number}?page=${history.pageNumber}`;
        window.location.href = chapterUrl;
        return;
      }
    }

    const chapterUrl = organization?.slug
      ? `/${organization?.slug}/manga/${manga.slug}/chapters/${chapter.number}`
      : `/manga/${manga.slug}/chapters/${chapter.number}`;
    window.location.href = chapterUrl;
  };

  // Toggle favorite
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!logged) {
      window.location.href = `/${organization?.slug || ""}/login`.replace(
        "//",
        "/"
      );
      return;
    }

    const wasFavorite = isFavorite;

    // Optimistic update
    setIsFavorite(!wasFavorite);
    setFavoriteFeedback(null);

    try {
      if (wasFavorite) {
        await callAPI(`/api/favorites/manga-custom/${manga.slug}`, {
          method: "DELETE",
        });
        setFavoriteFeedback({
          message: "Eliminado de favoritos",
          type: "success",
        });
      } else {
        await callAPI(`/api/favorites/manga-custom/${manga.slug}`, {
          method: "POST",
        });
        setFavoriteFeedback({
          message: "Agregado a favoritos",
          type: "success",
        });
      }

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFavoriteFeedback(null);
      }, 3000);
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorite(wasFavorite);
      setFavoriteFeedback({
        message: "Error al actualizar favoritos",
        type: "error",
      });
      console.error("Failed to toggle favorite", error);

      // Clear error feedback after 3 seconds
      setTimeout(() => {
        setFavoriteFeedback(null);
      }, 3000);
    }
  };

  // Mark chapter as read/unread
  const markChapterAsRead = async (
    e: React.MouseEvent,
    chapterNumber: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!logged) return;

    const chapter = manga.chapters?.find((c) => c.number === chapterNumber);
    if (!chapter || !userHasAccessToChapter(chapter)) return;

    setUserChapterHistory((prev) => [
      ...prev,
      {
        chapter,
        chapterId: chapter.id,
        finishedAt: new Date(),
        pageNumber: 0,
      },
    ]);

    // Show feedback
    setReadFeedback({ chapterNumber, message: "Marcado como leído" });
    setTimeout(() => {
      setReadFeedback(null);
    }, 2000);

    try {
      await callAPI(
        `/api/user-chapter-history/manga-custom/${manga.slug}/chapter/${chapterNumber}`
      );
    } catch (error) {
      console.error("Failed to mark chapter as read", error);
      // Revert on error
      setUserChapterHistory((prev) =>
        prev.filter((h) => h.chapter.number !== chapterNumber)
      );
      setReadFeedback({ chapterNumber, message: "Error al marcar como leído" });
      setTimeout(() => {
        setReadFeedback(null);
      }, 2000);
    }
  };

  const markChapterAsUnread = async (
    e: React.MouseEvent,
    chapterNumber: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!logged) return;

    const chapter = manga.chapters?.find((c) => c.number === chapterNumber);
    if (!chapter || !userHasAccessToChapter(chapter)) return;

    setUserChapterHistory((prev) =>
      prev.filter((h) => h.chapter.number !== chapterNumber)
    );

    try {
      await callAPI(
        `/api/user-chapter-history/manga-custom/${manga.slug}/chapter/${chapterNumber}`,
        { method: "DELETE" }
      );
    } catch (error) {
      console.error("Failed to mark chapter as unread", error);
    }
  };

  // Download chapter
  const downloadChapter = async (
    e: React.MouseEvent,
    chapterNumber: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const chapter = manga.chapters?.find((c) => c.number === chapterNumber);
    if (!chapter) return;

    if (!logged || !user) {
      window.location.href = `/${organization?.slug || ""}/login`.replace(
        "//",
        "/"
      );
      return;
    }

    if (!userHasAccessToChapter(chapter)) {
      return;
    }

    setIsDownloadingChapter(chapterNumber);

    try {
      const chapterPages = await callAPI(
        `/api/manga-custom/${manga.slug}/chapter/${chapter.number}/pages`
      );

      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(`Chapter ${chapter.number}`);

      const pagePromises = chapterPages.map((page: any) =>
        fetch(page.imageUrl).then((response) => response.blob())
      );
      const blobs = await Promise.all(pagePromises);

      blobs.forEach((blob, index) => {
        folder?.file(
          `${chapter.number.toString().padStart(6, "0")} - ${chapterPages[
            index
          ].number
            .toString()
            .padStart(6, "0")}.jpg`,
          blob
        );
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${manga.title} - ${chapter.number}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download chapter", error);
    } finally {
      setIsDownloadingChapter(null);
    }
  };

  // Format date using the utility function that handles future dates correctly
  const formatDate = (dateString: string): string => {
    return formatDateUtil(dateString, "es");
  };

  // Format comment date (more detailed)
  const firstChapter = manga.chapters?.sort((a, b) => a.number - b.number)?.[0];
  const lastChapter = manga.chapters?.sort((a, b) => b.number - a.number)?.[0];
  const currentChapters = chapterGroups[selectedChapterGroup]?.chapters || [];

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      {/* Banner Backdrop */}
      <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden">
        <img
          src={manga.bannerUrl || manga.imageUrl || ""}
          className="w-full h-full object-cover opacity-60 blur-[2px] scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-32 md:-mt-48 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* SECCION IZQUIERDA (SIDEBAR) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="relative group">
              <div className="aspect-[2/3] rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                <img
                  src={manga.imageUrl || ""}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={manga.title}
                />
              </div>
            </div>

            <button
              onClick={toggleFavorite}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                isFavorite
                  ? "bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-yellow-400/10"
                  : "bg-yellow-400 hover:bg-yellow-300 text-zinc-950 shadow-yellow-400/10"
              }`}
            >
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "QUITAR DE FAVORITOS" : "AÑADIR A FAVORITOS"}
            </button>

            {/* Feedback message */}
            {favoriteFeedback && (
              <div
                className={`p-4 rounded-2xl border text-sm font-bold text-center transition-all animate-in fade-in slide-in-from-top-2 ${
                  favoriteFeedback.type === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {favoriteFeedback.message}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                  Estado:
                </p>
                <div
                  className={`inline-flex px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest ${
                    manga.status === "ongoing"
                      ? "bg-green-500/20 border-green-500/30 text-green-400"
                      : manga.status === "hiatus"
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-red-500/20 border-red-500/30 text-red-400"
                  }`}
                >
                  {translateStatus(manga.status)}
                </div>
                {manga.nextChapterAt &&
                  (() => {
                    const nextChapterDate = new Date(manga.nextChapterAt);
                    const now = new Date();
                    if (nextChapterDate > now) {
                      return (
                        <div className="mt-3 space-y-2">
                          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                            Próximo capítulo:
                          </p>
                          <p className="text-white font-bold text-sm">
                            {formatDate(manga.nextChapterAt)
                              .charAt(0)
                              .toUpperCase() +
                              formatDate(manga.nextChapterAt).slice(1)}
                          </p>
                          {manga.nextChapterAtMessage && (
                            <p className="text-zinc-400 text-xs font-medium italic">
                              {manga.nextChapterAtMessage}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>

              {manga.demography && (
                <div>
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    Demografía:
                  </p>
                  <p className="text-white font-bold text-sm">
                    {manga.demography.name}
                  </p>
                </div>
              )}

              {manga.genres && manga.genres.length > 0 && (
                <div>
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    Géneros:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {manga.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {firstChapter && (
                  <button
                    onClick={() => goToReadChapter(firstChapter)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors"
                  >
                    IR AL PRIMER CAPÍTULO
                  </button>
                )}
                {lastChapter && (
                  <button
                    onClick={() => goToReadChapter(lastChapter)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors"
                  >
                    IR AL ÚLTIMO CAPÍTULO
                  </button>
                )}
              </div>

              {/* Recommended Mangas */}
              {recommendedMangas.length > 0 && (
                <div className="mt-6">
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-3">
                    Los usuarios que estan al día con este manga también leen:
                  </p>
                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                    {recommendedMangas.map((recommendedManga) => {
                      const mangaUrl = organization?.slug
                        ? `/${organization?.slug}/manga/${recommendedManga.slug}`
                        : `/manga/${recommendedManga.slug}`;

                      return (
                        <a
                          key={recommendedManga.id}
                          href={mangaUrl}
                          className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-zinc-800 hover:border-cyan-500/30 transition-all"
                        >
                          <img
                            src={recommendedManga.imageUrl || ""}
                            alt={recommendedManga.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-[10px] font-bold uppercase tracking-tight line-clamp-2">
                              {recommendedManga.title}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCION DERECHA (MAIN CONTENT) */}
          <div className="lg:col-span-9 space-y-12">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                {manga.title}
              </h1>
              {manga.authors && manga.authors.length > 0 && (
                <p className="text-zinc-400 text-lg font-bold">
                  Por {manga.authors.map((a) => a.name).join(", ")}
                </p>
              )}

              <div className="max-w-4xl">
                <p className="text-zinc-300 text-base leading-relaxed font-medium">
                  {manga.description ||
                    manga.shortDescription ||
                    "Sin descripción disponible."}
                </p>
              </div>
            </div>

            {/* Chapters Section */}
            {manga.chapters && manga.chapters.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                    Capítulos{" "}
                    <span className="text-zinc-500 text-sm font-bold ml-2">
                      {manga.chapters.length} publicados
                      {logged &&
                        Array.isArray(userChapterHistory) &&
                        userChapterHistory.length > 0 && (
                          <span className="ml-2">
                            (
                            {
                              userChapterHistory.filter((v) => v?.finishedAt)
                                .length
                            }{" "}
                            leídos)
                          </span>
                        )}
                    </span>
                  </h2>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    {currentChapters
                      .sort((a, b) => b.number - a.number)
                      .map((chapter) => {
                        const hasAccess = userHasAccessToChapter(chapter);
                        const isRead = isChapterRead(chapter.number);
                        const chapterHistory = getChapterHistory(
                          chapter.number
                        );

                        return (
                          <div
                            key={chapter.id}
                            onClick={() => goToReadChapter(chapter)}
                            className={`group border rounded-3xl p-6 flex items-center justify-between transition-all cursor-pointer sticky top-20 backdrop-blur-md bg-zinc-900/95 ${
                              hasAccess
                                ? isRead
                                  ? "border-zinc-800 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                  : chapterHistory
                                  ? "border-orange-500/30 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                  : "border-zinc-800 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                : "border-zinc-800/50 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-24 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50">
                                <img
                                  src={chapter.imageUrl || manga.imageUrl || ""}
                                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                  alt=""
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {/* Lock/Unlock Icon with Tooltip */}
                                    <div className="relative group/lock">
                                      {chapter.subscribersOnly && hasAccess && (
                                        <>
                                          <LockOpen
                                            size={16}
                                            className="text-green-400 animate-pulse"
                                          />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-10">
                                            Desbloqueado - Tienes acceso premium
                                          </div>
                                        </>
                                      )}

                                      {chapter.subscribersOnly &&
                                        !hasAccess && (
                                          <>
                                            <Lock
                                              size={16}
                                              className="text-yellow-400"
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-10">
                                              Bloqueado - Solo para suscriptores
                                            </div>
                                          </>
                                        )}

                                      {!chapter.subscribersOnly && (
                                        <>
                                          <LockOpen
                                            size={16}
                                            className="text-cyan-400"
                                          />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-10">
                                            Gratis - Disponible para todos
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    <h4 className="text-white font-bold text-lg">
                                      Capítulo {chapter.number}
                                    </h4>
                                  </div>

                                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide">
                                    {formatDate(chapter.releasedAt)}
                                  </span>
                                </div>
                                <p className="text-zinc-400 text-base font-bold italic tracking-tight uppercase group-hover:text-cyan-400 transition-colors">
                                  "{chapter.title}"
                                </p>
                              </div>
                            </div>

                            <div
                              className="flex flex-col items-end gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-4 text-zinc-500 relative">
                                <div className="relative group/tooltip">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Share functionality
                                    }}
                                    className="hover:text-cyan-400 transition-colors"
                                  >
                                    <Share2 size={18} />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                    Compartir
                                  </div>
                                </div>
                                {logged && hasAccess && (
                                  <>
                                    <div className="relative group/tooltip">
                                      {!isRead ? (
                                        <button
                                          onClick={(e) =>
                                            markChapterAsRead(e, chapter.number)
                                          }
                                          className="hover:text-cyan-400 transition-colors"
                                        >
                                          <Eye size={18} />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) =>
                                            markChapterAsUnread(
                                              e,
                                              chapter.number
                                            )
                                          }
                                          className="hover:text-cyan-400 transition-colors"
                                        >
                                          <EyeOff size={18} />
                                        </button>
                                      )}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                        {!isRead
                                          ? "Marcar como leído"
                                          : "Marcar como no leído"}
                                      </div>
                                      {readFeedback &&
                                        readFeedback.chapterNumber ===
                                          chapter.number && (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-10">
                                            {readFeedback.message}
                                          </div>
                                        )}
                                    </div>
                                    {hasAccess && (
                                      <div className="relative group/tooltip">
                                        <button
                                          onClick={(e) =>
                                            downloadChapter(e, chapter.number)
                                          }
                                          disabled={
                                            isDownloadingChapter ===
                                            chapter.number
                                          }
                                          className="hover:text-cyan-400 transition-colors disabled:opacity-50"
                                        >
                                          {isDownloadingChapter ===
                                          chapter.number ? (
                                            <div className="w-[18px] h-[18px] border-2 border-zinc-500 border-t-cyan-400 rounded-full animate-spin" />
                                          ) : (
                                            <Download size={18} />
                                          )}
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                          Descargar capítulo
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToReadChapter(chapter);
                                }}
                                className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                                  hasAccess
                                    ? "text-cyan-400 hover:text-cyan-300"
                                    : "text-yellow-400 hover:text-yellow-300"
                                }`}
                              >
                                {getChapterLabel(chapter)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Range Picker */}
                  {Object.keys(chapterGroups).length > 0 && (
                    <div className="w-24 space-y-2">
                      {Object.values(chapterGroups)
                        .sort((a, b) => b.from - a.from)
                        .map((group) => (
                          <button
                            key={group.label}
                            onClick={() => setSelectedChapterGroup(group.label)}
                            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              group.label === selectedChapterGroup
                                ? "bg-white text-zinc-950 shadow-lg"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white"
                            }`}
                          >
                            {group.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COMMENTS SECTION (FULL WIDTH) */}
        <CommentsSection
          identifier={manga.slug}
          logged={logged || false}
          user={user}
          organization={organization}
          onLogin={() => {
            window.location.href = `/${organization?.slug || ""}/login`.replace(
              "//",
              "/"
            );
          }}
        />
      </div>
    </div>
  );
};

export default MangaDetailPage;
