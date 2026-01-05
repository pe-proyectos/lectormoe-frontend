import React from 'react';
import { X } from 'lucide-react';

interface AdminNavbarProps {
  organization: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  organizationSlug: string;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ organization, organizationSlug }) => {
  const handleExit = () => {
    window.location.href = `/${organizationSlug}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 shadow-2xl shadow-black/50">
      <div className="max-w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
        {/* Logo y Nombre */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0">
            {organization.logoUrl ? (
              <img 
                src={organization.logoUrl} 
                alt={organization.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-cyan-500 font-black text-lg">
                {organization.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-black italic tracking-tighter text-white uppercase leading-none">
              {organization.name}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Panel de Administración
            </span>
          </div>
        </div>

        {/* Botón Salir */}
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white text-xs md:text-sm font-bold uppercase tracking-widest transition-all group"
        >
          <X size={16} className="md:w-[18px] md:h-[18px] group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Salir del Panel</span>
          <span className="sm:hidden">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;

