import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon as ListIcon,
  ArrowUpIcon,
  ArrowPathIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { callAPI } from '../util/callApi';
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";
import CommentsSection from "./landing/CommentsSection";
import ChapterReactions from "./ChapterReactions";
import { getOrgPath, getOrgSlugFromPath } from "../util/get-org-path";

/**
 * OPTIMIZACIONES PRINCIPALES:
 *
 * 1. PageImage memoizado - evita re-renders innecesarios de imágenes
 * 2. Cálculos costosos memoizados (medianWidth, shouldRenderSideBySide)
 * 3. Callbacks estables con useCallback
 * 4. Componentes pequeños memoizados
 * 5. Reducción de dependencias en useEffect
 */

// Componente memoizado para imágenes individuales
// @ts-ignore
const PageImage = memo((props) => {
  const { page, isSideBySide, isLeft, getImageClassName, getImageStyle, reloadNonce, _ } = props;
  return (
    <LazyImage
      id={`page-${page.number}-img`}
      src={page.imageUrl}
      retryable
      reloadNonce={reloadNonce}
      className={`${getImageClassName(isSideBySide)} ${
        isSideBySide && (isLeft ? "object-left" : "object-right")
      }`}
      style={getImageStyle ? getImageStyle() : {}}
      alt={`${_("page")} ${page.number}`}
      loading="lazy"
      decoding="async"
    />
  );
});

PageImage.displayName = "PageImage";

// Componente memoizado para página individual
// @ts-ignore
const SinglePageContainer = memo((props) => {
  const {
    page,
    isCascade,
    shouldShow,
    getPageContainerClassName,
    getPageContainerStyle,
    PageImageComponent,
  } = props;
  return (
    <div
      key={page.number}
      id={`page-${page.number}`}
      className={getPageContainerClassName(isCascade, false, shouldShow)}
      style={getPageContainerStyle(isCascade, page)}
    >
      {PageImageComponent}
    </div>
  );
});

SinglePageContainer.displayName = "SinglePageContainer";

// Componente memoizado para páginas dobles
const DoublePageContainer = memo((props) => {
  const {
    page,
    nextPage,
    isCascade,
    shouldShow,
    getPageContainerClassName,
    getPageContainerStyle,
    LeftImageComponent,
    RightImageComponent,
  } = props;
  return (
    <div
      key={`double-${page.number}-${nextPage.number}`}
      className={getPageContainerClassName(isCascade, true, shouldShow)}
      style={getPageContainerStyle(isCascade)}
    >
      {RightImageComponent}
      {LeftImageComponent}
    </div>
  );
});

DoublePageContainer.displayName = "DoublePageContainer";

export function Reader({
  language,
  manga,
  chapter,
  chapterNumber,
  logged,
  user,
  organizationSlug,
  organization,
  hasAccess = true,
  prevChapterUrl,
  nextChapterUrl,
  mangaUrl,
}) {
  const _ = getTranslator(language);
  
  // El slug está en manga.manga.slug (relación anidada)
  // También puede estar directamente en manga.slug si viene del API
  const mangaSlug = manga?.manga?.slug || manga?.slug || manga?.mangaSlug;
  
  // Validar que el slug esté disponible
  useEffect(() => {
    if (!mangaSlug && manga) {
      console.error('Reader: mangaSlug no disponible', {
        manga,
        availableKeys: Object.keys(manga || {}),
        mangaManga: manga?.manga,
      });
    }
  }, [mangaSlug, manga]);

  // Get organization slug from path if not provided
  const orgSlug = organizationSlug || getOrgSlugFromPath();

  const readTypes = useMemo(
    () => ({
      PAGINATED: "paginated",
      CASCADE: "cascade",
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [openPagesDialog, setOpenPagesDialog] = useState(false);
  // Recarga manual de hojas: global (todo el capítulo) y por página. Cada bump
  // cambia el nonce que recibe LazyImage, que recarga con cache-buster aunque la
  // imagen no haya dado error (a veces "carga mal" sin disparar onError).
  const [reloadAllNonce, setReloadAllNonce] = useState(0);
  const [pageNonces, setPageNonces] = useState({});
  const [lastSaveUrl, setLastSaveUrl] = useState("");
  const [screenIsMobile, setScreenIsMobile] = useState(false);

  const [scrollInfo, setScrollInfo] = useState({
    scrollY: 0,
    readScrollPercentage: 0,
    currentPageNumber: null,
  });

  const [chapterData, setChapterData] = useState({
    chapter: null,
    pages: [],
  });

  const [accessError, setAccessError] = useState(null);

  // ONE bookmark per work (manga or joint). null = no bookmark on this work.
  // For mangas, pageNumber is the actual page (1..N).
  const [workBookmark, setWorkBookmark] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState(null);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);

  const [settings, setSettings] = useState(() => {
    const savedReadType = localStorage.getItem("readType");
    const workType = manga?.workType || 'manga';
    const defaultReadType = savedReadType || (workType === 'manwha' ? readTypes.CASCADE : readTypes.PAGINATED);
    const defaultDirection = workType === 'comic' ? 'ltr' : 'rtl';
    return {
      readType: defaultReadType,
      readingDirection: localStorage.getItem("readingDirection") || defaultDirection,
      fitMode: (() => {
        const saved = localStorage.getItem('fitMode');
        if (saved) return saved;
        if (localStorage.getItem('limitPageHeight') === 'true') return 'height';
        // Default por dispositivo (solo si el usuario nunca eligió): en móvil
        // ajustar al ancho evita el zoom manual constante; en desktop se
        // conserva el comportamiento clásico (tamaño original).
        return window.matchMedia('(max-width: 768px)').matches ? 'width' : 'none';
      })(),
      pageFitLimitPx: parseInt(localStorage.getItem('pageFitLimitPx') || '900', 10),
      useDoublePages: localStorage.getItem("useDoublePages") === "true",
      chapterSettings: localStorage.getItem("chapterSettings") === "true",
      pageGap: localStorage.getItem("pageGap") || "minimo",
    };
  });

  // Memoizar detección de mobile
  useEffect(() => {
    const checkMobile = () => setScreenIsMobile(window.innerWidth < 720);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Memoizar median width - solo recalcular cuando cambien las páginas
  const medianWidth = useMemo(() => {
    if (!chapterData.pages.length) return 0;
    const widths = chapterData.pages
      .map((p) => p.imageWidth)
      .sort((a, b) => a - b);
    const mid = Math.floor(widths.length / 2);
    return (
      (widths.length % 2 !== 0
        ? widths[mid]
        : (widths[mid - 1] + widths[mid]) / 2) * 1.1
    );
  }, [chapterData.pages]);

  // Callbacks estables con useCallback
  const isSinglePage = useCallback((page, median) => {
    if (!page) return false;
    if (page.isSinglePage === true) return false;
    return page.imageWidth <= median;
  }, []);

  const shouldRenderSideBySide = useCallback(
    (pageIndex, pages, median) => {
      // En móvil forzamos página simple: dos páginas lado a lado se ven
      // diminutas en un teléfono y no hay zoom cómodo.
      if (!settings.useDoublePages || screenIsMobile) return false;

      const currentPage = pages[pageIndex];
      const nextPage = pages[pageIndex + 1];

      if (!currentPage || !nextPage) return false;

      const currentIsSingle = isSinglePage(currentPage, median);
      const nextIsSingle = isSinglePage(nextPage, median);

      return currentIsSingle && nextIsSingle;
    },
    [settings.useDoublePages, isSinglePage, screenIsMobile]
  );

  // Memoizar qué páginas mostrar para evitar recalcular en cada render
  const visiblePageNumbers = useMemo(() => {
    if (settings.readType === readTypes.CASCADE) {
      return new Set(chapterData.pages.map((p) => p.number));
    }

    const currentPageIndex = chapterData.pages.findIndex(
      (p) => p.number === currentPage
    );
    if (currentPageIndex === -1) return new Set();

    const visible = new Set([currentPage]);

    if (
      shouldRenderSideBySide(currentPageIndex, chapterData.pages, medianWidth)
    ) {
      const nextPage = chapterData.pages[currentPageIndex + 1];
      if (nextPage) visible.add(nextPage.number);
    }

    return visible;
  }, [
    settings.readType,
    currentPage,
    chapterData.pages,
    shouldRenderSideBySide,
    medianWidth,
    readTypes.CASCADE,
  ]);

  const shouldShowPage = useCallback(
    (pageNumber) => visiblePageNumbers.has(pageNumber),
    [visiblePageNumbers]
  );

  // Precarga de páginas vecinas en modo paginado: mantiene en caché las 2
  // siguientes y la anterior para que el cambio de página sea instantáneo
  // (sin flash en blanco). No monta nada extra ni altera la visibilidad; solo
  // calienta la caché del navegador con Image().
  useEffect(() => {
    if (settings.readType === readTypes.CASCADE) return;
    if (!chapterData.pages.length) return;
    const idx = chapterData.pages.findIndex((p) => p.number === currentPage);
    if (idx === -1) return;
    const toWarm = [idx + 1, idx + 2, idx - 1];
    for (const i of toWarm) {
      const p = chapterData.pages[i];
      if (p?.imageUrl) {
        const img = new Image();
        img.decoding = 'async';
        img.src = p.imageUrl;
      }
    }
  }, [currentPage, chapterData.pages, settings.readType, readTypes.CASCADE]);

  // Callbacks para settings - estables
  const handleSetReadType = useCallback((type) => {
    localStorage.setItem("readType", type);
    setSettings((prev) => ({ ...prev, readType: type }));
  }, []);

  const handleToggleReadingDirection = useCallback(() => {
    setSettings((prev) => {
      const newDir = prev.readingDirection === 'rtl' ? 'ltr' : 'rtl';
      localStorage.setItem("readingDirection", newDir);
      return { ...prev, readingDirection: newDir };
    });
  }, []);

  const handleToggleSettings = useCallback(() => {
    setSettings((prev) => {
      const newValue = !prev.chapterSettings;
      localStorage.setItem("chapterSettings", newValue ? "true" : "false");
      return { ...prev, chapterSettings: newValue };
    });
  }, []);

  const handleFitMode = useCallback((mode) => {
    localStorage.setItem('fitMode', mode);
    setSettings((prev) => ({ ...prev, fitMode: mode }));
  }, []);

  // Ajuste rápido desde la toolbar: cicla los 3 modos comunes con un toast
  // breve. Los modos con límite en px se eligen desde el panel completo.
  const [fitToast, setFitToast] = useState(null);
  const fitToastTimerRef = useRef(null);
  const cycleFitMode = useCallback(() => {
    const order = ['width', 'height', 'none'];
    const current = order.includes(settings.fitMode) ? settings.fitMode : 'none';
    const next = order[(order.indexOf(current) + 1) % order.length];
    handleFitMode(next);
    const labels = {
      width: 'Ajuste: ancho de pantalla',
      height: 'Ajuste: alto de pantalla',
      none: 'Ajuste: tamaño original',
    };
    setFitToast(labels[next]);
    if (fitToastTimerRef.current) clearTimeout(fitToastTimerRef.current);
    fitToastTimerRef.current = setTimeout(() => setFitToast(null), 1500);
  }, [settings.fitMode, handleFitMode]);

  // Nonce combinado por página: cambia si se recarga el capítulo entero o esa
  // página en concreto (las sumas solo crecen, así que cualquier bump lo altera).
  const nonceFor = useCallback(
    (num) => reloadAllNonce + (pageNonces[num] || 0),
    [reloadAllNonce, pageNonces]
  );

  const flashToast = useCallback((msg) => {
    setFitToast(msg);
    if (fitToastTimerRef.current) clearTimeout(fitToastTimerRef.current);
    fitToastTimerRef.current = setTimeout(() => setFitToast(null), 1500);
  }, []);

  const reloadAllPages = useCallback(() => {
    setReloadAllNonce((n) => n + 1);
    flashToast('Recargando capítulo…');
  }, [flashToast]);

  const reloadPage = useCallback((num) => {
    setPageNonces((p) => ({ ...p, [num]: (p[num] || 0) + 1 }));
    flashToast(`Recargando página ${num}…`);
  }, [flashToast]);

  const handlePageFitLimitPx = useCallback((value) => {
    const px = Math.max(100, Math.min(3000, parseInt(value, 10) || 900));
    localStorage.setItem('pageFitLimitPx', String(px));
    setSettings((prev) => ({ ...prev, pageFitLimitPx: px }));
  }, []);

  const handleToggleUseDoublePages = useCallback(() => {
    setSettings((prev) => {
      const newValue = !prev.useDoublePages;
      localStorage.setItem("useDoublePages", newValue ? "true" : "false");
      return { ...prev, useDoublePages: newValue };
    });
  }, []);

  const handlePagesDialog = useCallback(() => {
    setOpenPagesDialog((prev) => !prev);
  }, []);

  // Avanza/retrocede una página en modo paginado. Compartido por el toque en
  // zonas (izq/der), el swipe horizontal y el teclado.
  const stepPaginated = useCallback(
    (isGoingForward) => {
      const currentPageIndex = chapterData.pages.findIndex(
        (p) => p.number === currentPage
      );
      if (currentPageIndex === -1) return;

      let targetIndex;
      if (isGoingForward) {
        const isSideBySide = shouldRenderSideBySide(
          currentPageIndex,
          chapterData.pages,
          medianWidth
        );
        targetIndex = currentPageIndex + (isSideBySide ? 2 : 1);
      } else {
        const prevIndex = currentPageIndex - 1;
        const isPrevSideBySide =
          prevIndex >= 0 &&
          shouldRenderSideBySide(prevIndex, chapterData.pages, medianWidth);
        targetIndex = currentPageIndex - (isPrevSideBySide ? 2 : 1);
      }

      const targetPage = chapterData.pages[targetIndex];
      if (targetPage) {
        setCurrentPage(targetPage.number);
        // scrollIntoView en vez de location.href="#..." para no ensuciar el
        // historial en cada toque (rompería el botón atrás en Android).
        document.getElementById("manga-pages-top")?.scrollIntoView({ block: "start" });
      }
    },
    [chapterData.pages, currentPage, shouldRenderSideBySide, medianWidth]
  );

  // Swipe horizontal en modo paginado. touchStart/End sobre la capa de toque.
  const swipeRef = useRef({ x: 0, y: 0, swiped: false });
  const handlePageTouchStart = useCallback((e) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, swiped: false };
  }, []);
  const handlePageTouchEnd = useCallback(
    (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeRef.current.x;
      const dy = t.clientY - swipeRef.current.y;
      // Swipe válido: horizontal, suficientemente largo y más horizontal que vertical.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        swipeRef.current.swiped = true; // evita que el onClick posterior navegue de nuevo
        const swipedLeft = dx < 0;
        const isGoingForward = settings.readingDirection === 'ltr' ? swipedLeft : !swipedLeft;
        stepPaginated(isGoingForward);
      }
    },
    [settings.readingDirection, stepPaginated]
  );

  const handlePageClick = useCallback(
    (evt) => {
      // Si el gesto fue un swipe, no navegar otra vez con el tap sintético.
      if (swipeRef.current.swiped) {
        swipeRef.current.swiped = false;
        return;
      }
      const clickedRight = evt.clientX > window.innerWidth / 2;
      const isGoingForward = settings.readingDirection === 'ltr' ? clickedRight : !clickedRight;
      stepPaginated(isGoingForward);
    },
    [settings.readingDirection, stepPaginated]
  );

  // Anti doble disparo al encadenar capítulos con el teclado.
  const lastChapterNavAtRef = useRef(0);
  const navigateChapterWithKeyboard = useCallback((url) => {
    if (!url) return;
    const now = Date.now();
    if (now - lastChapterNavAtRef.current < 500) return;
    lastChapterNavAtRef.current = now;
    window.location.href = url;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // URLs de capítulo anterior/siguiente: misma resolución que usan los
      // botones de navegación (props tienen prioridad para páginas joint).
      const kbPrevUrl = prevChapterUrl !== undefined
        ? prevChapterUrl
        : (chapter?.previousChapter?.number
            ? getOrgPath(`/manga/${mangaSlug}/chapters/${chapter?.previousChapter?.number}`, orgSlug)
            : null);
      const kbNextUrl = nextChapterUrl !== undefined
        ? nextChapterUrl
        : (chapter?.nextChapter?.number
            ? getOrgPath(`/manga/${mangaSlug}/chapters/${chapter?.nextChapter?.number}`, orgSlug)
            : null);

      const clickedRight = e.key === 'ArrowRight';

      // Modo cascada: → al final del scroll pasa al siguiente capítulo,
      // ← al inicio vuelve al anterior. ↑/↓ siguen siendo scroll nativo.
      if (settings.readType === readTypes.CASCADE) {
        const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
        const atTop = window.scrollY <= 50;
        if (clickedRight && atBottom) navigateChapterWithKeyboard(kbNextUrl);
        else if (!clickedRight && atTop) navigateChapterWithKeyboard(kbPrevUrl);
        return;
      }

      const isGoingForward = settings.readingDirection === 'ltr' ? clickedRight : !clickedRight;
      const currentPageIndex = chapterData.pages.findIndex((p) => p.number === currentPage);
      if (currentPageIndex === -1) return;
      let targetIndex;
      if (isGoingForward) {
        const isSideBySide = shouldRenderSideBySide(currentPageIndex, chapterData.pages, medianWidth);
        targetIndex = currentPageIndex + (isSideBySide ? 2 : 1);
      } else {
        const prevIndex = currentPageIndex - 1;
        const isPrevSideBySide = prevIndex >= 0 && shouldRenderSideBySide(prevIndex, chapterData.pages, medianWidth);
        targetIndex = currentPageIndex - (isPrevSideBySide ? 2 : 1);
      }
      const targetPage = chapterData.pages[targetIndex];
      if (targetPage) {
        setCurrentPage(targetPage.number);
        document.getElementById("manga-pages-top")?.scrollIntoView({ block: "start" });
        return;
      }
      // Sin más páginas: encadenar al capítulo siguiente/anterior.
      if (isGoingForward && targetIndex >= chapterData.pages.length) {
        navigateChapterWithKeyboard(kbNextUrl);
      } else if (!isGoingForward && targetIndex < 0) {
        navigateChapterWithKeyboard(kbPrevUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.readType, readTypes.CASCADE, chapterData.pages, currentPage, shouldRenderSideBySide, medianWidth, settings.readingDirection, chapter, prevChapterUrl, nextChapterUrl, mangaSlug, orgSlug, navigateChapterWithKeyboard]);

  const handlePageGap = useCallback((value) => {
    localStorage.setItem("pageGap", value);
    setSettings((prev) => ({ ...prev, pageGap: value }));
  }, []);

  // Bookmark interaction — clicking the floating button always opens a modal
  // with the available actions. We avoid auto-detecting "are you at the
  // bookmark" because in cascade/vertical mangas currentPage doesn't track the
  // visible page reliably and the UX got stuck on "delete only".
  const isOnBookmarkedChapter = !!workBookmark && workBookmark.chapterId === chapter?.id;

  const saveBookmarkHere = useCallback(async () => {
    if (!chapter?.id || bookmarkLoading) return;
    setBookmarkLoading(true);
    setBookmarkError(null);
    try {
      const result = await callAPI('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, pageNumber: currentPage }),
      });
      const bk = result?.bookmark ?? result?.data?.bookmark;
      if (bk) setWorkBookmark({ id: bk.id, chapterId: bk.chapterId, chapterNumber: chapter?.number, pageNumber: bk.pageNumber });
    } catch (err) {
      setBookmarkError(err?.message || 'Error al guardar marcador');
      setTimeout(() => setBookmarkError(null), 3000);
    } finally {
      setBookmarkLoading(false);
      setBookmarkModalOpen(false);
    }
  }, [chapter, currentPage, bookmarkLoading]);

  const deleteCurrentBookmark = useCallback(async () => {
    if (!workBookmark || bookmarkLoading) return;
    setBookmarkLoading(true);
    setBookmarkError(null);
    try {
      await callAPI(`/api/bookmarks/${workBookmark.id}`, { method: 'DELETE' });
      setWorkBookmark(null);
    } catch (err) {
      setBookmarkError(err?.message || 'Error al eliminar marcador');
      setTimeout(() => setBookmarkError(null), 3000);
    } finally {
      setBookmarkLoading(false);
      setBookmarkModalOpen(false);
    }
  }, [workBookmark, bookmarkLoading]);

  const goToBookmark = useCallback(() => {
    if (!workBookmark) return;
    if (isOnBookmarkedChapter) {
      setCurrentPage(workBookmark.pageNumber);
      setBookmarkModalOpen(false);
      // In cascade/vertical mode all pages are stacked in one scroll, so just
      // updating currentPage doesn't actually move the viewport. Scroll the
      // bookmarked page container into view explicitly. Defers a frame so the
      // modal close + state update have committed.
      if (settings.readType === readTypes.CASCADE) {
        requestAnimationFrame(() => {
          const el = document.getElementById(`page-${workBookmark.pageNumber}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return;
    }
    const url = `${window.location.pathname.replace(/\/chapters\/[^/]+/, `/chapters/${workBookmark.chapterNumber}`)}?page=${workBookmark.pageNumber}`;
    window.location.href = url;
  }, [workBookmark, isOnBookmarkedChapter, settings.readType, readTypes.CASCADE]);

  const handleToggleBookmark = useCallback(() => {
    if (!chapter?.id) return;
    if (!logged) {
      setBookmarkError('Inicia sesión para guardar tu marcador');
      setTimeout(() => setBookmarkError(null), 3000);
      return;
    }
    setBookmarkModalOpen(true);
  }, [chapter, logged]);

  const getGapValue = useCallback((gapType) => {
    switch (gapType) {
      case "ninguno":
        return 0;
      case "minimo":
        return 2;
      case "medio":
        return 5;
      case "grande":
        return 10;
      default:
        return 0;
    }
  }, []);

  const getPageContainerStyle = useCallback(
    (_isCascade, page) => {
      const style = { marginBottom: `${getGapValue(settings.pageGap)}px` };
      // Reservar la altura de la hoja ANTES de que cargue la imagen: sin esto,
      // cada hoja mide ~0px mientras carga y el contenido salta al aparecer (y
      // el usuario "llega al final" sobre un hueco negro). Solo en ajuste
      // "ancho" (default en móvil) el alto se deriva del ancho, así que el
      // aspect-ratio calza exacto; en otros modos se deja como estaba.
      if (settings.fitMode === 'width' && page?.imageWidth > 0 && page?.imageHeight > 0) {
        style.aspectRatio = `${page.imageWidth} / ${page.imageHeight}`;
        style.width = '100%';
      }
      return style;
    },
    [settings.pageGap, getGapValue, settings.fitMode]
  );

  const getPageContainerClassName = useCallback(
    (isCascade, isDouble = false, shouldShow = true) => {
      const baseClass = "w-full flex justify-center select-none cursor-pointer";
      return `${baseClass}${isDouble ? " flex-row" : ""}${
        shouldShow ? "" : " hidden"
      }`;
    },
    []
  );

  const getImageClassName = useCallback(
    (isSideBySide) => {
      let className = "pointer-events-none object-contain";

      if (isSideBySide) {
        className += " w-1/2";
      } else {
        className += " w-auto max-w-full";
      }

      switch (settings.fitMode) {
        case 'height':
          className += ' max-h-[100vh] h-auto';
          break;
        case 'width':
          if (!isSideBySide) className = 'pointer-events-none object-contain w-full h-auto';
          else className += ' h-auto';
          break;
        default:
          className += ' h-auto';
      }

      return className;
    },
    [settings.fitMode]
  );

  const getImageStyle = useCallback(
    () => {
      if (settings.fitMode === 'limitH') return { maxHeight: `${settings.pageFitLimitPx}px` };
      if (settings.fitMode === 'limitW') return { maxWidth: `${settings.pageFitLimitPx}px`, margin: '0 auto' };
      return {};
    },
    [settings.fitMode, settings.pageFitLimitPx]
  );

  // Detect joint chapter and extract joint slug from mangaUrl
  const isJoint = mangaUrl && mangaUrl.startsWith('/joint/manga/');
  const jointSlug = isJoint ? mangaUrl.replace('/joint/manga/', '').split('/')[0] : null;

  // Analytics - solo una vez por cambio de settings
  // Skipped on joint pages because /api/analytics requires org context (x-organization) and joint URLs have none.
  useEffect(() => {
    if (isJoint) return;
    callAPI('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event: "view_manga_chapter",
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        payload: {
          manga: mangaSlug,
          chapter: chapterNumber,
          ...settings,
        },
      }),
    }).catch(console.error);
  }, [settings, mangaSlug, chapterNumber, isJoint]);

  // Save chapter history - con debounce
  useEffect(() => {
    if (!logged || !chapterNumber) return;
    if (!isJoint && !mangaSlug) return;

    const historyUrl = isJoint
      ? `/api/user-chapter-history/joint/${jointSlug}/chapter/${chapterNumber}/pages/${currentPage}`
      : `/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapterNumber}/pages/${currentPage}`;

    if (lastSaveUrl === historyUrl) return;

    const timeoutId = setTimeout(() => {
      setLastSaveUrl(historyUrl);
      callAPI(historyUrl, { method: 'POST' }).catch((error) => {
        // Solo loggear errores que no sean 404 (recurso no encontrado)
        if (error?.message && !error.message.includes('No se encontró el recurso')) {
          console.error("Failed to save chapter history", error);
        }
      });
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [currentPage, logged, mangaSlug, chapterNumber, lastSaveUrl, isJoint, jointSlug]);

  // Track view - solo una vez
  useEffect(() => {
    if (!chapterNumber) return;
    if (!isJoint && !mangaSlug) return;

    const viewsUrl = isJoint
      ? `/api/views/joint/${jointSlug}/chapter/${chapterNumber}`
      : `/api/views/manga-custom/${mangaSlug}/chapter/${chapterNumber}`;

    callAPI(viewsUrl, {
      method: 'POST'
    }).catch((error) => {
      // Silenciar errores de tracking de vistas
      console.debug('Failed to track view:', error);
    });
  }, [mangaSlug, chapterNumber, isJoint, jointSlug]);

  // Record manga-level view once on mount
  useEffect(() => {
    if (!isJoint || !jointSlug) return;
    fetch(`/api/views/joint/${jointSlug}`, { method: 'POST' }).catch(() => {});
  }, [isJoint, jointSlug]);

  // Load the user's single bookmark for this work (manga or joint).
  useEffect(() => {
    if (!logged || !chapter?.id) { setWorkBookmark(null); return; }
    callAPI('/api/bookmarks')
      .then((data) => {
        const ours = (data || []).find((b) => {
          if (isJoint) {
            return b.chapter?.joint?.slug === jointSlug || (b.chapterId ?? b.chapter?.id) === chapter.id;
          }
          return b.chapter?.mangaCustom?.manga?.slug === mangaSlug || (b.chapterId ?? b.chapter?.id) === chapter.id;
        });
        setWorkBookmark(ours
          ? {
              id: ours.id,
              chapterId: ours.chapterId ?? ours.chapter?.id,
              chapterNumber: ours.chapter?.number,
              pageNumber: ours.pageNumber,
            }
          : null);
      })
      .catch(() => {});
  }, [logged, chapter?.id, isJoint, mangaSlug, jointSlug]);

  // Update URL - con debounce
  useEffect(() => {
    if (!chapter || !chapterData.pages.length || loading) return;

    const page = chapterData.pages.find((p) => p.number === currentPage);
    if (!page) return;

    const timeoutId = setTimeout(() => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPageParam = urlParams.get("page");

        if (currentPageParam !== page.number.toString()) {
          urlParams.set("page", page.number);
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${urlParams}`
          );
        }
      } catch (error) {
        console.error("Failed to update page in URL", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPage, loading, chapterData.pages, chapter]);

  // Scroll tracking - con debounce mejorado
  useEffect(() => {
    if (
      settings.readType !== readTypes.CASCADE ||
      loading ||
      !chapterData.pages.length
    ) {
      return;
    }

    let animationFrameId;
    let lastUpdate = 0;
    const updateInterval = 100; // Actualizar máximo cada 100ms

    const handleScroll = () => {
      if (animationFrameId) return;

      animationFrameId = requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastUpdate < updateInterval) {
          animationFrameId = null;
          return;
        }

        lastUpdate = now;

        const firstPageImage = document.getElementById(
          `page-${chapterData.pages[0]?.number}-img`
        );
        const lastPageImage = document.getElementById(
          `page-${chapterData.pages[chapterData.pages.length - 1]?.number}-img`
        );

        if (!firstPageImage || !lastPageImage) {
          animationFrameId = null;
          return;
        }

        const scrollY = window.scrollY;
        const pageTopY =
          firstPageImage.getBoundingClientRect().top + window.scrollY;
        const pageBottomY =
          lastPageImage.getBoundingClientRect().bottom +
          window.scrollY -
          window.innerHeight;
        const readPercentage = Math.min(
          100,
          Math.max(0, ((scrollY - pageTopY) / (pageBottomY - pageTopY)) * 100)
        );

        setScrollInfo((prev) => {
          if (prev.readScrollPercentage === readPercentage) {
            animationFrameId = null;
            return prev;
          }

          const pageIndex = Math.floor(
            (readPercentage / 100) * (chapterData.pages.length - 1)
          );
          const page = chapterData.pages[pageIndex];

          animationFrameId = null;

          if (!page || page.number === prev.currentPageNumber) {
            return { ...prev, scrollY, readScrollPercentage: readPercentage };
          }

          setCurrentPage(page.number);
          return {
            scrollY,
            readScrollPercentage: readPercentage,
            currentPageNumber: page.number,
          };
        });
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [settings.readType, readTypes.CASCADE, loading, chapterData.pages]);

  // Initial load
  useEffect(() => {
    if (!hasAccess) {
      const errorType =
        !logged && manga?.requireLogin === true
          ? "login_required"
          : "not_released";

      const errorMessage =
        errorType === "login_required"
          ? "Debes iniciar sesión para leer este manga."
          : errorType === "subscription_required"
          ? "Este capítulo es exclusivo para suscriptores. Suscríbete para acceder a contenido premium."
          : "Este capítulo aún no ha sido publicado. Solo los suscriptores pueden acceder a capítulos anticipados.";

      setAccessError({
        message: errorMessage,
        errorType: errorType,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const pagesUrl = isJoint
      ? `/api/joint/${jointSlug}/chapter/${chapterNumber}/pages`
      : `/api/manga-custom/${mangaSlug}/chapter/${chapterNumber}/pages`;
    callAPI(pagesUrl)
      .then((result) => {
        // callAPI ya extrae result.data, así que result es directamente el array de páginas
        // Si hay un error, callAPI lanza una excepción, así que si llegamos aquí, result es válido
        if (!Array.isArray(result)) {
          setAccessError({
            message: "Error al cargar las páginas del capítulo.",
            errorType: "unknown",
          });
          setLoading(false);
          return;
        }

        const pages = result;
        setChapterData((prev) => ({ ...prev, pages: pages }));
        if (pages.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialPageNumber = parseInt(urlParams.get("page") || "1");
          const pageIndex = pages.findIndex((page) => page.number === initialPageNumber);
          // Si no se encuentra la página, usar la primera (índice 0)
          const validPageIndex = pageIndex >= 0 ? pageIndex : 0;
          const targetPage = pages[validPageIndex].number;
          setCurrentPage(targetPage);
          // In cascade mode all pages are stacked, so just setting currentPage
          // doesn't move the viewport. If we got a real ?page=N (not the
          // implicit 1), scroll the matching page container into view after
          // the DOM commits the page nodes.
          if (initialPageNumber > 1 && settings.readType === readTypes.CASCADE) {
            setTimeout(() => {
              const el = document.getElementById(`page-${targetPage}`);
              if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
            }, 200);
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading chapter pages:", error);
        setAccessError({
          message:
            error?.message ||
            "Error al cargar el capítulo. Por favor, intenta de nuevo.",
          errorType: "error",
        });
        setLoading(false);
      });
  }, [
    hasAccess,
    mangaSlug,
    chapterNumber,
    logged,
    manga?.requireLogin,
    isJoint,
    jointSlug,
  ]);

  // Compute effective prev/next navigation URLs
  // Props prevChapterUrl/nextChapterUrl take precedence (used for joint pages);
  // otherwise fall back to org-path construction.
  const resolvedPrevChapterUrl = prevChapterUrl !== undefined
    ? prevChapterUrl
    : (chapter?.previousChapter?.number
        ? getOrgPath(`/manga/${mangaSlug}/chapters/${chapter?.previousChapter?.number}`, orgSlug)
        : null);
  const resolvedNextChapterUrl = nextChapterUrl !== undefined
    ? nextChapterUrl
    : (chapter?.nextChapter?.number
        ? getOrgPath(`/manga/${mangaSlug}/chapters/${chapter?.nextChapter?.number}`, orgSlug)
        : null);
  const resolvedMangaUrl = mangaUrl !== undefined
    ? mangaUrl
    : getOrgPath(`/manga/${mangaSlug}`, orgSlug);

  // Memoizar componentes de navegación
  const PreviousChapterArrow = useMemo(
    () =>
      ({ ...props }) =>
        (
          <div
            className="flex flex-grow items-center h-full justify-center group/nav"
            onClick={() => {
              if (chapter?.previousChapter?.number && resolvedPrevChapterUrl)
                location.href = resolvedPrevChapterUrl;
            }}
            {...props}
          >
            <div className="relative group/tooltip">
              <ChevronLeftIcon
                className={
                  chapter?.previousChapter
                    ? "h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform"
                    : "h-16 w-16 text-white opacity-20 cursor-not-allowed"
                }
              />
              <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {chapter?.previousChapter
                  ? _("click_to_previous_chapter")
                  : _("you_are_in_first_chapter")}
              </div>
            </div>
          </div>
        ),
    [chapter?.previousChapter, resolvedPrevChapterUrl, _]
  );

  const NextChapterArrow = useMemo(
    () =>
      ({ ...props }) =>
        (
          <div
            className="flex flex-grow items-center h-full justify-center group/nav"
            onClick={() => {
              if (chapter?.nextChapter?.number && resolvedNextChapterUrl)
                location.href = resolvedNextChapterUrl;
            }}
            {...props}
          >
            <div className="relative group/tooltip">
              <ChevronRightIcon
                className={
                  chapter?.nextChapter
                    ? "h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform"
                    : "h-16 w-16 text-white opacity-20 cursor-not-allowed"
                }
              />
              <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {chapter?.nextChapter
                  ? _("click_to_next_chapter")
                  : _("you_are_in_last_chapter")}
              </div>
            </div>
          </div>
        ),
    [chapter?.nextChapter, resolvedNextChapterUrl, _]
  );

  // Renderizar páginas - OPTIMIZADO para evitar re-renders innecesarios
  const renderedPages = useMemo(() => {
    if (!chapterData.pages.length) return null;

    const isCascade = settings.readType === readTypes.CASCADE;

    // Sin páginas dobles (o móvil: siempre simple para que se lea bien)
    if (!settings.useDoublePages || screenIsMobile) {
      return chapterData.pages.map((page) => {
        const shouldShow = shouldShowPage(page.number);
        const PageImageComponent = (
          // @ts-ignore
          <PageImage
            page={page}
            isSideBySide={false}
            getImageClassName={getImageClassName}
            getImageStyle={getImageStyle}
            reloadNonce={nonceFor(page.number)}
            _={_}
          />
        );

        return (
          // @ts-ignore
          <SinglePageContainer
            key={page.number}
            page={page}
            isCascade={isCascade}
            shouldShow={shouldShow}
            getPageContainerClassName={getPageContainerClassName}
            getPageContainerStyle={getPageContainerStyle}
            PageImageComponent={PageImageComponent}
          />
        );
      });
    }

    // Con páginas dobles
    const rendered = [];
    const processedIndices = new Set();

    for (let i = 0; i < chapterData.pages.length; i++) {
      if (processedIndices.has(i)) continue;

      const page = chapterData.pages[i];
      const nextPage = chapterData.pages[i + 1];
      const shouldShow = shouldShowPage(page.number);

      if (
        nextPage &&
        shouldRenderSideBySide(i, chapterData.pages, medianWidth)
      ) {
        processedIndices.add(i);
        processedIndices.add(i + 1);

        const LeftImageComponent = (
          // @ts-ignore
          <PageImage
            page={page}
            isSideBySide={true}
            isLeft={true}
            getImageClassName={getImageClassName}
            getImageStyle={getImageStyle}
            reloadNonce={nonceFor(page.number)}
            _={_}
          />
        );

        const RightImageComponent = (
          // @ts-ignore
          <PageImage
            page={nextPage}
            isSideBySide={true}
            isLeft={false}
            getImageClassName={getImageClassName}
            getImageStyle={getImageStyle}
            reloadNonce={nonceFor(nextPage.number)}
            _={_}
          />
        );

        rendered.push(
          // @ts-ignore
          <DoublePageContainer
            key={`double-${page.number}-${nextPage.number}`}
            page={page}
            nextPage={nextPage}
            isCascade={isCascade}
            shouldShow={shouldShow}
            getPageContainerClassName={getPageContainerClassName}
            getPageContainerStyle={getPageContainerStyle}
            LeftImageComponent={LeftImageComponent}
            RightImageComponent={RightImageComponent}
          />
        );
      } else {
        processedIndices.add(i);

        const PageImageComponent = (
          // @ts-ignore
          <PageImage
            page={page}
            isSideBySide={false}
            getImageClassName={getImageClassName}
            getImageStyle={getImageStyle}
            reloadNonce={nonceFor(page.number)}
            _={_}
          />
        );

        rendered.push(
          // @ts-ignore
          <SinglePageContainer
            key={page.number}
            page={page}
            isCascade={isCascade}
            shouldShow={shouldShow}
            getPageContainerClassName={getPageContainerClassName}
            getPageContainerStyle={getPageContainerStyle}
            PageImageComponent={PageImageComponent}
          />
        );
      }
    }

    return rendered;
  }, [
    chapterData.pages,
    settings.readType,
    settings.useDoublePages,
    screenIsMobile,
    readTypes.CASCADE,
    shouldShowPage,
    shouldRenderSideBySide,
    medianWidth,
    getPageContainerClassName,
    getPageContainerStyle,
    getImageClassName,
    getImageStyle,
    nonceFor,
    _,
  ]);

  // Índice legible de la página actual (1..N) para el contador flotante. En
  // cascada se sigue el scroll; en paginado, la página activa.
  const currentReadableIndex = (() => {
    if (!chapterData.pages.length) return 0;
    const num =
      settings.readType === readTypes.CASCADE
        ? scrollInfo.currentPageNumber ?? currentPage
        : currentPage;
    const idx = chapterData.pages.findIndex((p) => p.number === num);
    return idx >= 0 ? idx + 1 : 1;
  })();

  return (
    <div id="reader-top">
      {/* Contador de progreso: "página X / N". Antes no había forma de saber
          cuánto faltaba salvo la barra fina. */}
      {chapterData.pages.length > 0 && !accessError && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[80] pointer-events-none bg-zinc-900/85 backdrop-blur border border-zinc-700 rounded-full px-3 py-1 text-[11px] font-bold text-zinc-200 tabular-nums shadow-lg">
          {currentReadableIndex} / {chapterData.pages.length}
        </div>
      )}
      {fitToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xl pointer-events-none">
          {fitToast}
        </div>
      )}
      <div className="relative w-full min-h-44 group py-4">
        <LazyImage
          alt={manga?.title}
          src={manga?.bannerUrl || manga?.imageUrl}
          decoding="async"
          loading="lazy"
          className="absolute -z-10 top-1/2 -translate-y-1/2 w-full min-w-full min-h-full blur-sm opacity-10 group-hover:opacity-15 object-cover transition-all duration-500 group-hover:scale-[101%]"
        />
        <div className="flex h-full w-full min-h-44 px-4 mx-auto items-center justify-around">
          <PreviousChapterArrow className="hidden md:flex flex-grow items-center h-full justify-center group/nav" />
          <div className="flex flex-grow flex-col max-w-5xl mx-auto">
            <div className="flex md:hidden w-full">
              <PreviousChapterArrow />
              <a
                href={resolvedMangaUrl}
                className="flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors relative group/tooltip"
              >
                <span className="text-3xl sm:text-6xl">
                  {chapter?.number}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {_("click_here_chapter_list")}
                </div>
              </a>
              <NextChapterArrow />
            </div>
            <div className="flex w-full items-center gap-x-4">
              <a
                href={resolvedMangaUrl}
                className="hidden md:flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors relative group/tooltip"
              >
                <span className="text-2xl md:text-6xl">
                  {chapter?.number}
                </span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {_("click_here_chapter_list")}
                </div>
              </a>
              <div className="flex flex-grow flex-wrap items-center justify-start">
                <span className="w-full text-xl md:text-3xl">
                  <a
                    href={resolvedMangaUrl}
                    className="transition-colors hover:text-red-100"
                  >
                    {manga?.title}
                  </a>
                </span>
                <span className="text-md md:text-2xl">{chapter?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {logged && chapter?.id && (
                  <button
                    onClick={handleToggleBookmark}
                    disabled={bookmarkLoading}
                    title="Marcador"
                    className={`p-1.5 rounded-lg transition-all ${
                      workBookmark ? 'text-yellow-400 hover:text-yellow-300' : 'text-zinc-400 hover:text-white'
                    } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      fill={workBookmark ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={reloadAllPages}
                  title="Recargar capítulo (si alguna hoja cargó mal)"
                  aria-label="Recargar capítulo"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all"
                >
                  <ArrowPathIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <button
                  onClick={handlePagesDialog}
                  title="Lista de páginas (ir o recargar una)"
                  aria-label="Lista de páginas"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all"
                >
                  <Squares2X2Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <button
                  onClick={cycleFitMode}
                  title="Ajuste de imagen (ancho / alto / original)"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all"
                >
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
                <AdjustmentsHorizontalIcon
                  className="h-6 w-6 sm:h-8 sm:w-8 cursor-pointer hover:text-gray-300 transition-all duration-300 hover:-rotate-90 transform"
                  onClick={handleToggleSettings}
                />
              </div>
            </div>
          </div>
          <NextChapterArrow className="hidden md:flex flex-grow items-center h-full justify-center group/nav" />
        </div>
        <div className="flex w-full max-w-5xl mx-auto items-center">
          {settings.chapterSettings && (
            <div className="py-6 px-4">
              <div className="flex flex-wrap w-full justify-between items-center gap-x-4">
                <div className="space-y-4">
                  {/* Ajuste de imagen */}
                  <div className="mx-4">
                    <label className="block text-sm font-medium text-gray-100 mb-2">Ajuste de imagen</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'none', label: 'Sin límite' },
                        { value: 'height', label: 'Alto ventana' },
                        { value: 'width', label: 'Ancho ventana' },
                        { value: 'limitH', label: 'Límite alto' },
                        { value: 'limitW', label: 'Límite ancho' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => handleFitMode(value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            settings.fitMode === value
                              ? 'bg-red-500 text-white shadow'
                              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {(settings.fitMode === 'limitH' || settings.fitMode === 'limitW') && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={100}
                          max={3000}
                          step={50}
                          value={settings.pageFitLimitPx}
                          onChange={(e) => handlePageFitLimitPx(e.target.value)}
                          className="w-24 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <span className="text-xs text-gray-400">px</span>
                      </div>
                    )}
                  </div>

                  {/* Usar páginas dobles — oculto en móvil (allí siempre es
                      página simple para que se lea bien). */}
                  {!screenIsMobile && (
                    <div className="flex items-center gap-3 mx-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.useDoublePages}
                          onChange={handleToggleUseDoublePages}
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                        <span className="ms-3 text-sm font-medium text-gray-100">{_('use_double_pages')}</span>
                      </label>
                    </div>
                  )}

                  {/* Espacio entre páginas — now available in all read modes */}
                  <div className="mx-4">
                    <label className="block text-sm font-medium text-gray-100 mb-2">Espacio entre páginas</label>
                    <select
                      value={settings.pageGap}
                      onChange={(e) => handlePageGap(e.target.value)}
                      className="w-full sm:w-72 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer hover:bg-zinc-700"
                    >
                      <option value="ninguno" className="bg-zinc-800">Ninguno (0px)</option>
                      <option value="minimo" className="bg-zinc-800">Mínimo (2px)</option>
                      <option value="medio" className="bg-zinc-800">Medio (5px)</option>
                      <option value="grande" className="bg-zinc-800">Grande (10px)</option>
                    </select>
                  </div>
                </div>
                <div className="mx-auto sm:mx-0">
                  <p className="text-gray-400 text-sm font-medium mb-3">
                    {_("read_type")}
                  </p>
                  <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
                    <button
                      onClick={() => handleSetReadType(readTypes.PAGINATED)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        settings.readType === readTypes.PAGINATED
                          ? "bg-red-500 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {_("paginated")}
                    </button>
                    <button
                      onClick={() => handleSetReadType(readTypes.CASCADE)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        settings.readType === readTypes.CASCADE
                          ? "bg-red-500 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {_("cascade")}
                    </button>
                  </div>
                  {settings.readType === readTypes.PAGINATED && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm font-medium mb-2">Dirección de lectura</p>
                      <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
                        <button
                          onClick={() => { if (settings.readingDirection !== 'rtl') handleToggleReadingDirection(); }}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            settings.readingDirection === 'rtl'
                              ? "bg-red-500 text-white shadow-lg"
                              : "text-gray-400 hover:text-white hover:bg-zinc-800"
                          }`}
                        >
                          → ← Manga
                        </button>
                        <button
                          onClick={() => { if (settings.readingDirection !== 'ltr') handleToggleReadingDirection(); }}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            settings.readingDirection === 'ltr'
                              ? "bg-red-500 text-white shadow-lg"
                              : "text-gray-400 hover:text-white hover:bg-zinc-800"
                          }`}
                        >
                          ← → Comic
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap w-full min-h-[100vh] justify-center">
        {/* PAGINAS */}
        <div
          id="manga-pages-top"
          className={`w-full select-none bg-black ${
            settings.readType === readTypes.CASCADE ? "min-h-[100vh]" : ""
          }`}
        >
          {chapterData.pages.length === 0 && loading && !accessError && (
            <div className="flex min-h-full w-full justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          )}

          {accessError && (
            <div className="flex min-h-screen w-full justify-center items-center py-8 px-4">
              <div className="max-w-2xl w-full bg-zinc-900 border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                    Acceso Denegado
                  </h2>

                  <p className="text-lg text-zinc-300 leading-relaxed">
                    {accessError.message}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                    {(accessError.errorType === "login_required" ||
                      accessError.errorType === "subscription_required") &&
                      !logged && (
                        <a
                          href={getOrgPath(
                            `/login?redirect=${window.location.pathname}`,
                            orgSlug
                          )}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-6 rounded-xl transition-all uppercase tracking-wider shadow-xl hover:shadow-cyan-500/20"
                        >
                          Iniciar Sesión
                        </a>
                      )}

                    {accessError.errorType === "subscription_required" && (
                      <a
                        href={getOrgPath(
                          `/subscriptions?mangaSlug=${mangaSlug}`,
                          orgSlug
                        )}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl transition-all uppercase tracking-wider shadow-xl hover:shadow-yellow-500/20"
                      >
                        Ver Planes
                      </a>
                    )}

                    <a
                      href={resolvedMangaUrl}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-6 rounded-xl transition-all uppercase tracking-wider border-2 border-zinc-700"
                    >
                      Volver al Manga
                    </a>
                  </div>

                  <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <p className="text-sm text-zinc-400">
                      {accessError.errorType === "subscription_required" && (
                        <>
                          Suscríbete para obtener acceso anticipado a capítulos
                          exclusivos y apoyar a los creadores.
                        </>
                      )}
                      {accessError.errorType === "not_released" && (
                        <>
                          Este capítulo estará disponible para todos después de
                          su fecha de lanzamiento oficial.
                        </>
                      )}
                      {accessError.errorType === "login_required" && (
                        <>
                          Inicia sesión con tu cuenta para continuar leyendo
                          este contenido.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chapterData.pages.length === 0 && !loading && !accessError && (
            <div className="flex min-h-full w-full justify-center py-4">
              <h3 className="text-white">{_("no_pages_found")}</h3>
            </div>
          )}

          <div className="flex min-h-[100vh] w-full h-full gap-2">
            <div
              className={`relative flex items-center justify-center flex-grow w-full ${
                settings.readType === readTypes.CASCADE ? "h-full flex-col" : ""
              }`}
            >
              {settings.readType === readTypes.PAGINATED && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  style={{ touchAction: 'pan-y' }}
                  onClick={handlePageClick}
                  onTouchStart={handlePageTouchStart}
                  onTouchEnd={handlePageTouchEnd}
                />
              )}
              {renderedPages}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {chapterData.pages.length > 0 && (
          <div className="sticky bottom-0 left-0 w-full h-1 bg-black">
            <div
              className="h-1 bg-red-500"
              style={{
                width:
                  settings.readType === readTypes.PAGINATED
                    ? `${Math.min(
                        Math.max(
                          (currentPage /
                            (Math.max(
                              ...chapterData.pages.map((p) => p.number)
                            ) -
                              1)) *
                            100,
                          0
                        ),
                        100
                      )}%`
                    : `${scrollInfo.readScrollPercentage}%`,

                transition:
                  settings.readType === readTypes.PAGINATED
                    ? "width 0.25s"
                    : "",
              }}
            />
          </div>
        )}

        {/* Chapter navigation strip — restyled to match the rest of the dark
            reader theme (zinc + cyan accents, generous radii, uppercase
            tracking, consistent with the floating buttons and footer cards). */}
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Previous */}
            {chapter?.previousChapter ? (
              // Sin releasedAt (p. ej. joints) = disponible. Con fecha, solo si ya pasó.
              (!chapter.previousChapter?.releasedAt || new Date(chapter.previousChapter.releasedAt).getTime() < Date.now()) ? (
                <button
                  onClick={() => resolvedPrevChapterUrl && (location.href = resolvedPrevChapterUrl)}
                  className="group flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900 text-zinc-200 hover:text-cyan-400 text-xs font-black uppercase tracking-widest transition-all"
                >
                  <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="truncate">Cap. {chapter.previousChapter.number}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-600 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                >
                  Próximamente · {formatDate(chapter.previousChapter?.releasedAt, language)}
                </button>
              )
            ) : (
              <span className="hidden sm:block" />
            )}

            {/* Back to chapter list (center, primary action) */}
            <button
              onClick={() => (location.href = resolvedMangaUrl)}
              className="group flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
            >
              <ListIcon className="h-4 w-4" />
              Lista de capítulos
            </button>

            {/* Next */}
            {chapter?.nextChapter ? (
              // Sin releasedAt (p. ej. joints) = disponible. Con fecha, solo si ya pasó.
              (!chapter.nextChapter?.releasedAt || new Date(chapter.nextChapter.releasedAt).getTime() < Date.now()) ? (
                <button
                  onClick={() => resolvedNextChapterUrl && (location.href = resolvedNextChapterUrl)}
                  className="group flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900 text-zinc-200 hover:text-cyan-400 text-xs font-black uppercase tracking-widest transition-all"
                >
                  <span className="truncate">Cap. {chapter.nextChapter.number}</span>
                  <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-600 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                >
                  Próximamente · {formatDate(chapter.nextChapter?.releasedAt, language)}
                </button>
              )
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>

          {settings.readType === readTypes.CASCADE && chapterData.pages.length > 0 && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={() => {
                  // scrollIntoView directo en vez de href="#..." — con las
                  // transiciones de vista, el ancla disparaba una navegación (el
                  // "F5" al primer clic). Un botón evita eso por completo.
                  const top = document.getElementById('manga-pages-top');
                  if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-cyan-500/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <ArrowUpIcon className="h-3.5 w-3.5" /> Volver arriba
              </button>
            </div>
          )}
        </div>

        <div className="w-full bg-zinc-950 border-t border-zinc-800 px-4 md:px-8 py-6">
          {/* Reactions */}
          {chapter?.id && (
            <ChapterReactions chapterId={chapter.id} logged={logged || false} />
          )}
          {/* Comments Section - Below Reader */}
          {chapterData.pages.length > 0 && !loading && (
            <CommentsSection
              identifier={isJoint ? `joint_${jointSlug}_${chapterNumber}` : `${mangaSlug}_${chapterNumber}`}
              logged={logged || false}
              user={user}
              organization={organization}
              onLogin={() => {
                window.location.href = getOrgPath(
                  `/login?redirect=${window.location.pathname}`,
                  orgSlug
                );
              }}
            />
          )}
        </div>
      </div>
      {/* Pages Dialog */}
      {openPagesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handlePagesDialog}>
          <div className="bg-gray-900 bg-opacity-90 mx-auto w-full max-w-[24rem] rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-between items-center">
                <span className="text-2xl text-white">{_("pages_list")}</span>
                <span className="text-base text-white">{manga?.title}</span>
              </div>
              <span className="text-lg text-white">
                {_("chapter")} {chapter?.number}
              </span>
              <span className="text-base text-white">{chapter?.title}</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-xs text-gray-400">Toca el número para ir; el icono ↻ recarga esa hoja si cargó mal.</p>
                <button
                  onClick={reloadAllPages}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  <ArrowPathIcon className="h-4 w-4" /> Recargar todo
                </button>
              </div>
              <div className="flex flex-wrap gap-2 my-2 max-h-[45vh] overflow-y-auto">
                {chapterData.pages.map((page) => (
                  <span
                    key={page.number}
                    className="inline-flex items-center bg-gray-800 odd:bg-gray-700 shadow-sm rounded-md overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        if (settings.readType === readTypes.PAGINATED) {
                          setCurrentPage(page.number);
                        }
                        // scrollIntoView en vez de location.href="#..." para no
                        // disparar una navegación (el "F5") con las transiciones de vista.
                        const targetId =
                          settings.readType === readTypes.PAGINATED
                            ? 'manga-pages-top'
                            : `page-${page.number}`;
                        document.getElementById(targetId)?.scrollIntoView({ block: 'start' });

                        handlePagesDialog();
                      }}
                      className="px-3 py-1 text-white hover:bg-orange-900 cursor-pointer"
                    >
                      {`${_("page")} ${page.number}`}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); reloadPage(page.number); }}
                      title={`Recargar página ${page.number}`}
                      aria-label={`Recargar página ${page.number}`}
                      className="px-2 py-1 text-gray-300 hover:text-white hover:bg-orange-900 border-l border-black/30 cursor-pointer"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={handlePagesDialog}
                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {bookmarkError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-red-200 text-sm px-4 py-2 rounded-lg shadow-lg">
          {bookmarkError}
        </div>
      )}

      {/* Floating bookmark button — always opens the actions modal. */}
      {chapter?.id && (
        <button
          onClick={handleToggleBookmark}
          disabled={bookmarkLoading}
          title="Marcador"
          aria-label="Marcador"
          className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${
            workBookmark ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-900/90 backdrop-blur border border-zinc-700 text-zinc-300 hover:text-white'
          } ${bookmarkLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <svg
            className="h-6 w-6"
            fill={workBookmark ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      )}

      {/* Bookmark actions modal — surfaces save / go-to / delete every click. */}
      {bookmarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setBookmarkModalOpen(false)}>
          <div
            className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-white font-black text-base">Marcador</h3>
            </div>
            <p className="text-zinc-400 text-xs mb-5">
              {workBookmark
                ? `Tienes un marcador en Cap. ${workBookmark.chapterNumber} · pág. ${workBookmark.pageNumber}.`
                : 'Aún no tienes un marcador en esta obra.'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={saveBookmarkHere}
                disabled={bookmarkLoading}
                className="w-full px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {workBookmark ? 'Mover marcador aquí' : 'Marcar esta página'} · Pág. {currentPage}
              </button>
              {workBookmark && (
                <button
                  type="button"
                  onClick={goToBookmark}
                  disabled={bookmarkLoading}
                  className="w-full px-4 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                >
                  Ir a mi marcador
                </button>
              )}
              {workBookmark && (
                <button
                  type="button"
                  onClick={deleteCurrentBookmark}
                  disabled={bookmarkLoading}
                  className="w-full px-4 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 border border-red-500/40"
                >
                  Eliminar marcador
                </button>
              )}
              <button
                type="button"
                onClick={() => setBookmarkModalOpen(false)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
