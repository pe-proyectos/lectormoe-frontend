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
} from "@material-tailwind/react";
import {
    FormHelperText,
    FormControl,
    InputLabel,
    MenuItem,
    Select
} from '@mui/material';
import { callAPI } from '../util/callApi';

export function Reader({ organization, manga, chapterNumber }) {
    const [loading, setLoading] = useState(true);
    const [readType, setReadType] = useState(localStorage.getItem('readType') || 'horizontal');
    const [limitPageHeight, setLimitPageHeight] = useState(false);
    const [mangaCustom, setMangaCustom] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const [loadedPages, setLoadedPages] = useState([]);
    const [openCommentsAccordion, setOpenCommentsAccordion] = useState(false);

    const handlePageLoad = (pageId) => {
        setLoadedPages(oldValue => [...oldValue, pageId]);
    }

    const dateToText = (date) => {
        const dt = new Date(date);
        const months = [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
        ];
        return `${dt.getDate()} de ${months[dt.getMonth()]} de ${dt.getFullYear()}`;
    }

    const shouldShowPage = (pageId) => {
        if (readType === 'vertical') {
            return true;
        }
        if (currentPage === pageId) {
            return true;
        }
        return false;
    }

    const handleSetReadType = (type) => {
        setReadType(type);
        localStorage.setItem('readType', type);
    }

    const handlePageClick = (evt, pageId, pageIndex) => {
        const rect = evt.target.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        if (readType === 'horizontal') {
            if (x > rect.width / 2) {
                const page = pages?.[pageIndex + 1];
                if (page) {
                    setCurrentPage(oldValue => page.id);
                    setCurrentPageIndex(oldValue => pageIndex + 1);
                    setCurrentPageNumber(oldValue => page.number || oldValue);
                }
            } else {
                const page = pages?.[pageIndex - 1];
                if (page) {
                    setCurrentPage(oldValue => page.id);
                    setCurrentPageIndex(oldValue => pageIndex - 1);
                    setCurrentPageNumber(oldValue => page.number || oldValue);
                }
            }
        }
    }

    useEffect(() => {
        callAPI(`/api/views/manga-custom/${manga.slug}/chapter/${chapterNumber}`, {
            includeIp: true,
        }).catch((error) => { });
    }, []);

    useEffect(() => {
        if (currentPageIndex === 0) {
            return;
        }
        const page = pages[currentPageIndex];
        if (page) {
            const targetElement = document.querySelector(`#page-${page.id}`);
            if (targetElement) {
                const offset = -75;
                const topPos = targetElement.getBoundingClientRect().top + window.pageYOffset + offset;
                window.scrollTo({
                    top: topPos,
                    behavior: 'smooth',
                });
            }
        }
    }, [currentPage]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            callAPI(`/api/manga-custom/${manga.slug}`),
            callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapterNumber}`),
            callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapterNumber}/pages`),
        ])
            .then(([manga, chapter, pages]) => {
                setMangaCustom(manga);
                setChapter(chapter);
                setPages(pages);
                if (pages.length > 0) {
                    setCurrentPage(pages[0].id);
                    setCurrentPageIndex(0);
                    setCurrentPageNumber(pages[0].number);
                }
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Disqus
        if (organization?.enableDisqusIntegration) {
            const disqus_config = function () {
                this.page.url = `https://${organization?.domain}/manga/${manga.slug}/chapters/${chapterNumber}`;
                this.page.identifier = `${manga.slug}_${chapterNumber}`;
                this.page.title = `${manga.title} - Capítulo ${chapterNumber} - ${chapter.title}`;
                this.page.category_id = `${manga.slug}`;
            };
            const script = document.createElement('script');
            script.src = organization?.disqusEmbedUrl || 'https://lat-manga.disqus.com/embed.js';
            script.setAttribute('data-timestamp', Date.now().toString());
            (document.head || document.body).appendChild(script);
        }
    }, []);

    return (
        <div id="top" className='w-full'>
            <div className='bg-gray-900 flex flex-wrap w-full min-h-[90vh] justify-center'>
                <div className='flex flex-wrap w-full sm:max-w-[46rem] p-2 mt-10 items-center bg-white bg-opacity-40 backdrop-blur-sm rounded-2xl'>
                    <div className='w-full md:w-1/2 p-4'>
                        <div className="flex flex-col-2 gap-4">
                            <div className='mt-auto'>
                                <h1 className='font-bold text-white text-8xl'>{chapter?.number}</h1>
                            </div>
                            <div className='my-auto'>
                                <h2 className='text-white text-4xl'>{chapter?.title}</h2>
                                <a href={`/manga/${manga.slug}`} className='text-white text-xl ml-1'>{mangaCustom?.title}</a>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 p-4">
                        {pages.length <= 0 ? (
                            <h4 className='text-white'>
                                {mangaCustom?.nextChapterAt
                                    ? `El próximo capítulo de ${mangaCustom?.title} será publicado el ${dateToText(mangaCustom?.nextChapterAt)}`
                                    : `El próximo capítulo de ${mangaCustom?.title} será publicado próximamente`
                                }
                            </h4>
                        ) : (
                            <>
                                <div className='w-full my-2 mx-4'>
                                    <Switch
                                        label={
                                            <Typography className='text-gray-100'>
                                                Limitar altura de página
                                            </Typography>
                                        }
                                        checked={limitPageHeight}
                                        onChange={(evt) => setLimitPageHeight(evt.target.checked)}
                                    />
                                </div>
                                <Tabs value={readType}>
                                    <TabsHeader>
                                        <Tab value="horizontal" onClick={() => handleSetReadType('horizontal')} >
                                            Paginado
                                        </Tab>
                                        <Tab value="vertical" onClick={() => handleSetReadType('vertical')}>
                                            Cascada
                                        </Tab>
                                    </TabsHeader>
                                </Tabs>
                            </>
                        )}
                    </div>
                </div>
                {pages.length > 0 && (
                    <div className='flex flex-wrap w-full justify-center my-4'>
                        {readType === 'horizontal' && (
                            <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} className='bg-gray-100 rounded-md'>
                                <InputLabel id="top-page-select-label">Página</InputLabel>
                                <Select
                                    labelId="top-page-select-label"
                                    displayEmpty
                                    value={currentPage}
                                    onChange={(evt) => {
                                        const pageIndex = pages.findIndex(page => page.id === evt.target.value);
                                        setCurrentPageIndex(pageIndex);
                                        setCurrentPage(pages[pageIndex].id);
                                        setCurrentPageNumber(pages[pageIndex].number);
                                    }}
                                >
                                    {pages.map((page, pageIndex) => (
                                        <MenuItem key={page.id} value={page.id}>Página {page.number}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </div>
                )}
                {pages.map((page, pageIndex) => (
                    <div
                        key={page.id}
                        id={`page-${page.id}`}
                        className={
                            'w-full flex justify-center cursor-pointer'
                            + (shouldShowPage(page.id) ? '' : ' hidden')
                        }
                        onClick={(evt) => handlePageClick(evt, page.id, pageIndex)}
                    >
                        <div className='relative max-w-[100vw] m-0 2xl:max-w-[95vw] 2xl:mx-auto select-none'>
                            {!loadedPages.includes(page.id) && (
                                <img
                                    width={`${page.imageWidth}px`}
                                    height={`${page.imageHeight}px`}
                                    className="bg-gray-300 !opacity-20 animate-pulse"
                                    style={
                                        limitPageHeight
                                            ? { maxHeight: 'calc(100vh - 80px)' }
                                            : {}
                                    }
                                />
                            )}
                            <img
                                src={page.imageUrl}
                                onLoad={() => handlePageLoad(page.id)}
                                className='max-w-full mx-auto pointer-events-none'
                                alt={`Pagina ${page.number}`}
                                hidden={!loadedPages.includes(page.id)}
                                style={
                                    limitPageHeight
                                        ? { maxHeight: 'calc(100vh - 80px)' }
                                        : {}
                                }
                            />
                        </div>
                    </div>
                ))}
                {pages.length > 0 && (
                    <div className='flex flex-wrap w-full justify-center my-4'>
                        {readType === 'horizontal' && (
                            <div className='flex flex-wrap w-full justify-center'>
                                <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} className='bg-gray-100 rounded-md'>
                                    <InputLabel id="bottom-page-select-label">Página</InputLabel>
                                    <Select
                                        labelId="bottom-page-select-label"
                                        displayEmpty
                                        value={currentPage}
                                        onChange={(evt) => {
                                            const pageIndex = pages.findIndex(page => page.id === evt.target.value);
                                            setCurrentPageIndex(pageIndex);
                                            setCurrentPage(pages[pageIndex].id);
                                            setCurrentPageNumber(pages[pageIndex].number);
                                        }}
                                    >
                                        {pages.map((page, pageIndex) => (
                                            <MenuItem key={page.id} value={page.id}>Página {page.number}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                        )}
                    </div>
                )}
                <div className='w-full text-center mt-2'>
                    {((currentPageIndex === pages.length - 1) || readType === 'vertical') && pages.length > 0 && (
                        <h4 className='text-white'>
                            Haz terminado de leer el capítulo {chapter?.number} de {mangaCustom?.title}: {chapter?.title}
                        </h4>
                    )}
                    {!chapter?.nextChapter && pages.length > 0 && (
                        <h4 className='text-white'>
                            {mangaCustom?.nextChapterAt
                                ? `El próximo capítulo será publicado el ${dateToText(mangaCustom?.nextChapterAt)}`
                                : "El próximo capítulo será publicado próximamente"
                            }
                        </h4>
                    )}
                </div>
                <div className='flex w-full justify-center mt-2'>
                    <div className=' m-2'>
                        <ButtonGroup>
                            {chapter?.previousChapter && (
                                <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`}>
                                    Capítulo anterior
                                    #{chapter?.previousChapter?.number} {chapter?.previousChapter?.title}
                                </Button>
                            )}
                            <Button onClick={() => location.href = `/manga/${manga.slug}`}>
                                Volver al listado de capítulos
                            </Button>
                            {chapter?.nextChapter && (
                                <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`}>
                                    Próximo capítulo
                                </Button>
                            )}
                        </ButtonGroup>
                    </div>
                </div>
                <div className='flex w-full justify-center mt-2 mb-8'>
                    {readType === 'vertical' && pages.length > 0 && (
                        <a href="#top" className='text-white text-xl'>
                            <Button>
                                Volver al inicio
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
                                    onClick={() => setOpenCommentsAccordion(oldValue => !oldValue)}
                                >
                                    <h3 className='text-xl font-bold text-gray-300'>
                                        {openCommentsAccordion ? 'Ocultar' : 'Mostrar'} comentarios
                                    </h3>
                                </AccordionHeader>
                                <AccordionBody className="bg-gray-100 my-2 p-4 rounded-md">
                                    <div id="disqus_thread" />
                                </AccordionBody>
                            </Accordion>

                        </div>
                    </div>
                )}
                {/* Progress Bar */}
                {readType === 'horizontal' && pages.length > 0 && (
                    <div className='sticky bottom-0 left-0 w-full h-1 bg-black'>
                        <div
                            className='h-1 bg-red-500'
                            style={{ width: `${(currentPageIndex / (pages.length - 1)) * 100}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
