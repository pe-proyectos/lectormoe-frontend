import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    Dialog,
    Spinner,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Card,
    CardHeader,
    CardBody,
    Switch,
    Select,
    Option,
    CardFooter,
    Typography,
    IconButton,
    Input,
    Checkbox,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DatePicker } from '../DatePicker';
import { ImageDropzone } from '../ImageDropzone';
import { AdminMangaProfileDialog } from './AdminMangaProfileDialog';
import { callAPI } from '../../util/callApi';

export function AdminChapterDialog({ open, setOpen, mangaCustom, chapter }) {
    // dialog
    const [loading, setLoading] = useState(true);
    // form
    const [title, setTitle] = useState(() => {
        if (chapter) return chapter.title;
        return `Capítulo ${mangaCustom?.chapters?.length + 1}`;
    });
    const [number, setNumber] = useState(() => {
        if (chapter) return chapter.number;
        return mangaCustom?.chapters?.length + 1;
    });
    const [releasedAt, setReleasedAt] = useState(() => {
        if (chapter) return new Date(chapter.releasedAt);
        return new Date();
    });
    const [chapterImageFile, setChapterImageFile] = useState(() => {
        if (chapter) return chapter.imageUrl;
        return null;
    });
    const [isSubscription, setIsSubscription] = useState(() => {
        if (chapter) return chapter.isSubscription;
        return false;
    });
    const [pages, setPages] = useState([]);
    const [dragId, setDragId] = useState();

    const handleDrag = (ev) => {
        setDragId(ev.currentTarget.id);
    };

    const handleDrop = (ev) => {
        const dragPageIndex = parseInt(dragId.split('-').pop());
        const dropPageIndex = parseInt(ev.currentTarget.id.split('-').pop());
        const newPagesOrder = [...pages];
        const [draggedPage] = newPagesOrder.splice(dragPageIndex, 1);
        newPagesOrder.splice(dropPageIndex, 0, draggedPage);
        setPages(newPagesOrder);
    };

    const removePage = (index) => {
        const newPages = pages.filter((page, i) => i !== index);
        setPages(newPages);
    };

    const minusDays = (date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() - days);
        return newDate;
    };

    const formatDateToInput = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = (date.getDate()).toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    useEffect(() => {
        if (chapter) {
            setTitle(chapter.title);
            setNumber(chapter.number);
            setReleasedAt(new Date(chapter.releasedAt));
            setIsSubscription(chapter.isSubscription);
            setChapterImageFile(chapter.imageUrl);
            setLoading(true);
            callAPI(`/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}/pages`)
                .then(chapterPages => setPages(chapterPages))
                .catch(error => toast.error(error?.message))
                .finally(() => setLoading(false));
        } else {
            const lastChapterNumber = mangaCustom?.chapters?.reduce((acc, chapter) => {
                return chapter.number > acc ? chapter.number : acc;
            }, 0);
            setNumber((lastChapterNumber + 1));
            setTitle(`Capítulo ${lastChapterNumber + 1}`);
            setReleasedAt(new Date());
            setIsSubscription(false);
            setChapterImageFile(null);
            setPages([]);
            setLoading(false);
        }
    }, [chapter, mangaCustom]);

    const handleSubmit = async () => {
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        if (!number) {
            return toast.error('El número es obligatorio');
        }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('number', number);
        formData.append('releasedAt', releasedAt);
        formData.append('isSubscription', isSubscription);
        if (chapterImageFile || chapter) formData.append('image', chapterImageFile);
        pages.forEach((page) => {
            formData.append('pages', page instanceof File ? page : page?.imageUrl);
        });
        setLoading(true);
        callAPI(
            chapter
                ? `/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}`
                : `/api/manga-custom/${mangaCustom.slug}/chapter`,
            {
                method: chapter ? 'PATCH' : 'POST',
                body: formData,
            })
            .then(response => {
                setTitle('');
                setNumber(1);
                setChapterImageFile(null);
                setPages([]);
                toast.success('Capítulo creado');
                setOpen(false);
            })
            .catch(error => {
                toast.error(error?.message);
            })
            .finally(() => setLoading(false));
    };

    return (
        <Dialog
            size="xl"
            open={open}
            handler={() => setOpen(previousState => !previousState)}
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {
                        chapter
                            ? `Editar capítulo ${chapter.number} de ${mangaCustom.title}`
                            : `Subir capítulo de ${mangaCustom.title}`
                    }
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-scroll">
                <div className="flex gap-2">
                    <div className="max-w-[30%] w-[30%] flex flex-col gap-4">
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            Detalles
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            Número
                        </Typography>
                        <Input
                            label="Número del capítulo"
                            autoComplete='off'
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            type='number'
                        />
                        <Typography className="-mb-2" variant="h6" color="gray">
                            Título
                        </Typography>
                        <Input
                            label="Título del capítulo"
                            autoComplete='off'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <Typography className="-mb-2" variant="h6" color="gray">
                            Miniatura del capítulo (Opcional)
                        </Typography>
                        <ImageDropzone
                            value={chapterImageFile}
                            label={'Arrastra y suelta una imagen para el capítulo'}
                            alt={'Miniatura del capítulo'}
                            onChange={(files) => files[0] ? setChapterImageFile(files[0]) : null}
                            onDelete={(file) => setChapterImageFile(null)}
                        />
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            Opciones
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            Fecha de salida
                        </Typography>
                        <input
                            type="datetime-local"
                            //   The specified value "2024-04-05T01:54:00.000Z" does not conform to the required format.  The format is "yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS".
                            value={formatDateToInput(releasedAt)}
                            onChange={(e) => setReleasedAt(new Date(e.target.value))}
                        />
                        <Typography variant="small" color="gray" className="font-normal">
                            Ningun usuario podrá leer este capítulo hasta la fecha de salida
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            Suscriptores
                        </Typography>
                        <Switch
                            checked={isSubscription}
                            onChange={(e) => setIsSubscription(e.target.checked)}
                            label={
                                <div>
                                    <Typography color="blue-gray" className="font-medium">
                                        Solo para suscriptores
                                    </Typography>
                                </div>
                            }
                        />
                        <Typography variant="small" color="gray" className="font-normal">
                            Si se activa los suscriptores podrán leer este capítulo antes de la fecha de salida
                        </Typography>
                    </div>
                    <div className="max-w-[70%] w-[70%] flex flex-col gap-4">
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            Páginas
                        </Typography>
                        <DropzoneArea
                            acceptedFiles={['image/*']}
                            dropzoneClass="!max-h-24 !min-h-24 !p-2"
                            dropzoneText={"Arrastra y suelta imágenes para subir"}
                            dropzoneParagraphClass="!text-base"
                            Icon={''}
                            cancelButtonText={"Cancelar"}
                            submitButtonText={"Subir"}
                            maxFileSize={25 * 1024 * 1024}
                            showAlerts={false}
                            onDrop={(files) => setPages([...pages, ...files])}
                            showPreviews={false}
                            showPreviewsInDropzone={false}
                            filesLimit={100}
                        />
                        <div className="flex flex-wrap gap-2 justify-start mx-4 h-[36rem] max-h-[36rem] p-2 overflow-y-auto bg-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                            {loading && <Spinner className='m-4 w-full' />}
                            {pages.length === 0 && !loading && (
                                <Typography variant="paragraph" color="blue-gray" className="w-full m-auto text-center">
                                    Este capítulo no tiene páginas, arrastra y suelta imágenes en el recuadro de arriba para subir
                                </Typography>
                            )}
                            {pages.map((page, index) => (
                                <Card
                                    key={index}
                                    draggable={true}
                                    id={`preview-page-${index}`}
                                    onDragStart={handleDrag}
                                    onDrop={handleDrop}
                                    className="w-40 min-w-40 max-w-40 max-h-72"
                                >
                                    <img
                                        src={
                                            page instanceof File
                                                ? URL.createObjectURL(page)
                                                : page?.imageUrl
                                        }
                                        alt={`Página ${index + 1}`}
                                        decoding="async"
                                        loading="lazy"
                                        className="w-full max-w-full h-56 max-h-56 object-cover rounded-md bg-gray-900"
                                    />
                                    <CardFooter className="p-0">
                                        <div className="flex justify-between items-center gap-2 p-2">
                                            <IconButton
                                                variant="text"
                                                size="sm"
                                                className="rounded-full"
                                            >
                                                <svg fill="#000" version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                                                    width="1.8rem" height="1.8rem" viewBox="0 0 32 32" xmlSpace="preserve">
                                                    <style type="text/css">
                                                        .st0{"{fill:none;}"}
                                                    </style>
                                                    <rect x="10" y="6" width="4" height="4" />
                                                    <rect x="18" y="6" width="4" height="4" />
                                                    <rect x="10" y="14" width="4" height="4" />
                                                    <rect x="18" y="14" width="4" height="4" />
                                                    <rect x="10" y="22" width="4" height="4" />
                                                    <rect x="18" y="22" width="4" height="4" />
                                                    <rect id="_Transparent_Rectangle_" className="st0" width="32" height="32" />
                                                </svg>
                                            </IconButton>
                                            <Typography variant="small" color="blue-gray">
                                                Página {index + 1}
                                            </Typography>
                                            <IconButton
                                                variant="text"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => removePage(index)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </IconButton>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter className="space-x-2">
                {/* boton cancelar */}
                <Button
                    variant="filled"
                    onClick={() => setOpen(false)}
                >
                    Cancelar
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleSubmit}
                    loading={loading}
                >
                    Guardar capítulo
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
