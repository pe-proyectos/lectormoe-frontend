import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    ButtonGroup,
    Button,
    Typography
} from "@material-tailwind/react";
import {
    MRT_TableContainer,
    useMaterialReactTable,
} from 'material-react-table';
import { callAPI } from '../../util/callApi';

export function AdminChaptersTable({ mangaCustom, onChapterClick, onChapterDelete }) {
    const columns = useMemo(
        () => [
            {
                accessorKey: 'imageUrl',
                header: 'Miniatura',
                size: 50,
                Cell: ({ row }) => row.original.imageUrl ? (
                    <img
                        src={row.original.imageUrl}
                        alt={row.original.title || row.original.number || "Sin miniatura"}
                        decoding="async"
                        loading="lazy"
                        className='max-w-24 max-h-36 mx-auto'
                    />
                ) : (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Sin miniatura
                    </Typography>
                ),
            },
            {
                accessorKey: 'number',
                header: 'Número',
                size: 50,
                Cell: ({ row }) => (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        {row.original.number}
                    </Typography>
                ),
            },
            {
                accessorKey: 'title',
                header: 'Título',
                Cell: ({ row }) => (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        {row.original.title}
                    </Typography>
                ),
            },
            {
                accessorKey: 'views',
                header: 'Visualizaciones',
                size: 50,
                Cell: ({ row }) => (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        {row.original.views}
                    </Typography>
                ),
            },
            {
                accessorKey: 'releasedAt',
                header: 'Fecha de salida',
                size: 50,
                Cell: ({ row }) => (
                    <span>{new Date(row.original.releasedAt).toLocaleDateString()}</span>
                ),
            },
            {
                accessorKey: 'updatedAt',
                header: 'Fecha actualización',
                size: 50,
                Cell: ({ row }) => (
                    <span>{new Date(row.original.updatedAt).toLocaleDateString()}</span>
                ),
            },
            {
                accessorKey: 'id',
                header: 'Acciones',
                Cell: ({ row }) => (
                    <ButtonGroup variant="text">
                        <Button variant="text" onClick={() => onChapterClick(row.original)}>
                            Editar
                        </Button>
                        <Button variant="text" className='hover:text-red-600' onClick={() => deleteChapter(row.original)}>
                            Eliminar
                        </Button>
                    </ButtonGroup>
                ),
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: mangaCustom.chapters,
        enableRowOrdering: false,
        enableColumnActions: false,
        enablePagination: false,
    });

    const deleteChapter = async (chapter) => {
        callAPI(`/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}`, {
            method: 'DELETE',
        })
            .then(response => {
                toast.success('Capítulo eliminado');
                onChapterDelete();
            })
            .catch(error => {
                toast.error(error?.message);
            });
    }

    return (
        <div className='max-w-full'>
            <MRT_TableContainer table={table} />
        </div>
    );
}
