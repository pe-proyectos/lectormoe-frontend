import { useState, useEffect } from 'react';
import { DropzoneArea } from 'material-ui-dropzone';
import {
  IconButton,
  Button,
} from "@material-tailwind/react";
import {
  XMarkIcon,
} from "@heroicons/react/24/solid";

export function ImageDropzone({ value, label, alt, onChange, onDelete }) {
    return (
        <div className="flex items-center gap-2">
            <DropzoneArea
                useChipsForPreview
                filesLimit={1}
                maxFileSize={25 * 1024 * 1024}
                dropzoneClass="!min-h-56 !p-2 !bg-blue-gray-50"
                Icon={''}
                dropzoneText={label}
                dropzoneParagraphClass="!text-base"
                showAlerts={false}
                acceptedFiles={['image/*']}
                onChange={(files) => onChange(files)}
                onDelete={(file) => onDelete(file)}
            />
            {value && (
                <div className='relative max-w-[50%] max-h-72'>
                    <div className="absolute top-0 right-0">
                        <IconButton
                            variant="outlined"
                            className="rounded-full bg-white bg-opacity-90 shadow-md"
                            onClick={(event) => { event.stopPropagation(); onDelete(); }}
                            size='sm'
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </IconButton>
                    </div>
                    <img
                        src={
                            value instanceof File
                                ? URL.createObjectURL(value)
                                : value
                        }
                        alt={alt}
                        decoding="async"
                        loading="lazy"
                        className="w-full max-h-72 object-cover rounded-md p-4"
                    />
                </div>
            )}
        </div>
    );
}