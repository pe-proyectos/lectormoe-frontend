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
    Select,
    Option,
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { DropzoneArea } from 'material-ui-dropzone';
import { DialogDatePicker } from '../DialogDatePicker';
import { ImageDropzone } from '../ImageDropzone';
import { AdminMangaProfileDialog } from './AdminMangaProfileDialog';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminMangaCustomDialog({ organization, open, setOpen, mangaCustom, setMangaCustom }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(true);
    const [isCreateMangaProfileDialogOpen, setIsCreateMangaProfileDialogOpen] = useState(false);
    // lists
    const [mangas, setMangas] = useState([]);
    const [genres, setGenres] = useState([]);
    // form
    const [mangaProfile, setMangaProfile] = useState(null);
    const [status, setStatus] = useState('ongoing');
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [releasedDate, setReleasedDate] = useState(null);
    const [nextChapterDate, setNextChapterDate] = useState(null);
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [bannerImageFile, setBannerImageFile] = useState(null);

    useEffect(() => {
        if (!mangaCustom) return;
        setMangaProfile(mangas.find(manga => manga.id === mangaCustom.mangaId));
        setStatus(mangaCustom?.status || 'ongoing');
        setTitle(mangaCustom?.title || '');
        setShortDescription(mangaCustom?.shortDescription || '');
        setDescription(mangaCustom?.description || '');
        setReleasedDate(mangaCustom?.releasedAt || null);
        setNextChapterDate(mangaCustom?.nextChapterAt || null);
        setCoverImageFile(mangaCustom?.imageUrl || null);
        setBannerImageFile(mangaCustom?.bannerUrl || null);
    }, [mangaCustom]);

    useEffect(() => {
        if (!open) {
            setMangaProfile(null);
            setMangaCustom(null);
            setStatus('ongoing');
            setTitle('');
            setShortDescription('');
            setDescription('');
            setReleasedDate(null);
            setNextChapterDate(null);
            setCoverImageFile(null);
            setBannerImageFile(null);
        }
    }, [open]);

    useEffect(() => {
        refreshMangaProfile();
        refreshGenres();
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

    const refreshGenres = () => {
        return callAPI(`/api/genre`)
            .then(result => setGenres(result))
            .catch(error => toast.error(error?.message));
    };

    useEffect(() => {
        if (!mangaProfile) return;
        if(mangaCustom) return;
        setLoading(true);
        callAPI(`/api/manga/${mangaProfile.slug}`)
            .then(result => {
                if(mangaCustom) return;
                setStatus(result.status);
                setTitle(result.title);
                setShortDescription(result.shortDescription);
                setDescription(result.description);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    }, [mangaProfile]);

    const handleSubmit = async (event) => {
        if (!mangaProfile) {
            return toast.error(_('manga_profile_mandatory'));
        }
        if (!title) {
            return toast.error(_('title_mandatory'));
        }
        const formData = new FormData();
        if (!mangaCustom) formData.append('mangaId', mangaProfile.id);
        if (mangaCustom) formData.append('mangaCustomId', mangaCustom.id);
        if (status) formData.append('status', status);
        if (title) formData.append('title', title);
        if (shortDescription) formData.append('shortDescription', shortDescription);
        if (description) formData.append('description', description);
        if (releasedDate) formData.append('releasedAt', releasedDate);
        if (nextChapterDate) formData.append('nextChapterAt', nextChapterDate);
        if (selectedGenres.length > 0) formData.append('genreIds', selectedGenres.map(genre => genre.id).join(','));
        formData.append('image', coverImageFile);
        formData.append('banner', bannerImageFile);
        setLoading(true);
        callAPI(mangaCustom ? `/api/manga-custom/${mangaCustom.slug}` : `/api/manga-custom`, {
            method: mangaCustom ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success(_('manga_created'));
                setMangaProfile(null);
                setMangaCustom(null);
                setStatus('ongoing');
                setTitle('');
                setShortDescription('');
                setDescription('');
                setReleasedDate(null);
                setNextChapterDate(null);
                setCoverImageFile(null);
                setBannerImageFile(null);
                setSelectedGenres([]);
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
                    {mangaCustom?.title || _("create_manga")}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                {!mangaCustom &&
                    <>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("manga_profile")}
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
                                                decoding="async"
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
                                            label={_("choose_manga_profile")}
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
                                    organization={organization}
                                    open={isCreateMangaProfileDialogOpen}
                                    setOpen={setIsCreateMangaProfileDialogOpen}
                                />
                            </div>
                        </div>
                    </>
                }
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("title")}
                </Typography>
                <Input
                    size="lg"
                    label={_("manga_title")}
                    autoComplete='off'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!mangaProfile}
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
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("synopsis")} ({_("optional")})
                </Typography>
                <Textarea
                    size="lg"
                    label={_("manga_synopsis")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("genres")}
                </Typography>
                <div className="flex">
                    <div className="grow">
                        <Autocomplete
                            multiple
                            disablePortal
                            options={genres}
                            isOptionEqualToValue={(option, value) => option.slug === value.slug}
                            getOptionLabel={(option) => option.name}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label={_("genres")}
                                    placeholder={_("genres") + '...'}
                                />
                            )}
                            value={selectedGenres}
                            getOptionDisabled={(options) => (selectedGenres.length >= 4 ? true : false)}
                            onChange={(event, newValue) => setSelectedGenres(newValue)}
                        />
                    </div>
                </div>
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("manga_status")}
                </Typography>
                <div>
                    <Select
                        label={_("status")}
                        value={status}
                        onChange={(val) => setStatus(val)}
                    >
                        <Option value="ongoing" selected={status === 'ongoing'}>{_("ongoing")}</Option>
                        <Option value="hiatus" selected={status === 'hiatus'}>{_("hiatus")}</Option>
                        <Option value="finished" selected={status === 'finished'}>{_("finished")}</Option>
                    </Select>
                </div>
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("release_date")} ({_("optional")})
                </Typography>
                <DialogDatePicker
                    organization={organization}
                    value={releasedDate}
                    onChange={setReleasedDate}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("next_chapter_date")} ({_("optional")})
                </Typography>
                <DialogDatePicker
                    organization={organization}
                    value={nextChapterDate}
                    onChange={setNextChapterDate}
                    disabled={!mangaProfile}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("manga_cover")} ({_("optional")})
                </Typography>
                <ImageDropzone
                    value={coverImageFile}
                    label={_("drop_manga_cover")}
                    alt={_("cover_image")}
                    onChange={(files) => files[0] ? setCoverImageFile(files[0]) : null}
                    onDelete={(file) => setCoverImageFile(null)}
                />
                <Typography className="-mb-2" variant="h6" color="gray">
                    {_("manga_banner")} ({_("optional")})
                </Typography>
                <ImageDropzone
                    value={bannerImageFile}
                    label={_("drop_manga_banner")}
                    alt={_("manga_banner")}
                    onChange={(files) => files[0] ? setBannerImageFile(files[0]) : null}
                    onDelete={(file) => setBannerImageFile(null)}
                />
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_("save_manga")}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
