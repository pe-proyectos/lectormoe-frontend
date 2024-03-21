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
                Cell: ({ row }) => (
                    <img
                        src={row.original.imageUrl}
                        alt={row.original.title || row.original.number || "Sin miniatura"}
                        className='max-w-24'
                    />
                ),
            },
            {
                accessorKey: 'number',
                header: 'Número',
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
                accessorKey: 'createdAt',
                header: 'Fecha de creación',
                Cell: ({ row }) => (
                    <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
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
        <MRT_TableContainer table={table} />
    );
}
