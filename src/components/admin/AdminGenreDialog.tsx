import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { callAPI } from '../../util/callApi';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface AdminGenreDialogProps {
  language?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  genre: {
    slug: string;
    name: string;
    description?: string;
  } | null;
  setGenre: (genre: any) => void;
}

const AdminGenreDialog: React.FC<AdminGenreDialogProps> = ({
  language,
  open,
  setOpen,
  genre,
  setGenre,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (genre) {
      setName(genre.name || '');
      setDescription(genre.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [genre]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return toast.error('El nombre es requerido');
    }

    setLoading(true);
    callAPI(genre ? `/api/genre/${genre.slug}` : '/api/genre', {
      method: genre ? 'PATCH' : 'POST',
      body: JSON.stringify({ name, description }),
    })
      .then(() => {
        toast.success(genre ? 'Género actualizado' : 'Género creado');
        setName('');
        setDescription('');
        setGenre(null);
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message || 'Error al guardar género'))
      .finally(() => setLoading(false));
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setGenre(null);
      setOpen(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={genre ? 'Editar Género' : 'Crear Género'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre del Género"
          placeholder="Ej: Acción, Romance, Comedia..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />

        <Textarea
          label="Descripción (Opcional)"
          placeholder="Describe el género..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={4}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {genre ? 'Guardar Cambios' : 'Crear Género'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminGenreDialog;

