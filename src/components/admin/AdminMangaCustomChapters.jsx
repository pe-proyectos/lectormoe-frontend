import 'cookie-store';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Card,
    Input,
    Checkbox,
    Button,
    Textarea,
    Typography,
    Collapse,
    CardBody,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { callAPI } from '../../util/callApi';
import { AdminChaptersTable } from './AdminChaptersTable';
import { AdminChapterDialog } from './AdminChapterDialog';

export function AdminMangaCustomChapters({ initialMangaCustom }) {
    const [loading, setLoading] = useState(true);
    const [chapter, setChapter] = useState(null);
    const [mangaCustom, setMangaCustom] = useState(initialMangaCustom);
    const [isAdminChapterDialogOpen, setIsAdminChapterDialogOpen] = useState(false);

    useEffect(() => {
        if (!isAdminChapterDialogOpen) {
            setChapter(null);
            refreshMangaCustom();
        };
    }, [isAdminChapterDialogOpen]);

    useEffect(() => {
        if (chapter) setIsAdminChapterDialogOpen(true);
    }, [chapter]);

    const refreshMangaCustom = () => {
        setLoading(true);
        callAPI(`/api/manga-custom/${mangaCustom.slug}`)
            .then(result => setMangaCustom(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <Card color="transparent" shadow={false}>
            <div className="flex gap-4 my-2">
                <img src={mangaCustom.imageUrl} className="w-56 max-h-96 object-cover" alt="cover" />
                <div>
                    <Typography variant="h2" color="blue-gray">
                        {mangaCustom.title}
                    </Typography>
                    <Typography variant="paragraph" color="blue-gray">
                        {mangaCustom.description || mangaCustom.shortDescription || "Sin descripción"}
                    </Typography>
                </div>
            </div>
            <Typography variant="h4" className='my-2' color="blue-gray">
                Capítulos
            </Typography>
            <Button
                variant="outlined"
                className='w-56 my-2'
                onClick={() => setIsAdminChapterDialogOpen(true)}
            >
                Publicar capítulo
            </Button>
            <AdminChapterDialog
                open={isAdminChapterDialogOpen}
                setOpen={setIsAdminChapterDialogOpen}
                mangaCustom={mangaCustom}
                chapter={chapter}
            />
            <AdminChaptersTable
                mangaCustom={mangaCustom}
                chapters={mangaCustom.chapters}
                onChapterClick={chapter => setChapter(chapter)}
                onChapterDelete={() => refreshMangaCustom()}
            />
        </Card>
    );
}
