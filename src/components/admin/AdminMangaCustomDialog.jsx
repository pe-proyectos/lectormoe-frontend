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
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { ImageDropzone } from '../ImageDropzone';
import { AdminMangaProfileDialog } from './AdminMangaProfileDialog';
import { callAPI } from '../../util/callApi';

export function AdminMangaCustomDialog({ open, setOpen, mangaCustom, setMangaCustom }) {
    // dialog
    const [loading, setLoading] = useState(true);
    const [isCreateMangaProfileDialogOpen, setIsCreateMangaProfileDialogOpen] = useState(false);
    // lists
    const [mangas, setMangas] = useState([]);
    // form
    const [mangaProfile, setMangaProfile] = useState(null);
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [releasedDate, setReleasedDate] = useState(null);
    const [nextChapterDate, setNextChapterDate] = useState(null);
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [bannerImageFile, setBannerImageFile] = useState(null);

    useEffect(() => {
        if (!mangaCustom) return;
        setMangaProfile(mangas.find(manga => manga.id === mangaCustom.mangaId));
        setTitle(mangaCustom?.title || '');
        setShortDescription(mangaCustom?.shortDescription || '');
        setDescription(mangaCustom?.description || '');
        setReleasedDate(mangaCustom?.releasedAt || null);
        setNextChapterDate(mangaCustom?.nextChapterAt || null);
        setCoverImageFile(mangaCustom?.imageUrl || null);
        setBannerImageFile(mangaCustom?.bannerUrl || null);
    }, [mangaCustom]);

    useEffect(() => {
        refreshMangaProfile();
    }, []);

    useEffect(() => {
        if (!isCreateMangaProfileDialogOpen) refreshMangaProfile();
    }, [isCreateMangaProfileDialogOpen]);

    const refreshMangaProfile = () => {
        setLoading(true);
        callAPI(`/api/manga/autocomplete`)
            .then(result => setMangas(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        if (!mangaProfile) return;
        if(mangaCustom) return;
        setLoading(true);
        callAPI(`/api/manga/${mangaProfile.slug}`)
            .then(result => {
                if(mangaCustom) return;
                setTitle(result.title);
                setShortDescription(result.shortDescription);
                setDescription(result.description);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, [mangaProfile]);

    const handleSubmit = async (event) => {
        if (!mangaProfile) {
            return toast.error('El perfil de manga es obligatorio');
        }
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        const formData = new FormData();
        if (!mangaCustom) formData.append('mangaId', mangaProfile.id);
        if (mangaCustom) formData.append('mangaCustomId', mangaCustom.id);
        if (title) formData.append('title', title);
        if (shortDescription) formData.append('shortDescription', shortDescription);
        if (description) formData.append('description', description);
        if (releasedDate) formData.append('releasedAt', releasedDate);
        if (nextChapterDate) formData.append('nextChapterAt', nextChapterDate);
        formData.append('image', coverImageFile);
        formData.append('banner', bannerImageFile);
        setLoading(true);
        callAPI(mangaCustom ? `/api/manga-custom/${mangaCustom.slug}` : `/api/manga-custom`, {
            method: mangaCustom ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Manga creado');
                setMangaProfile(null);
                setMangaCustom(null);
                setTitle('');
                setShortDescription('');
                setDescription('');
                setReleasedDate(null);
                setNextChapterDate(null);
                setCoverImageFile(null);
                setBannerImageFile(null);
                setOpen(false);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <Dialog
            size="md"
            open={open}
            handler={() => setOpen(previousState => !previousState)}
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {mangaCustom?.title || "Crear manga"}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                {!mangaCustom &&
                    <>
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
                                    value={mangaProfile}
                                    onChange={(event, newValue) => setMangaProfile(newValue)}
                                />
                            </div>
                            <div className="flex-none">
                                <Button
                                    variant="text"
                                    className="flex items-center gap-3 h-full ml-2"
                                    onClick={() => setIsCreateMangaProfileDialogOpen(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </Button>
                                <AdminMangaProfileDialog
                                    open={isCreateMangaProfileDialogOpen}
                                    setOpen={setIsCreateMangaProfileDialogOpen}
                                />
                            </div>
                        </div>
                    </>
                }
                <Typography className="-mb-2" variant="h6" color="gray">
                    Titulo
                </Typography>
                <Input
                    size="lg"
                    label="Titulo de la obra"
                    autoComplete='off'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Descripción corta ({shortDescription.length.toString().padStart(3, "0")}/300 caracteres) (Opcional)
                </Typography>
                <Textarea
                    size="md"
                    label="Una descripción de menos de 300 caracteres..."
                    maxLength={300}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Sinopsis (Opcional)
                </Typography>
                <Textarea
                    size="lg"
                    label="Sinopsis de la obra..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Fecha de publicación (Opcional)
                </Typography>
                <DatePicker
                    value={releasedDate}
                    onChange={setReleasedDate}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Fecha del próximo capítulo (Opcional)
                </Typography>
                <DatePicker
                    value={nextChapterDate}
                    onChange={setNextChapterDate}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Portada del manga (Opcional)
                </Typography>
                <ImageDropzone
                    value={coverImageFile}
                    label={'Arrastra y suelta la imagen de portada del manga'}
                    alt={'Imagen de portada'}
                    onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                    onDelete={(file) => setCoverImageFile(null)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Banner del manga (Opcional)
                </Typography>
                <ImageDropzone
                    value={bannerImageFile}
                    label={'Arrastra y suelta la imagen de banner del manga'}
                    alt={'Banner de manga'}
                    onChange={(files) => files[0] ? setBannerImageFile(files[0]) : null}
                    onDelete={(file) => setBannerImageFile(null)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    Guardar manga
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}