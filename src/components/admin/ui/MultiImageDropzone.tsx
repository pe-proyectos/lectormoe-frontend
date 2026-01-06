import React, { useState, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/solid';

interface MultiImageDropzoneProps {
  onDrop: (files: File[]) => void;
  label?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export const MultiImageDropzone: React.FC<MultiImageDropzoneProps> = ({
  onDrop,
  label = "Arrastra y suelta imágenes aquí",
  maxFileSize = 25 * 1024 * 1024,
  maxFiles = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.size > maxFileSize) {
          alert(`El archivo ${file.name} es demasiado grande. Máximo ${maxFileSize / (1024 * 1024)}MB`);
          return false;
        }
        return true;
      });
      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.size > maxFileSize) {
          alert(`El archivo ${file.name} es demasiado grande. Máximo ${maxFileSize / (1024 * 1024)}MB`);
          return false;
        }
        return true;
      });
      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        min-h-24 p-4
        border-2 border-dashed rounded-xl
        cursor-pointer transition-all
        flex flex-col items-center justify-center gap-2
        ${isDragging 
          ? 'border-cyan-500 bg-cyan-500/10' 
          : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
        }
      `}
    >
      <PhotoIcon className="h-8 w-8 text-zinc-500" />
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-300">
          {label}
        </p>
        <p className="text-xs text-zinc-500">
          Máximo {maxFileSize / (1024 * 1024)}MB por archivo
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

