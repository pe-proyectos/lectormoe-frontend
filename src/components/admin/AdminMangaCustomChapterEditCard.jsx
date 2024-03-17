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
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { callAPI } from '../../util/callApi';

export function AdminMangaCustomChapterEditCard({ chapter, manga }) {
    // form
    const [title, setTitle] = useState(chapter.title);
    const [number, setNumber] = useState(chapter.number);
    const [chapterImageFile, setChapterImageFile] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        if (!number) {
            return toast.error('El número es obligatorio');
        }
        const formData = new FormData();
        formData.append('chapterId', chapter.id);
        formData.append('title', title);
        formData.append('number', number);
        if (chapterImageFile) formData.append('image', chapterImageFile);
        callAPI(`/api/organization/${window.organization.slug}/manga-custom/${manga.slug}/chapter/${chapter.number}`, {
            method: 'PATCH',
            body: formData,
        })
            .then(response => {
                toast.success('Capítulo creado');
                window.location.href = "/admin/mangas/" + manga.slug;
            })
            .catch(error => {
                toast.error(error?.message);
            });
    };

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Editar capitulo
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
                Rellena los campos para editar el capitulo<br />
            </Typography>
            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-1 flex flex-col gap-6">
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Número
                    </Typography>
                    <Input
                        size="lg"
                        placeholder="Número del capitulo..."
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        autoComplete='off'
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        type='number'
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Título
                    </Typography>
                    <Input
                        size="lg"
                        placeholder="Título del capitulo..."
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        autoComplete='off'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Miniatura del capitulo
                    </Typography>
                    <img src={chapter.imageUrl} className="w-56" alt="cover" />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Nueva miniatura (Opcional)
                    </Typography>
                    <DropzoneArea
                        filesLimit={1}
                        dropzoneText='Arrastra y suelta la imagen de portada del manga'
                        onChange={(files) => files[0] ? setChapterImageFile(files[0]) : null}
                        disabled={!manga}
                    />
                </div>
                <Button type="submit" className="mt-6" fullWidth>
                    Guardar
                </Button>
            </form>
        </Card>
    );
}
