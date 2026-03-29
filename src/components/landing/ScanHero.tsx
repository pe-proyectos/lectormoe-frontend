import React, { useState, useEffect } from 'react';
import { translateStatus } from '../../util/landing/translateStatus';

interface Manga {
  id: string;
  title: string;
  cover: string;
  description?: string;
  chapter?: string;
  status?: string;
  demography?: string | null;
}

interface ScanHeroProps {
  mangas: Manga[];
  organization: any;
}

const ScanHero: React.FC<ScanHeroProps> = ({ mangas, organization }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (mangas.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mangas.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [mangas.length]);

  if (mangas.length === 0) return null;

  const currentFeatured = mangas[activeIndex];

  const handleReadNow = () => {
    if (currentFeatured.id) {
      window.location.href = `/${organization?.slug}/manga/${currentFeatured.id}`;
    }
  };

  return (
    <section 
      className="relative h-[450px] md:h-[650px] w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {mangas.map((manga, idx) => (
        <div 
          key={`hero-bg-${manga.id}`} 
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={manga.cover} 
            className="w-full h-full object-cover object-center" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        </div>
      ))}

      <div className="absolute bottom-12 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className={`relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 max-w-2xl shadow-2xl transition-opacity ${isHovered ? 'opacity-100 duration-300 ease-in' : 'opacity-0 duration-700 ease-out'}`}>
            <h2 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight line-clamp-2">
              {currentFeatured.title}
            </h2>
            <p className="text-zinc-200 text-xs md:text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
              {currentFeatured.description || `La organización conocida como la Alianza de Liberación Animal (ALA) atacó un instituto de investigación biológica y rescató a una chimpancé embarazada.`}
            </p>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleReadNow}
                  className="bg-zinc-950/80 text-green-500 border border-green-500/50 px-5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  LEER AHORA
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-white text-[10px] font-bold">{translateStatus(currentFeatured.status)}</span>
                </div>
              </div>
              
              {currentFeatured.demography && (
                <div className="px-3 py-1 bg-zinc-800 rounded-lg text-white text-[9px] font-black uppercase tracking-widest border border-white/5">
                  {currentFeatured.demography}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {mangas.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === i ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScanHero;

