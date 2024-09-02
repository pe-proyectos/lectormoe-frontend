import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
    Alert,
    Spinner,
    Button,
} from "@material-tailwind/react";
import { AdminAuthorCard } from './AdminAuthorCard';
import { AdminCreateAuthorDialog } from './AdminCreateAuthorDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminAuthorGrid({ organization }) {
    const _ = getTranslator(organization.language);

    const [loading, setLoading] = useState(true);
    const [authors, setAuthors] = useState([]);
    const [isCreateAuthorDialogOpen, setIsCreateAuthorDialogOpen] = useState(false);

    useEffect(() => {
        if (!isCreateAuthorDialogOpen) refreshAutors();
    }, [isCreateAuthorDialogOpen]);

    const refreshAutors = () => {
        setLoading(true);
        callAPI(`/api/author`)
            .then(result => setAuthors(result))
            .catch(error => toast.error(error?.message || _("error_loading_authors")))
            .finally(() => setLoading(false));
    };

    return (
        <div className="w-full my-4">
            <Button
                variant="outlined"
                className="flex items-center gap-3 h-full sm:m-4"
                onClick={() => setIsCreateAuthorDialogOpen(true)}
            >
                {_("add_author")}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <AdminCreateAuthorDialog organization={organization} open={isCreateAuthorDialogOpen} setOpen={setIsCreateAuthorDialogOpen} />
            <div className="max-w-lg">
                {loading && <Spinner className='m-4 w-full' />}
                {!loading && authors.length === 0 &&
                    <Alert>
                        {_("no_authors")},
                        <a href="/admin/authors/create" className='hover:text-light-blue-200'>{" "}{_("add_author_here")}{" "}</a>
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {authors.map(author => (
                    <AdminAuthorCard
                        organization={organization}
                        key={author.id}
                        imageUrl={author.imageUrl}
                        name={author.name}
                        shortDescription={author.shortDescription}
                        description={author.description}
                    />
                ))}
            </div>
        </div>
    );
}
