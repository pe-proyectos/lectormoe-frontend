import React from 'react';
import { ChevronRight } from 'lucide-react';

interface AdminMangasBreadcrumbProps {
  language?: string;
  organizationSlug: string;
}

const AdminMangasBreadcrumb: React.FC<AdminMangasBreadcrumbProps> = ({ organizationSlug }) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium overflow-x-auto">
      <a
        href={`/${organizationSlug}/admin/mangas`}
        className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
      >
        Mangas
      </a>
      <ChevronRight size={14} className="sm:w-4 sm:h-4 text-zinc-600 flex-shrink-0" />
      <a
        href={`/${organizationSlug}/admin/mangas/profile/create`}
        className="text-cyan-500 hover:text-cyan-400 transition-colors whitespace-nowrap"
      >
        Crear Perfil
      </a>
    </div>
  );
};

export default AdminMangasBreadcrumb;

