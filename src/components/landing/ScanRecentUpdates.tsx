import React from 'react';
import { RefreshCw, ArrowRight, Info } from 'lucide-react';
import MangaCard3D from './MangaCard3D';

interface ScanRecentUpdatesProps {
  mangas: any[];
  onExploreClick: () => void;
  organizationSlug: string;
  userPermissions?: any;
}

const ScanRecentUpdates: React.FC<ScanRecentUpdatesProps> = ({ mangas, onExploreClick, organizationSlug, userPermissions }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-3xl font-black text-white tracking-tight">Actualizados recientemente</h2>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
          <RefreshCw size={14} className="text-cyan-500" />
          <span>Últimas publicaciones del equipo</span>
        </div>
      </div>
      <div className="w-full h-0.5 bg-zinc-800 mb-8" />
      
      {mangas.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {mangas.map((manga, i) => (
            <MangaCard3D 
              key={`recent-${i}`} 
              manga={manga} 
              hideScan={true}
              userPermissions={userPermissions}
            />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-zinc-900 rounded-[48px] bg-zinc-900/10">
          <Info size={48} className="mx-auto mb-4 text-zinc-800" />
          <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-sm">Sin proyectos indexados</p>
        </div>
      )}

      <div className="mt-16 flex justify-center">
        <button 
          onClick={onExploreClick}
          className="group relative bg-white text-zinc-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center gap-4 active:scale-95"
        >
          Ver todo el catálogo
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default ScanRecentUpdates;

