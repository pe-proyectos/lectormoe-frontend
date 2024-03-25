import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Spinner,
    Button,
    ButtonGroup,
    Select,
    Option,
    Card,
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
} from "@material-tailwind/react";
import { callAPI } from '../util/callApi';

export function Reader({ organization, manga, chapterNumber }) {
    const [loading, setLoading] = useState(true);
    const [readType, setReadType] = useState(localStorage.getItem('readType') || 'horizontal');
    const [mangaCustom, setMangaCustom] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
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
                setCurrentPage(oldValue => pages?.[pageIndex + 1]?.id || oldValue);
                setCurrentPageIndex(oldValue => pages?.[pageIndex + 1] ? pageIndex + 1 : oldValue);
            } else {
                setCurrentPage(oldValue => pages?.[pageIndex - 1]?.id || oldValue);
                setCurrentPageIndex(oldValue => pages?.[pageIndex - 1] ? pageIndex - 1 : oldValue);
            }
        }
    }

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
        <div className='w-full'>
            <div className='bg-gray-900 flex flex-col w-full justify-center'>
                <div className='w-full text-center mt-10'>
                    <a
                        href={`/manga/${manga.slug}`}
                        className='text-white'
                    >
                        {mangaCustom?.title}
                    </a>
                    <h1 className='text-white text-sm'>Capítulo {chapter?.number}</h1>
                    <h2 className='text-white text-4xl'>{chapter?.title}</h2>
                    <div className="w-72 max-w-full mx-auto mt-6">
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
                    </div>
                </div>
                <div className='flex flex-wrap w-full justify-center my-2 gap-4'>
                    {readType === 'horizontal' && pages.map((page, pageIndex) => (
                        <Button
                            key={page.id}
                            className={"py-2 px-4 mx-2 border-b-2 border-gray-900 " + (page.id === currentPage ? ' border-red-900 ' : '')}
                            onClick={() => {
                                setCurrentPage(page.id);
                                setCurrentPageIndex(pageIndex);
                            }}
                        >
                            {page.number}
                        </Button>
                    ))}
                </div>
                {pages.map((page, pageIndex) => (
                    <div
                        key={page.id}
                        className={
                            'w-full flex justify-center cursor-pointer'
                            + (shouldShowPage(page.id) ? '' : ' hidden')
                        }
                        onClick={(evt) => handlePageClick(evt, page.id, pageIndex)}
                    >
                        <div className='max-w-[100vw] m-0 2xl:max-w-[95vw] 2xl:mx-auto'>
                            {!loadedPages.includes(page.id) && (
                                <img
                                    width={`${page.imageWidth}px`}
                                    height={`${page.imageHeight}px`}
                                    className="bg-gray-300 my-1 !opacity-20 animate-pulse"
                                />
                            )}
                            <img
                                src={page.imageUrl}
                                onLoad={() => handlePageLoad(page.id)}
                                className='max-w-full mx-auto my-1'
                                alt={`Pagina ${page.number}`}
                                hidden={!loadedPages.includes(page.id)}
                            />
                        </div>
                    </div>
                ))}
                <div className='flex flex-wrap w-full justify-center my-2 gap-2'>
                    {readType === 'horizontal' && pages.map((page, pageIndex) => (
                        <Button
                            key={page.id}
                            className={"py-2 px-4 mx-2 border-b-2 border-gray-900 " + (page.id === currentPage ? ' border-red-900 ' : '')}
                            onClick={() => {
                                setCurrentPage(page.id);
                                setCurrentPageIndex(pageIndex);
                            }}
                        >
                            {page.number}
                        </Button>
                    ))}
                </div>
                <div className='w-full text-center mt-2'>
                    {((currentPageIndex === pages.length - 1) || readType === 'vertical') && (
                        <h4 className='text-white'>
                            Haz terminado de leer el capítulo {chapter?.number} de {mangaCustom?.title}: {chapter?.title}
                        </h4>
                    )}
                    {!chapter?.nextChapter && (
                        <h4 className='text-white'>
                            {mangaCustom?.nextChapterAt
                                ? `El próximo capítulo será publicado el ${dateToText(mangaCustom?.nextChapterAt)}`
                                : "El próximo capítulo será publicado próximamente"
                            }
                        </h4>
                    )}
                </div>
                <div className='flex w-full justify-center mt-2'>
                    <div className='max-w-sm m-2'>
                        <ButtonGroup>
                            {chapter?.previousChapter
                                ? (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.previousChapter?.number}`}>
                                        Capítulo anterior
                                        #{chapter?.previousChapter?.number} {chapter?.previousChapter?.title}
                                    </Button>
                                )
                                : (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}`}>
                                        Volver al listado de capítulos
                                    </Button>
                                )
                            }
                            {chapter?.nextChapter
                                ? (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}/chapters/${chapter?.nextChapter?.number}`}>
                                        #{chapter?.nextChapter?.number} - {chapter?.nextChapter?.title}
                                    </Button>
                                )
                                : (
                                    <Button onClick={() => location.href = `/manga/${manga.slug}`}>
                                        Volver al listado de capítulos
                                    </Button>
                                )
                            }
                        </ButtonGroup>
                    </div>
                </div>
                {/* Disqus Comments */}
                {organization?.enableDisqusIntegration && (
                    <div className='w-full text-center'>
                        <div className='max-w-[97vw] m-0 2xl:max-w-[95vw] mx-auto bg-gray-800 shadow-sm my-4 p-4 rounded-md'>
                            <div id="disqus_thread"></div>
                        </div>
                    </div>
                )}
                {/* Progress Bar */}
                {readType === 'horizontal' && (
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
