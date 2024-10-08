import React, { useRef, useState, useEffect } from 'react';
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
    Input,
    IconButton,
    Chip,
} from "@material-tailwind/react";
import {
    BellIcon,
    Cog6ToothIcon,
    UserIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { callAPI } from '../util/callApi';
import { MangaCard } from './MangaCard';
import { PageNavigation } from './PageNavigation';
import { getTranslator } from "../util/translate";

export function BookSearch({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [mangaList, setMangaList] = useState([]);
    const [search, setSearch] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q') || '';
    });
    const [bookTypeCode, setBookTypeCode] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('type');
        if (['manga', 'manhua', 'manhwa'].includes(code)) {
            return code;
        }
        return 'manga';
    });
    const [orderBy, setOrderBy] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('order') || 'latest';
    });
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [page, setPage] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('page')) || 1;
    });
    const [maxPage, setMaxPage] = useState(1);
    const [limit, setLimit] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return Number(urlParams.get('limit')) || 24;
    });
    const [debounceTimer, setDebounceTimer] = useState(0);
    const firstRender = useRef(true);

    useEffect(() => {
        callAPI('/api/analytics', {
            method: 'POST',
            includeIp: true,
            body: JSON.stringify({
                event: 'view_manga_search',
                path: window.location.pathname,
                userAgent: window.navigator.userAgent,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                payload: {
                    search,
                    bookTypeCode,
                    orderBy,
                    limit,
                },
            }),
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setDebounceTimer(prev => Math.max(prev - 10, 0));
        }, 10);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!firstRender.current) {
            const timer = setTimeout(() => {
                refreshMangaProfile();
            }, 1000);
            setDebounceTimer(1000);
            return () => {
                clearTimeout(timer);
            };
        }
        firstRender.current = false;
    }, [search]);

    useEffect(() => {
        refreshMangaProfile();
    }, [page, orderBy, bookTypeCode, limit]);

    useEffect(() => {
        setPage(1);
    }, [orderBy]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    useEffect(() => {
        setPage(1);
    }, [bookTypeCode]);

    const refreshMangaProfile = () => {
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', page);
        urlParams.set('limit', limit);
        urlParams.set('order', orderBy);
        const query = new URLSearchParams({
            page,
            limit: limit,
            order: orderBy,
        });
        if (search) {
            query.set('title', search);
            urlParams.set('q', search);
        }
        if (bookTypeCode) {
            query.set('type', bookTypeCode);
            urlParams.set('type', bookTypeCode);
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
        callAPI(`/api/manga-custom?${query}`)
            .then(({ data, maxPage }) => {
                setMangaList(data);
                setMaxPage(maxPage || 1);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
        callAPI('/api/analytics', {
            method: 'POST',
            includeIp: true,
            body: JSON.stringify({
                event: 'action_search_' + bookTypeCode,
                path: window.location.pathname,
                userAgent: window.navigator.userAgent,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                payload: {
                    page,
                    title: search,
                    order: orderBy,
                    limit,
                    bookTypeCode,
                },
            }),
        }).catch(err => console.error(err));
    }

    const titles = {
        'manga': 'Manga',
        'manhua': 'Manhua',
        'manhwa': 'Manhwa',
    }

    return (
        <div>
            <div className='relative w-full flex flex-wrap items-center justify-around px-2 py-12'>
                <p>
                    {_(bookTypeCode + "_search_description")}
                </p>
            </div>
            <div className='relative w-full flex flex-wrap items-center justify-around px-2 py-6 pb-0'>
                <p className='text-6xl font-bold'>
                    {_(bookTypeCode + "_search_hero_title")}
                </p>
            </div>
            <div className='relative w-full flex flex-wrap items-center justify-around px-2 py-12'>
                <div className="relative flex w-full gap-2 md:w-max mx-4 bg-white z-10 rounded-lg">
                    <Input
                        type="search"
                        size='lg'
                        placeholder={_(bookTypeCode + "_search_by_name")}
                        containerProps={{
                            className: "w-full md:min-w-[26rem]",
                        }}
                        className=" !border-t-blue-gray-300 pl-9 placeholder:text-blue-gray-300 focus:!border-blue-gray-300"
                        labelProps={{
                            className: "before:content-none after:content-none",
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="!absolute left-3 top-[13px]">
                        <svg
                            width="13"
                            height="14"
                            viewBox="0 0 14 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M9.97811 7.95252C10.2126 7.38634 10.3333 6.7795 10.3333 6.16667C10.3333 4.92899 9.84167 3.742 8.9665 2.86683C8.09133 1.99167 6.90434 1.5 5.66667 1.5C4.42899 1.5 3.242 1.99167 2.36683 2.86683C1.49167 3.742 1 4.92899 1 6.16667C1 6.7795 1.12071 7.38634 1.35523 7.95252C1.58975 8.51871 1.93349 9.03316 2.36683 9.4665C2.80018 9.89984 3.31462 10.2436 3.88081 10.4781C4.447 10.7126 5.05383 10.8333 5.66667 10.8333C6.2795 10.8333 6.88634 10.7126 7.45252 10.4781C8.01871 10.2436 8.53316 9.89984 8.9665 9.4665C9.39984 9.03316 9.74358 8.51871 9.97811 7.95252Z"
                                fill="#CFD8DC"
                            />
                            <path
                                d="M13 13.5L9 9.5M10.3333 6.16667C10.3333 6.7795 10.2126 7.38634 9.97811 7.95252C9.74358 8.51871 9.39984 9.03316 8.9665 9.4665C8.53316 9.89984 8.01871 10.2436 7.45252 10.4781C6.88634 10.7126 6.2795 10.8333 5.66667 10.8333C5.05383 10.8333 4.447 10.7126 3.88081 10.4781C3.31462 10.2436 2.80018 9.89984 2.36683 9.4665C1.93349 9.03316 1.58975 8.51871 1.35523 7.95252C1.12071 7.38634 1 6.7795 1 6.16667C1 4.92899 1.49167 3.742 2.36683 2.86683C3.242 1.99167 4.42899 1.5 5.66667 1.5C6.90434 1.5 8.09133 1.99167 8.9665 2.86683C9.84167 3.742 10.3333 4.92899 10.3333 6.16667Z"
                                stroke="#CFD8DC"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
                <div className='absolute h-1 bottom-5 left-10 right-10 justify-center'>
                    <div
                        className='h-1 mx-auto bg-red-800 bg-opacity-60 rounded-sm animate-pulse'
                        style={{ width: `calc(${debounceTimer} * 100% / 1000)` }}
                    />
                </div>
            </div>
            <div className='relative w-full flex flex-wrap items-center justify-evenly gap-x-2 gap-y-4 px-2 py-12'>
                <div className="flex items-center gap-4">
                    <Typography color="white" className="font-normal">
                        {_("order_by")}:
                    </Typography>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => setOrderBy('latest')}
                        disabled={orderBy === 'latest'}
                    >
                        {_("newest")}
                    </Button>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => setOrderBy('popular')}
                        disabled={orderBy === 'popular'}
                    >
                        {_("popular")}
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <Typography color="white" className="font-normal">
                        {_("show")}:
                    </Typography>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => setLimit(12)}
                        disabled={limit === 12}
                    >
                        12
                    </Button>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => setLimit(24)}
                        disabled={limit === 24}
                    >
                        24
                    </Button>
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => setLimit(36)}
                        disabled={limit === 36}
                    >
                        36
                    </Button>
                </div>
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8">
                    <PageNavigation
                        organization={organization}
                        page={page}
                        maxPage={maxPage}
                        setPage={setPage}
                        loading={loading}
                        data={mangaList}
                    />
                </div>
            </div>
            <div className='flex flex-wrap items-center justify-evenly mx-auto gap-2 sm:gap-4'>
                {
                    loading && (
                        <div className="w-full m-4 text-center">
                            <Typography
                                color="white"
                                className="font-light text-xl"
                            >
                                {_("loading")}...
                            </Typography>
                        </div>
                    )
                }
                {!loading && mangaList.length === 0 && (
                    <div className="w-full m-4 text-center">
                        <Typography
                            color="white"
                            className="font-light text-xl"
                        >
                            {_(bookTypeCode + "_no_results")}
                        </Typography>
                    </div>
                )}
                {mangaList.map(manga => <MangaCard key={manga.id} organization={organization} manga={manga} />)}
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <PageNavigation
                    organization={organization}
                    page={page}
                    maxPage={maxPage}
                    setPage={setPage}
                    loading={loading}
                    data={mangaList}
                />
            </div>
        </div>
    );
}
