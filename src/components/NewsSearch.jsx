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
import { getTranslator } from "../util/translate";

export function NewsSearch({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [mangaList, setMangaList] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [maxPage, setMaxPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [debounceTimer, setDebounceTimer] = useState(0);
    const firstRender = useRef(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const initialSearch = urlParams.get('q');
        if (initialSearch) {
            setSearch(initialSearch || '');
        }
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
    }, [
        page,
        limit,
    ]);

    const refreshMangaProfile = () => {
        setLoading(true);
        const query = new URLSearchParams({
            page,
            limit: 20,
            title: search || "",
        });
        callAPI(`/api/manga-custom?${query}`)
            .then(({ data, maxPage }) => {
                setMangaList(data);
                setMaxPage(maxPage);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    return (
        <div>
            <div className='relative w-full flex flex-wrap items-center justify-around px-2 py-12'>
                <div className="relative flex w-full gap-2 md:w-max mx-4 bg-white z-10 rounded-lg">
                    <Input
                        type="search"
                        placeholder="Buscar mangas por nombre..."
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
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4'>
                <div className="flex items-center gap-8">
                    <IconButton
                        size="sm"
                        variant="outlined"
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                    >
                        <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
                    </IconButton>
                    <Typography color="gray" className="font-normal">
                        Page <strong className="text-gray-900">{page}</strong> of{" "}
                        <strong className="text-gray-900">{maxPage}</strong>
                    </Typography>
                    <IconButton
                        size="sm"
                        variant="outlined"
                        onClick={() => setPage(prev => Math.min(prev + 1, 10))}
                        disabled={page === maxPage}
                    >
                        <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                    </IconButton>
                </div>
            </div>
            <div className='w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4'>
                {
                    loading && (
                        <div className="w-full m-4 text-center">
                            <Typography
                                color="gray"
                                className="font-light text-xl"
                            >
                                Cargando...
                            </Typography>
                        </div>
                    )
                }
                {!loading && mangaList.length === 0 && (
                    <div className="w-full m-4 text-center">
                        <Typography
                            color="gray"
                            className="font-light text-xl"
                        >
                            No hay mangas para mostrar
                        </Typography>
                    </div>
                )}
                {mangaList.map(manga => <MangaCard organization={organization} key={manga.id} manga={manga} />)}
            </div>
        </div>
    );
}
