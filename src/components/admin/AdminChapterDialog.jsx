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
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminChapterDialog({ organization, open, setOpen, mangaCustom, chapter }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(true);
    // form
    const [title, setTitle] = useState(() => {
        if (chapter) return chapter.title;
        return `${_("chapter")} ${mangaCustom?.chapters?.length + 1}`;
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
            setTitle(`${_("chapter")} ${lastChapterNumber + 1}`);
            setReleasedAt(new Date());
            setIsSubscription(false);
            setChapterImageFile(null);
            setPages([]);
            setLoading(false);
        }
    }, [chapter, mangaCustom]);

    const handleSubmit = async () => {
        if (!title) {
            return toast.error(_("mandatory_title"));
        }
        if (!number) {
            return toast.error(_("mandatory_number"));
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
                toast.success(_("chapter_created"));
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
                            ? `${_("edit_chapter")} ${chapter.number} ${_("of")} ${mangaCustom.title}`
                            : `${_("upload_chapter_of")} ${mangaCustom.title}`
                    }
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-scroll">
                <div className="flex gap-2">
                    <div className="max-w-[30%] w-[30%] flex flex-col gap-4">
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            {_("details")}
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("number")}
                        </Typography>
                        <Input
                            label={_("chapter_number")}
                            autoComplete='off'
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            type='number'
                        />
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("upload_chapter_of")}Título
                        </Typography>
                        <Input
                            label={_("chapter_title")}
                            autoComplete='off'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("chapter_miniature")}
                        </Typography>
                        <ImageDropzone
                            value={chapterImageFile}
                            label={_("chapter_miniature_label")}
                            alt={_("chapter_miniature_alt")}
                            onChange={(files) => files[0] ? setChapterImageFile(files[0]) : null}
                            onDelete={(file) => setChapterImageFile(null)}
                        />
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            {_("options")}
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("release_date")}
                        </Typography>
                        <input
                            type="datetime-local"
                            value={formatDateToInput(releasedAt)}
                            onChange={(e) => setReleasedAt(new Date(e.target.value))}
                        />
                        <Typography variant="small" color="gray" className="font-normal">
                            {_("release_date_description")}
                        </Typography>
                        <Typography className="-mb-2" variant="h6" color="gray">
                            {_("suscribers")}
                        </Typography>
                        <Switch
                            checked={isSubscription}
                            onChange={(e) => setIsSubscription(e.target.checked)}
                            label={
                                <div>
                                    <Typography color="blue-gray" className="font-medium">
                                        {_("suscribers_only")}
                                    </Typography>
                                </div>
                            }
                        />
                        <Typography variant="small" color="gray" className="font-normal">
                            {_("suscribers_only_description")}
                        </Typography>
                    </div>
                    <div className="max-w-[70%] w-[70%] flex flex-col gap-4">
                        <Typography className="-mb-2" variant="h5" color="blue-gray">
                            {_("pages")}
                        </Typography>
                        <DropzoneArea
                            acceptedFiles={['image/*']}
                            dropzoneClass="!max-h-24 !min-h-24 !p-2"
                            dropzoneText={_("drag_and_drop_images")}
                            dropzoneParagraphClass="!text-base"
                            Icon={''}
                            cancelButtonText={_("cancel")}
                            submitButtonText={_("upload")}
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
                                    {_("chapter_no_pages")}
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
                                        alt={`${_("page")} ${index + 1}`}
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
                                                {_("page")} {index + 1}
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
                    {_("cancel")}
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleSubmit}
                    loading={loading}
                >
                    {_("save_chapter")}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
