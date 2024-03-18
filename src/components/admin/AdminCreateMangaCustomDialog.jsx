import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Card,
    Spinner,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Input,
    Checkbox,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { AdminCreateMangaProfileDialog } from './AdminCreateMangaProfileDialog';
import { callAPI } from '../../util/callApi';

export function AdminCreateMangaCustomDialog({ onClose=() => {} }) {
    // dialog
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen((cur) => !cur);
    const [loading, setLoading] = useState(false);
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
    // error
    const [error, setError] = useState('');

    // onCLose
    useEffect(() => {
        if (!open && onClose) onClose();
    }, [open]);

    useEffect(() => {
        refreshMangaProfile();
    }, []);

    const refreshMangaProfile = () => {
        callAPI(`/api/manga/autocomplete`)
            .then(result => {
                console.log(result);
                setMangas(result)
            })
            .catch(error => toast.error('Error al cargar el autocompletado de mangas'));
    }

    useEffect(() => {
        if (!manga) return;
        callAPI(`/api/manga/${manga.slug}`)
            .then(result => {
                setTitle(result.title);
                setShortDescription(result.shortDescription);
                setDescription(result.description);
            })
            .catch(error => toast.error('Error al cargar el perfil de manga'));
    }, [manga]);

    const handleSubmit = async (event) => {
        if (!manga) {
            setError('El perfil de manga es obligatorio');
            return toast.error('El perfil de manga es obligatorio');
        }
        if (!title) {
            setError('El titulo es obligatorio');
            return toast.error('El titulo es obligatorio');
        }
        const formData = new FormData();
        formData.append('mangaId', manga.id);
        formData.append('title', title);
        if (shortDescription) formData.append('shortDescription', shortDescription);
        if (description) formData.append('description', description);
        if (releasedDate) formData.append('releasedAt', releasedDate);
        if (nextChapterDate) formData.append('nextChapterAt', nextChapterDate);
        if (coverImageFile) formData.append('image', coverImageFile);
        setLoading(true);
        callAPI(`/api/manga-custom`, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Manga creado');
                setManga(null);
                setTitle('');
                setShortDescription('');
                setDescription('');
                setReleasedDate(null);
                setNextChapterDate(null);
                setCoverImageFile(null);
                setError('');
                setOpen(false);
            })
            .catch(error => {
                toast.error(error?.message);
                setError(error?.message);
            })
            .finally(() => setLoading(false));
    };

    return (
        <>
            <Button variant="outlined" className="flex items-center gap-3 h-full ml-2" onClick={handleOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Agregar Manga
            </Button>
            <Dialog
                size="md"
                open={open}
                handler={handleOpen}
            >
                <DialogHeader>
                    <Typography variant="h4" color="blue-gray">
                        Crear manga
                    </Typography>
                </DialogHeader>
                <DialogBody className="max-h-[80vh] overflow-y-auto flex flex-col gap-4">
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Perfil de manga
                    </Typography>
                    <div className="flex">
                        <div className="grow">
                            <Autocomplete
                                disablePortal
                                options={mangas}
                                isOptionEqualToValue={(option, value) => option.slug === value.slug}
                                getOptionLabel={(option) => option.title}
                                renderOption={(props, option) => (
                                    <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                        <img
                                            loading="lazy"
                                            width="20"
                                            srcSet={option.imageUrl || ""}
                                            src={option.imageUrl || ""}
                                            alt=""
                                        />
                                        {option.title}
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Elige un perfil de manga"
                                        inputProps={{
                                            ...params.inputProps,
                                            autoComplete: 'new-password',
                                        }}
                                    />
                                )}
                                value={manga}
                                onChange={(event, newValue) => setManga(newValue)}
                            />
                        </div>
                        <div className="flex-none">
                            <AdminCreateMangaProfileDialog onClose={() => refreshMangaProfile()} />
                        </div>
                    </div>
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Titulo
                    </Typography>
                    <Input
                        size="lg"
                        label="Titulo de la obra"
                        autoComplete='off'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Descripción corta (Opcional)
                    </Typography>
                    <Textarea
                        size="md"
                        label="Una descripción de menos de 100 caracteres..."
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Descripción (Opcional)
                    </Typography>
                    <Textarea
                        size="lg"
                        label="Argumento de la obra..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!manga}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Fecha de publicación (Opcional)
                    </Typography>
                    <DatePicker
                        value={releasedDate}
                        onChange={setReleasedDate}
                        disabled={!manga}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Fecha del próximo capitulo (Opcional)
                    </Typography>
                    <DatePicker
                        value={nextChapterDate}
                        onChange={setNextChapterDate}
                        disabled={!manga}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Portada del manga (Opcional)
                    </Typography>
                    <DropzoneArea
                        filesLimit={1}
                        dropzoneText='Arrastra y suelta la imagen de portada del manga'
                        onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                        disabled={!manga}
                    />
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button variant="outlined" className="flex items-center justify-center gap-3" onClick={handleSubmit} fullWidth>
                        { !loading && "Guardar manga" }
                        { loading && "Guardando manga..." }
                        { loading && <Spinner /> }
                    </Button>
                    {error && (
                        <Typography color="red" className="mt-2">
                            {error}
                        </Typography>
                    )}
                </DialogFooter>
                <ToastContainer />
            </Dialog>
        </>
    );
}