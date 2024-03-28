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

export function MangaGrid() {
    const [loading, setLoading] = useState(true);
    const [mangaList, setMangaList] = useState([]);
    const [mangaLatestList, setMangaLatestList] = useState([]);
    const [mangaFeaturedList, setMangaFeaturedList] = useState([]);
    const [mangaPopularList, setMangaPopularList] = useState([]);
    const [newsList, setNewsList] = useState([]);

    useEffect(() => {
        refreshMangaProfile();
        refreshNewsList();
        // Latest
        setLoading(true);
        callAPI(`/api/manga-custom?order=latest&limit=8`)
            .then(result => setMangaLatestList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Featured
        setLoading(true);
        callAPI(`/api/manga-custom?order=featured&limit=3`)
            .then(result => setMangaFeaturedList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        // Popular
        setLoading(true);
        callAPI(`/api/manga-custom?order=popular&limit=8`)
            .then(result => setMangaPopularList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, []);

    const refreshMangaProfile = () => {
        setLoading(true);
        callAPI(`/api/manga-custom`)
            .then(result => setMangaList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    const refreshNewsList = () => {
        setLoading(true);
        callAPI(`/api/news`)
            .then(result => setNewsList(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    const FeaturedMangaCard = ({ manga, ...props }) => {
        return (
            <div {...props}>
                <a href={manga?.slug ? `/manga/${manga?.slug}` : '#'}>
                    <div className='relative w-full h-full group overflow-hidden rounded-md shadow-md'>
                        <img src={manga?.imageUrl} className='absolute inset-0 -translate-y-1/2 w-full blur-sm' />
                        <img src={manga?.imageUrl} className='absolute inset-0 h-full mx-auto object-cover' />
                        <div className="to-bg-black-10 absolute bottom-0 h-2/4 lg:h-3/4 w-full bg-gradient-to-t from-black/90 via-black/60 lg:via-black/80" />
                        <div className="absolute top-4 right-4 justify-end">
                            <Chip variant="filled" value={`${manga?.views || 0} Vistas`} />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <Typography
                                color="white"
                                className="font-semibold text-4xl"
                            >
                                {manga?.title || ""}
                            </Typography>
                            <Typography
                                color="white"
                                className="font-normal text-sm hidden lg:block"
                            >
                                {manga?.shortDescription || ""}
                            </Typography>
                        </div>
                    </div>
                </a>
            </div>
        );
    }

    const MangaCard = ({ manga }) => {
        return (
            <Card
                shadow={false}
                className="relative grid h-[26rem] max-h-[26rem] w-[16rem] shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center"
            >
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="absolute inset-0 m-0 h-full w-full rounded-none bg-black"
                >
                    <a href={`/manga/${manga.slug}`}>
                        <img
                            src={manga.imageUrl}
                            alt={manga.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </a>
                </CardHeader>
                <CardBody className="relative py-14 px-6 md:px-12">
                    <figcaption className="absolute bottom-8 left-1/2 flex flex-col w-[12rem] -translate-x-1/2
            justify-between rounded-xl border border-white border-opacity-25 bg-white/70 py-1 px-2 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm"
                    >
                        <div>
                            <Typography
                                as='a'
                                href={`/manga/${manga.slug}`}
                                color="blue-gray"
                                className="font-semibold hover:underline cursor-pointer"
                            >
                                {manga.title}
                            </Typography>
                        </div>
                        <div className='flex flex-wrap gap-2 justify-center'>
                            {manga?.lastChapterNumber && (
                                <div>
                                    <Typography
                                        as='a'
                                        href={`/manga/${manga.slug}/chapters/${manga.lastChapterNumber}`}
                                        color="gray"
                                        className="font-normal text-xs hover:underline cursor-pointer"
                                    >
                                        Cápitulo {manga?.lastChapterNumber}
                                    </Typography>
                                </div>
                            )}
                            <div>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}`}
                                    color="gray"
                                    className="font-normal text-xs hover:underline cursor-pointer"
                                >
                                    Lista de capitulos
                                </Typography>
                            </div>
                        </div>
                    </figcaption>
                </CardBody>
            </Card>
        );
    }

    const MangaCardsScroller = ({ children }) => {
        const [scrollPosition, setScrollPosition] = useState(0);
        const [maxScrollPosition, setMaxScrollPosition] = useState(0);
        const handleScroll = (e) => {
            const { scrollLeft, scrollWidth, clientWidth } = e.target;
            setScrollPosition(scrollLeft);
            const maxScroll = scrollWidth - clientWidth;
            setMaxScrollPosition(maxScroll);
        };
        return (
            <div className='relative h-[28rem] overflow-x-scroll overflow-y-hidden no-scrollbar' onScrollCapture={handleScroll}>
                <div className="absolute top-1/2 -translate-y-1/2 flex gap-4 col-span-3 justify-around">
                    {children}
                </div>
                <div className="sticky bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-sm">
                    <div
                        className="h-1 w-[20%] shadow-md rounded-sm bg-gradient-to-r from-red-800 to-purple-900"
                        style={{
                            marginLeft: `${(scrollPosition / maxScrollPosition) * 80}%`,
                        }}
                    />
                </div>
            </div>
        )
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
                        {newsList.map((news) => (
                            <Card key={news.id} className="w-full sm:max-w-[16rem] lg:max-w-[26rem] overflow-hidden">
                                <CardHeader
                                    floated={false}
                                    shadow={false}
                                    color="transparent"
                                    className="m-0 rounded-none"
                                >
                                    <img
                                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                                        className='h-40 object-cover w-full'
                                        alt="ui/ux review check"
                                    />
                                </CardHeader>
                                <CardBody className='px-4 pt-4 pb-1'>
                                    <Typography variant="h6" color="blue-gray">
                                        UI/UX Review Check
                                    </Typography>
                                    <Typography variant="lead" color="gray" className="mt-3 font-normal text-md">
                                        Because it&apos;s about motivating the doers. Because I&apos;m here to
                                        follow my dreams and inspire others.
                                    </Typography>
                                </CardBody>
                                <CardFooter className="flex items-center justify-between px-4 pt-1 pb-4">
                                    <div className="flex items-center -space-x-3">
                                        <Tooltip content="Natali Craig">
                                            <Avatar
                                                size="sm"
                                                variant="circular"
                                                alt="natali craig"
                                                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1061&q=80"
                                                className="border-2 border-white hover:z-10"
                                            />
                                        </Tooltip>
                                        <Tooltip content="Tania Andrew">
                                            <Avatar
                                                size="sm"
                                                variant="circular"
                                                alt="tania andrew"
                                                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80"
                                                className="border-2 border-white hover:z-10"
                                            />
                                        </Tooltip>
                                    </div>
                                    <Typography className="font-normal">January 10</Typography>
                                </CardFooter>
                            </Card>
                        ))}
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
                </div>
            </div>
        </div>
    );
}
