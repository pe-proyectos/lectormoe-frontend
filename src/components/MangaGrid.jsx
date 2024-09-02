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
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";

export function MangaGrid({ organization, logged }) {
    const _ = getTranslator(organization.language);

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
    const [showAllChapterHistoryList, setShowAllChapterHistoryList] = useState(false);

    useEffect(() => {
        refreshNewsList();
        refreshUserChapterHistory();
        // Latest
        setLoadingLatest(true);
        callAPI(`/api/manga-custom?order=latest&limit=9`)
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
        callAPI(`/api/manga-custom?order=popular&limit=9`)
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
        if (organization.language === 'en') {
            if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
            if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
            return 'today';
        } else if (organization.language === 'pt') {
            if (months > 0) return `há ${months} mes${months > 1 ? 'es' : ''}`;
            if (weeks > 0) return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
            if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
            if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
            if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
            if (seconds > 0) return `há ${seconds} segundo${seconds > 1 ? 's' : ''}`;
            return 'hoje';
        }
        if (months > 0) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        if (seconds > 0) return `hace ${seconds} segundo${seconds > 1 ? 's' : ''}`;
        return 'hoy';
    }

    return (
        <div className='2xl:max-w-[1320px] 2xl:mx-auto transition-all duration-500'>
            {/* Search bar */}
            <div className="relative h-80 w-full mt-8 mb-16 2xl:rounded-lg overflow-hidden">
                <LazyImage
                    src={organization?.bannerUrl || "https://cdn.pixabay.com/photo/2016/11/29/12/54/banner-1868728_960_720.jpg"}
                    alt="Manga"
                    decoding="async"
                    loading="lazy"
                    className="absolute object-cover w-full h-full"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50" />
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center">
                    <div className=' w-full backdrop-blur-sm bg-black bg-opacity-40 p-4'>
                        <Typography
                            className="font-semibold text-gray-200 text-4xl text-center"
                        >
                            {_("welcome_to")} {organization?.title || "Mangas"}
                        </Typography>
                        <Typography
                            className="font-normal text-gray-300 text-lg text-center"
                        >
                            {organization?.description || _("read_mangas_online")}
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
                        {_("most_popular")}
                    </Typography>
                    <Typography
                        color="gray"
                        className="font-normal text-sm mt-2 sm:mb-1"
                    >
                        {_("most_popular_description")}
                    </Typography>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-sm mb-1" />
                <div className="grid grid-cols-1 md:grid-cols-2 justify-center">
                    <FeaturedMangaCard organization={organization} manga={mangaFeaturedList?.[0]} className='h-[32rem] w-full p-2' />
                    <div className="flex flex-wrap w-full items-center">
                        {<FeaturedMangaCard organization={organization} manga={mangaFeaturedList?.[1]} className='h-[16rem] w-full p-2' />}
                        {<FeaturedMangaCard organization={organization} manga={mangaFeaturedList?.[2]} className='h-[16rem] w-full p-2' />}
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
                                ? _("logged_title")
                                : _("no_logged_title")
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
                        {_("keep_reading")}
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
                                            {_("no_history")}
                                        </Typography>
                                    </div>
                                )
                            }
                            {(showAllChapterHistoryList ? userChapterHistoryList : userChapterHistoryList.slice(0, 6)).map((history) => (
                                <a
                                    key={history.id}
                                    className='w-full'
                                    href={`/manga/${history.chapter.mangaCustom.manga.slug}/chapters/${history.chapter.number}?page=${history.pageNumber}`}
                                >
                                    <Alert
                                        variant="ghost"
                                        className='w-full bg-gray-400 hover:bg-gray-300'
                                    >
                                        <p className='font-semibold'>{history.chapter.mangaCustom.title}</p>
                                        <span className='text-xs'>{_("chapter")} {history.chapter.number} {_("welcome_to")}página {history.pageNumber}, {_("read")} {formatDate(history.lastReadAt)}</span>
                                    </Alert>
                                </a>
                            ))}
                            {userChapterHistoryList.length > 6 && (
                                <Button
                                    color="gray"
                                    onClick={() => setShowAllChapterHistoryList(!showAllChapterHistoryList)}
                                >
                                    {showAllChapterHistoryList ? _("see_less") : _("see_more")}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-center mb-4">
                            <div className="flex flex-col items-center justify-center text-center w-full h-full">
                                <span className="font-light text-gray-700 text-lg"
                                >
                                    <a href='/register' className='hover:underline'>
                                        {_("register")}
                                    </a>
                                    &nbsp;o&nbsp;
                                    <a href='/login' className='hover:underline'>
                                        {_("login")}
                                    </a>
                                    &nbsp;{_("to_access_history")}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
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
                    </div> */}
                    {/* <div className="w-full h-1 bg-gray-200 rounded-sm my-4" /> */}
                    {/* <div className="flex flex-wrap gap-4 justify-center">
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
                    </div> */}
                </div>
                <div className='col-span-3 align-middle order-last lg:order-first'>
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="white"
                            className="font-semibold text-4xl"
                        >
                            {_("popular")}
                        </Typography>
                        <Typography
                            color="gray"
                            className="font-normal text-sm mt-2 sm:mb-1"
                        >
                            {_("popular_description")}
                        </Typography>
                        <a
                            href='/search?order=popular'
                            className="hidden md:block font-normal text-gray-500 text-md hover:underline ml-auto mr-4"
                        >
                            {_("see_all")}
                        </a>
                    </div>
                    <MangaCardsScroller useSideScroll={true} >
                        {!loadingPopular && mangaPopularList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    {_("nothing_to_show")}
                                </Typography>
                            </div>
                        )}
                        {loadingPopular && ("123456789".split("").map(n => <MangaCard organization={organization} key={n} manga={null} />))}
                        {mangaPopularList.map((manga, index) => (
                            <div key={manga.id} className={index === 8 ? "hidden md:block" : undefined} >
                                <MangaCard organization={organization} key={manga.id} manga={manga} />
                            </div>
                        ))}
                    </MangaCardsScroller>
                    <div className='flex md:hidden w-full items-center justify-center'>
                        <a href="/search?sort=popular">
                            <Button color="gray" className="m-4">
                                {_("see_all_popular")}
                            </Button>
                        </a>
                    </div>
                    <div className='flex flex-wrap sm:gap-4 mb-4 items-end'>
                        <Typography
                            color="white"
                            className="font-semibold text-4xl"
                        >
                            {_("recently_updated")}
                        </Typography>
                        <a
                            href='/search?order=latest'
                            className="hidden md:block font-normal text-gray-500 text-md hover:underline ml-auto mr-4"
                        >
                            {_("see_all")}
                        </a>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-sm my-4" />
                    <MangaCardsScroller>
                        {!loadingLatest && mangaLatestList.length === 0 && (
                            <div className="m-4">
                                <Typography
                                    color="gray"
                                    className="font-light text-xl"
                                >
                                    {_("manga_no_results")}
                                </Typography>
                            </div>
                        )}
                        {loadingLatest && ("123456789".split("").map(n => <MangaCard organization={organization} key={n} manga={null} />))}
                        {mangaLatestList.map((manga, index) => (
                            <div key={manga.id} className={index === 8 ? "hidden md:block" : undefined} >
                                <MangaCard organization={organization} key={manga.id} manga={manga} />
                            </div>
                        ))}
                    </MangaCardsScroller>
                    <div className='flex w-full items-center justify-center'>
                        <a href="/search?sort=latest">
                            <Button color="gray" className="m-4">
                                {_("see_all_recently_updated")}
                            </Button>
                        </a>
                    </div>
                </div>
            </div >
        </div >
    );
}
