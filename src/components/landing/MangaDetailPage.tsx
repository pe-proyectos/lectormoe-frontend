import React, { useState, useEffect, useMemo, useRef } from "react";
import { notify } from '../../util/feedback';
import {
  Star,
  Bookmark,
  Share2,
  Eye,
  Download,
  EyeOff,
  Lock,
  LockOpen,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { callAPI } from "../../util/callApi";
import { translateStatus } from "../../util/landing/translateStatus";
import { getBookTypeBadge, getDemographyBadge } from "../../util/taxonomy";
import MilestoneAlertButton from "./MilestoneAlertButton";
import MangaReviews from "./MangaReviews";
import ReportButton from "./ReportButton";
import AddToListButton from "./AddToListButton";
import DownloadButton from "../app/DownloadButton";
import { formatDate as formatDateUtil } from "../../util/date";
import CommentsSection from "./CommentsSection";
import NSFWAgeModal from "./NSFWAgeModal";
import { isNSFWContent, hasAgeVerification } from "../../util/nsfw";

interface Chapter {
  id: number;
  number: number;
  title: string;
  releasedAt: string;
  imageUrl?: string | null;
  isRead?: boolean;
  hasAccess?: boolean;
  isUnreleased?: boolean;
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
    alternativeTitle?: string | null;
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
    authors?: Array<{ name: string; slug?: string }>;
    manga?: {
      authors?: Array<{ name: string; slug?: string }>;
    };
    subscriptionPlansCanReadUnreleased?: Array<{ id: number; name: string }>;
    subscriptionPlansCanReadReleased?: Array<{ id: number; name: string }>;
    requireLogin?: boolean;
    isSimulRelease?: boolean;
    nextChapterAt?: string | null;
    nextChapterAtMessage?: string | null;
    usersAlsoReadMangaCustomIds?: string | null;
    isNSFW?: boolean;
  };
  organization?: any;
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
  writingType?: string;
}

const MangaDetailPage: React.FC<MangaDetailPageProps> = ({
  manga,
  organization,
  user,
  logged,
  nsfwMode = false,
  contentKind = 'manga',
  writingType,
}) => {
  // Routing helpers — text chapters live under /writings/<org>/<type>/<slug>/chapter/<n>
  // while image chapters live under /<org>/manga/<slug>/chapters/<n>.
  const isWriting = contentKind === 'writing';
  const writingsPrefix = nsfwMode ? `/red/writings/${organization?.slug || ''}` : `/writings/${organization?.slug || ''}`;
  const detailBase = isWriting && writingType
    ? `${writingsPrefix}/${writingType}`
    : (nsfwMode ? `/red/${organization?.slug || ''}/manga` : `/${organization?.slug || ''}/manga`);
  const chapterPathSegment = isWriting ? 'chapter' : 'chapters';
  // El slug está en manga.manga.slug (relación anidada del mangaCustom)
  const mangaSlug = (manga as any)?.manga?.slug || manga.slug;

  // Joint pages reuse this component but don't have manga-custom-specific endpoints
  // (favorites, history by manga_slug, view tracking, analytics with mangaSlug payload).
  // Detect joint mode via the sentinel organization slug set by the joint Astro page.
  const isJoint = organization?.slug === 'joint';

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInUserList, setIsInUserList] = useState(false);
  const [userListFeedback, setUserListFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userChapterHistory, setUserChapterHistory] = useState<any[]>([]);
  // La agrupación de capítulos se calcula de forma síncrona (useMemo) para que
  // el HTML del servidor ya traiga los capítulos: con useEffect, el SSR salía
  // vacío y en móvil con red lenta (o JS fallido) nunca aparecían.
  const { groups: chapterGroups, defaultGroup: defaultChapterGroup } = useMemo(() => {
    const groups: Record<
      string,
      { label: string; from: number; to: number; chapters: Chapter[] }
    > = {};
    let lastLabel = "";
    if (!manga.chapters || manga.chapters.length === 0) {
      return { groups, defaultGroup: lastLabel };
    }

    const sortedChapters = [...manga.chapters].sort((a, b) => b.number - a.number);
    const highestChapterNumber = sortedChapters[0]?.number || 0;
    const highestChapterNumberCeiled = Math.ceil(highestChapterNumber / 10) * 10;

    for (let i = 10; i <= highestChapterNumberCeiled; i += 10) {
      const chapters = sortedChapters.filter(
        (chapter) => chapter.number >= i - 9 && chapter.number < i + 1
      );
      if (chapters.length === 0) continue;
      const label = `${i - 9}-${i}`;
      groups[label] = { label, from: i - 9, to: i, chapters };
      lastLabel = label;
    }

    // Capítulos con número < 1 (prólogos/especiales 0, 0.5, 0.01): el loop
    // principal arranca en 1, así que se agregan aparte.
    const subOneChapters = sortedChapters.filter((chapter) => chapter.number < 1);
    if (subOneChapters.length > 0) {
      if (Object.keys(groups).length > 0) {
        const firstGroup = Object.keys(groups)[0];
        groups[firstGroup].chapters.push(...subOneChapters);
      } else {
        groups["0"] = { label: "0", from: 0, to: 0, chapters: subOneChapters };
        lastLabel = "0";
      }
    }

    return { groups, defaultGroup: lastLabel };
  }, [manga.chapters]);

  // null = el usuario aún no eligió grupo; se usa el default (el más reciente).
  const [selectedChapterGroupState, setSelectedChapterGroup] = useState<string | null>(null);
  const selectedChapterGroup =
    selectedChapterGroupState !== null && chapterGroups[selectedChapterGroupState]
      ? selectedChapterGroupState
      : defaultChapterGroup;
  const rangePickerRef = useRef<HTMLDivElement>(null);
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
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    chapterNumber: number | null;
    shareUrl: string;
  }>({
    isOpen: false,
    chapterNumber: null,
    shareUrl: "",
  });
  const [copied, setCopied] = useState(false);
  const [chaptersUpdating, setChaptersUpdating] = useState<Set<number>>(new Set());
  const [showNSFWModal, setShowNSFWModal] = useState(false);
  // Single bookmark per work (manga or joint). Used to render the "Ir a mi
  // marcador" button next to the user-list toggle and link straight to the
  // bookmarked chapter+position.
  const [workBookmark, setWorkBookmark] = useState<any | null>(null);

  // Check if NSFW content and show age verification modal
  useEffect(() => {
    const mangaIsNSFW = isNSFWContent(manga) || organization?.isNSFW === true;
    if (mangaIsNSFW && !hasAgeVerification()) {
      setShowNSFWModal(true);
    }
  }, []);

  // Check if manga/joint is favorite
  useEffect(() => {
    if (!logged) return;
    const endpoint = isJoint
      ? `/api/joint/${mangaSlug}/favorite`
      : `/api/favorites/manga-custom/${mangaSlug}`;
    callAPI(endpoint)
      .then((value) => { setIsFavorite(!!value); })
      .catch(() => {});
  }, [logged, mangaSlug, isJoint]);

  // Load the user's single bookmark for THIS work (if any). Used to surface
  // an "Ir a mi marcador" shortcut on the manga detail page.
  useEffect(() => {
    if (!logged) { setWorkBookmark(null); return; }
    const qs = isJoint
      ? `?jointId=${(manga as any)?.id ?? ''}`
      : `?mangaCustomId=${manga?.id ?? ''}`;
    if (!qs.includes('=') || qs.endsWith('=')) return;
    callAPI(`/api/bookmarks/work${qs}`)
      .then((bk: any) => setWorkBookmark(bk || null))
      .catch(() => setWorkBookmark(null));
  }, [logged, isJoint, manga?.id]);

  // Check if manga/joint is in user's 'Mi Lista'
  useEffect(() => {
    if (!logged) return;
    const endpoint = isJoint
      ? `/api/user-list/joint/${mangaSlug}`
      : `/api/user-list/manga-custom/${mangaSlug}`;
    callAPI(endpoint)
      .then((value) => { setIsInUserList(!!value); })
      .catch(() => {});
  }, [logged, mangaSlug, isJoint]);

  const handleToggleUserList = async () => {
    if (!logged) {
      window.location.href = '/login';
      return;
    }
    const wasIn = isInUserList;
    setIsInUserList(!wasIn);
    setUserListFeedback(null);
    try {
      const endpoint = isJoint
        ? `/api/user-list/joint/${mangaSlug}`
        : `/api/user-list/manga-custom/${mangaSlug}`;
      await callAPI(endpoint, { method: wasIn ? 'DELETE' : 'POST' });
      setUserListFeedback({
        message: wasIn ? 'Eliminado de tu lista' : 'Agregado a tu lista',
        type: 'success',
      });
      setTimeout(() => setUserListFeedback(null), 3000);
    } catch (error: any) {
      setIsInUserList(wasIn);
      setUserListFeedback({
        message: error?.message || 'Error al actualizar la lista',
        type: 'error',
      });
      setTimeout(() => setUserListFeedback(null), 3000);
    }
  };

  // Fetch user chapter history (manga-custom only — joints don't support manga_slug filter)
  useEffect(() => {
    if (!logged || isJoint) {
      setUserChapterHistory([]);
      return;
    }
    callAPI(`/api/user-chapter-history?limit=1000&include_finished=true&manga_slug=${mangaSlug}`)
      .then((result) => {
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
          setUserChapterHistory(result.items);
        } else if (Array.isArray(result)) {
          setUserChapterHistory(result);
        } else {
          setUserChapterHistory([]);
        }
      })
      .catch(() => { setUserChapterHistory([]); });
  }, [logged, mangaSlug, isJoint]);

  // Track view when profile page is loaded
  useEffect(() => {
    if (!mangaSlug) return;
    if (isJoint) return; // joints don't use the manga-custom view endpoint

    callAPI(`/api/views/manga-custom/${mangaSlug}`, { method: 'POST' }).catch(() => {});

    callAPI('/api/analytics', {
      method: 'POST',
      includeIp: true,
      body: JSON.stringify({
        event: 'view_manga_profile',
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        payload: { mangaSlug },
      }),
    }).catch(() => {});
  }, [mangaSlug, isJoint]);

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
            // El API retorna { items: [...], maxPage: X, total: Y }
            if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items)) {
              setRecommendedMangas(result.items);
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

  // Get required plans for a chapter
  const getRequiredPlansForChapter = (chapter: Chapter): Array<{ id: number; name: string }> | null => {
    const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();
    
    if (isChapterReleased) {
      const hasCanReadReleasedPlans = (manga.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
      if (hasCanReadReleasedPlans) {
        return manga.subscriptionPlansCanReadReleased || [];
      }
      return null; // Todos pueden leer
    } else {
      const hasCanReadUnreleasedPlans = (manga.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;
      if (hasCanReadUnreleasedPlans) {
        return manga.subscriptionPlansCanReadUnreleased || [];
      }
      return []; // Nadie puede leer (array vacío significa que nadie puede)
    }
  };

  // Get access reason message
  const getAccessReasonMessage = (chapter: Chapter): string | null => {
    if (!logged && manga.requireLogin) {
      return "Debes iniciar sesión para leer este manga.";
    }

    // Si el capítulo está marcado como isUnreleased (bloqueado para lectura anticipada)
    // Solo los suscriptores exclusivos y los suscriptores con acceso anticipado del manga pueden leerlo
    if (chapter.isUnreleased === true) {
      if (!logged) {
        const exclusivePlans = manga.subscriptionPlansCanReadReleased || [];
        const unreleasedPlans = manga.subscriptionPlansCanReadUnreleased || [];
        const allPlans = [...exclusivePlans, ...unreleasedPlans];
        const uniquePlans = allPlans.filter((plan, index, self) => 
          index === self.findIndex((p) => p.id === plan.id)
        );
        if (uniquePlans.length > 0) {
          return `Este capítulo está bloqueado para lectura anticipada. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado pueden leerlo. Requiere uno de los siguientes planes: ${uniquePlans.map(p => p.name).join(", ")}.`;
        }
        return "Este capítulo está bloqueado para lectura anticipada. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado pueden leerlo.";
      }

      // Usuario logueado - verificar si tiene acceso
      let hasExclusiveAccess = false;
      let hasUnreleasedAccess = false;

      for (const subscription of user?.subscriptions || []) {
        if (
          subscription.active === true &&
          subscription?.subscriptionPlan?.organizationId === organization?.id
        ) {
          const hasReleasedPlan = manga.subscriptionPlansCanReadReleased?.find(
            (plan) => plan.id === subscription?.subscriptionPlan?.id
          );
          const hasUnreleasedPlan = manga.subscriptionPlansCanReadUnreleased?.find(
            (plan) => plan.id === subscription?.subscriptionPlan?.id
          );

          if (hasReleasedPlan) {
            hasExclusiveAccess = true;
          }
          if (hasUnreleasedPlan) {
            hasUnreleasedAccess = true;
          }
        }
      }

      // Si no tiene acceso, mostrar mensaje
      if (!hasExclusiveAccess && !hasUnreleasedAccess) {
        const exclusivePlans = manga.subscriptionPlansCanReadReleased || [];
        const unreleasedPlans = manga.subscriptionPlansCanReadUnreleased || [];
        const allPlans = [...exclusivePlans, ...unreleasedPlans];
        const uniquePlans = allPlans.filter((plan, index, self) => 
          index === self.findIndex((p) => p.id === plan.id)
        );
        if (uniquePlans.length > 0) {
          return `Este capítulo está bloqueado para lectura anticipada. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado pueden leerlo. Requiere uno de los siguientes planes: ${uniquePlans.map(p => p.name).join(", ")}.`;
        }
        return "Este capítulo está bloqueado para lectura anticipada. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado pueden leerlo.";
      }

      // Si tiene acceso, no mostrar mensaje (retornar null)
      return null;
    }

    const isChapterReleased = chapter.releasedAt 
      ? new Date(chapter.releasedAt).getTime() < new Date().getTime()
      : false;
    const requiredPlans = getRequiredPlansForChapter(chapter);

    if (isChapterReleased) {
      if (requiredPlans && requiredPlans.length > 0) {
        if (!logged) {
          return `Este capítulo requiere uno de los siguientes planes: ${requiredPlans.map(p => p.name).join(", ")}.`;
        }
        // Usuario logueado pero sin el plan requerido
        return `Este capítulo requiere uno de los siguientes planes: ${requiredPlans.map(p => p.name).join(", ")}.`;
      }
      return null; // Todos pueden leer
    } else {
      if (requiredPlans && requiredPlans.length > 0) {
        if (!logged) {
          return `Este capítulo aún no ha sido publicado. Requiere uno de los siguientes planes para acceso anticipado: ${requiredPlans.map(p => p.name).join(", ")}.`;
        }
        return `Este capítulo aún no ha sido publicado. Requiere uno de los siguientes planes para acceso anticipado: ${requiredPlans.map(p => p.name).join(", ")}.`;
      }
      return "Este capítulo aún no ha sido publicado.";
    }
  };

  // Check chapter access
  const userHasAccessToChapter = (chapter: Chapter): boolean => {
    if (!logged && manga.requireLogin) return false;

    // Check user permissions (staff)
    const permissions =
      user?.permissions?.find(
        (permission: any) => permission.organizationId === organization?.id
      ) || {};
    if (permissions.canReadUnreleased === true) return true;
    if (permissions.canEditChapter === true) return true;
    if (permissions.canEditPage === true) return true;

    // Si el capítulo está marcado como isUnreleased (bloqueado para lectura anticipada)
    // Solo los suscriptores exclusivos y los suscriptores con acceso anticipado del manga pueden leerlo
    if (chapter.isUnreleased === true) {
      if (!logged) return false;

      let hasExclusiveAccess = false; // Acceso exclusivo (subscriptionPlansCanReadReleased)
      let hasUnreleasedAccess = false; // Acceso anticipado (subscriptionPlansCanReadUnreleased)

      for (const subscription of user?.subscriptions || []) {
        if (
          subscription.active === true &&
          subscription?.subscriptionPlan?.organizationId === organization?.id
        ) {
          // Verificar si tiene plan de lectura exclusiva
          const hasReleasedPlan = manga.subscriptionPlansCanReadReleased?.find(
            (plan) => plan.id === subscription?.subscriptionPlan?.id
          );
          // Verificar si tiene plan de lectura anticipada
          const hasUnreleasedPlan = manga.subscriptionPlansCanReadUnreleased?.find(
            (plan) => plan.id === subscription?.subscriptionPlan?.id
          );

          if (hasReleasedPlan) {
            hasExclusiveAccess = true;
          }
          if (hasUnreleasedPlan) {
            hasUnreleasedAccess = true;
          }
        }
      }

      // Solo puede leer si tiene acceso exclusivo O acceso anticipado (o ambos)
      if (hasExclusiveAccess || hasUnreleasedAccess) return true;

      // Fallback: si la obra no restringe planes para el adelanto (lista vacía),
      // cualquier suscriptor con un plan ACTIVO del MISMO scan y
      // canReadUnreleased=true puede leerlo (espeja el backend).
      const unreleasedListEmpty = (manga.subscriptionPlansCanReadUnreleased?.length ?? 0) === 0;
      if (unreleasedListEmpty) {
        for (const subscription of user?.subscriptions || []) {
          if (subscription.active !== true) continue;
          const plan = subscription?.subscriptionPlan as any;
          if (!plan?.active) continue;
          if (plan.canReadUnreleased !== true) continue;
          if (plan.organizationId !== organization?.id) continue;
          return true;
        }
      }
      return false;
    }

    // Lógica normal para capítulos no bloqueados
    const isChapterReleased = chapter.releasedAt 
      ? new Date(chapter.releasedAt).getTime() < new Date().getTime()
      : false;

    if (isChapterReleased) {
      // Capítulo ya fue lanzado
      const hasCanReadReleasedPlans = (manga.subscriptionPlansCanReadReleased?.length ?? 0) > 0;

      if (hasCanReadReleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadReleased pueden leer
        if (!logged) return false;

        for (const subscription of user?.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organization?.id
          ) {
            const hasPlan = manga.subscriptionPlansCanReadReleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadReleased está vacío → Todos pueden leer
        return true;
      }
    } else {
      // Capítulo NO ha sido lanzado
      const hasCanReadUnreleasedPlans = (manga.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;

      if (hasCanReadUnreleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadUnreleased pueden leer
        if (!logged) return false;

        for (const subscription of user?.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organization?.id
          ) {
            const hasPlan = manga.subscriptionPlansCanReadUnreleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadUnreleased vacío → la obra no restringe planes:
        // cualquier suscriptor con un plan ACTIVO del MISMO scan y
        // canReadUnreleased=true puede leer el adelanto (espeja el backend).
        if (!logged) return false;
        for (const subscription of user?.subscriptions || []) {
          if (subscription.active !== true) continue;
          const plan = subscription?.subscriptionPlan as any;
          if (!plan?.active) continue;
          if (plan.canReadUnreleased !== true) continue;
          if (plan.organizationId !== organization?.id) continue;
          return true;
        }
        return false;
      }
    }
  };

  // Check if the user has permission to download chapters
  const userCanDownload = (): boolean => {
    if (!logged || !user) return false;

    // Staff with canDownload permission
    const permissions =
      user?.permissions?.find(
        (permission: any) => permission.organizationId === organization?.id
      ) || {};
    if (permissions.canDownload === true) return true;

    // Active subscription with canDownload enabled for this org
    for (const subscription of user?.subscriptions || []) {
      if (
        subscription.active === true &&
        subscription?.subscriptionPlan?.organizationId === organization?.id &&
        subscription?.subscriptionPlan?.canDownload === true
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

  // Check if chapter is read (considering updating state)
  const isChapterRead = (chapterNumber: number): boolean => {
    const history = getChapterHistory(chapterNumber);
    const isUpdating = chaptersUpdating.has(chapterNumber);
    // If updating, return the optimistic state (will be read if we're marking as read)
    // For simplicity, we'll use the current history state even while updating
    return !!history?.finishedAt;
  };

  // Get chapter label
  const getChapterLabel = (chapter: Chapter): string | null => {
    if (!userHasAccessToChapter(chapter)) {
      if (!logged && manga.requireLogin) {
        return "Inicia sesión para leer";
      }
      const requiredPlans = getRequiredPlansForChapter(chapter);
      if (requiredPlans && requiredPlans.length > 0) {
        // Return null when there are required plans - we'll show pills instead
        return null;
      }
      const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();
      if (!isChapterReleased) {
        return "Aún no publicado";
      }
      return "Solo para suscriptores";
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

  // Get required plans for chapter (to render pills)
  const getRequiredPlansForChapterPills = (chapter: Chapter) => {
    return getRequiredPlansForChapter(chapter);
  };

  // Render subscription plan pills for sidebar
  const renderSidebarSubscriptionPills = (plans: Array<{ id: number; name: string }>, type: 'unreleased' | 'released') => {
    if (!plans || plans.length === 0) return null;

    // Check if user has a specific plan
    const userHasPlan = (planId: number) => {
      if (!user || !organization?.id) return false;
      return user.subscriptions?.some((sub: any) => 
        sub.active === true &&
        sub?.subscriptionPlan?.organizationId === organization.id &&
        sub?.subscriptionPlan?.id === planId
      ) || false;
    };

    // Get tooltip text based on type
    const getTooltipText = () => {
      if (type === 'unreleased') {
        return "Acceso de lectura anticipada";
      } else {
        return "Acceso de lectura exclusiva";
      }
    };

    return (
      <div className="flex flex-wrap gap-1.5">
        {plans.map((plan: any) => {
          const hasPlan = userHasPlan(plan.id);
          return (
            <div key={plan.id} className="relative group/pill">
              <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-help ${
                hasPlan 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
              }`}>
                {plan.name}
              </span>
              {/* Tooltip individual para cada pill */}
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[8px] font-medium leading-relaxed max-w-[360px] opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg whitespace-normal">
                {getTooltipText()}
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render subscription plan pills with tooltips
  const renderSubscriptionPlanPills = (chapter: Chapter) => {
    const requiredPlans = getRequiredPlansForChapterPills(chapter);
    if (!requiredPlans || requiredPlans.length === 0) return null;

    const unreleasedPlans = manga.subscriptionPlansCanReadUnreleased || [];
    const releasedPlans = manga.subscriptionPlansCanReadReleased || [];

    // Create a map of all unique plans
    const allPlansMap = new Map();

    // Add unreleased plans
    unreleasedPlans.forEach((plan: any) => {
      allPlansMap.set(plan.id, {
        ...plan,
        inUnreleased: true,
        inReleased: false
      });
    });

    // Add or update released plans
    releasedPlans.forEach((plan: any) => {
      if (allPlansMap.has(plan.id)) {
        allPlansMap.get(plan.id).inReleased = true;
      } else {
        allPlansMap.set(plan.id, {
          ...plan,
          inUnreleased: false,
          inReleased: true
        });
      }
    });

    // Filter to only show required plans
    const plansToShow = requiredPlans.map(reqPlan => {
      const fullPlan = allPlansMap.get(reqPlan.id);
      return fullPlan || reqPlan;
    });

    // Check if user has a specific plan
    const userHasPlan = (planId: number) => {
      if (!user || !organization?.id) return false;
      return user.subscriptions?.some((sub: any) => 
        sub.active === true &&
        sub?.subscriptionPlan?.organizationId === organization.id &&
        sub?.subscriptionPlan?.id === planId
      ) || false;
    };

    // Get tooltip text for each plan
    const getTooltipText = (plan: any) => {
      if (plan.inUnreleased && plan.inReleased) {
        return "Acceso de lectura exclusiva + lectura anticipada";
      } else if (plan.inUnreleased) {
        return "Acceso de lectura anticipada";
      } else if (plan.inReleased) {
        return "Acceso de lectura exclusiva";
      }
      return "";
    };

    return (
      <div className="flex flex-wrap gap-1 sm:gap-1.5">
        {plansToShow.map((plan: any) => {
          const hasPlan = userHasPlan(plan.id);
          return (
            <div key={plan.id} className="relative group/pill">
              <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase cursor-help ${
                hasPlan 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
              }`}>
                {plan.name}
              </span>
              {/* Tooltip individual para cada pill */}
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[8px] font-medium leading-relaxed max-w-[200px] sm:max-w-[280px] md:max-w-[360px] opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg whitespace-normal">
                {getTooltipText(plan)}
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to get chapter URL
  const getChapterUrl = (chapter: Chapter): string => {
    const orgBase = nsfwMode ? `/red/${organization?.slug || ""}` : `/${organization?.slug || ""}`;
    if (!logged && manga.requireLogin) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `${orgBase}/manga/${mangaSlug}`;
      return `/${organization?.slug || ""}/login?mangaSlug=${
        mangaSlug
      }&chapterNumber=${chapter.number}&redirect=${
        currentPath
      }`.replace("//", "/");
    }

    if (!userHasAccessToChapter(chapter)) {
      return `/${
        organization?.slug || ""
      }/subscriptions?mangaSlug=${mangaSlug}&chapterNumber=${
        chapter.number
      }`.replace("//", "/");
    }

    if (logged) {
      const history = getChapterHistory(chapter.number);
      if (history && !history.finishedAt && history.pageNumber) {
        return organization?.slug
          ? `${detailBase}/${mangaSlug}/${chapterPathSegment}/${chapter.number}?page=${history.pageNumber}`
          : `/manga/${mangaSlug}/chapters/${chapter.number}?page=${history.pageNumber}`;
      }
    }

    return organization?.slug
      ? `${detailBase}/${mangaSlug}/${chapterPathSegment}/${chapter.number}`
      : `/manga/${mangaSlug}/chapters/${chapter.number}`;
  };

  // Generate share URL with user slug
  const generateShareUrl = (chapterNumber: number): string => {
    const baseUrl = window.location.origin;
    const chapterUrl = organization?.slug
      ? (isWriting && writingType
        ? `${writingsPrefix}/${writingType}/${mangaSlug}/chapter/${chapterNumber}`
        : `/${organization.slug}/manga/${mangaSlug}/chapters/${chapterNumber}`)
      : `/manga/${mangaSlug}/chapters/${chapterNumber}`;
    
    if (user?.slug) {
      return `${baseUrl}${chapterUrl}?shared_by=${user.slug}`;
    }
    return `${baseUrl}${chapterUrl}`;
  };

  // Handle share button click
  const handleShareClick = (e: React.MouseEvent, chapterNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = generateShareUrl(chapterNumber);
    setShareModal({
      isOpen: true,
      chapterNumber,
      shareUrl,
    });
    setCopied(false);
  };

  // Copy share URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareModal.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Navigate to chapter (kept for backward compatibility with onClick handlers)
  const goToReadChapter = (chapter: Chapter) => {
    window.location.href = getChapterUrl(chapter);
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
      const favEndpoint = isJoint
        ? `/api/joint/${mangaSlug}/favorite`
        : `/api/favorites/manga-custom/${mangaSlug}`;
      if (wasFavorite) {
        await callAPI(favEndpoint, { method: 'DELETE' });
        setFavoriteFeedback({
          message: "Eliminado de favoritos",
          type: "success",
        });
      } else {
        await callAPI(favEndpoint, { method: 'POST' });
        setFavoriteFeedback({
          message: "Agregado a favoritos. Recibirás emails cuando salgan nuevos capítulos",
          type: "success",
        });
      }

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFavoriteFeedback(null);
      }, 3000);
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFavorite(wasFavorite);
      setFavoriteFeedback({
        message: error?.message || "Error al actualizar favoritos",
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
  // Unified function to toggle chapter read status
  const toggleChapterReadStatus = async (
    e: React.MouseEvent,
    chapterNumber: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!logged) return;

    const chapter = manga.chapters?.find((c) => c.number === chapterNumber);
    if (!chapter || !userHasAccessToChapter(chapter)) return;

    const currentHistory = getChapterHistory(chapterNumber);
    const isCurrentlyRead = !!currentHistory?.finishedAt;
    const willBeRead = !isCurrentlyRead;

    // Mark as updating (shows gray state)
    setChaptersUpdating((prev) => new Set(prev).add(chapterNumber));

    // Optimistic update: update state immediately
    if (willBeRead) {
      // Mark as read
      setUserChapterHistory((prev) => {
        // Remove existing entry if any (in case of "continuar leyendo")
        const filtered = prev.filter((h) => h?.chapter?.number !== chapterNumber);
        // Add new entry with finishedAt
        return [
          ...filtered,
          {
            chapter,
            chapterId: chapter.id,
            finishedAt: new Date(),
            pageNumber: currentHistory?.pageNumber || 0,
          },
        ];
      });
      setReadFeedback({ chapterNumber, message: "Marcado como leído" });
    } else {
      // Mark as unread - remove finishedAt but keep history if exists
      setUserChapterHistory((prev) => {
        const filtered = prev.filter((h) => h?.chapter?.number !== chapterNumber);
        // If there was a history entry, keep it but without finishedAt
        if (currentHistory && !currentHistory.finishedAt) {
          return [...filtered, currentHistory];
        }
        return filtered;
      });
      setReadFeedback({ chapterNumber, message: "Marcado como no leído" });
    }

    // Call API
    try {
      if (willBeRead) {
        await callAPI(`/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapterNumber}`, { method: 'GET' });
      } else {
        await callAPI(`/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapterNumber}`, { method: 'DELETE' });
      }
      
      // Success: remove updating state
      setChaptersUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(chapterNumber);
        return newSet;
      });
      
      // Clear feedback after delay
      setTimeout(() => {
        setReadFeedback(null);
      }, 2000);
    } catch (error) {
      console.error(`Failed to ${willBeRead ? 'mark' : 'unmark'} chapter as read`, error);
      
      // Revert optimistic update on error
      if (willBeRead) {
        // Revert: remove the read status we just added
        setUserChapterHistory((prev) => {
          const filtered = prev.filter((h) => h?.chapter?.number !== chapterNumber);
          // Restore previous state if it existed (could be "continuar leyendo" without finishedAt)
          if (currentHistory) {
            return [...filtered, currentHistory];
          }
          return filtered;
        });
        setReadFeedback({ chapterNumber, message: "Error al marcar como leído" });
      } else {
        // Revert: restore read status (was read, we tried to unread, failed)
        setUserChapterHistory((prev) => {
          const filtered = prev.filter((h) => h?.chapter?.number !== chapterNumber);
          // Restore the read state (with finishedAt)
          if (currentHistory) {
            return [...filtered, currentHistory];
          }
          // If no history existed, create one with finishedAt
          return [
            ...filtered,
            {
              chapter,
              chapterId: chapter.id,
              finishedAt: new Date(),
              pageNumber: 0,
            },
          ];
        });
        setReadFeedback({ chapterNumber, message: "Error al marcar como no leído" });
      }
      
      // Remove updating state even on error
      setChaptersUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(chapterNumber);
        return newSet;
      });
      
      setTimeout(() => {
        setReadFeedback(null);
      }, 2000);
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

    if (!userCanDownload()) {
      notify.error("No tienes permisos para descargar capítulos. Necesitas una suscripción activa con acceso a descargas.");
      return;
    }

    if (!userHasAccessToChapter(chapter)) {
      return;
    }

    setIsDownloadingChapter(chapterNumber);

    try {
      const chapterPages = await callAPI(`/api/manga-custom/${mangaSlug}/chapter/${chapter.number}/pages`);

      if (!Array.isArray(chapterPages) || chapterPages.length === 0) {
        console.error("No se encontraron páginas para este capítulo");
        notify.error("No se pudieron obtener las páginas del capítulo. Por favor, intenta de nuevo.");
        return;
      }

      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(`Chapter ${chapter.number}`);

      const pagePromises = chapterPages.map((page: any) =>
        fetch(page.imageUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error al descargar la página: ${response.statusText}`);
            }
            return response.blob();
          })
      );
      const blobs = await Promise.all(pagePromises);

      blobs.forEach((blob, index) => {
        const page = chapterPages[index];
        const extension = page.imageUrl?.split('.').pop()?.toLowerCase() || 'jpg';
        folder?.file(
          `${chapter.number.toString().padStart(6, "0")} - ${page.number
            .toString()
            .padStart(6, "0")}.${extension}`,
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
    } catch (error: any) {
      console.error("Failed to download chapter", error);
      const errorMessage = error?.message || "Error al descargar el capítulo. Por favor, verifica que tengas acceso y vuelve a intentar.";
      notify.error(errorMessage);
    } finally {
      setIsDownloadingChapter(null);
    }
  };

  // Format date using the utility function that handles future dates correctly
  const formatDate = (dateString: string): string => {
    return formatDateUtil(dateString, "es");
  };

  // Format comment date (more detailed)
  // Use non-mutating sort: Array.prototype.sort() mutates in place, so the
  // line for `firstChapter` was leaving manga.chapters in ascending order
  // BEFORE the next render of the chapter list — could subtly desync the
  // displayed order from chapterGroups (which expects descending).
  const firstChapter = manga.chapters
    ? [...manga.chapters].sort((a, b) => a.number - b.number)[0]
    : undefined;
  const lastChapter = manga.chapters
    ? [...manga.chapters].sort((a, b) => b.number - a.number)[0]
    : undefined;
  const currentChapters = chapterGroups[selectedChapterGroup]?.chapters || [];

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 overflow-x-hidden">
      {/* Aviso: obra en privado. Solo el staff llega aquí (el resto recibe 404). */}
      {(manga as any)?.isPublic === false && (
        <div className="max-w-7xl mx-auto px-3 md:px-8 pt-2">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <Lock size={18} className="shrink-0 mt-0.5 text-amber-400" />
            <div className="text-sm">
              <p className="font-black uppercase tracking-wider text-amber-300">Obra en privado · no pública</p>
              <p className="text-amber-200/80 mt-0.5">Solo tu equipo del scan puede verla. No aparece en el sitio, la búsqueda ni el inicio, y los anuncios están desactivados. Vuélvela pública desde la edición cuando el tema de copyright esté resuelto.</p>
            </div>
          </div>
        </div>
      )}
      {/* NSFW Age Verification Modal */}
      {showNSFWModal && (
        <NSFWAgeModal onConfirm={() => setShowNSFWModal(false)} />
      )}

      {/* Banner Backdrop */}
      <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden">
        <img
          src={manga.bannerUrl || manga.imageUrl || ""}
          className="w-full h-full object-cover opacity-60 blur-[2px] scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-8 -mt-32 md:-mt-48 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* SECCION IZQUIERDA (SIDEBAR) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="relative group mx-auto w-48 sm:w-56 lg:w-full">
              <div className="aspect-[2/3] rounded-3xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                <img
                  src={manga.imageUrl || ""}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={manga.title}
                />
              </div>
            </div>

            {/* CTA primario: leer. Antes el botón dominante era Favoritos
                (amarillo) y los accesos de lectura quedaban enterrados abajo. */}
            {firstChapter && (
              <a
                href={getChapterUrl(firstChapter)}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all active:scale-95"
              >
                <BookOpen size={18} />
                Empezar a leer
              </a>
            )}

            <button
              onClick={toggleFavorite}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
                isFavorite
                  ? "bg-yellow-400/10 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
              }`}
            >
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "QUITAR DE FAVORITOS" : "AÑADIR A FAVORITOS"}
            </button>

            <button
              onClick={handleToggleUserList}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
                isInUserList
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-400'
              }`}
            >
              <Bookmark size={18} fill={isInUserList ? 'currentColor' : 'none'} />
              {isInUserList ? 'EN MI LISTA' : 'AÑADIR A MI LISTA'}
            </button>

            {!isJoint && (
              <MilestoneAlertButton
                mangaSlug={mangaSlug}
                logged={logged}
                scanSlug={organization?.slug}
                lastPublished={(manga.chapters || []).reduce((m: number, c: any) => {
                  const released = !c.isUnreleased && (!c.releasedAt || new Date(c.releasedAt) <= new Date());
                  return released ? Math.max(m, Number(c.number) || 0) : m;
                }, 0)}
              />
            )}

            {logged && (
              <AddToListButton
                mangaCustomId={!isJoint ? (manga as any).id : undefined}
                jointId={isJoint ? (manga as any).id : undefined}
                logged={logged}
                scanSlug={organization?.slug}
              />
            )}

            {/* Descargar para leer sin conexión — solo móvil/app (desktop intacto).
                Solo obras con imágenes (no novelas). */}
            {!isWriting && organization?.slug && (
              <div className="md:hidden">
                <DownloadButton
                  user={user}
                  scanSlug={organization.slug}
                  mangaSlug={mangaSlug}
                  title={(manga as any).title || (manga as any)?.manga?.title || 'Manga'}
                  coverUrl={(manga as any).imageUrl || (manga as any)?.manga?.imageUrl || ''}
                  chapters={(manga.chapters || []).map((c: any) => ({ number: c.number, title: c.title, isUnreleased: c.isUnreleased }))}
                  isJoint={isJoint}
                />
              </div>
            )}

            {/* Reportar contenido (discreto) */}
            <div className="flex justify-end">
              <ReportButton
                mangaSlug={mangaSlug}
                organizationSlug={organization?.slug}
                jointSlug={isJoint ? mangaSlug : undefined}
                logged={logged}
              />
            </div>

            {/* Bookmark shortcut — only visible when the user has saved a
                position somewhere in this work. Routes to the chapter and, for
                novels, hints the scroll percentage via ?page= which the
                NovelReader picks up on mount. */}
            {logged && workBookmark && (() => {
              const ch = workBookmark.chapter;
              if (!ch) return null;
              const isWriting = !!ch.mangaCustom?.manga?.bookType?.code &&
                ['novel', 'light-novel', 'book', 'short-story'].includes(ch.mangaCustom.manga.bookType.code);
              const orgSlug = ch.mangaCustom?.organization?.slug;
              const ms = ch.mangaCustom?.manga?.slug;
              const jSlug = ch.joint?.slug;
              const typeSeg = ch.mangaCustom?.manga?.bookType?.code || 'novel';
              let url: string;
              if (jSlug) {
                url = `/joint/manga/${jSlug}/chapters/${ch.number}?page=${workBookmark.pageNumber}`;
              } else if (isWriting && orgSlug && ms) {
                url = `/writings/${orgSlug}/${typeSeg}/${ms}/chapter/${ch.number}?page=${workBookmark.pageNumber}`;
              } else if (orgSlug && ms) {
                url = `/${orgSlug}/manga/${ms}/chapters/${ch.number}?page=${workBookmark.pageNumber}`;
              } else {
                return null;
              }
              const positionLabel = isWriting
                ? `${workBookmark.pageNumber}%`
                : `Pág. ${workBookmark.pageNumber}`;
              return (
                <a
                  href={url}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 bg-yellow-400/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/20"
                >
                  <Bookmark size={18} fill="currentColor" />
                  Ir a mi marcador · Cap. {ch.number} · {positionLabel}
                </a>
              );
            })()}

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
            {userListFeedback && (
              <div
                className={`p-4 rounded-2xl border text-sm font-bold text-center transition-all animate-in fade-in slide-in-from-top-2 ${
                  userListFeedback.type === 'success'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {userListFeedback.message}
              </div>
            )}

            <div className="space-y-6">
              {(() => {
                const typeBadge = getBookTypeBadge((manga as any).manga?.bookType?.name);
                const demoBadge = getDemographyBadge(manga.demography?.name || (manga as any).manga?.demography?.name);
                const isOneShot = (manga as any).isOneShot === true;
                if (!typeBadge && !demoBadge && !isOneShot) return null;
                return (
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeBadge && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${typeBadge.className}`}>{typeBadge.label}</span>
                    )}
                    {demoBadge && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${demoBadge.className}`}>{demoBadge.label}</span>
                    )}
                    {isOneShot && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-cyan-500/20 border-cyan-500/30 text-cyan-300">One-shot</span>
                    )}
                  </div>
                );
              })()}
              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                  Estado:
                </p>
                <a
                  href={`${nsfwMode ? '/red/search' : '/search'}?status=${encodeURIComponent(manga.status)}`}
                  className={`inline-flex px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-125 transition-all ${
                    manga.status === "ongoing"
                      ? "bg-green-500/20 border-green-500/30 text-green-400"
                      : manga.status === "hiatus"
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-red-500/20 border-red-500/30 text-red-400"
                  }`}
                >
                  {translateStatus(manga.status)}
                </a>
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

              {/* Vistas totales. Cuando la obra está en un joint, el backend ya
                  suma las lecturas del joint para que no se vea "congelada" en 0. */}
              <div>
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                  Vistas:
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-xl text-xs font-black text-white">
                  <Eye size={14} className="text-cyan-400" />
                  {((manga as any).views || 0).toLocaleString()}
                </div>
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
                      <a
                        key={genre.id}
                        href={`${nsfwMode ? '/red/search' : '/search'}?genre=${encodeURIComponent(genre.name)}`}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                      >
                        {genre.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Lectura Anticipada */}
              {manga.subscriptionPlansCanReadUnreleased && manga.subscriptionPlansCanReadUnreleased.length > 0 && (
                <div>
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    Lectura Anticipada:
                  </p>
                  {renderSidebarSubscriptionPills(manga.subscriptionPlansCanReadUnreleased, 'unreleased')}
                </div>
              )}

              {/* Lectura Exclusiva */}
              {manga.subscriptionPlansCanReadReleased && manga.subscriptionPlansCanReadReleased.length > 0 && (
                <div>
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest mb-2">
                    Lectura Exclusiva:
                  </p>
                  {renderSidebarSubscriptionPills(manga.subscriptionPlansCanReadReleased, 'released')}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {firstChapter && (
                  <a
                    href={getChapterUrl(firstChapter)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors text-center"
                  >
                    IR AL PRIMER CAPÍTULO
                  </a>
                )}
                {lastChapter && (
                  <a
                    href={getChapterUrl(lastChapter)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-colors text-center"
                  >
                    IR AL ÚLTIMO CAPÍTULO
                  </a>
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
                      // El slug está en recommendedManga.manga.slug (relación anidada del mangaCustom)
                      const recommendedMangaSlug = recommendedManga.manga?.slug || recommendedManga.slug;
                      const recOrgBase = nsfwMode ? `/red/${organization?.slug}` : `/${organization?.slug}`;
                      const mangaUrl = recommendedMangaSlug && recommendedMangaSlug !== 'undefined' && organization?.slug
                        ? `${recOrgBase}/manga/${recommendedMangaSlug}`
                        : (recommendedMangaSlug && recommendedMangaSlug !== 'undefined'
                          ? `/manga/${recommendedMangaSlug}`
                          : '#');

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
              {manga.alternativeTitle && (
                <p className="text-zinc-400 text-sm md:text-base font-semibold italic tracking-tight -mt-1">
                  {manga.alternativeTitle}
                </p>
              )}
              {(() => {
                // Authors live on the underlying manga model (mangaCustom.manga.authors),
                // not on the per-org mangaCustom. Fall back to root .authors to be safe
                // for any caller that may have flattened the structure.
                const authors = manga.manga?.authors ?? manga.authors ?? [];
                if (authors.length === 0) return null;
                return (
                  <p className="text-zinc-400 text-lg font-bold">
                    Por{' '}
                    {authors.map((a, i) => (
                      <React.Fragment key={a.slug ?? a.name}>
                        {i > 0 && ', '}
                        {a.slug ? (
                          <a
                            href={`/search?author=${encodeURIComponent(a.slug)}`}
                            className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 underline-offset-4 hover:decoration-cyan-400 transition-colors"
                            title={`Ver más obras de ${a.name}`}
                          >
                            {a.name}
                          </a>
                        ) : (
                          <span>{a.name}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                );
              })()}

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

                {/* Range picker first on mobile (so user can switch ranges
                    without scrolling past the whole list), and a side column
                    on lg+. Chapter list stops being sticky/overflow-scroll on
                    mobile — that pattern was leaving the list invisible inside
                    a cramped column. */}
                <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
                  <div className="flex-1 space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overflow-x-hidden min-w-0">
                    {(() => {
                      const sorted = [...currentChapters].sort((a, b) => b.number - a.number);
                      // Solo tiene sentido marcar capítulos como "Desbloqueado"
                      // cuando la obra realmente tiene alguno bloqueado; si todos
                      // son de acceso libre, el candado verde es ruido repetido.
                      const anyLocked = sorted.some((c) => !userHasAccessToChapter(c));
                      const groupByVol = (manga as any).groupChaptersByVolume === true;
                      const volumes: any[] = (manga as any).volumes || [];
                      const volMeta = (n: number | null) => (n != null ? volumes.find((v: any) => v.number === n) : null);
                      let prevVol: number | null | undefined = undefined;
                      return sorted.map((chapter) => {
                        const hasAccess = userHasAccessToChapter(chapter);
                        const isRead = isChapterRead(chapter.number);
                        const chapterHistory = getChapterHistory(
                          chapter.number
                        );
                        const isUpdating = chaptersUpdating.has(chapter.number);

                        const chapterUrl = getChapterUrl(chapter);
                        const isFinal = (manga as any).finalChapterNumber != null && chapter.number === (manga as any).finalChapterNumber;

                        // Cabecera de volumen (solo si la obra agrupa por volumen).
                        const vol = (chapter as any).volumeNumber ?? null;
                        let volumeHeader = null;
                        if (groupByVol && vol !== prevVol) {
                          prevVol = vol;
                          const meta = volMeta(vol);
                          volumeHeader = (
                            <div key={`vol-${vol}`} className="flex items-center gap-3 pt-4 pb-1">
                              {meta?.coverUrl && <img src={meta.coverUrl} alt="" className="w-10 h-14 object-cover rounded" />}
                              <div>
                                <p className="text-white font-black uppercase tracking-tight text-sm">
                                  {vol != null ? `Volumen ${vol}` : 'Sin volumen'}
                                </p>
                                {meta?.title && <p className="text-zinc-500 text-xs">{meta.title}</p>}
                              </div>
                            </div>
                          );
                        }

                        return (
                        <React.Fragment key={`wrap-${chapter.id}`}>
                        {volumeHeader}
                          <a
                            key={chapter.id}
                            href={chapterUrl}
                            className={`group border rounded-2xl md:rounded-3xl p-3 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between transition-all cursor-pointer block min-w-0 ${
                              isUpdating
                                ? "border-zinc-700 opacity-60"
                                : isFinal
                                ? "border-amber-500/30 hover:border-amber-400/50 hover:bg-zinc-900/80"
                                : hasAccess
                                ? isRead
                                  ? "border-zinc-800 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                  : chapterHistory
                                  ? "border-orange-500/30 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                  : "border-zinc-800 hover:border-cyan-500/30 hover:bg-zinc-900/80"
                                : "border-zinc-800/50 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1 mb-2 md:mb-0">
                              <div className="hidden md:block w-24 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50 shrink-0">
                                <img
                                  src={chapter.imageUrl || manga.imageUrl || ""}
                                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                  alt=""
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {/* Lock/Unlock Icon with Tooltip */}
                                    {(!hasAccess || anyLocked) && (
                                    <div className="relative group/lock shrink-0">
                                      {hasAccess && (
                                        <>
                                          <LockOpen
                                            size={16}
                                            className="text-green-400 animate-pulse"
                                          />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-10">
                                            Desbloqueado - Tienes acceso
                                          </div>
                                        </>
                                      )}

                                      {!hasAccess && (
                                        <>
                                          <Lock
                                            size={16}
                                            className="text-yellow-400"
                                          />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs">
                                            {(() => {
                                              const reason = getAccessReasonMessage(chapter);
                                              return reason || "Sin acceso";
                                            })()}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    )}

                                    <h4 className="text-white font-bold text-sm md:text-lg truncate">
                                      Capítulo {(chapter as any).displayNumber ?? chapter.number}
                                    </h4>
                                    {(manga as any).finalChapterNumber != null && chapter.number === (manga as any).finalChapterNumber && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-widest shrink-0">
                                        Final
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wide shrink-0">
                                    {formatDate(chapter.releasedAt)}
                                  </span>
                                </div>
                                <p className="text-zinc-500 text-xs md:text-base font-bold italic tracking-tight uppercase group-hover:text-cyan-400 transition-colors truncate">
                                  "{chapter.title}"
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-col items-start md:items-end gap-2 md:gap-3 min-w-0 flex-shrink-0">
                              <div
                                className="flex items-center gap-3 md:gap-4 text-zinc-500 relative shrink-0 w-full md:w-auto justify-between md:justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-2 md:gap-4">
                                  <div className="relative group/tooltip">
                                    <button
                                      onClick={(e) => handleShareClick(e, chapter.number)}
                                      className="hover:text-cyan-400 transition-colors cursor-pointer"
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
                                        <button
                                          onClick={(e) =>
                                            toggleChapterReadStatus(e, chapter.number)
                                          }
                                          disabled={chaptersUpdating.has(chapter.number)}
                                          className={`transition-colors cursor-pointer ${
                                            chaptersUpdating.has(chapter.number)
                                              ? "text-zinc-600 cursor-wait"
                                              : isRead
                                              ? "hover:text-cyan-400"
                                              : "hover:text-cyan-400"
                                          }`}
                                        >
                                          {chaptersUpdating.has(chapter.number) ? (
                                            <div className="w-[18px] h-[18px] border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                                          ) : isRead ? (
                                            <EyeOff size={18} />
                                          ) : (
                                            <Eye size={18} />
                                          )}
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                          {chaptersUpdating.has(chapter.number)
                                            ? "Actualizando..."
                                            : !isRead
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
                                      {hasAccess && userCanDownload() && (
                                        <div className="relative group/tooltip">
                                          <button
                                            onClick={(e) =>
                                              downloadChapter(e, chapter.number)
                                            }
                                            disabled={
                                              isDownloadingChapter ===
                                              chapter.number
                                            }
                                            className="hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                                {(() => {
                                  const label = getChapterLabel(chapter);
                                  if (label !== null) {
                                    // Si el capítulo está bloqueado para lectura anticipada, agregar tooltip
                                    if (chapter.isUnreleased === true && label === "Solo para suscriptores") {
                                      return (
                                        <div className="relative group/tooltip">
                                          <span
                                            className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                                              hasAccess
                                                ? "text-cyan-400"
                                                : "text-yellow-400"
                                            }`}
                                          >
                                            {label}
                                          </span>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-[10px] font-medium leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg whitespace-normal max-w-xs text-center">
                                            Este capítulo está bloqueado para lectura anticipada. Solo los suscriptores exclusivos y los suscriptores con acceso anticipado del manga pueden leerlo.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <span
                                        className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                                          hasAccess
                                            ? "text-cyan-400"
                                            : "text-yellow-400"
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              {/* Pills - Show at bottom on mobile, right side on desktop */}
                              {(() => {
                                const label = getChapterLabel(chapter);
                                if (label === null) {
                                  // Show pills when there are required plans
                                  return (
                                    <div className="w-full md:w-auto flex justify-start md:justify-end mt-0 md:mt-0">
                                      {renderSubscriptionPlanPills(chapter)}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </a>
                        </React.Fragment>
                        );
                      });
                    })()}
                  </div>

                  {/* Range Picker — horizontal scroll on mobile (with arrow
                      affordances for users without a visible scrollbar),
                      vertical sidebar on lg+. */}
                  {Object.keys(chapterGroups).length > 0 && (
                    <div className="relative lg:w-24 lg:block">
                      {/* Mobile scroll arrows (hidden on lg+ where it's a column) */}
                      <button
                        type="button"
                        onClick={() => rangePickerRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                        aria-label="Rangos anteriores"
                        className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-zinc-950/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center justify-center shadow-lg backdrop-blur"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => rangePickerRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                        aria-label="Rangos siguientes"
                        className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-zinc-950/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center justify-center shadow-lg backdrop-blur"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <div
                        ref={rangePickerRef}
                        className="hscroll lg:[touch-action:auto] lg:[scroll-snap-type:none] flex lg:block gap-2 lg:gap-0 lg:space-y-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 px-4 lg:px-0 scroll-smooth scrollbar-thin"
                      >
                        {Object.values(chapterGroups)
                          .sort((a, b) => b.from - a.from)
                          .map((group) => (
                            <button
                              key={group.label}
                              onClick={() => setSelectedChapterGroup(group.label)}
                              className={`shrink-0 lg:shrink min-w-[5rem] lg:min-w-0 lg:w-full py-2.5 px-3 lg:px-0 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                group.label === selectedChapterGroup
                                  ? "bg-white text-zinc-950 shadow-lg"
                                  : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white"
                              }`}
                            >
                              {group.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REVIEWS (solo manga-custom, no joints en esta versión) */}
        {!isJoint && (
          <MangaReviews mangaSlug={mangaSlug} user={user} logged={logged} organization={organization} scanSlug={organization?.slug} />
        )}

        {/* COMMENTS SECTION (FULL WIDTH) */}
        <CommentsSection
          identifier={isJoint ? `joint_${mangaSlug}` : mangaSlug}
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

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShareModal({ isOpen: false, chapterNumber: null, shareUrl: "" })}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-2">
                <Share2 size={20} className="text-cyan-400" />
                Compartir Capítulo
              </h3>
              <button
                onClick={() => setShareModal({ isOpen: false, chapterNumber: null, shareUrl: "" })}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                  URL de Compartir
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareModal.shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm font-mono p-2 border border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      copied
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400"
                    }`}
                    title={copied ? "¡Copiado!" : "Copiar URL"}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <p className="text-cyan-400 text-xs font-bold leading-relaxed">
                  💡 Por cada persona que acceda a este enlace, se agregará{" "}
                  <span className="text-white">1 punto compartido por IP</span> a tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaDetailPage;
