
import React, { useRef, useState } from 'react';
import { Manga } from '../types';
import { Clock, Book, ArrowRight, Check, Lock, CreditCard } from 'lucide-react';

interface Props {
  manga: Manga;
  hideScan?: boolean;
  onSubscribe?: () => void;
  onClick?: () => void;
}

const MangaCard3D: React.FC<Props> = ({ manga, hideScan = false, onSubscribe, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSubscribe) onSubscribe();
  };

  return (
    <div 
      className="perspective-1000 w-full group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div 
        ref={cardRef}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 ? 'transform 0.5s ease-out' : 'none'
        }}
        className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300"
      >
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={manga.cover} 
            alt={manga.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          
          {/* Lock Icon for Sub only */}
          {manga.isSubscriberOnly && (
            <div className="absolute top-3 left-3 z-30 p-1.5 bg-yellow-500 rounded-lg text-black shadow-lg">
              <Lock size={12} fill="currentColor" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${manga.status === 'Ongoing' ? 'bg-green-500 text-zinc-950' : 'bg-cyan-500 text-zinc-950'}`}>
              {manga.status}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 backdrop-blur-[2px] z-20">
            
            <button className="w-full bg-white text-zinc-950 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors">
               <Book size={12} /> Ir al Manga
            </button>

            {/* Ultimo Cap Button */}
            <button 
              disabled={manga.isSubscriberOnly}
              className={`w-full bg-zinc-900/90 border ${manga.isSubscriberOnly ? 'border-yellow-500/30 opacity-80' : 'border-zinc-800'} text-white p-2 rounded-xl text-left hover:border-cyan-500/50 transition-all group/btn`}
            >
               <div className="flex items-center justify-between mb-0.5">
                 <span className={`${manga.isSubscriberOnly ? 'text-yellow-500' : 'text-cyan-400'} font-black text-[10px] uppercase flex items-center gap-1`}>
                    {manga.chapter} {manga.isSubscriberOnly && <Lock size={8} />}
                 </span>
                 <span className="text-zinc-600 text-[8px] font-bold">{manga.lastUpdate}</span>
               </div>
               <p className="text-[9px] font-bold truncate leading-none text-zinc-300">
                 {manga.isSubscriberOnly ? 'Solo para suscriptores' : `"${manga.chapterTitle || 'Nuevo capítulo'}"`}
               </p>
               {!manga.isSubscriberOnly && (
                 <div className={`flex items-center gap-1 mt-1.5 text-[8px] font-black uppercase transition-colors ${manga.isRead ? 'text-zinc-600' : 'text-white/40 group-hover/btn:text-cyan-400'}`}>
                    {manga.isRead ? <><Check size={10} className="text-green-500" /> Leído</> : <><ArrowRight size={10} /> Leer ahora</>}
                 </div>
               )}
            </button>

            {/* Prev Cap */}
            {manga.prevChapter && (
              <button className={`w-full bg-zinc-900/40 border border-zinc-800/50 text-white p-2 rounded-xl text-left hover:border-zinc-600 transition-all`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-zinc-400 font-black text-[10px] uppercase">{manga.prevChapter}</span>
                  <span className="text-zinc-700 text-[8px] font-bold">{manga.prevChapterUpdate}</span>
                </div>
                <p className="text-[9px] font-medium truncate text-zinc-600 leading-none">"{manga.prevChapterTitle}"</p>
              </button>
            )}

            {/* Subscribe CTA in Hover */}
            {manga.isSubscriberOnly && (
              <button 
                onClick={handleSubscribeClick}
                className="w-full mt-1 bg-yellow-500 text-black py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg"
              >
                <CreditCard size={12} /> Suscribirme
              </button>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 group-hover:opacity-0 transition-opacity">
            <h3 className="text-white font-black text-base italic leading-tight mb-2 tracking-tight line-clamp-2">
              {manga.title}
            </h3>
            <div className="flex items-center justify-between text-[10px]">
              <span className={`font-black ${manga.isSubscriberOnly ? 'text-yellow-500' : 'text-white'}`}>{manga.chapter}</span>
              <span className="text-zinc-500 font-bold flex items-center gap-1"><Clock size={10} /> {manga.lastUpdate}</span>
            </div>
          </div>
        </div>
        
        {!hideScan && (
          <div className="px-4 py-3 bg-zinc-900/90 border-t border-zinc-800/50 flex items-center justify-between group-hover:bg-zinc-800 transition-colors">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate">{manga.scan}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaCard3D;
