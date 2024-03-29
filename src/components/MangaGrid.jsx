import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Avatar,
    Tooltip,
    Button,
    Chip,
} from "@material-tailwind/react";
import { callAPI } from '../util/callApi';
import { MangaCardsScroller } from './MangaCardsScroller';
import { FeaturedMangaCard } from './FeaturedMangaCard';
import { MangaCard } from './MangaCard';
import { NewsCard } from './NewsCard';

export function MangaGrid() {
    const [loading, setLoading] = useState(true);
    const [mangaLatestList, setMangaLatestList] = useState([]);
    const [mangaFeaturedList, setMangaFeaturedList] = useState([]);
    const [mangaPopularList, setMangaPopularList] = useState([]);
    const [newsList, setNewsList] = useState([]);

    useEffect(() => {
        refreshNewsList();
        // Latest
        setLoading(true);
        callAPI(`/api/manga-custom?order=latest&limit=8`)
            .then(({ data }) => setMangaLatestList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Featured
        setLoading(true);
        callAPI(`/api/manga-custom?order=featured&limit=3`)
            .then(({ data }) => setMangaFeaturedList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Popular
        setLoading(true);
        callAPI(`/api/manga-custom?order=popular&limit=8`)
            .then(({ data }) => setMangaPopularList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, []);

    const refreshNewsList = () => {
        setLoading(true);
        callAPI(`/api/news`)
            .then(result => setNewsList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    return (
        <div>
            {mangaFeaturedList?.[0] && (
                <div className="grid grid-cols-1 md:grid-cols-2 justify-center">
                    <FeaturedMangaCard manga={mangaFeaturedList?.[0]} className='h-[32rem] w-full p-2' />
                    <div className="flex flex-wrap w-full items-center">
                        {mangaFeaturedList?.[1] && <FeaturedMangaCard manga={mangaFeaturedList?.[1]} className='h-[16rem] w-full p-2' />}
                        {mangaFeaturedList?.[2] && <FeaturedMangaCard manga={mangaFeaturedList?.[2]} className='h-[16rem] w-full p-2' />}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 m-2">
                <div className="lg:order-last">
                    <Typography
                        color="gray"
                        className="font-semibold text-4xl"
                    >
                        Noticias
                    </Typography>
                    <div className="w-full h-1 bg-gray-200 rounded-sm my-4" />
                    <div className="flex flex-wrap gap-4 justify-center">
                        {
                            !loading && newsList.length === 0 && (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <Typography
                                        color="gray"
                                        className="font-light text-xl"
                                    >
                                        No hay noticias para mostrar
                                    </Typography>
                                </div>
                            )
                        }
                        {newsList.map((news) => <NewsCard news={news} key={news.id} />)}
                        <div>
                            <Button
                                variant="filled"
                                size="lg"
                                className="mt-4"
                                onClick={refreshNewsList}
                            >
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </div>
                <div className='col-span-3 align-middle'>
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="gray"
                            className="font-semibold text-4xl"
                        >
                            Populares
                        </Typography>
                        <Typography
                            color="gray"
                            className="font-normal text-sm mt-2 sm:mb-1"
                        >
                            (Más visitados en las últimas 24 horas)
                        </Typography>
                    </div>
                    <MangaCardsScroller>
                        {!loading && mangaPopularList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    No hay mangas para mostrar
                                </Typography>
                            </div>
                        )}
                        {mangaPopularList.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                    </MangaCardsScroller>
                    <Typography
                        color="gray"
                        className="font-semibold text-4xl mb-4"
                    >
                        Actualizados recientemente
                    </Typography>
                    <MangaCardsScroller>
                        {!loading && mangaLatestList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    No hay mangas para mostrar
                                </Typography>
                            </div>
                        )}
                        {mangaLatestList.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                    </MangaCardsScroller>
                </div>
            </div>
        </div>
    );
}
