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

export function AdminCreateMangaCustomCard() {
    // lists
    const [mangas, setMangas] = useState([]);
    // form
    const [manga, setManga] = useState(null);
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [releasedDate, setReleasedDate] = useState(null);
    const [nextChapterDate, setNextChapterDate] = useState(null);
    const [coverImageFile, setCoverImageFile] = useState(null);

    useEffect(() => {
        callAPI(`/api/manga/autocomplete`)
            .then(result => setMangas(result))
            .catch(error => toast.error('Error al cargar las demografias'));
    }, []);

    useEffect(() => {
        if (!manga) return;
        callAPI(`/api/manga/${manga.slug}`)
            .then(result => {
                setTitle(result.title);
                setShortDescription(result.shortDescription);
                setDescription(result.description);
            })
            .catch(error => toast.error('Error al cargar las demografias'));
    }, [manga]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!manga) {
            return toast.error('El perfil de manga es obligatorio');
        }
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        if (!shortDescription) {
            return toast.error('La descripción corta es obligatoria');
        }
        if (!description) {
            return toast.error('La descripción es obligatoria');
        }
        if (!coverImageFile) {
            return toast.error('La imagen del autor es obligatoria');
        }
        const formData = new FormData();
        formData.append('mangaId', manga.id);
        formData.append('title', title);
        formData.append('shortDescription', shortDescription);
        formData.append('description', description);
        if (releasedDate) formData.append('releasedAt', releasedDate);
        if (nextChapterDate) formData.append('nextChapterAt', nextChapterDate);
        formData.append('image', coverImageFile);
        callAPI(`/api/organization/${window.organization.slug}/manga-custom`, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Manga creado');
                window.location.href = "/admin/mangas";
            })
            .catch(error => {
                toast.error(error?.message);
            });
    };

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Crear manga
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
                Este manga pertenecerá a tu organización.<br />
            </Typography>
            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-1 flex flex-col gap-6">
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Perfil de manga
                        (<a href="/admin/mangas/profile/create" className="hover:text-blue-500">Crear perfil de manga</a>)
                    </Typography>
                    <Autocomplete
                        className='mb-2'
                        options={mangas}
                        isOptionEqualToValue={(option, value) => option.slug === value.slug}
                        getOptionLabel={(option) => option.title}
                        renderInput={(params) => <TextField {...params} label="Perfil de manga" />}
                        value={manga}
                        onChange={(event, newValue) => setManga(newValue)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Titulo
                    </Typography>
                    <Input
                        size="lg"
                        placeholder="Titulo de la obra"
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        autoComplete='off'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Descripción corta
                    </Typography>
                    <Textarea
                        size="md"
                        label="Una descripción de menos de 100 caracteres..."
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Descripción
                    </Typography>
                    <Textarea
                        size="lg"
                        label="Argumento de la obra..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Fecha de publicación
                    </Typography>
                    <DatePicker
                        value={releasedDate}
                        onChange={setReleasedDate}
                        disabled={!manga}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Fecha del próximo capitulo
                    </Typography>
                    <DatePicker
                        value={nextChapterDate}
                        onChange={setNextChapterDate}
                        disabled={!manga}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Portada del manga
                    </Typography>
                    <DropzoneArea
                        filesLimit={1}
                        dropzoneText='Arrastra y suelta la imagen de portada del manga'
                        onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
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
