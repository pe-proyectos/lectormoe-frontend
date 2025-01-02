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
import { ImageDropzone } from '../ImageDropzone';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminGenreDialog({ organization, open, setOpen, genre, setGenre }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState(genre ? genre.name : '');
    const [description, setDescription] = useState(genre ? genre.description : '');

    useEffect(() => {
        if (!genre) return;
        setName(genre.name || '');
        setDescription(genre.description || '');
    }, [genre]);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error(_('name_is_required'));
        }
        setLoading(true);
        callAPI(genre ? `/api/genre/${genre.slug}` : '/api/genre', {
            method: genre ? 'PATCH' : 'POST',
            body: JSON.stringify({ name, description }),
        })
            .then(response => {
                toast.success(_('genre_saved'));
                setName('');
                setDescription('');
                setGenre(null);
                setOpen(false);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <Dialog
            size="sm"
            open={open}
            handler={() => setOpen(previousState => !previousState)}
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {_(genre ? 'edit_genre' : 'create_genre')}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('name')}
                </Typography>
                <Input
                    size="lg"
                    label={_('genre_name')}
                    autoComplete='off'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('description_optional')}
                </Typography>
                <Textarea
                    size="lg"
                    label={_('genre_description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_(genre ? 'save_genre' : 'create_genre')}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
