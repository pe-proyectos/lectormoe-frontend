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
import { callAPI } from '../../util/callApi';

export function AdminCreateMangaProfileCard() {
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
        callAPI(`/api/demography`)
            .then(result => setDemographies(result))
            .catch(error => toast.error('Error al cargar las demografias'));
        callAPI(`/api/author`)
            .then(result => setAuthors(result))
            .catch(error => toast.error('Error al cargar los autores'));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!title) {
            return toast.error('El titulo es obligatorio');
        }
        if (selectedAuthors.length < 1) {
            return toast.error('El autor es obligatorio (minimo 1)');
        }
        if (!demography) {
            return toast.error('La demografia es obligatoria');
        }
        if (!shortDescription) {
            return toast.error('La descripción corta es obligatoria');
        }
        if (!description) {
            return toast.error('La descripción es obligatoria');
        }
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
                window.location.href = "/admin/mangas/create";
            })
            .catch(error => {
                toast.error(error?.message);
            });
    };

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Crear perfil de manga
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
                Este perfil es trasversal a todos los mangas que se creen en la plataforma.<br />
                Una vez creado no podrá ser editado o eliminado,<br />
                Podrá ser usado por todas las organizaciones.<br />
            </Typography>
            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-1 flex flex-col gap-6">
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Autor
                        (<a href="/admin/authors/create" className="hover:text-blue-500">Crear autor</a>)
                    </Typography>
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
                                label="Autor(es)"
                                placeholder="Autor(es)"
                            />
                        )}
                        value={selectedAuthors}
                        getOptionDisabled={(options) => (selectedAuthors.length >= 4 ? true : false)}
                        onChange={(event, newValue) => setSelectedAuthors(newValue)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Demografia
                    </Typography>
                    <Autocomplete
                        disablePortal
                        options={demographies}
                        getOptionLabel={(option) => option.name}
                        renderInput={(params) => <TextField {...params} label="Demografia" />}
                        value={demography}
                        onChange={(event, newValue) => setDemography(newValue)}
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
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Descripción corta
                    </Typography>
                    <Textarea
                        size="md"
                        label="Una descripción de menos de 100 caracteres..."
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Descripción
                    </Typography>
                    <Textarea
                        size="lg"
                        label="Argumento de la obra..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <Button type="submit" className="mt-6" fullWidth>
                    Guardar
                </Button>
            </form>
        </Card>
    );
}
