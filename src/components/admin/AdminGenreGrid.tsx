import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import AdminGenreCard from './AdminGenreCard';
import AdminGenreDialog from './AdminGenreDialog';
import { callAPI } from '../../util/callApi';
import Button from './ui/Button';
import Card from './ui/Card';

interface AdminGenreGridProps {
  organization: any;
  language?: string;
  organizationSlug: string;
}

const AdminGenreGrid: React.FC<AdminGenreGridProps> = ({
  organization,
  language,
  organizationSlug,
}) => {
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isDialogOpen) refreshGenres();
  }, [isDialogOpen]);

  const refreshGenres = () => {
    setLoading(true);
    callAPI(`/api/genre`)
      .then((result) => setGenres(result))
      .catch((error) => toast.error(error?.message || 'Error cargando géneros'))
      .finally(() => setLoading(false));
  };

  const handleEdit = (genre: any) => {
    setSelectedGenre(genre);
    setIsDialogOpen(true);
  };

  const handleDelete = (genre: any) => {
    if (!confirm(`¿Estás seguro de eliminar el género "${genre.name}"?`)) return;

    callAPI(`/api/genre/${genre.slug}`, { method: 'DELETE' })
      .then(() => {
        refreshGenres();
        setSelectedGenre(null);
        toast.success('Género eliminado correctamente');
      })
      .catch((error) => toast.error(error?.message || 'Error al eliminar género'));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminGenreDialog
        language={language}
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        genre={selectedGenre}
        setGenre={setSelectedGenre}
      />

      {/* Header */}
      <Card>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedGenre(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus size={20} />
          Agregar Género
        </Button>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <span className="text-zinc-400 font-medium">Cargando géneros...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && genres.length === 0 && (
        <Card className="text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-800 rounded-full">
              <AlertCircle size={48} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">No hay géneros</h3>
              <p className="text-zinc-400">Comienza agregando tu primer género</p>
            </div>
          </div>
        </Card>
      )}

      {/* Grid */}
      {!loading && genres.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <AdminGenreCard
              key={genre.id}
              language={language}
              genre={genre}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGenreGrid;

