import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    Input,
    Checkbox,
    Button,
    Switch,
    Textarea,
    Typography,
} from "@material-tailwind/react";
import { DropzoneDialog } from 'material-ui-dropzone';
import {
    MRT_TableContainer,
    useMaterialReactTable,
} from 'material-react-table';
import { callAPI } from '../../util/callApi';

export function AdminPagesCard({ manga, chapter, pages }) {
    const [data, setData] = useState(() => pages);
    const [chapterNewImages, setChapterNewImages] = useState([]);
    const [openUploadImagesDialog, setOpenUploadImagesDialog] = useState(false);
    const columns = useMemo(
        () => [
            {
                accessorKey: 'number',
                header: 'Número',
                Cell: ({ row }) => (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        {row.index + 1}
                    </Typography>
                ),
            },
            {
                accessorKey: 'imageUrl',
                header: 'Imagen',
                Cell: ({ row }) => (
                    <img
                        src={row.original.imageUrl}
                        alt={row.index + 1}
                        width="100"
                    />
                ),
            },
            {
                accessorKey: 'isDoublePage',
                header: 'Es doble página',
                Cell: ({ row }) => (
                    <Switch />
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Creado el',
                Cell: ({ row }) => (
                    <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
                ),
            },
            {
                accessorKey: 'id',
                header: 'Acciones',
                Cell: ({ row }) => (
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => {
                            const newPages = [...pages];
                            newPages.splice(row.index, 1);
                            setData(newPages);
                        }}
                    >
                        Eliminar
                    </Button>
                ),
            },
        ],
        [],
    );

    const saveUploadImagesDialog = async () => {
        const images = [...chapterNewImages];
        setChapterNewImages([]);

        const formData = new FormData();
        images.forEach(image => {
            formData.append('images', image);
        });
        callAPI(`/api/organization/${window.organization.slug}/manga-custom/${manga.slug}/chapter/${chapter.number}/pages`, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Imagenes subidas');
                setData(response);
            })
            .catch(error => {
                toast.error(error?.message);
            })
            .finally(() => {
                setOpenUploadImagesDialog(false);
            });
    }

    const saveNewOrder = async () => {
        callAPI(`/api/organization/${window.organization.slug}/manga-custom/${manga.slug}/chapter/${chapter.number}/pages/order`, {
            method: 'POST',
            body: JSON.stringify(data.map((page, index) => ({
                id: page.id,
                order: index + 1,
            }))),
        })
            .then(response => {
                toast.success('Orden guardado');
                setData(response);
            })
            .catch(error => {
                toast.error(error?.message);
            })
            .finally(() => {
                setOpenUploadImagesDialog(false);
            });
    }

    const table = useMaterialReactTable({
        columns,
        data,
        enableRowOrdering: true,
        enableColumnActions: false,
        muiRowDragHandleProps: ({ table }) => ({
            onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (hoveredRow && draggingRow) {
                    data.splice(
                        hoveredRow.index,
                        0,
                        data.splice(draggingRow.index, 1)[0],
                    );
                    setData([...data]);
                }
            },
        }),
    });

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Páginas - {manga.title} #{chapter.number}
            </Typography>
            <div className="dropzone-container flex flex-col items-end justify-end">
                <MRT_TableContainer table={table} />;
                <div>
                    <Button type="submit" variant='text' className="my-6 mx-1" onClick={() => setOpenUploadImagesDialog(true)}>
                        Subir imagenes
                    </Button>
                    <Button type="submit" variant='outlined' className="my-6 mx-1" onClick={() => saveNewOrder()}>
                        Guardar
                    </Button>
                </div>
            </div>
            <DropzoneDialog
                acceptedFiles={['image/*']}
                cancelButtonText={"Cancelar"}
                submitButtonText={"Subir"}
                maxFileSize={5000000}
                open={openUploadImagesDialog}
                onClose={() => setOpenUploadImagesDialog(false)}
                onSave={(files) => saveUploadImagesDialog(files)}
                onChange={(files) => setChapterNewImages(files)}
                showPreviews={true}
                showFileNamesInPreview={true}
                filesLimit={100}
            />
        </Card>
    );
};
