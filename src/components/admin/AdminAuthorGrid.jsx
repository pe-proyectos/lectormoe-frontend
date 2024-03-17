import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from "@material-tailwind/react";
import { AdminAuthorCard } from './AdminAuthorCard';
import { callAPI } from '../../util/callApi';

export function AdminAuthorGrid() {
    const [authors, setAuthors] = useState([]);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        callAPI(`/api/author`)
            .then(result => {
                setStatus("success");
                setAuthors(result);
            })
            .catch(error => {
                setStatus("error");
                toast.error('Error al cargar los autores');
            });
    }, []);

    return (
        <div className="flex w-full justify-center my-4">
            <div className="max-w-lg">
                {status === "loading" && <Spinner />}
                {status === "error" && <p>No se pudo obtener a los autores</p>}
                {status === "success" && authors.length === 0 &&
                    <Alert>
                        No hay autores disponibles,
                        <a href="/admin/authors/create" className='hover:text-light-blue-200'>{" crea uno "}</a>
                        para empezar.
                    </Alert>
                }
            </div>
            <div className="flex flex-wrap gap-4">
                {authors.map(author => (
                    <AdminAuthorCard
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
