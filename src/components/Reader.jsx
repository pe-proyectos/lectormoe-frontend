import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Spinner,
  Button,
  ButtonGroup,
  Card,
  Tabs,
  TabsHeader,
  Tab,
  Typography,
  Accordion,
  AccordionHeader,
  Switch,
  AccordionBody,
  SpeedDial,
  SpeedDialHandler,
  IconButton,
  Tooltip,
  Dialog,
  CardBody,
  Slider,
  Drawer,
} from "@material-tailwind/react";
import {
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { callAPI } from "../util/callApi";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";
import { CommentsCard } from "./CommentsCard";
import { XMarkIcon } from "@heroicons/react/24/solid";

export function Reader({
  language,
  manga,
  chapter,
  chapterNumber,
  logged,
  user,
}) {
  const _ = getTranslator(language);

  const readTypes = {
    PAGINATED: "paginated",
    CASCADE: "cascade",
  };

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [openPagesDialog, setOpenPagesDialog] = useState(false);
  const [lastSaveUrl, setLastSaveUrl] = useState("");

  const [showSideComments, setShowSideComments] = useState(false);

  const [screenIsMobile, setScreenIsMobile] = useState(false);

  useEffect(() => {
    setScreenIsMobile(window.innerWidth < 720);
  }, [window.innerWidth]);

  const [scrollInfo, setScrollInfo] = useState({
    scrollY: 0,
    readScrollPercentage: 0,
  });

  const [chapterData, setChapterData] = useState({
    chapter: null,
    pages: [],
  });

  const [settings, setSettings] = useState(() => ({
    readType:
      localStorage.getItem("readType") ||
      manga?.bookType?.default_read_type ||
      readTypes.CASCADE,
    limitPageHeight: localStorage.getItem("limitPageHeight") === "true",
    useDoublePages: localStorage.getItem("useDoublePages") === "true",
    showFloatButtons: localStorage.getItem("showFloatButtons") !== "false",
    showChapterComments:
      localStorage.getItem("showChapterComments") !== "false",
    chapterSettings: localStorage.getItem("chapterSettings") === "true",
    pageGap: localStorage.getItem("pageGap") || "minimo",
  }));

  // Helper to get median width
  const getMedianWidth = useCallback(() => {
    if (!chapterData.pages.length) return 0;
    const widths = chapterData.pages.map((p) => p.imageWidth).sort((a, b) => a - b);
    const mid = Math.floor(widths.length / 2);
    return (widths.length % 2 !== 0 ? widths[mid] : (widths[mid - 1] + widths[mid]) / 2) * 1.1;
  }, [chapterData.pages]);

  // Helper to check if a page is single (width <= median)
  const isSinglePage = useCallback((page, medianWidth) => {
    if (!page) return false;
    // If page has isSinglePage attribute, use if true
    if (page.isSinglePage === true) {
      // We return false because if the page is marked as Single Page from db we
      // we should consider it probably is a double page already or is meant to be alone
      // setting this to true would cause the site to think its an individual page
      // and thu must be put together and rendered side by side
      return false;
    }
    // Otherwise, check width against median
    return page.imageWidth <= medianWidth;
  }, []);

  // Helper to determine if a page should be rendered side by side based on context
  const shouldRenderSideBySide = useCallback((pageIndex, pages, medianWidth) => {
    if (!settings.useDoublePages) return false;
    
    const currentPage = pages[pageIndex];
    const nextPage = pages[pageIndex + 1];
    
    // If we don't have both current and next page, can't render side by side
    if (!currentPage || !nextPage) return false;
    
    const currentIsSingle = isSinglePage(currentPage, medianWidth);
    const nextIsSingle = isSinglePage(nextPage, medianWidth);
    
    // If either current or next page is not single, can't render side by side
    if (!currentIsSingle || !nextIsSingle) return false;

    // If both pages are single, render them side by side
    return true;
  }, [settings.useDoublePages, isSinglePage]);

  const shouldShowPage = useCallback(
    (pageNumber) => {
      if (settings.readType === readTypes.CASCADE) return true;
      
      const currentPageIndex = chapterData.pages.findIndex(p => p.number === currentPage);
      const isNextPage = pageNumber === currentPage + 1;
      
      // In paginated mode, show current page and next page only if they should be side by side
      if (settings.readType === readTypes.PAGINATED) {
        if (pageNumber === currentPage) return true;
        if (isNextPage && shouldRenderSideBySide(currentPageIndex, chapterData.pages, getMedianWidth())) return true;
        return false;
      }
      
      return false;
    },
    [settings.readType, currentPage, chapterData.pages, shouldRenderSideBySide, getMedianWidth]
  );

  const handleSetReadType = (type) => {
    localStorage.setItem("readType", type);
    setSettings((prev) => ({ ...prev, readType: type }));
  };

  const handleToggleSettings = () => {
    localStorage.setItem(
      "chapterSettings",
      !settings.chapterSettings ? "true" : "false"
    );
    setSettings((prev) => ({
      ...prev,
      chapterSettings: !prev.chapterSettings,
    }));
  };

  const handleToggleComments = () => {
    localStorage.setItem(
      "showChapterComments",
      !settings.showChapterComments ? "true" : "false"
    );
    setSettings((prev) => ({
      ...prev,
      showChapterComments: !prev.showChapterComments,
    }));
  };

  const handleToggleFloatButtons = () => {
    localStorage.setItem(
      "showFloatButtons",
      !settings.showFloatButtons ? "true" : "false"
    );
    setSettings((prev) => ({
      ...prev,
      showFloatButtons: !prev.showFloatButtons,
    }));
  };

  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const handleLimitPageHeight = () => {
    localStorage.setItem(
      "limitPageHeight",
      !settings.limitPageHeight ? "true" : "false"
    );
    setSettings((prev) => ({
      ...prev,
      limitPageHeight: !prev.limitPageHeight,
    }));
  };

  const handleToggleUseDoublePages = () => {
    localStorage.setItem(
      "useDoublePages",
      !settings.useDoublePages ? "true" : "false"
    );
    setSettings((prev) => ({ ...prev, useDoublePages: !prev.useDoublePages }));
  };

  const handlePagesDialog = () => {
    setOpenPagesDialog((prev) => !prev);
  };

  const handlePageClick = (evt) => {
    // Get click position relative to window width
    const x = evt.clientX;
    const windowWidth = window.innerWidth;
    const isRightHalf = x > windowWidth / 2;

    const currentPageIndex = chapterData.pages.findIndex(p => p.number === currentPage);
    const medianWidth = getMedianWidth();

    if (isRightHalf) {
      // Going forward: if current page is part of a side-by-side pair, jump 2 pages
      const isSideBySide = shouldRenderSideBySide(currentPageIndex, chapterData.pages, medianWidth);
      const pageJump = isSideBySide ? 2 : 1;
      const page = chapterData.pages?.[currentPageIndex + pageJump];
      if (page) {
        setCurrentPage(page.number);
        location.href =
          settings.readType === readTypes.PAGINATED
            ? "#manga-pages-top"
            : `#page-${page.number}`;
      }
    } else {
      // Going backward: check if previous page is part of a side-by-side pair
      const prevPageIndex = currentPageIndex - 1;
      const isPrevPageSideBySide = prevPageIndex >= 0 && 
        shouldRenderSideBySide(prevPageIndex, chapterData.pages, medianWidth);
      
      // If previous page is part of a side-by-side pair, jump back 2 pages
      // Otherwise, jump back 1 page
      const pageJump = isPrevPageSideBySide ? 2 : 1;
      const page = chapterData.pages?.[currentPageIndex - pageJump];
      
      if (page) {
        setCurrentPage(page.number);
        location.href =
          settings.readType === readTypes.PAGINATED
            ? "#manga-pages-top"
            : `#page-${page.number}`;
      }
    }
  };

  const handlePageGap = (value) => {
    localStorage.setItem("pageGap", value);
    setSettings((prev) => ({
      ...prev,
      pageGap: value,
    }));
  };

  const getGapValue = (gapType) => {
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
  };

  useEffect(() => {
    callAPI("/api/analytics", {
      method: "POST",
      includeIp: true,
      body: JSON.stringify({
        event: "view_manga_chapter",
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        payload: {
          manga: manga.slug,
          chapter: chapterNumber,
          ...settings,
        },
      }),
    }).catch(console.error);
  }, [settings, manga.slug, chapterNumber]);

  useEffect(() => {
    if (!logged) {
      return;
    }
    const url = `/api/user-chapter-history/manga-custom/${manga.slug}/chapter/${chapterNumber}/pages/${currentPage}`;
    if (lastSaveUrl === url) {
      return;
    }
    setLastSaveUrl(url);
    callAPI(url).catch((error) => {
      console.error("Failed to save chapter history", error);
    });
  }, [currentPage]);

  useEffect(() => {
    callAPI(`/api/views/manga-custom/${manga.slug}/chapter/${chapterNumber}`, {
      includeIp: true,
    }).catch(() => {});
  }, []);

  // useEffect on page change
  useEffect(() => {
    if (!chapter) {
      return;
    }
    if (!chapterData.pages) {
      return;
    }
    const page = chapterData.pages.find((p) => p.number === currentPage);

    if (!page) {
      return;
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("page", page.number);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${urlParams}`
      );
    } catch (error) {
      console.error("Failed to update page in URL", error);
    }
  }, [currentPage]);

  // useEffect on scroll to determine what page is being read in cascade mode
  useEffect(() => {
    if (settings.readType !== readTypes.CASCADE) {
      return;
    }

    const firstPageImage = document.getElementById(
      `page-${chapterData.pages[0]?.number}-img`
    );
    const lastPageImage = document.getElementById(
      `page-${chapterData.pages[chapterData.pages.length - 1]?.number}-img`
    );

    if (!firstPageImage || !lastPageImage) {
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
    if (readPercentage === scrollInfo.readScrollPercentage) {
      return;
    }
    setScrollInfo((prev) => ({
      ...prev,
      readScrollPercentage: readPercentage,
    }));
    // setCurrentPage
    const pageIndex = Math.floor(
      (readPercentage / 100) * (chapterData.pages.length - 1)
    );

    const page = chapterData.pages[pageIndex];

    if (!page) {
      return;
    }

    setCurrentPage(page.number);
  }, [scrollInfo.scrollY]);

  const handleScroll = debounce(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY !== scrollInfo.scrollY) {
      setScrollInfo((prev) => ({ ...prev, scrollY: currentScrollY }));
    }
  }, 100);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // useEffect on initial load
  useEffect(() => {
    setLoading(true);
    callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapterNumber}/pages`)
      .then((pages) => {
        setChapterData((prev) => ({ ...prev, pages: pages }));
        if (pages.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialPageNumber = parseInt(urlParams.get("page") || "1");
          const pageIndex =
            pages.findIndex((page) => page.number === initialPageNumber) || 0;
          setCurrentPage(pages[pageIndex].number);
        }
      })

      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  }, []);

  const PreviousChapterArrow = ({ ...props }) => (
    <div
      className="flex flex-grow items-center h-full justify-center group/nav"
      onClick={() => {
        if (chapter?.previousChapter?.number)
          location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`;
      }}
      {...props}
    >
      <Tooltip
        content={
          chapter?.previousChapter
            ? _("click_to_previous_chapter")
            : _("you_are_in_first_chapter")
        }
        placement="bottom"
      >
        <ChevronLeftIcon
          className={
            chapter?.previousChapter
              ? "h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform"
              : "h-16 w-16 text-white opacity-20 cursor-not-allowed"
          }
        />
      </Tooltip>
    </div>
  );

  const NextChapterArrow = ({ ...props }) => (
    <div
      className="flex flex-grow items-center h-full justify-center group/nav"
      onClick={() => {
        if (chapter?.nextChapter?.number)
          location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`;
      }}
      {...props}
    >
      <Tooltip
        content={
          chapter?.nextChapter
            ? _("click_to_next_chapter")
            : _("you_are_in_last_chapter")
        }
        placement="bottom"
      >
        <ChevronRightIcon
          className={
            chapter?.nextChapter
              ? "h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform"
              : "h-16 w-16 text-white opacity-20 cursor-not-allowed"
          }
        />
      </Tooltip>
    </div>
  );

  // Common styles for page containers
  const getPageContainerStyle = useCallback((isCascade) => ({
    marginBottom: isCascade ? `${getGapValue(settings.pageGap)}px` : '0'
  }), [settings.pageGap]);

  // Common class names for page containers
  const getPageContainerClassName = useCallback((isCascade, isDouble = false, shouldShow = true) => {
    const baseClass = isCascade
      ? "w-full flex justify-center select-none cursor-pointer"
      : "w-full flex justify-center select-none cursor-pointer";
    return `${baseClass}${isDouble ? " flex-row" : ""}${shouldShow ? "" : " hidden"}`;
  }, []);

  // Common LazyImage component
  const PageImage = useCallback(
    ({ page, isSideBySide = false, isLeft = false }) => (
      <LazyImage
        id={`page-${page.number}-img`}
        src={page.imageUrl}
        className={`pointer-events-none object-contain ${
          isSideBySide ? "w-1/2" : "max-w-full"
        } ${settings.limitPageHeight ? "max-h-[100vh]" : ""} ${
          isSideBySide && (isLeft ? "object-left" : "object-right")
        }`}
        width={`${page.imageWidth}px`}
        height={`${page.imageHeight}px`}
        alt={`${_("page")} ${page.number}`}
      />
    ),
    [settings.limitPageHeight]
  );

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
                href={`/manga/${manga?.slug}`}
                className="flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors"
              >
                <Tooltip
                  content={_("click_here_chapter_list")}
                  placement="bottom"
                >
                  <span className="text-3xl sm:text-6xl">
                    {chapter?.number}
                  </span>
                </Tooltip>
              </a>
              <NextChapterArrow />
            </div>
            <div className="flex w-full items-center gap-x-4">
              <a
                href={`/manga/${manga?.slug}`}
                className="hidden md:flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors"
              >
                <Tooltip
                  content={_("click_here_chapter_list")}
                  placement="bottom"
                >
                  <span className="text-2xl md:text-6xl">
                    {chapter?.number}
                  </span>
                </Tooltip>
              </a>
              <div className="flex flex-grow flex-wrap items-center justify-start">
                <span className="w-full text-xl md:text-3xl">
                  <a
                    href={`/manga/${manga?.slug}`}
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
          <Accordion open={settings.chapterSettings}>
            <AccordionBody className="py-6 px-4">
              <div className="flex flex-wrap w-full justify-between items-center gap-x-4">
                <div>
                  <div className="my-2 mx-4">
                    <Switch
                      color="red"
                      label={
                        <Typography className="text-gray-100">
                          {_("limit_page_height")}
                        </Typography>
                      }
                      checked={settings.limitPageHeight}
                      onChange={() => handleLimitPageHeight()}
                      crossOrigin={undefined}
                    />
                  </div>
                  <div className="my-2 mx-4">
                    <Switch
                      color="red"
                      label={
                        <Typography className="text-gray-100">
                          {_("use_double_pages")}
                        </Typography>
                      }
                      checked={settings.useDoublePages}
                      onChange={() => handleToggleUseDoublePages()}
                      crossOrigin={undefined}
                    />
                  </div>
                  <div className="my-2 mx-4">
                    <Switch
                      color="green"
                      label={
                        <Typography className="text-gray-100">
                          {_("show_float_buttons")}
                        </Typography>
                      }
                      checked={settings.showFloatButtons}
                      onChange={() => handleToggleFloatButtons()}
                      crossOrigin={undefined}
                    />
                  </div>
                  {settings.readType === readTypes.CASCADE && (
                    <div className="my-2 mx-4">
                      <Typography className="text-gray-100">
                        Espacio entre páginas
                      </Typography>
                      <div className="w-72 mt-2">
                        <select
                          value={settings.pageGap}
                          onChange={(e) => handlePageGap(e.target.value)}
                          className="w-full bg-gray-800 text-white rounded-lg p-2"
                        >
                          <option value="ninguno">Ninguno (0px)</option>
                          <option value="minimo">Mínimo (2px)</option>
                          <option value="medio">Medio (5px)</option>
                          <option value="grande">Grande (10px)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mx-auto sm:mx-0">
                  <p className="text-gray-400 ml-1">{_("read_type")}</p>
                  <Tabs value={settings.readType}>
                    <TabsHeader>
                      <Tab
                        value={readTypes.PAGINATED}
                        onClick={() => handleSetReadType(readTypes.PAGINATED)}
                        className="text-sm"
                      >
                        {_("paginated")}
                      </Tab>
                      <Tab
                        value={readTypes.CASCADE}
                        onClick={() => handleSetReadType(readTypes.CASCADE)}
                        className="text-sm"
                      >
                        {_("cascade")}
                      </Tab>
                    </TabsHeader>
                  </Tabs>
                </div>
              </div>
            </AccordionBody>
          </Accordion>
        </div>
      </div>
      <div className="flex flex-wrap w-full min-h-[100vh] justify-center">
        {/* PAGINAS */}
        <div
          id="manga-pages-top"
          className={`w-full select-none bg-black ${settings.readType === readTypes.CASCADE ? 'min-h-[100vh]' : ''}`}
        >
          {chapterData.pages.length === 0 && loading && (
            <div className="flex min-h-full w-full justify-center py-4">
              <Spinner color="red" />
            </div>
          )}

          {chapterData.pages.length === 0 && !loading && (
            <div className="flex min-h-full w-full justify-center py-4">
              <h3 className="text-white">{_("no_pages_found")}</h3>
            </div>
          )}

          <div className="flex min-h-[100vh] w-full h-full flex-row-reverse gap-2">
            {showSideComments && chapterData.pages.length > 0 && !loading && (
              <div className="sticky top-0 h-full min-w-96 max-h-[100vh] p-4 rounded-lg overflow-hidden hidden md:block">
                <CommentsCard
                  logged={logged}
                  user={user}
                  identifier={`${manga.slug}_${chapterNumber}_sidebar`}
                />
              </div>
            )}
            <div className={`relative flex items-center justify-center flex-grow w-full ${settings.readType === readTypes.CASCADE ? 'h-full flex-col' : ''}`}>
              {/* <div className="relative"> */}
                {settings.readType === readTypes.PAGINATED && (
                  <div 
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handlePageClick}
                  />
                )}
                {(() => {
                  if (!settings.useDoublePages) {
                    // Default: render one page per row
                    return chapterData.pages.map((page, pageIndex) => (
                      <div
                        key={page.number}
                        id={`page-${page.number}`}
                        className={getPageContainerClassName(settings.readType === readTypes.CASCADE, false, shouldShowPage(page.number))}
                        style={getPageContainerStyle(settings.readType === readTypes.CASCADE)}
                      >
                        <PageImage page={page} isSideBySide={false} />
                      </div>
                    ));
                  }
                  // Double pages logic
                  const medianWidth = getMedianWidth();
                  const rendered = [];
                  for (let i = 0; i < chapterData.pages.length; ) {
                    const page = chapterData.pages[i];
                    const nextPage = chapterData.pages[i + 1];

                    if (shouldRenderSideBySide(i, chapterData.pages, medianWidth)) {
                      // Render side by side
                      rendered.push(
                        <div
                          key={`double-${page.number}-${nextPage.number}`}
                          className={`flex w-full cursor-pointer flex-row justify-center select-none mb-0 ${shouldShowPage(page.number) ? "" : " hidden"}`}
                          style={getPageContainerStyle(settings.readType === readTypes.CASCADE)}
                        >
                          <PageImage page={nextPage} isSideBySide={true} isLeft={false} />
                          <PageImage page={page} isSideBySide={true} isLeft={true} />
                        </div>
                      );
                      i += 2;
                    } else {
                      // Render single (either double page or last single)
                      rendered.push(
                        <div
                          key={page.number}
                          id={`page-${page.number}`}
                          className={getPageContainerClassName(settings.readType === readTypes.CASCADE, false, shouldShowPage(page.number))}
                          style={getPageContainerStyle(settings.readType === readTypes.CASCADE)}
                        >
                          <PageImage page={page} isSideBySide={false} />
                        </div>
                      );
                      i += 1;
                    }
                  }
                  return rendered;
                })()}
              {/* </div> */}
            </div>
          </div>
        </div>
        {/* Comments Drawer */}
        <Drawer
          placement="right"
          open={
            showSideComments &&
            chapterData.pages.length > 0 &&
            !loading &&
            screenIsMobile
          }
          onClose={() => setShowSideComments(false)}
          className="p-4 bg-opacity-0 w-full"
          size={500}
          overlayProps={{
            className: "fixed inset-0 bg-black/50",
          }}
        >
          <div className="absolute top-6 right-8 z-10">
            <button
              onClick={() => setShowSideComments(false)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <CommentsCard
            logged={logged}
            user={user}
            identifier={`${manga.slug}_${chapterNumber}_drawer`}
          />
        </Drawer>
        {/* Progress Bar */}
        {chapterData.pages.length > 0 && (
          <div className="sticky bottom-0 left-0 w-full h-1 bg-black">
            <div
              className="h-1 bg-red-500"
              style={{
                width:
                  settings.readType === readTypes.PAGINATED
                    ? `${
                      Math.min(
                        Math.max(
                          (currentPage /
                            (Math.max(...chapterData.pages.map((p) => p.number)) -
                              1)) *
                          100,
                          0
                        ),
                        100
                      )
                      }%`
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
          <div className=" m-2">
            <ButtonGroup>
              {chapter?.previousChapter &&
                (new Date(chapter.previousChapter?.releasedAt).getTime() <
                new Date().getTime() ? (
                  <Button
                    onClick={() =>
                      (location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`)
                    }
                  >
                    {_("previous_chapter")}#{chapter?.previousChapter?.number}{" "}
                    {chapter?.previousChapter?.title}
                  </Button>
                ) : (
                  <Button disabled>
                    {_("previous_chapter_will_be_released_in")}{" "}
                    {formatDate(
                      chapter.previousChapter?.releasedAt,
                      language
                    )}
                  </Button>
                ))}
              <Button onClick={() => (location.href = `/manga/${manga.slug}`)}>
                {_("back_to_chapter_list")}
              </Button>
              {chapter?.nextChapter &&
                (new Date(chapter.nextChapter?.releasedAt).getTime() <
                new Date().getTime() ? (
                  <Button
                    onClick={() =>
                      (location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`)
                    }
                  >
                    {_("next_chapter")}
                  </Button>
                ) : (
                  <Button disabled>
                    {_("next_chapter_will_be_released_in")}{" "}
                    {formatDate(
                      chapter.nextChapter?.releasedAt,
                      language
                    )}
                  </Button>
                ))}
            </ButtonGroup>
          </div>
        </div>
        <div className="flex w-full justify-center mt-2 mb-8">
          {settings.readType === readTypes.CASCADE &&
            chapterData.pages.length > 0 && (
              <a href="#manga-pages-top" className="text-white text-xl">
                <Button>{_("back_to_start")}</Button>
              </a>
            )}
        </div>
        <div className="w-full text-center">
          <div className="max-w-[97vw] m-0 2xl:max-w-[95vw] mx-auto shadow-sm my-4 rounded-md">
            <Accordion open={settings.showChapterComments}>
              <AccordionHeader onClick={handleToggleComments}>
                <h3 className="text-xl font-bold text-gray-300">
                  {settings.showChapterComments ? _("hide") : _("show")}{" "}
                  {_("comments")}
                </h3>
              </AccordionHeader>
              <AccordionBody className="bg-gray-800 my-2 p-4 rounded-md">
                <CommentsCard
                  logged={logged}
                  user={user}
                  identifier={`${manga.slug}_${chapterNumber}_accordion`}
                />
              </AccordionBody>
            </Accordion>
          </div>
        </div>
      </div>
      {/* Speed Dial */}
      {settings.showFloatButtons && (
        <>
          <div className="fixed flex flex-col gap-2 bottom-5 right-5">
            <SpeedDial>
              <Tooltip content={_("back_to_start")} placement="left">
                <SpeedDialHandler>
                  <a href="#main-navbar">
                    <IconButton
                      size="lg"
                      className="rounded-full bg-opacity-90"
                    >
                      <ChevronUpIcon className="h-5 w-5 transition-transform group-hover:transform group-hover:scale-150" />
                    </IconButton>
                  </a>
                </SpeedDialHandler>
              </Tooltip>
            </SpeedDial>
            <SpeedDial>
              <Tooltip
                content={
                  showSideComments && chapterData.pages.length > 0 && !loading
                    ? "Ocultar comentarios"
                    : "Mostrar comentarios"
                }
                placement="left"
              >
                <SpeedDialHandler>
                  <IconButton
                    size="lg"
                    className="rounded-full bg-opacity-90"
                    onClick={() => setShowSideComments(!showSideComments)}
                  >
                    {showSideComments &&
                    chapterData.pages.length > 0 &&
                    !loading ? (
                      <svg
                        className="w-6 h-6 text-gray-400 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1v2a1 1 0 0 0 1.707.707L9.414 13H15a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M8.023 17.215c.033-.03.066-.062.098-.094L10.243 15H15a3 3 0 0 0 3-3V8h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1.707.707L14.586 18H9a1 1 0 0 1-.977-.785Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-gray-400 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 17h6l3 3v-3h2V9h-2M4 4h11v8H9l-3 3v-3H4V4Z"
                        />
                      </svg>
                    )}
                  </IconButton>
                </SpeedDialHandler>
              </Tooltip>
            </SpeedDial>
            <SpeedDial>
              <Tooltip content={_("pages_list")} placement="left">
                <SpeedDialHandler
                  className="cursor-pointer"
                  onClick={() => handlePagesDialog()}
                >
                  <IconButton size="lg" className="rounded-full bg-opacity-90">
                    <ListBulletIcon className="h-5 w-5 transition-transform group-hover:transform group-hover:scale-150" />
                  </IconButton>
                </SpeedDialHandler>
              </Tooltip>
            </SpeedDial>
          </div>
        </>
      )}
      {/* Pages Dialog */}
      <Dialog
        size="xs"
        open={openPagesDialog}
        handler={handlePagesDialog}
        className="bg-transparent shadow-none"
      >
        <Card className="bg-gray-900 bg-opacity-90 mx-auto w-full max-w-[24rem]">
          <CardBody className="flex flex-col gap-2">
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
          </CardBody>
        </Card>
      </Dialog>
    </div>
  );
}
