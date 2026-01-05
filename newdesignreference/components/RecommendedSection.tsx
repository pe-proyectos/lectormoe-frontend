
import React from 'react';
import { RECOMMENDED_MANGA } from '../constants';
import { Flame, Play, Plus } from 'lucide-react';

const RecommendedSection: React.FC = () => {
  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
      <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-zinc-900/20">
        <div className="absolute inset-0">
          <img 
            src={RECOMMENDED_MANGA.cover} 
            className="w-full h-full object-cover opacity-20 blur-2xl"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-12 items-center gap-12 p-8 md:p-16">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <Flame size={12} fill="currentColor" /> Lo más leído en la última hora
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tighter italic uppercase">
                {RECOMMENDED_MANGA.title}
              </h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Escrito por {RECOMMENDED_MANGA.author} • {RECOMMENDED_MANGA.scan}</p>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl font-medium">
              {RECOMMENDED_MANGA.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button className="bg-white text-zinc-950 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-cyan-500 transition-all flex items-center gap-2">
                <Play size={18} fill="currentColor" /> Comenzar lectura
              </button>
              <button className="bg-zinc-800/50 text-white border border-zinc-700/50 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Plus size={18} /> Añadir a mi lista
              </button>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 relative group">
            <div className="relative aspect-[3/4] w-full max-w-sm ml-auto rounded-3xl overflow-hidden shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-700">
              <img src={RECOMMENDED_MANGA.cover} className="w-full h-full object-cover" alt={RECOMMENDED_MANGA.title} />
              <div className="absolute inset-0 border-[12px] border-white/5 pointer-events-none" />
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedSection;
