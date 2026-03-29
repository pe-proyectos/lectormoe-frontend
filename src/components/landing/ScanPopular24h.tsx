import React, { useState, useEffect } from 'react';
import { Flame, ChevronDown } from 'lucide-react';
import MangaCard3D from './MangaCard3D';

interface ScanPopular24hProps {
  mangas: any[];
  user: any;
  organization: any;
  nsfwMode?: boolean;
}

const ScanPopular24h: React.FC<ScanPopular24hProps> = ({ mangas, user, organization, nsfwMode = false }) => {
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si es mobile (< 640px = breakpoint sm de Tailwind)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check inicial
    checkMobile();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mostrar solo la primera fila: 2 en mobile, 3 en desktop/tablet
  const firstRowCount = isMobile ? 2 : 3;
  
  const visibleMangas = showAll ? mangas : mangas.slice(0, firstRowCount);
  const hasMore = mangas.length > firstRowCount;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-3xl font-black text-white tracking-tight">Más populares</h2>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
          <Flame size={14} className="text-orange-500" />
          <span>(Más visitados en las últimas 24 horas)</span>
        </div>
      </div>
      <div className="w-full h-0.5 bg-zinc-800 mb-8" />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {visibleMangas.map((manga, i) => (
          <MangaCard3D
            key={`pop24h-${i}`}
            user={user}
            organization={organization}
            manga={manga}
            hideScan={true}
            nsfwMode={nsfwMode}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="group flex items-center gap-2 px-6 py-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-300"
          >
            <span className="text-sm font-bold text-zinc-300 group-hover:text-white">
              {showAll ? 'Mostrar menos' : `Mostrar más (${mangas.length - firstRowCount})`}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-zinc-500 group-hover:text-cyan-500 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      )}
    </section>
  );
};

export default ScanPopular24h;

