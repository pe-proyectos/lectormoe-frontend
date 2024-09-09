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
import { getTranslator } from "../../util/translate";

export function AdminMangaProfileDialog({ organization, mangaProfile, open, setOpen }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(true);
    const [isCreateAuthorDialogOpen, setIsCreateAuthorDialogOpen] = useState(false);
    // lists
    const [bookTypes, setBookTypes] = useState([]);
    const [demographies, setDemographies] = useState([]);
    const [authors, setAuthors] = useState([]);
    // form
    const [demography, setDemography] = useState(null);
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [title, setTitle] = useState('');
    const [bookType, setBookType] = useState(null);
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        refreshAuthors();
        setLoading(true);
        callAPI(`/api/demography`)
            .then(result => setDemographies(result))
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        callAPI(`/api/book_type`)
            .then(result => setBookTypes(result))
            .catch(error => toast.error(error?.message));
    }, []);

    useEffect(() => {
        if (!isCreateAuthorDialogOpen) refreshAuthors();
    }, [isCreateAuthorDialogOpen]);

    const refreshAuthors = () => {
        return callAPI(`/api/author`)
            .then(result => setAuthors(result))
            .catch(error => toast.error(error?.message));
    };

    const handleSubmit = async () => {
        if (!title) {
            return toast.error(_('title_mandatory'));
        }
        if (selectedAuthors.length < 1 || selectedAuthors.length > 4) {
            return toast.error(_('author_mandatory_min_1_max_4'));
        }
        if (!demography) {
            return toast.error(_('demography_mandatory'));
        }
        if (!bookType) {
            return toast.error(_('book_type_mandatory'));
        }
        setLoading(true);
        callAPI('/api/manga', {
            method: 'POST',
            body: JSON.stringify({
                title,
                authorIds: selectedAuthors.map(author => author.id),
                bookTypeId: bookType.id,
                demographyId: demography.id,
                shortDescription,
                description,
            })
        })
            .then(response => {
                toast.success(_('manga_profile_created'));
                setTitle('');
                setDemography(null);
                setBookType(null);
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
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {_("create_manga_profile")}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <Typography className="-mb-2" variant="h6" color="gray">
                    {selectedAuthors.length > 1 ? _("authors") : _("author")} ({selectedAuthors.length}/4)
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
                                    label={selectedAuthors.length > 1 ? _("authors") : _("author")}
                                    placeholder={selectedAuthors.length > 1 ? _("authors") + '...' : _("author") + '...'}
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
                        <AdminCreateAuthorDialog organization={organization} open={isCreateAuthorDialogOpen} setOpen={setIsCreateAuthorDialogOpen} />
                    </div>
                </div>
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("demography")}
                </Typography>
                <Autocomplete
                    disablePortal
                    options={demographies}
                    getOptionLabel={(option) => `${option.name} (${option.description})`}
                    renderInput={(params) => <TextField {...params} label={_("demography")} />}
                    value={demography}
                    onChange={(event, newValue) => setDemography(newValue)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("book_type")}
                </Typography>
                <Autocomplete
                    disablePortal
                    options={bookTypes}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => <TextField {...params} label={_("book_type")} />}
                    value={bookType}
                    onChange={(event, newValue) => setBookType(newValue)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("title")}
                </Typography>
                <Input
                    size="lg"
                    label={_("manga_title")}
                    autoComplete='off'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("short_description")} ({shortDescription.length.toString().padStart(3, "0")}/300 {_("characters")}) ({_("optional")})
                </Typography>
                <Textarea
                    size="md"
                    label={_("short_description_less_than_300")}
                    maxLength={300}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("synopsis")} ({_("optional")})
                </Typography>
                <Textarea
                    size="lg"
                    label={_("manga_synopsis")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_("save_manga_profile")}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
