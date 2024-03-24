import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Spinner,
    Button,
} from "@material-tailwind/react";
import { callAPI } from '../util/callApi';

export function Reader({ mangaSlug, chapterNumber }) {
    const [loading, setLoading] = useState(true);
    const [mangaCustom, setMangaCustom] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [loadedPages, setLoadedPages] = useState([]);

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

    useEffect(() => {
        setLoading(true);
        Promise.all([
            callAPI(`/api/manga-custom/${mangaSlug}`),
            callAPI(`/api/manga-custom/${mangaSlug}/chapter/${chapterNumber}`),
            callAPI(`/api/manga-custom/${mangaSlug}/chapter/${chapterNumber}/pages`),
        ])
            .then(([manga, chapter, pages]) => {
                console.log("manga");
                console.log(manga);
                console.log("chapter");
                console.log(chapter);
                console.log("pages");
                console.log(pages);
                setMangaCustom(manga);
                setChapter(chapter);
                setPages(pages);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className='w-full'>
            <div className='bg-gray-900 flex flex-col w-full justify-center'>
                <div className='w-full text-center my-8'>
                    <h1 className='text-white'>{mangaCustom?.title}</h1>
                    <h1 className='text-white text-sm'>Capítulo {chapter?.number}</h1>
                    <h2 className='text-white text-4xl'>{chapter?.title}</h2>
                </div>
                {loading && <Spinner className='m-4 w-full' />}
                {pages.map(page => (
                    <div key={page.id} className='max-w-[100vw] m-0 2xl:max-w-[95vw] 2xl:mx-auto'>
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
                ))}
                <div className='w-full text-center'>
                    {chapter?.nextChapter && (
                        <a href={`/manga/${mangaSlug}/chapters/${chapter?.nextChapter?.number}`}>
                            <Button variant="gradient" className='m-2 mb-4'>
                                Siguiente capítulo: #{chapter?.nextChapter?.number} - {chapter?.nextChapter?.title}
                            </Button>
                        </a>
                    )}
                    {!chapter?.nextChapter && (
                        <div className='m-2 mb-4'>
                            <h4 className='text-white mb-2'>
                                {mangaCustom?.nextChapterAt
                                    ? `El próximo capítulo será publicado el ${dateToText(mangaCustom?.nextChapterAt)}`
                                    : "El próximo capítulo será publicado próximamente"
                                }
                            </h4>
                            <a href={`/manga/${mangaSlug}`}>
                                <Button variant="gradient">
                                    Volver al listado de capítulos
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
