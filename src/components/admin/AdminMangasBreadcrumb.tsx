import React from 'react';
import { ChevronRight } from 'lucide-react';

interface AdminMangasBreadcrumbProps {
  language?: string;
  organizationSlug: string;
}

const AdminMangasBreadcrumb: React.FC<AdminMangasBreadcrumbProps> = ({ organizationSlug }) => {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <a
        href={`/${organizationSlug}/admin/mangas`}
        className="text-zinc-400 hover:text-white transition-colors"
      >
        Mangas
      </a>
      <ChevronRight size={16} className="text-zinc-600" />
      <a
        href={`/${organizationSlug}/admin/mangas/profile/create`}
        className="text-cyan-500 hover:text-cyan-400 transition-colors"
      >
        Crear Perfil
      </a>
    </div>
  );
};

export default AdminMangasBreadcrumb;

