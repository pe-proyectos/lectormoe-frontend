import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Spinner,
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
import { callAPI } from '../../util/callApi';
import { AdminCreateAuthorDialog } from './AdminCreateAuthorDialog';
import { set } from "date-fns";

export function AdminMangaProfileDialog({ mangaProfile, open, setOpen }) {
    // dialog
    const [loading, setLoading] = useState(false);
    const [isCreateAuthorDialogOpen, setIsCreateAuthorDialogOpen] = useState(false);
    // lists
    const [demographies, setDemographies] = useState([]);
    const [authors, setAuthors] = useState([]);
    // form
    const [demography, setDemography] = useState(null);
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        refreshAutors();
        callAPI(`/api/demography`)
            .then(result => setDemographies(result))
            .catch(error => toast.error(error?.message));
    }, []);

    useEffect(() => {
        if (!isCreateAuthorDialogOpen) refreshAutors();
    }, [isCreateAuthorDialogOpen]);

    const refreshAutors = () => {
        callAPI(`/api/author`)
            .then(result => setAuthors(result))
            .catch(error => toast.error(error?.message));
    };

    const handleSubmit = async () => {
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        if (selectedAuthors.length < 1 || selectedAuthors.length > 4) {
            return toast.error('El autor es obligatorio (minimo 1, maximo 4)');
        }
        if (!demography) {
            return toast.error('La demografia es obligatoria');
        }
        setLoading(true);
        callAPI('/api/manga', {
            method: 'POST',
            body: JSON.stringify({
                title,
                authorIds: selectedAuthors.map(author => author.id),
                demographyId: demography.id,
                shortDescription,
                description,
            })
        })
            .then(response => {
                toast.success('Perfil de manga creado');
                setTitle('');
                setDemography(null);
                setSelectedAuthors([]);
                setShortDescription('');
                setDescription('');
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
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    Crear perfil de manga
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[80vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {selectedAuthors.length > 1 ? 'Autores' : 'Autor'} ({selectedAuthors.length}/4)
                </Typography>
                <div className="flex">
                    <div className="grow">
                        <Autocomplete
                            multiple
                            disablePortal
                            options={authors}
                            isOptionEqualToValue={(option, value) => option.slug === value.slug}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label={selectedAuthors.length > 1 ? 'Autores' : 'Autor'}
                                    placeholder={selectedAuthors.length > 1 ? 'Autores...' : 'Autor...'}
                                />
                            )}
                            value={selectedAuthors}
                            getOptionDisabled={(options) => (selectedAuthors.length >= 4 ? true : false)}
                            onChange={(event, newValue) => setSelectedAuthors(newValue)}
                        />
                    </div>
                    <div className="flex-none">
                        <Button
                            variant="text"
                            className="flex items-center gap-3 h-full ml-2"
                            onClick={() => setIsCreateAuthorDialogOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </Button>
                        <AdminCreateAuthorDialog open={isCreateAuthorDialogOpen} setOpen={setIsCreateAuthorDialogOpen} />
                    </div>
                </div>
                <Typography className="-mb-2" variant="h6" color="gray">
                    Demografia
                </Typography>
                <Autocomplete
                    disablePortal
                    options={demographies}
                    getOptionLabel={(option) => `${option.name} (${option.description})`}
                    renderInput={(params) => <TextField {...params} label="Demografia" />}
                    value={demography}
                    onChange={(event, newValue) => setDemography(newValue)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Titulo
                </Typography>
                <Input
                    size="lg"
                    label="Titulo de la obra"
                    autoComplete='off'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Descripción corta (Opcional)
                </Typography>
                <Textarea
                    size="md"
                    label="Una descripción de menos de 100 caracteres..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    Descripción (Opcional)
                </Typography>
                <Textarea
                    size="lg"
                    label="Argumento de la obra..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    Guardar perfil de manga
                </Button>
            </DialogFooter>
            <ToastContainer />
        </Dialog>
    );
}