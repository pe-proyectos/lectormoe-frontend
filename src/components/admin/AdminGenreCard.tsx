import React from 'react';
import { Edit, Trash2, BookOpen } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface AdminGenreCardProps {
  language?: string;
  genre: {
    id: number;
    name: string;
    description?: string;
    _count: {
      mangasCustom: number;
    };
  };
  handleEdit: (genre: any) => void;
  handleDelete: (genre: any) => void;
}

const AdminGenreCard: React.FC<AdminGenreCardProps> = ({
  genre,
  handleEdit,
  handleDelete,
}) => {
  return (
    <Card className="w-full max-w-sm">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
            {genre.name}
          </h3>
          <p className="text-sm text-zinc-400 line-clamp-3">
            {genre.description || 'Sin descripción'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-zinc-400">
          <BookOpen size={16} />
          <span className="text-sm font-medium">
            {genre._count.mangasCustom} {genre._count.mangasCustom === 1 ? 'manga' : 'mangas'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(genre)}
            className="flex-1"
          >
            <Edit size={14} />
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(genre)}
            className="flex-1"
          >
            <Trash2 size={14} />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AdminGenreCard;

