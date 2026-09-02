import React, { useState, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

// Algunos navegadores/SO devuelven `file.type` vacío para imágenes perfectamente
// válidas (según cómo se guardó el archivo, extensiones como .jfif, etc.). El
// filtro anterior (`file.type.startsWith('image/')`) las descartaba en SILENCIO,
// lo que se veía como "archivo inválido / no sube" aunque fuera el formato de
// siempre. Aceptamos también por extensión y avisamos qué se rechazó y por qué.
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'jfif', 'bmp', 'apng'];
const looksLikeImage = (file: File): boolean => {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
};

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

  // Clasifica los archivos y avisa (una sola vez) qué se rechazó y por qué, en
  // vez de descartar en silencio. Así el scan sabe exactamente cuál falló.
  const processFiles = (fileList: File[]) => {
    const accepted: File[] = [];
    const rejectedType: string[] = [];
    const rejectedSize: string[] = [];
    for (const file of fileList) {
      if (!looksLikeImage(file)) { rejectedType.push(file.name); continue; }
      if (file.size > maxFileSize) { rejectedSize.push(file.name); continue; }
      accepted.push(file);
    }
    const msgs: string[] = [];
    if (rejectedType.length) {
      msgs.push(`No parecen imágenes (jpg, png, webp, gif, avif): ${rejectedType.join(', ')}`);
    }
    if (rejectedSize.length) {
      msgs.push(`Superan ${maxFileSize / (1024 * 1024)}MB: ${rejectedSize.join(', ')}`);
    }
    if (msgs.length) toast.error(msgs.join(' '));
    if (accepted.length) onDrop(accepted);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    // Permite volver a elegir el mismo archivo si hizo falta reintentar.
    e.target.value = '';
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
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.jfif,.bmp,.apng"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

