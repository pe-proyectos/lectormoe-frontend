import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Avatar,
    Button,
    Chip,
    Alert,
    Carousel,
} from "@material-tailwind/react";
import { callAPI } from '../util/callApi';
import { MangaCardsScroller } from './MangaCardsScroller';
import { FeaturedMangaCard } from './FeaturedMangaCard';
import { MangaCard } from './MangaCard';
import { NewsCard } from './NewsCard';

export function MangaGrid({ organization, logged }) {
    const [loading, setLoading] = useState(true);
    const [loadingLatest, setLoadingLatest] = useState(true);
    const [mangaLatestList, setMangaLatestList] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [mangaFeaturedList, setMangaFeaturedList] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [mangaPopularList, setMangaPopularList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [newsList, setNewsList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [userChapterHistoryList, setUserChapterHistoryList] = useState([]);
    const [userChapterHistoryTotal, setUserChapterHistoryTotal] = useState([]);

    useEffect(() => {
        refreshNewsList();
        refreshUserChapterHistory();
        // Latest
        setLoadingLatest(true);
        callAPI(`/api/manga-custom?order=latest&limit=8`)
            .then(({ data }) => setMangaLatestList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoadingLatest(false));
        // Featured
        setLoadingFeatured(true);
        callAPI(`/api/manga-custom?order=featured&limit=3`)
            .then(({ data }) => setMangaFeaturedList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoadingFeatured(false));
        // Popular
        setLoadingPopular(true);
        callAPI(`/api/manga-custom?order=popular&limit=8`)
            .then(({ data }) => setMangaPopularList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoadingPopular(false));
    }, []);

    const refreshUserChapterHistory = () => {
        if (!logged) {
            setLoadingHistory(false);
            return;
        };
        setLoadingHistory(true);
        callAPI(`/api/user-chapter-history`)
            .then(({ data, total }) => {
                setUserChapterHistoryList(data);
                setUserChapterHistoryTotal(total);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoadingHistory(false));
    }

    const refreshNewsList = () => {
        setLoadingNews(true);
        callAPI(`/api/news?limit=3`)
            .then(({ data }) => setNewsList(data))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoadingNews(false));
    }

    const formatDate = (date) => {
        if (!date) return '';
        const dt = new Date(date);
        const diff = new Date() - dt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        if (months > 0) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        return 'hoy';
    }

    return (
        <div className='2xl:max-w-[1320px] 2xl:mx-auto transition-all duration-500'>
            {/* Search bar */}
            <div className="relative h-80 w-full mt-8 mb-16 2xl:rounded-lg overflow-hidden">
                <img
                    src={organization?.bannerUrl || "https://cdn.pixabay.com/photo/2016/11/29/12/54/banner-1868728_960_720.jpg"}
                    alt="Manga"
                    className="absolute object-cover w-full h-full"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50" />
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center">
                    <div className=' w-full backdrop-blur-sm bg-black bg-opacity-40 p-4'>
                        <Typography
                            className="font-semibold text-gray-200 text-4xl text-center"
                        >
                            Bienvenido a {organization?.title || "Mangas"}
                        </Typography>
                        <Typography
                            className="font-normal text-gray-300 text-lg text-center"
                        >
                            {organization?.description || "Lectura de mangas online"}
                        </Typography>
                    </div>
                </div>
            </div >
            {/* Top 3 mangas */}
            < div className="grid grid-cols-1 m-2" >
                <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                    <Typography
                        color="white"
                        className="font-semibold text-4xl"
                    >
                        Más populares
                    </Typography>
                    <Typography
                        color="gray"
                        className="font-normal text-sm mt-2 sm:mb-1"
                    >
                        (Mangas con más visitas de todos los tiempos)
                    </Typography>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-sm mb-1" />
                <div className="grid grid-cols-1 md:grid-cols-2 justify-center">
                    <FeaturedMangaCard manga={mangaFeaturedList?.[0]} className='h-[32rem] w-full p-2' />
                    <div className="flex flex-wrap w-full items-center">
                        {<FeaturedMangaCard manga={mangaFeaturedList?.[1]} className='h-[16rem] w-full p-2' />}
                        {<FeaturedMangaCard manga={mangaFeaturedList?.[2]} className='h-[16rem] w-full p-2' />}
                    </div>
                </div>
            </div >
            {/* Google Ad */}
            < div className="w-full sm:mx-2 my-16" >
                <div className="flex justify-center">
                    <div className="max-w-[64rem] max-h-[8rem] text-center">
                        <p className='uppercase text-2xl font-bold'>
                            {organization?.title || "Mangas"}
                        </p>
                        <p className='uppercase'>
                            {organization?.logged
                                ? "Explora, lee y disfruta de tus mangas favoritos"
                                : "Registrate o inicia sesión para guardar tu historial y retomar la lectura en cualquier momento"
                            }
                        </p>
                    </div>
                </div>
            </div >
            {/* Main content */}
            < div className="grid grid-cols-1 lg:grid-cols-4 gap-y-4 lg:gap-4 m-2" >
                <div className="col-span-1 align-middle order-first lg:order-last">
                    <Typography
                        color="white"
                        className="font-semibold text-4xl"
                    >
                        Seguir leyendo
                    </Typography>
                    <div className="w-full h-1 bg-gray-200 rounded-sm my-4" />
                    {logged ? (
                        <div className="flex flex-wrap gap-4 justify-center mb-4">
                            {
                                !loadingHistory && userChapterHistoryList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center w-full h-full">
                                        <Typography
                                            color="gray"
                                            className="font-light text-xl"
                                        >
                                            No hay historial para mostrar
                                        </Typography>
                                    </div>
                                )
                            }
                            {userChapterHistoryList.map((history) => (
                                <a
                                    key={history.id}
                                    className='w-full'
                                    href={`/manga/${history.chapter.mangaCustom.manga.slug}/chapters/${history.chapter.number}?page=${history.pageNumber}`}
                                >
                                    <Alert
                                        variant="ghost"
                                        className='w-full hover:bg-gray-300'
                                    >
                                        <p className='font-semibold'>{history.chapter.mangaCustom.title}</p>
                                        <span className='text-xs'>Capítulo {history.chapter.number} página {history.pageNumber}, leído {formatDate(history.lastReadAt)}</span>
                                    </Alert>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-center mb-4">
                            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                                <span className="font-light text-gray-700 text-lg"
                                >
                                    <a href='/register' className='hover:underline'>
                                        Registrate
                                    </a>
                                    &nbsp;o&nbsp;
                                    <a href='/login' className='hover:underline'>
                                        Inicia sesión
                                    </a>
                                    &nbsp;para ver guardar tu historial
                                </span>
                            </div>
                        </div>
                    )}
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="white"
                            className="font-semibold text-4xl"
                        >
                            Noticias
                        </Typography>
                        <a
                            href='/news'
                            className="font-normal text-gray-500 text-md hover:underline ml-auto mr-4"
                        >
                            Ver todas
                        </a>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-sm my-4" />
                    <div className="flex flex-wrap gap-4 justify-center">
                        {
                            !loadingNews && newsList.length === 0 && (
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
                    </div>
                </div>
                <div className='col-span-3 align-middle order-last lg:order-first'>
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="white"
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
                        <a
                            href='/mangas?order=popular'
                            className="hidden md:block font-normal text-gray-500 text-md hover:underline ml-auto mr-4"
                        >
                            Ver todos
                        </a>
                    </div>
                    <MangaCardsScroller>
                        {!loadingPopular && mangaPopularList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    No hay mangas para mostrar
                                </Typography>
                            </div>
                        )}
                        {loadingPopular && ("12345678".split("").map(n => <MangaCard key={n} manga={null} />))}
                        {mangaPopularList.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                    </MangaCardsScroller>
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="white"
                            className="font-semibold text-4xl"
                        >
                            Actualizados recientemente
                        </Typography>
                        <a
                            href='/mangas?order=latest'
                            className="hidden md:block font-normal text-gray-500 text-md hover:underline ml-auto mr-4"
                        >
                            Ver todos
                        </a>
                    </div>
                    <MangaCardsScroller>
                        {!loadingLatest && mangaLatestList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    No hay mangas para mostrar
                                </Typography>
                            </div>
                        )}
                        {loadingLatest && ("12345678".split("").map(n => <MangaCard key={n} manga={null} />))}
                        {mangaLatestList.map(manga => <MangaCard key={manga.id} manga={manga} />)}
                    </MangaCardsScroller>
                </div>
            </div >
        </div >
    );
}
