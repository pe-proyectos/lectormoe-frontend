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
import { getTranslator } from "../../util/translate";

export function AdminPagesCard({ organization, manga, chapter, pages }) {
    const _ = getTranslator(organization.language);

    const [data, setData] = useState(() => pages);
    const [chapterNewImages, setChapterNewImages] = useState([]);
    const [openUploadImagesDialog, setOpenUploadImagesDialog] = useState(false);
    const columns = useMemo(
        () => [
            {
                accessorKey: 'number',
                header: _('number'),
                Cell: ({ row }) => (
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        {row.index + 1}
                    </Typography>
                ),
            },
            {
                accessorKey: 'imageUrl',
                header: _('image'),
                Cell: ({ row }) => (
                    <img
                        src={row.original.imageUrl}
                        alt={row.index + 1}
                        decoding="async"
                        loading="lazy"
                        width="100"
                    />
                ),
            },
            {
                accessorKey: 'isDoublePage',
                header: _('is_double_page'),
                Cell: ({ row }) => (
                    <Switch />
                ),
            },
            {
                accessorKey: 'createdAt',
                header: _('created_at'),
                Cell: ({ row }) => (
                    <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>
                ),
            },
            {
                accessorKey: 'id',
                header: _('actions'),
                Cell: ({ row }) => (
                    <Button
                        color="red"
                        size="sm"
                        onClick={() => deletePage(row.original.id)}
                    >
                        {_('delete')}
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
        callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapter.number}/pages`, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success(_('images_uploaded'));
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
        callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapter.number}/pages/order`, {
            method: 'POST',
            body: JSON.stringify(data.map((page, index) => ({
                id: page.id,
                order: index + 1,
            }))),
        })
            .then(response => {
                toast.success(_('order_saved'));
                setData(response);
            })
            .catch(error => {
                toast.error(error?.message);
            })
            .finally(() => {
                setOpenUploadImagesDialog(false);
            });
    }

    const deletePage = async (id) => {
        callAPI(`/api/manga-custom/${manga.slug}/chapter/${chapter.number}/pages/${id}`, {
            method: 'DELETE',
        })
            .then(response => {
                toast.success(_('page_deleted'));
                setData(response);
            })
            .catch(error => {
                toast.error(error?.message);
            });
    }

    const table = useMaterialReactTable({
        columns,
        data,
        enableRowOrdering: true,
        enableColumnActions: false,
        enablePagination: false,
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
                {_('pages')} - {manga.title} #{chapter.number}
            </Typography>
            <div className="dropzone-container flex flex-col items-end justify-end">
                <MRT_TableContainer table={table} />;
                <div>
                    <Button type="submit" variant='text' className="my-6 mx-1" onClick={() => setOpenUploadImagesDialog(true)}>
                        {_('upload_images')}
                    </Button>
                    <Button type="submit" variant='outlined' className="my-6 mx-1" onClick={() => saveNewOrder()}>
                        {_('save')}
                    </Button>
                </div>
            </div>
            <DropzoneDialog
                acceptedFiles={['image/*']}
                cancelButtonText={_('cancel')}
                submitButtonText={_('upload')}
                maxFileSize={25 * 1024 * 1024}
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
