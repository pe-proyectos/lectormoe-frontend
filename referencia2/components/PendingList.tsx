
import React from 'react';
import { USER_PENDING } from '../constants';
import { Bookmark, Play, Clock, ArrowRight } from 'lucide-react';

const PendingList: React.FC = () => {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Bookmark size={20} />
          </div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Mis Capítulos Pendientes</h3>
        </div>
        <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
          Continuar Todo <ArrowRight size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {USER_PENDING.map((manga) => (
          <div 
            key={manga.id} 
            className="group relative bg-zinc-950/40 hover:bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4 transition-all cursor-pointer overflow-hidden"
          >
            {/* Background Hover Effect */}
            <div className="absolute inset-y-0 left-0 w-1 bg-cyan-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />
            
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.2em]">{manga.scan}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={8} /> {manga.lastUpdate}
                  </span>
                </div>
                
                <h4 className="text-white font-black italic text-lg leading-tight truncate group-hover:text-cyan-400 transition-colors">
                  {manga.title}
                </h4>
                
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                      {manga.chapter} - <span className="text-zinc-500">{manga.chapterTitle}</span>
                    </span>
                    <span className="text-[9px] text-cyan-500/80 font-black uppercase tracking-widest mt-0.5">
                      En {manga.lastPage}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <button className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-all shadow-xl">
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {USER_PENDING.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
             <Bookmark size={32} className="mb-4 text-zinc-800" />
             <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Sin lecturas pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingList;
