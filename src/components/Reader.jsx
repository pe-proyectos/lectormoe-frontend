import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Spinner,
    Button,
    ButtonGroup,
    Option,
    Card,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
    Typography,
    Accordion,
    AccordionHeader,
    Switch,
    AccordionBody,
    SpeedDial,
    SpeedDialHandler,
    SpeedDialContent,
    SpeedDialAction,
    IconButton,
    Tooltip,
    Dialog,
    CardBody,
} from "@material-tailwind/react";
import {
    ChevronUpIcon,
    AdjustmentsHorizontalIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import {
    FormHelperText,
    FormControl,
    InputLabel,
    MenuItem,
    Select
} from '@mui/material';
import { callAPI } from '../util/callApi';
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";

export function Reader({ organization, manga, chapterNumber, logged }) {
    const _ = getTranslator(organization.language);

    const readTypes = {
        PAGINATED: 'paginated',
        CASCADE: 'cascade',
    }

    const [loading, setLoading] = useState(true);
    const [readType, setReadType] = useState(() => localStorage.getItem('readType') || manga?.bookType?.default_read_type || readTypes.PAGINATED);
    const [limitPageHeight, setLimitPageHeight] = useState(() => localStorage.getItem('limitPageHeight') === "true");
    const [showFloatButtons, setShowFloatButtons] = useState(() => localStorage.getItem('showFloatButtons') !== "false");
    const [mangaCustom, setMangaCustom] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [readScrollPercentage, setReadScrollPercentage] = useState(0);
    const [loadedPages, setLoadedPages] = useState([]);
    const [openCommentsAccordion, setOpenCommentsAccordion] = useState(() => localStorage.getItem('showChapterComments') !== "false");
    const [openSettingsAccordion, setOpenSettingsAccordion] = useState(() => localStorage.getItem('chapterSettings') === "true");
    const [openPagesDialog, setOpenPagesDialog] = useState(false);
    const [lastSaveUrl, setLastSaveUrl] = useState('');

    const labelProps = {
        variant: "small",
        className: "absolute top-2/4 -left-2/4 -translate-y-2/4 -translate-x-3/4 font-normal text-white bg-black bg-opacity-80 px-4 py-1 rounded-3xl",
    };

    const handlePageLoad = (pageId) => {
        setLoadedPages(oldValue => [...oldValue, pageId]);
    }

    const dateToText = (date) => {
        const dt = new Date(date);
        const months = [
            _("january"),
            _("february"),
            _("march"),
            _("april"),
            _("may"),
            _("june"),
            _("july"),
            _("august"),
            _("september"),
            _("october"),
            _("november"),
            _("december"),
        ];
        return `${dt.getDate()} ${_("of")} ${months[dt.getMonth()]} ${_("of")} ${dt.getFullYear()}`;
    }

    const shouldShowPage = (pageId) => {
        if (readType === readTypes.CASCADE) {
            return true;
        }
        if (currentPage === pageId) {
            return true;
        }
        return false;
    }

    const handleSetReadType = (type) => {
        localStorage.setItem('readType', type);
        setReadType(type);
    }

    const handleToggleSettings = () => {
        localStorage.setItem('chapterSettings', !openSettingsAccordion ? "true" : "false");
        setOpenSettingsAccordion(oldValue => !oldValue);
    }

    const handleToggleComments = () => {
        localStorage.setItem('showChapterComments', !openCommentsAccordion ? "true" : "false");
        setOpenCommentsAccordion(oldValue => !oldValue);
    }

    const handleToggleFloatButtons = () => {
        localStorage.setItem('showFloatButtons', !showFloatButtons ? "true" : "false");
        setShowFloatButtons(oldValue => !oldValue);
    }

    const handleLimitPageHeight = () => {
        localStorage.setItem('limitPageHeight', !limitPageHeight ? "true" : "false");
        setLimitPageHeight(oldValue => !oldValue);
    }

    const handlePagesDialog = () => {
        setOpenPagesDialog(oldValue => !oldValue);
    }

    const handlePageClick = (evt, pageId, pageIndex) => {
        const rect = evt.target.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        if (x > rect.width / 2) {
            const page = pages?.[pageIndex + 1];
            if (page) {
                setCurrentPage(oldValue => page.id);
                setCurrentPageIndex(oldValue => pageIndex + 1);
                setCurrentPageNumber(oldValue => page.number || oldValue);
                location.href = readType === readTypes.PAGINATED ? '#manga-pages-top' : `#page-${page.id}`;
            }
        } else {
            const page = pages?.[pageIndex - 1];
            if (page) {
                setCurrentPage(oldValue => page.id);
                setCurrentPageIndex(oldValue => pageIndex - 1);
                setCurrentPageNumber(oldValue => page.number || oldValue);
                location.href = readType === readTypes.PAGINATED ? '#manga-pages-top' : `#page-${page.id}`;
            }
        }
    }

    useEffect(() => {
        callAPI('/api/analytics', {
            method: 'POST',
            includeIp: true,
            body: JSON.stringify({
                event: 'view_manga_chapter',
                path: window.location.pathname,
                userAgent: window.navigator.userAgent,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                payload: {
                    manga: manga.slug,
                    chapter: chapterNumber,
                    showFloatButtons,
                    readType,
                    limitPageHeight,
                },
            }),
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!logged) {
            return;
        }
        const url = `/api/user-chapter-history/manga-custom/${manga.slug}/chapter/${chapterNumber}/pages/${currentPageNumber}`;
        if (lastSaveUrl === url) {
            return;
        }
        setLastSaveUrl(url);
        callAPI(url)
            .catch((error) => { console.error('Failed to save chapter history', error); });
    }, [currentPageNumber]);

    useEffect(() => {
        callAPI(`/api/views/manga-custom/${manga.slug}/chapter/${chapterNumber}`, {
            includeIp: true,
        }).catch((error) => { });
    }, []);

    // useEffect on page change
    useEffect(() => {
        if (readType !== readTypes.PAGINATED) {
            return;
        }
        if (!chapter) {
            return;
        }
        if (!pages) {
            return;
        }
        const page = pages[currentPageIndex];
        if (!page) {
            return;
        }
        try {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('page', page.number);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        } catch (error) {
            console.error('Failed to update page in URL', error);
        }
    }, [currentPage]);

    // useEffect on scroll to determine what page is being read in cascade mode
    useEffect(() => {
        if (readType !== readTypes.CASCADE) {
            return;
        }
        const firstPageImage = document.getElementById(`page-${pages[0]?.id}-img`);
        const lastPageImage = document.getElementById(`page-${pages[pages.length - 1]?.id}-img`);
        if (!firstPageImage || !lastPageImage) {
            return;
        }
        const scrollY = window.scrollY;
        const pageTopY = firstPageImage.getBoundingClientRect().top + window.scrollY;
        const pageBottomY = lastPageImage.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        const readPercentage = (Math.min(100, Math.max(0, ((scrollY - pageTopY) / (pageBottomY - pageTopY)) * 100)));
        if (readPercentage === readScrollPercentage) {
            return;
        }
        setReadScrollPercentage(readPercentage);
        // setCurrentPage
        const pageIndex = Math.ceil((readPercentage / 100) * (pages.length - 1));
        const page = pages[pageIndex];
        if (!page) {
            return;
        }
        setCurrentPage(page.id);
        setCurrentPageIndex(pageIndex);
        setCurrentPageNumber(page.number);
    }, [scrollPosition]);
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        setScrollPosition(currentScrollY);
    };
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // useEffect on initial load
    useEffect(() => {
        setLoading(true);
        Promise.all([
            callAPI(`/api/manga-custom/${manga.slug}`),
            callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapterNumber}`),
            callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapterNumber}/pages`),
        ])
            .then(([mangaCustom, chapter, pages]) => {
                setMangaCustom(mangaCustom);
                setChapter(chapter);
                setPages(pages);
                if (pages.length > 0) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const initialPageNumber = urlParams.get('page') ? parseInt(urlParams.get('page')) : 1;
                    const pageIndex = pages.findIndex(page => page.number === initialPageNumber) || 0;
                    setCurrentPage(pages[pageIndex].id);
                    setCurrentPageIndex(pageIndex);
                    setCurrentPageNumber(pages[pageIndex].number);
                }
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Disqus
        if (organization?.enableDisqusIntegration) {
            window.disqus_config = function () {
                this.page.url = `https://${organization?.domain}/manga/${manga.slug}/chapters/${chapterNumber}`;
                this.page.identifier = `${manga.slug}_${chapterNumber}`;
                this.page.title = `${manga.title} - Capítulo ${chapterNumber} - ${chapter?.title}`;
            };
            const script = document.createElement('script');
            script.src = organization?.disqusEmbedUrl || 'https://lat-manga.disqus.com/embed.js';
            script.setAttribute('data-timestamp', Date.now().toString());
            (document.head || document.body).appendChild(script);
        }
    }, []);

    const PreviousChapterArrow = ({ ...props }) => (
        <div
            className='flex flex-grow items-center h-full justify-center group/nav'
            onClick={() => { if (chapter?.previousChapter?.number) location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`; }}
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
                            ? 'h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform'
                            : 'h-16 w-16 text-white opacity-20 cursor-not-allowed'
                    }
                />
            </Tooltip>
        </div>
    )

    const NextChapterArrow = ({ ...props }) => (
        <div
            className='flex flex-grow items-center h-full justify-center group/nav'
            onClick={() => { if (chapter?.nextChapter?.number) location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`; }}
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
                            ? 'h-16 w-16 text-white cursor-pointer opacity-20 group-hover/nav:opacity-80 transition-all duration-300 group-hover/nav:scale-150 transform'
                            : 'h-16 w-16 text-white opacity-20 cursor-not-allowed'
                    }
                />
            </Tooltip>
        </div>
    )

    return (
        <div id="reader-top">
            <div className='relative w-full min-h-44 group py-4'>
                <LazyImage
                    src={manga?.bannerUrl || manga?.imageUrl}
                    decoding="async"
                    loading="lazy"
                    className='absolute -z-10 top-1/2 -translate-y-1/2 w-full min-w-full min-h-full blur-sm opacity-10 group-hover:opacity-15 object-cover transition-all duration-500 group-hover:scale-[101%]'
                />
                <div className='flex h-full w-full min-h-44 px-4 mx-auto items-center justify-around'>
                    <PreviousChapterArrow className='hidden md:flex flex-grow items-center h-full justify-center group/nav' />
                    <div className='flex flex-grow flex-col max-w-5xl mx-auto'>
                        <div className="flex md:hidden w-full">
                            <PreviousChapterArrow />
                            <a
                                href={`/manga/${mangaCustom?.slug}`}
                                className='flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors'
                            >
                                <Tooltip content={_("click_here_chapter_list")} placement="bottom">
                                    <span className='text-3xl sm:text-6xl'>{chapter?.number}</span>
                                </Tooltip>
                            </a>
                            <NextChapterArrow />
                        </div>
                        <div className='flex w-full items-center gap-x-4'>
                            <a
                                href={`/manga/${mangaCustom?.slug}`}
                                className='hidden md:flex items-center justify-center cursor-pointer hover:text-red-100 transition-colors'
                            >
                                <Tooltip content={_("click_here_chapter_list")} placement="bottom">
                                    <span className='text-2xl md:text-6xl'>{chapter?.number}</span>
                                </Tooltip>
                            </a>
                            <div className='flex flex-grow flex-wrap items-center justify-start'>
                                <span className='w-full text-xl md:text-3xl'>
                                    <a href={`/manga/${mangaCustom?.slug}`} className='transition-colors hover:text-red-100'>{mangaCustom?.title}</a>
                                </span>
                                <span className='text-md md:text-2xl'>{chapter?.title}</span>
                            </div>
                            <div>
                                <AdjustmentsHorizontalIcon
                                    className='h-6 w-6 sm:h-8 sm:w-8 cursor-pointer hover:text-gray-300 transition-all duration-300 hover:-rotate-90 transform'
                                    onClick={handleToggleSettings}
                                />
                            </div>
                        </div>
                    </div>
                    <NextChapterArrow className='hidden md:flex flex-grow items-center h-full justify-center group/nav' />
                </div>
                <div className='flex w-full max-w-5xl mx-auto items-center'>
                    <Accordion open={openSettingsAccordion}>
                        <AccordionBody className='py-6 px-4'>
                            <div className='flex flex-wrap w-full justify-between items-center gap-x-4'>
                                <div>
                                    <div className='my-2 mx-4'>
                                        <Switch
                                            color='red'
                                            label={
                                                <Typography className='text-gray-100'>
                                                    {_("limit_page_height")}
                                                </Typography>
                                            }
                                            checked={limitPageHeight}
                                            onChange={() => handleLimitPageHeight()}
                                        />
                                    </div>
                                    <div className='my-2 mx-4'>
                                        <Switch
                                            color='green'
                                            label={
                                                <Typography className='text-gray-100'>
                                                    {_("show_float_buttons")}
                                                </Typography>
                                            }
                                            checked={showFloatButtons}
                                            onChange={() => handleToggleFloatButtons()}
                                        />
                                    </div>
                                </div>
                                <div className='mx-auto sm:mx-0'>
                                    <p className='text-gray-400 ml-1'>
                                        {_("read_type")}
                                    </p>
                                    <Tabs value={readType}>
                                        <TabsHeader>
                                            <Tab
                                                value={readTypes.PAGINATED}
                                                onClick={() => handleSetReadType(readTypes.PAGINATED)}
                                                className='text-sm'
                                            >
                                                {_("paginated")}
                                            </Tab>
                                            <Tab
                                                value={readTypes.CASCADE}
                                                onClick={() => handleSetReadType(readTypes.CASCADE)}
                                                className='text-sm'
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
            <div className='flex flex-wrap w-full min-h-[90vh] justify-center'>
                {/* PAGINAS */}
                <div id="manga-pages-top" className='w-full min-h-[100vh] select-none backdrop-blur-sm bg-black bg-opacity-50'>
                    {pages.length === 0 && loading && (
                        <div className='flex min-h-full w-full justify-center py-4'>
                            <Spinner color="red" size="xl" />
                        </div>
                    )}
                    {pages.length === 0 && !loading && (
                        <div className='flex min-h-full w-full justify-center py-4'>
                            <h3 className='text-white'>{_("no_pages_found")}</h3>
                        </div>
                    )}
                    {pages.map((page, pageIndex) => (
                        <div
                            key={page.id}
                            id={`page-${page.id}`}
                            className={
                                (
                                    readType === readTypes.CASCADE
                                    ? 'w-full flex justify-center select-none cursor-pointer '
                                    : 'w-full h-full flex justify-center select-none cursor-pointer '
                                )
                                + (shouldShowPage(page.id) ? '' : ' hidden')
                            }
                            onClick={(evt) => handlePageClick(evt, page.id, pageIndex)}
                        >
                            {!loadedPages.includes(page.id) && (
                                <img
                                    width={`${page.imageWidth}px`}
                                    height={`${page.imageHeight}px`}
                                    className="bg-gray-300 !opacity-20 animate-pulse"
                                    style={
                                        limitPageHeight
                                            ? { maxHeight: '100vh' }
                                            : {}
                                    }
                                />
                            )}
                            <LazyImage
                                id={`page-${page.id}-img`}
                                src={page.imageUrl}
                                onLoad={() => handlePageLoad(page.id)}
                                className='max-w-full m-auto pointer-events-none'
                                alt={`${_("page")} ${page.number}`}
                                hidden={!loadedPages.includes(page.id)}
                                style={
                                    limitPageHeight
                                        ? { maxHeight: '100vh' }
                                        : {}
                                }
                            />
                        </div>
                    ))}
                </div>
                {/* Progress Bar */}
                {pages.length > 0 && (
                    <div className='sticky bottom-0 left-0 w-full h-1 bg-black'>
                        <div
                            className='h-1 bg-red-500'
                            style={{
                                width: readType === readTypes.PAGINATED
                                    ? `${(currentPageIndex / (pages.length - 1)) * 100}%`
                                    : `${readScrollPercentage}%`,
                                transition: readType === readTypes.PAGINATED ? 'width 0.25s' : '',
                            }}
                        />
                    </div>
                )}
                <div className='flex w-full justify-center mt-2'>
                    <div className=' m-2'>
                        <ButtonGroup>
                            {chapter?.previousChapter && (
                                (new Date(chapter.previousChapter?.releasedAt).getTime() < new Date().getTime()) ? (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`}>
                                        {_("previous_chapter")}
                                        #{chapter?.previousChapter?.number} {chapter?.previousChapter?.title}
                                    </Button>
                                    ) : (
                                    <Button disabled>
                                        {_("previous_chapter_will_be_released_in")} {formatDate(chapter.previousChapter?.releasedAt, organization.language)}
                                    </Button>
                                )
                            )}
                            <Button onClick={() => location.href = `/manga/${manga.slug}`}>
                                {_("back_to_chapter_list")}
                            </Button>
                            {chapter?.nextChapter && (
                                (new Date(chapter.nextChapter?.releasedAt).getTime() < new Date().getTime()) ? (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`}>
                                        {_("next_chapter")}
                                    </Button>
                                ) : (
                                    <Button disabled>
                                        {_("next_chapter_will_be_released_in")} {formatDate(chapter.nextChapter?.releasedAt, organization.language)}
                                    </Button>
                                )
                            )}
                        </ButtonGroup>
                    </div>
                </div>
                <div className='flex w-full justify-center mt-2 mb-8'>
                    {readType === readTypes.CASCADE && pages.length > 0 && (
                        <a href="#manga-pages-top" className='text-white text-xl'>
                            <Button>
                                {_("back_to_start")}
                            </Button>
                        </a>
                    )}
                </div>
                {/* Disqus Comments */}
                {organization?.enableDisqusIntegration && (
                    <div className='w-full text-center'>
                        <div className='max-w-[97vw] m-0 2xl:max-w-[95vw] mx-auto shadow-sm my-4 rounded-md'>
                            <Accordion open={openCommentsAccordion}>
                                <AccordionHeader
                                    onClick={handleToggleComments}
                                >
                                    <h3 className='text-xl font-bold text-gray-300'>
                                        {openCommentsAccordion ? _("hide") : _("show")} {_("comments")}
                                    </h3>
                                </AccordionHeader>
                                <AccordionBody className="bg-gray-800 my-2 p-4 rounded-md">
                                    <div id="disqus_thread" />
                                </AccordionBody>
                            </Accordion>

                        </div>
                    </div>
                )}
            </div>
            {/* Speed Dial */}
            {showFloatButtons && (
                <>
                    <div className="fixed bottom-5 right-5">
                        <SpeedDial>
                            <Tooltip content={_("pages_list")} placement="left">
                                <SpeedDialHandler
                                    className='cursor-pointer'
                                    onClick={() => handlePagesDialog()}
                                >
                                    <IconButton size="lg" className="rounded-full">
                                        <ListBulletIcon className="h-5 w-5 transition-transform group-hover:transform group-hover:scale-150" />
                                    </IconButton>
                                </SpeedDialHandler>
                            </Tooltip>
                        </SpeedDial>
                    </div>
                    <div className="fixed bottom-20 right-5">
                        <SpeedDial>
                            <Tooltip content={_("back_to_start")} placement="left">
                                <SpeedDialHandler>
                                    <a href="#main-navbar">
                                        <IconButton size="lg" className="rounded-full">
                                            <ChevronUpIcon className="h-5 w-5 transition-transform group-hover:transform group-hover:scale-150" />
                                        </IconButton>
                                    </a>
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
                            <span className='text-2xl text-white'>{_("pages_list")}</span>
                            <span className='text-base text-white'>{mangaCustom?.title}</span>
                        </div>
                        <span className='text-lg text-white'>{_("chapter")} {chapter?.number}</span>
                        <span className='text-base text-white'>{chapter?.title}</span>
                        <div className="flex flex-wrap gap-2 my-2">
                            {pages.map((page, index) => (
                                <span
                                    key={page.id}
                                    onClick={() => {
                                        if (readType === readTypes.PAGINATED) {
                                            setCurrentPage(oldValue => page.id);
                                            setCurrentPageIndex(oldValue => index);
                                            setCurrentPageNumber(oldValue => page.number);
                                        }
                                        location.href = readType === readTypes.PAGINATED ? '#manga-pages-top' : `#page-${page.id}`;
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
