import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminGenreCard } from './AdminGenreCard';
import { AdminGenreDialog } from './AdminGenreDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminGenreGrid({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);

    useEffect(() => {
        if (!isGenreDialogOpen) refreshGenres();
    }, [isGenreDialogOpen]);

    const refreshGenres = () => {
        setLoading(true);
        callAPI(`/api/genre`)
            .then(result => setGenres(result))
            .catch(error => toast.error(error?.message || _("error_loading_genres")))
            .finally(() => setLoading(false));
    };

    const handleEdit = (genre) => {
        setSelectedGenre(genre);
        setIsGenreDialogOpen(true);
    };

    const handleDelete = (genre) => {
        callAPI(`/api/genre/${genre.slug}`, { method: 'DELETE' })
            .then(() => {
                refreshGenres();
                setSelectedGenre(null);
                setIsGenreDialogOpen(false);
                toast.success(_("genre_deleted"));
            })
            .catch(error => toast.error(error?.message || _("error_deleting_genre")))
    };

    return (
        <div className="w-full my-4">
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => {
                    setSelectedGenre(null);
                    setIsGenreDialogOpen(true);
                }}
            >
                {_("add_genre")}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <AdminGenreDialog
                organization={organization}
                open={isGenreDialogOpen}
                setOpen={setIsGenreDialogOpen}
                genre={selectedGenre}
                setGenre={setSelectedGenre}
            />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && genres.length === 0 &&
                    <Alert>
                        {_("no_genres")},
                        <a href="/admin/genres/create" className='hover:text-light-blue-200'>{" "}{_("add_genre_here")}{" "}</a>
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {genres.map(genre => (
                    <AdminGenreCard
                        organization={organization}
                        key={genre.id}
                        genre={genre}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
