import React from 'react';
import { Eye, Trophy, Crown, Medal } from 'lucide-react';
import { translateStatus } from '../../util/landing/translateStatus';

interface Manga {
  id: string;
  title: string;
  cover: string;
  description?: string;
  chapter?: string;
  status?: string;
  views?: number;
}

interface ScanTopThreeProps {
  mangas: Manga[];
  organization: any;
}

const ScanTopThree: React.FC<ScanTopThreeProps> = ({ mangas, organization }) => {
  if (mangas.length === 0) return null;

  const RankingBadge = ({ rank }: { rank: number }) => {
    const configs = [
      { color: 'bg-yellow-500', icon: <Crown size={14} />, label: 'RANK #1' },
      { color: 'bg-zinc-300', icon: <Trophy size={14} />, label: 'RANK #2' },
      { color: 'bg-orange-600', icon: <Medal size={14} />, label: 'RANK #3' },
    ];
    const config = configs[rank - 1] || configs[2];

    return (
      <div className="flex items-center gap-2">
        <div className={`${config.color} text-zinc-950 p-1.5 rounded-lg shadow-lg shadow-black/20`}>
          {config.icon}
        </div>
        <span className="text-white font-black italic tracking-tighter text-xs">
          {config.label}
        </span>
      </div>
    );
  };

  const handleMangaClick = (mangaId: string) => {
    // mangaId is the slug
    window.location.href = `/${organization?.slug}/manga/${mangaId}`;
  };

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-[0.3em] text-[10px]">
            <Crown size={12} fill="currentColor" /> Salón de la Fama
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            Inmortales <span className="text-outline-white text-transparent">del Scan</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          Visitas totales históricas
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* RANK #1 - THE MAIN HIGHLIGHT */}
        {mangas[0] && (
          <div 
            className="lg:col-span-7 group relative h-[500px] md:h-[650px] rounded-[32px] overflow-hidden border border-yellow-500/20 shadow-2xl shadow-yellow-500/5 cursor-pointer"
            onClick={() => handleMangaClick(mangas[0].id)}
          >
            <img 
              src={mangas[0].cover} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt={mangas[0].title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-transparent to-transparent" />
            
            {/* Badge Rank 1 stays at top left */}
            <div className="absolute top-8 left-8">
              <RankingBadge rank={1} />
            </div>

            {/* Visit count moved to top right */}
            <div className="absolute top-8 right-8">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <Eye size={12} className="text-yellow-500" />
                <span className="text-white font-black text-[10px] tracking-widest">
                  {mangas[0].views?.toLocaleString() || '0'} VISITAS
                </span>
              </div>
            </div>

            <div className="absolute bottom-10 left-10 right-10">
              <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-4 uppercase group-hover:text-yellow-400 transition-colors">
                {mangas[0].title}
              </h3>
              <p className="text-zinc-300 text-sm md:text-base line-clamp-2 leading-relaxed max-w-xl opacity-80">
                {mangas[0].description || "Una obra maestra indiscutible que ha definido la trayectoria de nuestro equipo. Acción, emoción y un arte sin precedentes."}
              </p>
            </div>
            
            {/* Glowing Border Effect on Hover */}
            <div className="absolute inset-0 border-2 border-yellow-500/0 group-hover:border-yellow-500/30 rounded-[32px] transition-all duration-500 pointer-events-none" />
          </div>
        )}

        {/* RANK #2 & #3 COLUMN - Heights synchronized with Rank 1 */}
        <div className="lg:col-span-5 flex flex-col gap-6 md:h-[650px]">
          {[mangas[1], mangas[2]].filter(Boolean).map((manga, i) => {
            const isRank2 = i === 0;
            return (
              <div 
                key={`top-rank-${manga.id}`}
                className={`flex-1 group relative rounded-[32px] overflow-hidden border shadow-xl cursor-pointer transition-all duration-500 ${isRank2 ? 'border-zinc-300/10 hover:border-zinc-300/30' : 'border-orange-900/10 hover:border-orange-500/30'}`}
                onClick={() => handleMangaClick(manga.id)}
              >
                <img 
                  src={manga.cover} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                
                <div className="absolute top-6 left-6">
                  <RankingBadge rank={i + 2} />
                </div>

                <div className="absolute top-6 right-6">
                  <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <Eye size={10} className={isRank2 ? 'text-zinc-300' : 'text-orange-500'} />
                    <span className="text-white font-bold text-[9px] tracking-widest uppercase">
                      {manga.views?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className={`text-2xl font-black text-white italic tracking-tight leading-tight uppercase transition-colors ${isRank2 ? 'group-hover:text-zinc-200' : 'group-hover:text-orange-400'}`}>
                    {manga.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{manga.chapter || 'Cap. 01'}</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{translateStatus(manga.status)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Decorative shelf bottom shadow */}
      <div className="absolute -bottom-10 left-0 right-0 h-20 bg-cyan-500/5 blur-[100px] pointer-events-none" />
    </section>
  );
};

export default ScanTopThree;

