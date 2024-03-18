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

export function AdminCreateAuthorDialog({ onClose }) {
    // dialog
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen((cur) => !cur);
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);
    // error
    const [error, setError] = useState('');

    // onCLose
    useEffect(() => {
        if (!open && onClose) onClose();
    }, [open]);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error('El nombre es obligatorio');
        }
        const formData = new FormData();
        formData.append('name', name);
        if (shortDescription) formData.append('shortDescription', shortDescription);
        if (description) formData.append('description', description);
        if (coverImageFile) formData.append('image', coverImageFile);
        setLoading(true);
        callAPI('/api/author', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Autor creado');
                setName('');
                setDescription('');
                setShortDescription('');
                setCoverImageFile(null);
                setError('');
                setOpen(false);
            })
            .catch(error => {
                toast.error(error?.message || 'Error al crear el autor');
                setError(error?.message || 'Error al crear el autor');
            })
            .finally(() => setLoading(false));
    };

    return (
        <>
            <Button variant="text" className="flex items-center gap-3 h-full ml-2" onClick={handleOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </Button>
            <Dialog
                size="sm"
                open={open}
                handler={handleOpen}
            >
                <DialogHeader>
                    <Typography variant="h4" color="blue-gray">
                        Crear autor
                    </Typography>
                </DialogHeader>
                <DialogBody className="max-h-[80vh] overflow-y-auto flex flex-col gap-4">
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Nombre
                    </Typography>
                    <Input
                        size="lg"
                        label="Nombre del autor"
                        autoComplete='off'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Rol del autor (Opcional)
                    </Typography>
                    <Input
                        size="md"
                        label="Ejemplo: Mangaka, Escritor, Ilustrador, etc."
                        autoComplete='off'
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Descripción (Opcional)
                    </Typography>
                    <Textarea
                        size="lg"
                        label="Descripción del autor"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        Imagen del autor (Opcional)
                    </Typography>
                    <DropzoneArea
                        filesLimit={1}
                        dropzoneText='Arrastra y suelta la imagen del autor'
                        onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                    />
                </DialogBody>
                <DialogFooter className="space-x-2">
                    <Button variant="outlined" onClick={handleSubmit} fullWidth>
                        { !loading && "Guardar autor" }
                        { loading && "Guardando autor..." }
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
