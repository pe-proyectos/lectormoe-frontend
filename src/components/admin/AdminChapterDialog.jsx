import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ToastContainer, toast } from 'react-toastify';
import { Loader2, X, GripVertical } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Switch from './ui/Switch';
import Card from './ui/Card';
import { ImageDropzone } from '../ImageDropzone';
import { MultiImageDropzone } from './ui/MultiImageDropzone';
import NovelEditor from './NovelEditor';
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";
import { uploadFile } from "../../util/uploadFile";

const WRITING_BOOK_TYPES = new Set(['novel', 'light-novel', 'book', 'short-story']);

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
    const [chapterImageFile, setChapterImageFile] = useState(() => {
        if (chapter) return chapter.imageUrl;
        return null;
    });
    const [pages, setPages] = useState([]);
    const [singlePageIndexes, setSinglePageIndexes] = useState([]);
    const [dragId, setDragId] = useState(null);
    const [bodyMarkdown, setBodyMarkdown] = useState(chapter?.bodyMarkdown || '');

    // bookType.code is what tells us whether this chapter is markdown-text or images.
    const bookTypeCode = mangaCustom?.manga?.bookType?.code || mangaCustom?.bookType?.code;
    const isWriting = WRITING_BOOK_TYPES.has(bookTypeCode);

    // Cache blob URLs so we don't call URL.createObjectURL on every render.
    // Each File object gets one URL for its lifetime in state.
    const blobUrlCache = useRef(new Map());

    // Stable page IDs for React keys (avoids full remount on reorder).
    const pageIdMap = useRef(new WeakMap());
    const pageIdCounter = useRef(0);

    const getPageSrc = useCallback((page) => {
        if (page instanceof File) {
            if (!blobUrlCache.current.has(page)) {
                blobUrlCache.current.set(page, URL.createObjectURL(page));
            }
            return blobUrlCache.current.get(page);
        }
        return page?.imageUrl;
    }, []);

    const getPageId = useCallback((page) => {
        if (!pageIdMap.current.has(page)) {
            pageIdMap.current.set(page, ++pageIdCounter.current);
        }
        return pageIdMap.current.get(page);
    }, []);

    // Revoke all cached blob URLs when the dialog is closed/unmounted.
    useEffect(() => {
        return () => {
            for (const url of blobUrlCache.current.values()) URL.revokeObjectURL(url);
            blobUrlCache.current.clear();
        };
    }, []);

    // O(1) lookup instead of O(n) Array.includes on every card render.
    const singlePageSet = useMemo(() => new Set(singlePageIndexes), [singlePageIndexes]);

    const handleDrag = useCallback((ev) => {
        const pageIndex = parseInt(ev.currentTarget.id.split('-').pop());
        setDragId(`preview-page-${pageIndex}`);
    }, []);

    const handleDragOver = useCallback((ev) => {
        ev.preventDefault();
    }, []);

    const handleDrop = useCallback((ev) => {
        ev.preventDefault();
        if (!dragId) return;
        const dragPageIndex = parseInt(dragId.split('-').pop());
        const dropPageIndex = parseInt(ev.currentTarget.id.split('-').pop());
        setPages(prev => {
            const next = [...prev];
            const [dragged] = next.splice(dragPageIndex, 1);
            next.splice(dropPageIndex, 0, dragged);
            return next;
        });
        setSinglePageIndexes(prev => prev.map(i => {
            if (i === dragPageIndex) return dropPageIndex;
            if (i < dragPageIndex && i >= dropPageIndex) return i + 1;
            if (i > dragPageIndex && i <= dropPageIndex) return i - 1;
            return i;
        }));
        setDragId(null);
    }, [dragId]);

    const handleDragEnd = useCallback(() => {
        setDragId(null);
    }, []);

    const removePage = useCallback((index) => {
        setPages(prev => {
            const removed = prev[index];
            if (removed instanceof File) {
                const url = blobUrlCache.current.get(removed);
                if (url) {
                    URL.revokeObjectURL(url);
                    blobUrlCache.current.delete(removed);
                }
            }
            return prev.filter((_p, i) => i !== index);
        });
        setSinglePageIndexes(prev =>
            prev.filter(i => i !== index).map(i => (i > index ? i - 1 : i))
        );
    }, []);

    const togglePageType = useCallback((index) => {
        setSinglePageIndexes(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index].sort((a, b) => a - b)
        );
    }, []);

    const handlePagesDrop = useCallback((files) => {
        setPages(prev => [...prev, ...files]);
    }, []);

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
            setChapterImageFile(chapter.imageUrl);
            setBodyMarkdown(chapter.bodyMarkdown || '');
            if (isWriting) {
                setPages([]);
                setSinglePageIndexes([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            callAPI(`/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}/pages`)
                .then(chapterPages => {
                    setPages(chapterPages);
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
            setChapterImageFile(null);
            setPages([]);
            setSinglePageIndexes([]);
            setBodyMarkdown('');
            setLoading(false);
        }
    }, [chapter, mangaCustom, isWriting]);

    const handleSubmit = async () => {
        if (!title) {
            return toast.error(_("mandatory_title"));
        }
        if (!number) {
            return toast.error(_("mandatory_number"));
        }
        // Validate chapter number uniqueness before starting any file uploads
        if (!chapter) {
            const duplicate = mangaCustom?.chapters?.find(c => Number(c.number) === Number(number));
            if (duplicate) {
                return toast.error(`El capítulo ${number} ya existe`);
            }
        }
        setLoading(true);
        
        // Declarar variables fuera del bloque try para que estén disponibles en todo el scope
        let imageKey = chapterImageFile;
        const pageKeys = [];

        try {
            // For writings we skip the multi-image upload entirely.
            const filesToUpload = isWriting
                ? (chapterImageFile instanceof File ? 1 : 0)
                : [
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

                // Skip the per-page upload loop for writing chapters.
                if (!isWriting) {
                    // Upload up to 5 files concurrently instead of one-by-one.
                    // Sequential uploads of 30+ heavy pages easily exceed gateway timeouts.
                    const CONCURRENCY = 5;
                    const resolvedKeys = new Array(pages.length);
                    const tasks = pages.map((page, index) => async () => {
                        if (page instanceof File) {
                            uploadedCount++;
                            toast.update(toastId, {
                                render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
                                position: "bottom-right"
                            });
                            resolvedKeys[index] = await uploadFile(page, undefined, 'chapters');
                        } else if (page?.imageUrl) {
                            resolvedKeys[index] = page.imageUrl;
                        } else {
                            resolvedKeys[index] = page;
                        }
                    });
                    let taskIdx = 0;
                    const worker = async () => {
                        while (taskIdx < tasks.length) {
                            const i = taskIdx++;
                            await tasks[i]();
                        }
                    };
                    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
                    pageKeys.push(...resolvedKeys);
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
                        image: imageKey,
                        // For writings we send empty pages and the markdown body instead.
                        pages: isWriting ? [] : pageKeys,
                        singlePages: isWriting ? [] : singlePageIndexes,
                        ...(isWriting ? { bodyMarkdown } : {}),
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
                                {_("release_date")}
                            </label>
                            <input
                                type="datetime-local"
                                value={formatDateToInput(releasedAt)}
                                onChange={(e) => setReleasedAt(new Date(e.target.value))}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                {_("release_date_description")}
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {isWriting ? (
                            <>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                    Contenido
                                </h3>
                                <NovelEditor
                                    value={bodyMarkdown}
                                    onChange={setBodyMarkdown}
                                    disabled={loading}
                                />
                            </>
                        ) : (
                          <>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {_("pages")}
                        </h3>
                        <MultiImageDropzone
                            onDrop={handlePagesDrop}
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
                                    key={getPageId(page)}
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
                                            src={getPageSrc(page)}
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
                                                    checked={singlePageSet.has(index)}
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
                          </>
                        )}
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
