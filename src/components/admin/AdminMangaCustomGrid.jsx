import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from "@material-tailwind/react";
import { AdminMangaCustomCard } from './AdminMangaCustomCard';
import { callAPI } from '../../util/callApi';

export function AdminMangaCustomGrid() {
    const [mangaList, setMangaList] = useState([]);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        callAPI(`/api/manga-custom`)
            .then(result => {
                setStatus("success");
                setMangaList(result);
            })
            .catch(error => {
                setStatus("error");
                toast.error('Error al cargar los autores');
            });
    }, []);

    return (
        <div className="flex w-full justify-center my-4 gap-4">
            <div className="max-w-lg">
                {status === "loading" && <Spinner />}
                {status === "error" && <p>No se pudo obtener los mangas</p>}
                {status === "success" && mangaList.length === 0 &&
                    <Alert>
                        No hay mangas disponibles,
                        <a href="/admin/mangas/create" className='hover:text-light-blue-200'>{" crea uno "}</a>
                        para empezar.
                    </Alert>
                }
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mangaList.map(manga => (
                    <AdminMangaCustomCard
                        key={manga.id}
                        slug={manga.slug}
                        imageUrl={manga.imageUrl}
                        title={manga.title}
                        description={manga.description}
                    />
                ))}
            </div>          
        </div>
    );
}
