import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { callAPI } from '../util/callApi';
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";
import CommentsSection from "./landing/CommentsSection";
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
  const { page, isSideBySide, isLeft, getImageClassName, _ } = props;
  return (
    <LazyImage
      id={`page-${page.number}-img`}
      src={page.imageUrl}
      className={`${getImageClassName(isSideBySide)} ${
        isSideBySide && (isLeft ? "object-left" : "object-right")
      }`}
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
      style={getPageContainerStyle(isCascade)}
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

  const [settings, setSettings] = useState(() => ({
    readType:
      localStorage.getItem("readType") ||
      manga?.bookType?.default_read_type ||
      readTypes.CASCADE,
    limitPageHeight: localStorage.getItem("limitPageHeight") === "true",
    useDoublePages: localStorage.getItem("useDoublePages") === "true",
    chapterSettings: localStorage.getItem("chapterSettings") === "true",
    pageGap: localStorage.getItem("pageGap") || "minimo",
  }));

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
      if (!settings.useDoublePages) return false;

      const currentPage = pages[pageIndex];
      const nextPage = pages[pageIndex + 1];

      if (!currentPage || !nextPage) return false;

      const currentIsSingle = isSinglePage(currentPage, median);
      const nextIsSingle = isSinglePage(nextPage, median);

      return currentIsSingle && nextIsSingle;
    },
    [settings.useDoublePages, isSinglePage]
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

  // Callbacks para settings - estables
  const handleSetReadType = useCallback((type) => {
    localStorage.setItem("readType", type);
    setSettings((prev) => ({ ...prev, readType: type }));
  }, []);

  const handleToggleSettings = useCallback(() => {
    setSettings((prev) => {
      const newValue = !prev.chapterSettings;
      localStorage.setItem("chapterSettings", newValue ? "true" : "false");
      return { ...prev, chapterSettings: newValue };
    });
  }, []);

  const handleLimitPageHeight = useCallback(() => {
    setSettings((prev) => {
      const newValue = !prev.limitPageHeight;
      localStorage.setItem("limitPageHeight", newValue ? "true" : "false");
      return { ...prev, limitPageHeight: newValue };
    });
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

  const handlePageClick = useCallback(
    (evt) => {
      const isGoingForward = evt.clientX > window.innerWidth / 2;
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
        location.href = "#manga-pages-top";
      }
    },
    [chapterData.pages, currentPage, shouldRenderSideBySide, medianWidth]
  );

  const handlePageGap = useCallback((value) => {
    localStorage.setItem("pageGap", value);
    setSettings((prev) => ({ ...prev, pageGap: value }));
  }, []);

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
    (isCascade) => ({
      marginBottom: isCascade ? `${getGapValue(settings.pageGap)}px` : "0",
    }),
    [settings.pageGap, getGapValue]
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

      if (settings.limitPageHeight) {
        // Aplicar limitación de altura en todos los casos cuando está activado
        className += " max-h-[100vh] h-auto";
      } else {
        className += " h-auto";
      }

      return className;
    },
    [
      settings.limitPageHeight,
      settings.readType,
      readTypes.PAGINATED,
      readTypes.CASCADE,
    ]
  );

  // Analytics - solo una vez por cambio de settings
  useEffect(() => {
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
  }, [settings, mangaSlug, chapterNumber]);

  // Save chapter history - con debounce
  useEffect(() => {
    if (!logged || !mangaSlug || !chapterNumber) return;

    const url = `/api/user-chapter-history/manga-custom/${mangaSlug}/chapter/${chapterNumber}/pages/${currentPage}`;
    if (lastSaveUrl === url) return;

    const timeoutId = setTimeout(() => {
      setLastSaveUrl(url);
      callAPI(url, { method: 'POST' }).catch((error) => {
        // Solo loggear errores que no sean 404 (recurso no encontrado)
        if (error?.message && !error.message.includes('No se encontró el recurso')) {
          console.error("Failed to save chapter history", error);
        }
      });
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [currentPage, logged, mangaSlug, chapterNumber, lastSaveUrl]);

  // Track view - solo una vez
  useEffect(() => {
    if (!mangaSlug || !chapterNumber) return;
    
    callAPI(`/api/views/manga-custom/${mangaSlug}/chapter/${chapterNumber}`, {
      method: 'POST'
    }).catch((error) => {
      // Silenciar errores de tracking de vistas
      console.debug('Failed to track view:', error);
    });
  }, [mangaSlug, chapterNumber]);

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
    callAPI(`/api/manga-custom/${mangaSlug}/chapter/${chapterNumber}/pages`)
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
          setCurrentPage(pages[validPageIndex].number);
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
  ]);

  // Memoizar componentes de navegación
  const PreviousChapterArrow = useMemo(
    () =>
      ({ ...props }) =>
        (
          <div
            className="flex flex-grow items-center h-full justify-center group/nav"
            onClick={() => {
              if (chapter?.previousChapter?.number)
                location.href = getOrgPath(
                  `/manga/${mangaSlug}/chapters/${chapter?.previousChapter?.number}`,
                  orgSlug
                );
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
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {chapter?.previousChapter
                  ? _("click_to_previous_chapter")
                  : _("you_are_in_first_chapter")}
              </div>
            </div>
          </div>
        ),
    [chapter?.previousChapter, mangaSlug, orgSlug, _]
  );

  const NextChapterArrow = useMemo(
    () =>
      ({ ...props }) =>
        (
          <div
            className="flex flex-grow items-center h-full justify-center group/nav"
            onClick={() => {
              if (chapter?.nextChapter?.number)
                location.href = getOrgPath(
                  `/manga/${mangaSlug}/chapters/${chapter?.nextChapter?.number}`,
                  orgSlug
                );
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
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {chapter?.nextChapter
                  ? _("click_to_next_chapter")
                  : _("you_are_in_last_chapter")}
              </div>
            </div>
          </div>
        ),
    [chapter?.nextChapter, mangaSlug, orgSlug, _]
  );

  // Renderizar páginas - OPTIMIZADO para evitar re-renders innecesarios
  const renderedPages = useMemo(() => {
    if (!chapterData.pages.length) return null;

    const isCascade = settings.readType === readTypes.CASCADE;

    // Sin páginas dobles
    if (!settings.useDoublePages) {
      return chapterData.pages.map((page) => {
        const shouldShow = shouldShowPage(page.number);
        const PageImageComponent = (
          // @ts-ignore
          <PageImage
            page={page}
            isSideBySide={false}
            getImageClassName={getImageClassName}
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
    readTypes.CASCADE,
    shouldShowPage,
    shouldRenderSideBySide,
    medianWidth,
    getPageContainerClassName,
    getPageContainerStyle,
    getImageClassName,
    _,
  ]);

  return (
    <div id="reader-top">
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
                href={getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
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
                href={getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
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
                    href={getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
                    className="transition-colors hover:text-red-100"
                  >
                    {manga?.title}
                  </a>
                </span>
                <span className="text-md md:text-2xl">{chapter?.title}</span>
              </div>
              <div>
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
                  {/* Limitar altura de página */}
                  <div className="flex items-center gap-3 mx-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.limitPageHeight}
                        onChange={handleLimitPageHeight}
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      <span className="ms-3 text-sm font-medium text-gray-100">
                        {_("limit_page_height")}
                      </span>
                    </label>
                  </div>

                  {/* Usar páginas dobles */}
                  <div className="flex items-center gap-3 mx-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.useDoublePages}
                        onChange={handleToggleUseDoublePages}
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      <span className="ms-3 text-sm font-medium text-gray-100">
                        {_("use_double_pages")}
                      </span>
                    </label>
                  </div>

                  {/* Espacio entre páginas (solo en modo cascada) */}
                  {settings.readType === readTypes.CASCADE && (
                    <div className="mx-4">
                      <label className="block text-sm font-medium text-gray-100 mb-2">
                        Espacio entre páginas
                      </label>
                      <select
                        value={settings.pageGap}
                        onChange={(e) => handlePageGap(e.target.value)}
                        className="w-full sm:w-72 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer hover:bg-zinc-700"
                      >
                        <option value="ninguno" className="bg-zinc-800">
                          Ninguno (0px)
                        </option>
                        <option value="minimo" className="bg-zinc-800">
                          Mínimo (2px)
                        </option>
                        <option value="medio" className="bg-zinc-800">
                          Medio (5px)
                        </option>
                        <option value="grande" className="bg-zinc-800">
                          Grande (10px)
                        </option>
                      </select>
                    </div>
                  )}
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
                      href={getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
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
                  onClick={handlePageClick}
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

        <div className="flex w-full justify-center mt-2">
          <div className="m-2 flex flex-wrap gap-2 justify-center">
            {chapter?.previousChapter &&
              (new Date(chapter.previousChapter?.releasedAt).getTime() <
              new Date().getTime() ? (
                <button
                  onClick={() =>
                    (location.href = getOrgPath(
                      `/manga/${mangaSlug}/chapters/${chapter?.previousChapter?.number}`,
                      orgSlug
                    ))
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {_("previous_chapter")}#{chapter?.previousChapter?.number}{" "}
                  {chapter?.previousChapter?.title}
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-not-allowed opacity-50"
                >
                  {_("previous_chapter_will_be_released_in")}{" "}
                  {formatDate(chapter.previousChapter?.releasedAt, language)}
                </button>
              ))}
            <button
              onClick={() =>
                (location.href = getOrgPath(`/manga/${mangaSlug}`, orgSlug))
              }
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {_("back_to_chapter_list")}
            </button>
            {chapter?.nextChapter &&
              (new Date(chapter.nextChapter?.releasedAt).getTime() <
              new Date().getTime() ? (
                <button
                  onClick={() =>
                    (location.href = getOrgPath(
                      `/manga/${mangaSlug}/chapters/${chapter?.nextChapter?.number}`,
                      orgSlug
                    ))
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {_("next_chapter")}
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-not-allowed opacity-50"
                >
                  {_("next_chapter_will_be_released_in")}{" "}
                  {formatDate(chapter.nextChapter?.releasedAt, language)}
                </button>
              ))}
          </div>
        </div>

        <div className="flex w-full justify-center mt-2 mb-4">
          {settings.readType === readTypes.CASCADE &&
            chapterData.pages.length > 0 && (
              <a href="#manga-pages-top" className="text-white text-xl">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  {_("back_to_start")}
                </button>
              </a>
            )}
        </div>

        <div className="flex p-0 md:p-4 w-full justify-center mt-2 mb-8">
          {/* Comments Section - Below Reader */}
          {chapterData.pages.length > 0 && !loading && (
            <CommentsSection
              identifier={`${mangaSlug}_${chapterNumber}`}
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
              <div className="flex flex-wrap gap-2 my-2">
                {chapterData.pages.map((page) => (
                  <span
                    key={page.number}
                    onClick={() => {
                      if (settings.readType === readTypes.PAGINATED) {
                        setCurrentPage(page.number);
                      }
                      location.href =
                        settings.readType === readTypes.PAGINATED
                          ? "#manga-pages-top"
                          : `#page-${page.number}`;

                      handlePagesDialog();
                    }}
                    className="px-4 text-white bg-gray-800 odd:bg-gray-700 hover:bg-orange-900 hover:cursor-pointer shadow-sm rounded-md"
                  >
                    {`${_("page")} ${page.number}`}
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
    </div>
  );
}
