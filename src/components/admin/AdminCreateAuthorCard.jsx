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

export function AdminCreateAuthorCard() {
    // form
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!name) {
            return toast.error('El nombre es obligatorio');
        }
        if (!coverImageFile) {
            return toast.error('La imagen del autor es obligatoria');
        }
        const formData = new FormData();
        formData.append('name', name);
        if (shortDescription) formData.append('shortDescription', shortDescription);
        if (description) formData.append('description', description);
        formData.append('image', coverImageFile);
        callAPI('/api/author', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                toast.success('Autor creado');
                window.location.href = "/admin/authors";
            })
            .catch(error => {
                toast.error(error?.message || 'Error al crear el autor');
            });
    };

    return (
        <Card color="transparent" shadow={false}>
            <Typography variant="h4" color="blue-gray">
                Crear autor
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
                Este autor será transversal para todas las organizaciones<br />
                Una vez creado, no podrá ser actualizado ni eliminado.<br />
            </Typography>
            <form onSubmit={handleSubmit} className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                <div className="mb-1 flex flex-col gap-6">
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Nombre
                    </Typography>
                    <Input
                        size="lg"
                        placeholder="Nombre del autor"
                        className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
                        autoComplete='off'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Rol del autor (Opcional)
                    </Typography>
                    <Textarea
                        size="md"
                        label="Ejemplo: Mangaka, Escritor, Ilustrador, etc."
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Descripción (Opcional)
                    </Typography>
                    <Textarea
                        size="lg"
                        label="Descripción del autor"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Typography variant="h6" color="blue-gray" className="-mb-3">
                        Imagen del autor
                    </Typography>
                    <DropzoneArea
                        filesLimit={1}
                        dropzoneText='Arrastra y suelta la imagen del autor'
                        onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                    />
                </div>
                <Button type="submit" className="mt-6" fullWidth>
                    Guardar
                </Button>
            </form>
        </Card>
    );
}
