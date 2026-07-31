import { useState, useRef, useEffect } from 'react';
import { notify } from '../util/feedback';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/solid';

export function ImageDropzone({ value, label, alt, onChange, onDelete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    const dropzoneRef = useRef(null);

    useEffect(() => {
        if (value) {
            if (value instanceof File) {
                const objectUrl = URL.createObjectURL(value);
                setPreview(objectUrl);
                return () => URL.revokeObjectURL(objectUrl);
            } else {
                setPreview(value);
            }
        } else {
            setPreview(null);
        }
    }, [value]);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            const file = files[0];
            if (file.size > 25 * 1024 * 1024) {
                notify.error('El archivo es demasiado grande. Máximo 25MB');
                return;
            }
            onChange([file]);
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            const file = files[0];
            if (file.size > 25 * 1024 * 1024) {
                notify.error('El archivo es demasiado grande. Máximo 25MB');
                return;
            }
            onChange([file]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col gap-4">
            {preview ? (
                <div className="relative w-full max-w-md">
                    <div className="absolute top-2 right-2 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 rounded-full shadow-lg transition-colors border border-zinc-700"
                        >
                            <XMarkIcon className="h-4 w-4 text-white" />
                        </button>
                    </div>
                    <img
                        src={preview}
                        alt={alt}
                        decoding="async"
                        loading="lazy"
                        className="w-full max-h-72 object-cover rounded-xl border border-zinc-800"
                    />
                </div>
            ) : (
                <div
                    ref={dropzoneRef}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={`
                        min-h-56 p-8
                        border-2 border-dashed rounded-xl
                        cursor-pointer transition-all
                        flex flex-col items-center justify-center gap-4
                        ${isDragging 
                            ? 'border-cyan-500 bg-cyan-500/10' 
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }
                    `}
                >
                    <PhotoIcon className="h-12 w-12 text-zinc-500" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-zinc-300 mb-1">
                            {label}
                        </p>
                        <p className="text-xs text-zinc-500">
                            Haz clic o arrastra una imagen aquí
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                            Máximo 25MB
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
}