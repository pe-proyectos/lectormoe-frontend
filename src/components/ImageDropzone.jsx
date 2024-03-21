import { useState, useEffect } from 'react';
import { DropzoneArea } from 'material-ui-dropzone';

export function ImageDropzone({value, label, alt, onChange, onDelete }) {
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
                <img
                    src={
                        value instanceof File
                            ? URL.createObjectURL(value)
                            : value
                    }
                    alt={alt}
                    className="max-w-[50%] h-56 object-cover rounded-md"
                />
            )}
        </div>
    );
}