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
    useEffect(() => {
        console.log("VALUE CHANGED TO ", value)
    }, [value]);
    return (
        <div className="flex items-center gap-2">
            <DropzoneArea
                useChipsForPreview
                filesLimit={1}
                dropzoneClass="!min-h-56 !p-2"
                Icon={''}
                dropzoneText={label}
                dropzoneParagraphClass="!text-base"
                showAlerts={false}
                acceptedFiles={['image/*']}
                onChange={(files) => onChange(files)}
                onDelete={(file) => onDelete(file)}
            />
            {value && (
                <div className='relative max-w-[50%] h-56'>
                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
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
                        className="w-full object-cover rounded-md"
                    />
                </div>
            )}
        </div>
    );
}