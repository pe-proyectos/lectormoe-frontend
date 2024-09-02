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

export function AdminCreateAuthorDialog({ organization, open, setOpen }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(false);
    // form
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error(_('name_is_required'));
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
                toast.success(_('author_created'));
                setName('');
                setDescription('');
                setShortDescription('');
                setCoverImageFile(null);
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
                    {_('create_author')}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('name')}
                </Typography>
                <Input
                    size="lg"
                    label={_('author_name')}
                    autoComplete='off'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('author_role_optional')}
                </Typography>
                <Input
                    size="md"
                    label={_('author_role_example')}
                    autoComplete='off'
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('description_optional')}
                </Typography>
                <Textarea
                    size="lg"
                    label={_('author_description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_('author_image_optional')}
                </Typography>
                <ImageDropzone
                    value={coverImageFile}
                    label={_('drag_and_drop_author_image')}
                    alt={_('author_image')}
                    onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                    onDelete={(file) => setCoverImageFile(null)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_('save_author')}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
