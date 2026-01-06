import React from 'react';
import { Flame } from 'lucide-react';
import MangaCard3D from './MangaCard3D';

interface ScanPopular24hProps {
  mangas: any[];
  userPermissions?: any;
}

const ScanPopular24h: React.FC<ScanPopular24hProps> = ({ mangas, userPermissions }) => {
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
        {mangas.map((manga, i) => (
          <MangaCard3D 
            key={`pop24h-${i}`} 
            manga={manga} 
            hideScan={true}
            userPermissions={userPermissions}
          />
        ))}
      </div>
    </section>
  );
};

export default ScanPopular24h;

