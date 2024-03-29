import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Typography,
    IconButton,
    Button,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { AdminMangaCustomCard } from './AdminMangaCustomCard';
import { AdminMangaCustomDialog } from './AdminMangaCustomDialog';
import { callAPI } from '../../util/callApi';

export function AdminMangaCustomGrid() {
    const [loading, setLoading] = useState(true);
    const [mangaList, setMangaList] = useState([]);
    const [page, setPage] = useState(1);
    const [maxPage, setMaxPage] = useState(1);
    const [selectedManga, setSelectedManga] = useState(null);
    const [isCreateMangaCustomDialogOpen, setIsCreateMangaCustomDialogOpen] = useState(false);

    useEffect(() => {
        refreshMangaProfile();
    }, [page]);

    useEffect(() => {
        if (!isCreateMangaCustomDialogOpen) refreshMangaProfile();
    }, [isCreateMangaCustomDialogOpen]);

    const refreshMangaProfile = () => {
        setLoading(true);
        const query = new URLSearchParams({
            page,
            limit: 20,
        });
        callAPI(`/api/manga-custom?${query}`)
            .then(({ data, maxPage }) => {
                setMangaList(data);
                setMaxPage(maxPage);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    const handleCardClick = (mangaCustom) => {
        setSelectedManga(mangaCustom);
        setIsCreateMangaCustomDialogOpen(true);
    }

    return (
        <div className="w-full my-4">
            <AdminMangaCustomDialog
                open={isCreateMangaCustomDialogOpen}
                setOpen={setIsCreateMangaCustomDialogOpen}
                mangaCustom={selectedManga}
                setMangaCustom={setSelectedManga}
            />
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => setIsCreateMangaCustomDialogOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Agregar Manga
            </Button>
            {!loading && mangaList.length > 0 && (
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
            )}
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && mangaList.length === 0 &&
                    <Alert>
                        No hay mangas disponibles,
                        <a href="/admin/mangas/create" className='hover:text-light-blue-200'>{" crea uno "}</a>
                        para empezar.
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {mangaList.map(mangaCustom => (
                    <AdminMangaCustomCard
                        key={mangaCustom.id}
                        mangaCustom={mangaCustom}
                        onClick={() => handleCardClick(mangaCustom)}
                    />
                ))}
            </div>
        </div>
    );
}
