import React, { useMemo, useState } from 'react';
import { Trophy, Crown, Star, Heart, MessageSquare, ShieldCheck, LogIn, Play, Clock, BookMarked, Sparkles } from 'lucide-react';

interface Donor {
  name: string;
  days: number;
  rank: 'SS+' | 'S' | 'A' | 'B';
}

interface HistoryItem {
  id: string;
  mangaName: string;
  chapterNumber: string;
  chapterTitle: string;
  lastVisited: string;
}

interface ScanSidebarProps {
  onSubscribeClick: () => void;
}

const ScanSidebar: React.FC<ScanSidebarProps> = ({ onSubscribeClick }) => {
  // Estado simulado de autenticación para demostración
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const rawDonors: Donor[] = [
    { name: 'Arley155', days: 450, rank: 'SS+' },
    { name: 'KuroNeko_99', days: 420, rank: 'SS+' },
    { name: 'Dayane', days: 332, rank: 'S' },
    { name: 'Nay13sos', days: 326, rank: 'A' },
    { name: 'Fredy193', days: 296, rank: 'A' },
    { name: 'alecin', days: 203, rank: 'B' },
    { name: 'Zenitsu_Fan', days: 510, rank: 'SS+' },
    { name: 'MangaLover', days: 340, rank: 'S' },
    { name: 'CapyWatcher', days: 180, rank: 'B' },
    { name: 'MangaExplorer', days: 90, rank: 'B' },
  ];

  const userHistory: HistoryItem[] = [
    { id: '1', mangaName: 'Capibara Knight', chapterNumber: '142', chapterTitle: 'El amanecer del roedor', lastVisited: 'Hoy, 14:30' },
    { id: '2', mangaName: 'Digital Horizon', chapterNumber: '54', chapterTitle: 'Protocolo Zero', lastVisited: 'Ayer, 21:15' },
    { id: '3', mangaName: 'Neon Ronin', chapterNumber: 'Final', chapterTitle: 'El último corte', lastVisited: 'Hace 3 días' },
  ];

  const groupedDonors = useMemo(() => {
    const order: Donor['rank'][] = ['SS+', 'S', 'A', 'B'];
    const groups = order.map(rank => ({
      rank,
      members: rawDonors
        .filter(d => d.rank === rank)
        .sort((a, b) => b.days - a.days)
    }));
    return groups.filter(g => g.members.length > 0);
  }, [rawDonors]);

  const getRankConfig = (rank: string) => {
    switch (rank) {
      case 'SS+': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Crown size={12} fill="currentColor" /> };
      case 'S': return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Star size={12} fill="currentColor" /> };
      case 'A': return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: <ShieldCheck size={12} fill="currentColor" /> };
      default: return { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: <Heart size={12} fill="currentColor" /> };
    }
  };

  return (
    <aside className="lg:col-span-4 space-y-8 pt-16">
      <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar space-y-8">
        
        {/* Continuar Leyendo - MOVIDO AL PRINCIPIO */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <BookMarked size={20} className="text-cyan-500" /> Continuar leyendo
            </h3>
          </div>

          {!isLoggedIn ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/50">
                <LogIn size={24} className="text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                Regístrate o Inicia sesión para ver y guardar tu historial de lectura.
              </p>
              <button 
                onClick={() => setIsLoggedIn(true)}
                className="w-full py-3.5 bg-cyan-500 text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
              >
                Ingresar ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-1 truncate">{item.mangaName}</p>
                      <h4 className="text-white font-bold text-xs truncate">
                        Cap. {item.chapterNumber} - {item.chapterTitle}
                      </h4>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-all shrink-0">
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-zinc-600 text-[8px] font-bold uppercase tracking-widest">
                    <Clock size={10} />
                    <span>Visto: {item.lastVisited}</span>
                  </div>
                </div>
              ))}
              
              <button className="w-full mt-4 text-center text-[10px] font-black text-zinc-500 hover:text-cyan-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group">
                Ver historial completo <Play size={10} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Top Donadores Agrupados - MOVIDO ABAJO DEL HISTORIAL */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <Trophy size={20} className="text-yellow-500" /> Top Donadores
            </h3>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Scroll ↓</span>
          </div>
          
          {/* Lista de donadores scrolleable */}
          <div className="max-h-[350px] overflow-y-auto pr-3 space-y-8 custom-scrollbar relative z-10">
            {groupedDonors.map((group) => {
              const config = getRankConfig(group.rank);
              return (
                <div key={group.rank} className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 bg-[#0c0c0e]/80 backdrop-blur-md py-1 z-10">
                    <div className={`px-3 py-1 rounded-lg border font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 ${config.bg} ${config.color} ${config.border}`}>
                      {config.icon} {group.rank}
                    </div>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                  </div>

                  <div className="space-y-2">
                    {group.members.map((user, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/80 transition-all hover:translate-x-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs border border-zinc-800 transition-colors ${config.color}`}>
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs leading-none mb-1">{user.name}</p>
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{user.days} días</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={onSubscribeClick}
            className="w-full mt-6 py-3 bg-yellow-500 text-zinc-950 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg shadow-yellow-500/10"
          >
            Ser Patrocinador
          </button>
        </div>

        {/* Discord Advertisement Banner */}
        <div className="group relative bg-[#5865F2] rounded-[32px] p-8 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(88,101,242,0.3)] hover:-translate-y-1 cursor-pointer">
          {/* Decorative Elements */}
          <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700">
            <MessageSquare size={200} fill="white" />
          </div>
          <div className="absolute top-4 right-4 text-white/20 animate-pulse">
            <Sparkles size={24} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
                <MessageSquare size={28} className="text-[#5865F2]" fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 font-black text-[10px] uppercase tracking-[0.3em]">Comunidad VIP</span>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Discord Oficial</h3>
              </div>
            </div>
            
            <p className="text-white/90 text-sm font-bold leading-relaxed">
              ¿Quieres leer antes que nadie? ¡Únete a nuestro servidor para recibir alertas al instante y charlar con el staff!
            </p>
            
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-3 bg-white text-[#5865F2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-xl active:scale-95 group-hover:shadow-white/20"
            >
              ¡Unirse Ahora!
            </a>
          </div>
        </div>

        {/* Estilos adicionales para scrollbars */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `}} />
      </div>
    </aside>
  );
};

export default ScanSidebar;