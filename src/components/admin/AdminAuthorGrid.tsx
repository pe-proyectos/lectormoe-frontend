import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import AdminAuthorCard from './AdminAuthorCard';
import { AdminCreateAuthorDialog } from './AdminCreateAuthorDialog';
import { callAPI } from '../../util/callApi';
import Button from './ui/Button';
import Card from './ui/Card';

interface AdminAuthorGridProps {
  organization: any;
  language?: string;
  organizationSlug: string;
}

const AdminAuthorGrid: React.FC<AdminAuthorGridProps> = ({
  organization,
  language,
  organizationSlug,
}) => {
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isDialogOpen) refreshAuthors();
  }, [isDialogOpen]);

  const refreshAuthors = () => {
    setLoading(true);
    callAPI(`/api/author`)
      .then((result) => setAuthors(result))
      .catch((error) => toast.error(error?.message || 'Error cargando autores'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminCreateAuthorDialog
        organization={organization}
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
      />

      {/* Header */}
      <Card>
        <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
          <Plus size={20} />
          Agregar Autor
        </Button>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <span className="text-zinc-400 font-medium">Cargando autores...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && authors.length === 0 && (
        <Card className="text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-800 rounded-full">
              <AlertCircle size={48} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">No hay autores</h3>
              <p className="text-zinc-400">Comienza agregando tu primer autor</p>
            </div>
          </div>
        </Card>
      )}

      {/* Grid */}
      {!loading && authors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {authors.map((author) => (
            <AdminAuthorCard
              key={author.id}
              language={language}
              imageUrl={author.imageUrl}
              name={author.name}
              shortDescription={author.shortDescription}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuthorGrid;

