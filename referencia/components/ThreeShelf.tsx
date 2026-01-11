
import React, { useState } from 'react';
import { POPULAR_MANGAS } from '../constants';
import { Manga } from '../types';

// Define the props interface for the Book component to ensure compatibility with standard React props like 'key'.
interface BookProps {
  manga: Manga;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const Book: React.FC<BookProps> = ({ manga, isHovered, onHover, onLeave }) => {
  const thickness = 40; // Grosor del libro

  return (
    <div 
      className="relative flex items-end h-[350px] transition-all duration-500 ease-out"
      style={{ 
        width: isHovered ? '220px' : '60px', // Se expande para mostrar la portada
        zIndex: isHovered ? 50 : 10,
        marginRight: isHovered ? '20px' : '5px'
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="absolute inset-0 [perspective:1000px] pointer-events-none">
        <div 
          className="relative w-[220px] h-full transition-all duration-700 [transform-style:preserve-3d] pointer-events-auto"
          style={{ 
            transform: isHovered 
              ? 'translateZ(100px) rotateY(0deg) translateY(-20px)' 
              : 'rotateY(-75deg)',
            transformOrigin: 'left center'
          }}
        >
          {/* CARA FRONTAL (PORTADA) */}
          <div className="absolute inset-0 w-full h-full bg-zinc-800 shadow-2xl rounded-r-sm overflow-hidden z-20 border-l border-white/10">
            <img src={manga.cover} className="w-full h-full object-cover" alt={manga.title} />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-white/10 opacity-50" />
          </div>

          {/* LOMO (SPINE) - Lo que se ve cuando está en el estante */}
          <div 
            className="absolute top-0 left-0 h-full bg-zinc-900 z-30 flex items-center justify-center border-y border-white/5"
            style={{ 
              width: `${thickness}px`,
              transform: 'rotateY(-90deg)',
              transformOrigin: 'left'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] whitespace-nowrap -rotate-90 w-[300px] text-center">
              {manga.title}
            </span>
          </div>

          {/* CARA TRASERA */}
          <div 
            className="absolute inset-0 w-full h-full bg-zinc-950 z-10"
            style={{ transform: `translateZ(-${thickness}px)` }}
          />
        </div>
      </div>
      
      {/* Etiqueta Flotante */}
      <div className={`absolute -bottom-16 left-0 w-full transition-all duration-500 text-center ${isHovered ? 'opacity-100' : 'opacity-0 scale-90'}`}>
        <p className="text-white font-bold text-sm tracking-tight truncate">{manga.title}</p>
        <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">{manga.scan}</p>
      </div>
    </div>
  );
};

const ThreeShelf: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="bg-[#050505] py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-20 space-y-4">
          <span className="text-cyan-500 font-black text-xs uppercase tracking-[0.4em]">The Selection</span>
          <h2 className="text-6xl font-black text-white italic tracking-tighter">Staff Picks</h2>
          <div className="h-1 w-20 bg-cyan-500" />
        </div>

        <div className="relative flex items-end justify-center py-20 min-h-[500px]">
          {/* Base del Estante */}
          <div className="absolute bottom-16 left-0 right-0 h-4 bg-zinc-900 shadow-[0_30px_60px_rgba(0,0,0,1)] rounded-full opacity-50" />
          
          <div className="flex items-end perspective-2000">
            {POPULAR_MANGAS.map((manga, i) => (
              <Book 
                key={manga.id} 
                manga={manga} 
                isHovered={hoveredIdx === i} 
                onHover={() => setHoveredIdx(i)}
                onLeave={() => setHoveredIdx(null)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeShelf;
