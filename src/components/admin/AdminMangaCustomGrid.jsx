import React, { useState, useEffect } from 'react';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminMangaCustomCard } from './AdminMangaCustomCard';
import { AdminMangaCustomDialog } from './AdminMangaCustomDialog';
import { callAPI } from '../../util/callApi';

export function AdminMangaCustomGrid() {
    const [mangaList, setMangaList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedManga, setSelectedManga] = useState(null);
    const [isCreateMangaCustomDialogOpen, setIsCreateMangaCustomDialogOpen] = useState(false);

    useEffect(() => {
        refreshMangaProfile();
    }, []);

    useEffect(() => {
        if (!isCreateMangaCustomDialogOpen) refreshMangaProfile();
    }, [isCreateMangaCustomDialogOpen]);

    const refreshMangaProfile = () => {
        callAPI(`/api/manga-custom`)
            .then(result => setMangaList(result))
            .catch(error => toast.error(error?.message || 'Error al cargar los autores'));
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
                className="flex items-center gap-3 h-full ml-2"
                onClick={() => setIsCreateMangaCustomDialogOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Agregar Manga
            </Button>
            <div className="max-w-lg">
                {loading && <Spinner />}
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
