import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import { Loader2, X, GripVertical } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Switch from './ui/Switch';
import Card from './ui/Card';
import { ImageDropzone } from '../ImageDropzone';
import { MultiImageDropzone } from './ui/MultiImageDropzone';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";
import { uploadFile } from "../../util/uploadFile";

export function AdminChapterDialog({ language, open, setOpen, mangaCustom, chapter }) {
    const _ = getTranslator(language);

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
    const [subscribersOnly, setSubscribersOnly] = useState(() => {
        if (chapter) return chapter.subscribersOnly;
        return false;
    });
    const [chapterImageFile, setChapterImageFile] = useState(() => {
        if (chapter) return chapter.imageUrl;
        return null;
    });
    const [pages, setPages] = useState([]);
    const [singlePageIndexes, setSinglePageIndexes] = useState([]);
    const [dragId, setDragId] = useState(null);

    const handleDrag = (ev) => {
        // Obtener el índice desde el id de la imagen
        const imageId = ev.currentTarget.id;
        const pageIndex = parseInt(imageId.split('-').pop());
        // Usar el id del Card padre para el drop
        setDragId(`preview-page-${pageIndex}`);
    };

    const handleDragOver = (ev) => {
        ev.preventDefault();
    };

    const handleDrop = (ev) => {
        ev.preventDefault();
        if (!dragId) return;
        // @ts-ignore
        const dragPageIndex = parseInt(dragId.split('-').pop());
        const dropPageIndex = parseInt(ev.currentTarget.id.split('-').pop());
        const newPagesOrder = [...pages];
        const [draggedPage] = newPagesOrder.splice(dragPageIndex, 1);
        newPagesOrder.splice(dropPageIndex, 0, draggedPage);
        setPages(newPagesOrder);

        // Actualizar los índices de páginas simples después de reordenar
        const newSinglePageIndexes = singlePageIndexes.map(index => {
            if (index === dragPageIndex) return dropPageIndex;
            if (index < dragPageIndex && index >= dropPageIndex) return index + 1;
            if (index > dragPageIndex && index <= dropPageIndex) return index - 1;
            return index;
        });
        setSinglePageIndexes(newSinglePageIndexes);
        setDragId(null);
    };

    const handleDragEnd = () => {
        setDragId(null);
    };

    const removePage = (index) => {
        const newPages = pages.filter((_page, i) => i !== index);
        setPages(newPages);
        
        // Actualizar los índices de páginas simples después de eliminar
        const newSinglePageIndexes = singlePageIndexes
            .filter(i => i !== index)
            .map(i => i > index ? i - 1 : i);
        setSinglePageIndexes(newSinglePageIndexes);
    };

    const togglePageType = (index) => {
        setSinglePageIndexes(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index].sort((a, b) => a - b);
            }
        });
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
            setSubscribersOnly(chapter.subscribersOnly);
            setChapterImageFile(chapter.imageUrl);
            setLoading(true);
            callAPI(`/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}/pages`)
                .then(chapterPages => {
                    setPages(chapterPages);
                    // Inicializar los índices de páginas simples
                    const initialSinglePageIndexes = chapterPages
                        .map((page, index) => page.isSinglePage ? index : null)
                        .filter(index => index !== null);
                    setSinglePageIndexes(initialSinglePageIndexes);
                })
                .catch(error => toast.error(error?.message))
                .finally(() => setLoading(false));
        } else {
            const lastChapterNumber = mangaCustom?.chapters?.reduce((acc, chapter) => {
                return chapter.number > acc ? chapter.number : acc;
            }, 0);
            setNumber((lastChapterNumber + 1));
            setTitle(`${_("chapter")} ${lastChapterNumber + 1}`);
            setReleasedAt(new Date());
            setSubscribersOnly(false);
            setChapterImageFile(null);
            setPages([]);
            setSinglePageIndexes([]);
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
        setLoading(true);
        
        // Declarar variables fuera del bloque try para que estén disponibles en todo el scope
        let imageKey = chapterImageFile;
        const pageKeys = [];
        
        try {
            // Contar archivos a subir
            const filesToUpload = [
                chapterImageFile instanceof File,
                ...pages.map(page => page instanceof File)
            ].filter(Boolean).length;

            let toastId = null;
            let uploadedCount = 0;

            if (filesToUpload > 0) {
                toastId = toast.loading(`Subiendo archivos ${uploadedCount + 1}/${filesToUpload}`, {
                    position: "bottom-right"
                });
            }

            try {
                // Upload chapter image if it's a new file
                if (chapterImageFile instanceof File) {
                    uploadedCount++;
                    toast.update(toastId, { 
                        render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
                        position: "bottom-right"
                    });
                    imageKey = await uploadFile(chapterImageFile, undefined, 'chapters');
                }

                // Upload pages that are new files (secuencialmente para actualizar contador)
                for (const page of pages) {
                    if (page instanceof File) {
                        uploadedCount++;
                        toast.update(toastId, { 
                            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
                            position: "bottom-right"
                        });
                        const key = await uploadFile(page, undefined, 'chapters');
                        pageKeys.push(key);
                    } else if (page?.imageUrl) {
                        // Si ya tiene imageUrl (páginas existentes), mantener la URL completa
                        pageKeys.push(page.imageUrl);
                    } else {
                        // Si es un string (fileKey o URL), mantenerlo como está
                        pageKeys.push(page);
                    }
                }

                if (toastId) {
                    toast.dismiss(toastId);
                    toast.success(`${filesToUpload} ${filesToUpload === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`, {
                        position: "bottom-right"
                    });
                }
            } catch (error) {
                if (toastId) {
                    toast.dismiss(toastId);
                    toast.error("Error al subir archivos", {
                        position: "bottom-right"
                    });
                }
                throw error;
            }

            await callAPI(
                chapter
                    ? `/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}`
                    : `/api/manga-custom/${mangaCustom.slug}/chapter`,
                {
                    method: chapter ? 'PATCH' : 'POST',
                    body: JSON.stringify({
                        title,
                        number,
                        releasedAt: releasedAt.toISOString(),
                        subscribersOnly,
                        image: imageKey,
                        pages: pageKeys,
                        singlePages: singlePageIndexes,
                    }),
                }
            );
            setTitle('');
            setNumber(1);
            setChapterImageFile(null);
            setPages([]);
            setSinglePageIndexes([]);
            toast.success(_("chapter_created"));
            setOpen(false);
        } catch (error) {
            toast.error(error?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title={
                    chapter
                        ? `${_("edit_chapter")} ${chapter.number} ${_("of")} ${mangaCustom.title}`
                        : `${_("upload_chapter_of")} ${mangaCustom.title}`
                }
                size="xl"
            >
                <div className="flex flex-col gap-6">
                    <div className="flex gap-4">
                        <div className="w-[30%] flex flex-col gap-4 min-w-0 flex-shrink-0">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                {_("details")}
                            </h3>
                        <Input
                            label={_("chapter_number")}
                            autoComplete='off'
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            type='number'
                        />
                        <Input
                            label={_("chapter_title")}
                            autoComplete='off'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                {_("chapter_miniature")}
                            </label>
                            <ImageDropzone
                                value={chapterImageFile}
                                label={_("chapter_miniature_label")}
                                alt={_("chapter_miniature_alt")}
                                onChange={(files) => files[0] ? setChapterImageFile(files[0]) : null}
                                onDelete={(_file) => setChapterImageFile(null)}
                            />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {_("options")}
                        </h3>
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                {_("subscribers_only")}
                            </label>
                            <Switch
                                label={_("subscribers_only")}
                                checked={subscribersOnly}
                                onChange={(checked) => setSubscribersOnly(checked)}
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                {_("subscribers_only_description")}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                {_("release_date")}
                            </label>
                            <input
                                type="datetime-local"
                                value={formatDateToInput(releasedAt)}
                                onChange={(e) => setReleasedAt(new Date(e.target.value))}
                                disabled={subscribersOnly}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                {_("release_date_description")}
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {_("pages")}
                        </h3>
                        <MultiImageDropzone
                            onDrop={(files) => setPages([...pages, ...files])}
                            label={_("drag_and_drop_images")}
                            maxFileSize={25 * 1024 * 1024}
                            maxFiles={100}
                        />
                        <div className="flex flex-wrap gap-2 justify-start h-[32rem] max-h-[32rem] p-2 overflow-y-auto bg-zinc-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-xl border border-zinc-800">
                            {loading && (
                                <div className="w-full flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                                </div>
                            )}
                            {pages.length === 0 && !loading && (
                                <div className="w-full flex items-center justify-center py-8">
                                    <p className="text-zinc-400 text-center">
                                        {_("chapter_no_pages")}
                                    </p>
                                </div>
                            )}
                            {pages.map((page, index) => (
                                <Card
                                    key={index}
                                    id={`preview-page-${index}`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className="w-40 min-w-40 max-w-40"
                                >
                                    <div className="relative">
                                        <img
                                            draggable={true}
                                            id={`preview-page-image-${index}`}
                                            onDragStart={handleDrag}
                                            onDragEnd={handleDragEnd}
                                            src={
                                                page instanceof File
                                                    ? URL.createObjectURL(page)
                                                    : page?.imageUrl
                                            }
                                            alt={`${_("page")} ${index + 1}`}
                                            decoding="async"
                                            loading="lazy"
                                            className="w-full h-56 object-cover rounded-t-xl bg-zinc-900 cursor-move"
                                        />
                                    </div>
                                    <div className="p-2 flex flex-col gap-2">
                                        <div className="flex justify-between items-center gap-2">
                                            <button
                                                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                                                disabled
                                            >
                                                <GripVertical size={16} className="text-zinc-500" />
                                            </button>
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                                {_("page")} {index + 1}
                                            </span>
                                            <button
                                                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors hover:text-red-500"
                                                onClick={() => removePage(index)}
                                            >
                                                <X size={16} className="text-zinc-400" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-400">
                                                Página sola
                                            </span>
                                            <label 
                                                className="relative inline-flex items-center cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={singlePageIndexes.includes(index)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        togglePageType(index);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800 flex-shrink-0">
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            {_("cancel")}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={loading}
                        >
                            {_("save_chapter")}
                        </Button>
                    </div>
                </div>
            </Modal>
            <ToastContainer theme="dark" />
        </>
    );
}
