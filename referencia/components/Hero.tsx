
import React, { useState, useEffect } from 'react';
import { POPULAR_MANGAS } from '../constants';
import { Play, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

const Hero: React.FC = () => {
  const [active, setActive] = useState(0);
  const current = POPULAR_MANGAS[active];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % POPULAR_MANGAS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[550px] md:h-[600px] w-full bg-black overflow-hidden pt-20">
      {/* Background Layer with optimized visibility */}
      <div className="absolute inset-0">
        <img 
          src={current.cover} 
          className="w-full h-full object-cover opacity-30 blur-sm scale-105 transition-all duration-1000"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
        <div className="grid lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* Text Content - Compressed for smaller height */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-cyan-500 text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">Featured</span>
                <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em]">{current.scan}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white italic leading-tight tracking-tighter uppercase drop-shadow-2xl">
                {current.title.split(' ')[0]} 
                <span className="text-outline-white text-transparent ml-2">{current.title.split(' ').slice(1).join(' ') || 'Manga'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-300 font-bold bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/50">Chapter {current.chapter}</span>
              <span className="text-zinc-500 font-bold uppercase tracking-widest">{current.lastUpdate}</span>
            </div>

            <p className="text-zinc-400 text-base max-w-xl leading-relaxed line-clamp-2 md:line-clamp-3">
              Descubre la historia que está cautivando a todos. Un despliegue visual impresionante y una narrativa profunda, ahora disponible gracias a {current.scan}.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button className="bg-cyan-500 text-black font-black px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105 active:scale-95 text-sm">
                <Play size={16} fill="currentColor" /> LEER AHORA
              </button>
              <button className="bg-zinc-900/80 backdrop-blur-md text-white font-black px-8 py-3.5 rounded-xl border border-zinc-700/50 flex items-center gap-2 hover:bg-zinc-800 transition-all text-sm">
                <Plus size={16} /> MI LISTA
              </button>
            </div>
          </div>

          {/* Side Image - Smaller scale */}
          <div className="hidden lg:block lg:col-span-5 justify-self-end">
            <div className="relative w-[300px] h-[440px] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 group transform rotate-2 hover:rotate-0 transition-all duration-500">
              <img src={current.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={current.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                 <p className="text-white font-black italic text-xl drop-shadow-lg">{current.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 right-8 z-20 flex items-center gap-4">
        <div className="flex gap-2 mr-4">
          {POPULAR_MANGAS.map((_, i) => (
            <button 
              key={i}
              onClick={() => setActive(i)}
              className={`h-1 transition-all duration-500 rounded-full ${active === i ? 'w-8 bg-cyan-500' : 'w-2 bg-zinc-800 hover:bg-zinc-600'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActive((prev) => (prev - 1 + POPULAR_MANGAS.length) % POPULAR_MANGAS.length)}
            className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setActive((prev) => (prev + 1) % POPULAR_MANGAS.length)}
            className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
