import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Star, Heart, MessageSquare, ShieldCheck, LogIn, Play, Clock, BookMarked, Sparkles } from 'lucide-react';

interface ScanSidebarProps {
  onSubscribeClick: () => void;
  user?: any;
  logged?: boolean;
  organizationSlug: string;
  discordUrl?: string | null;
}

interface HistoryItem {
  id: string;
  mangaName: string;
  chapterNumber: string;
  chapterTitle: string;
  lastVisited: string;
  mangaUrl: string;
}

interface TopDonor {
  id: number;
  username: string;
  slug: string;
  imageUrl: string | null;
  days: number;
  subscriptionPlan: {
    name: string;
  };
  subscriptionId: number;
}

type DonorRank = 'SS+' | 'S' | 'A' | 'B';

interface GroupedDonor extends TopDonor {
  rank: DonorRank;
}

const ScanSidebar: React.FC<ScanSidebarProps> = ({ onSubscribeClick, user, logged, organizationSlug, discordUrl }) => {
  const [userHistory, setUserHistory] = useState<HistoryItem[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);

  // Agrupar donadores por rango basado en el precio
  const groupedDonors = useMemo(() => {
    if (topDonors.length === 0) return [];

    // Determinar rangos basados en percentiles de días
    const days = topDonors.map(d => d.days).sort((a, b) => b - a);
    const maxDays = days[0] || 0;
    const minDays = days[days.length - 1] || 0;
    const range = maxDays - minDays;

    const assignRank = (days: number): DonorRank => {
      if (range === 0) return 'B';
      const percentile = (days - minDays) / range;
      if (percentile >= 0.8) return 'SS+';
      if (percentile >= 0.6) return 'S';
      if (percentile >= 0.4) return 'A';
      return 'B';
    };

    const donorsWithRank: GroupedDonor[] = topDonors.map(donor => ({
      ...donor,
      rank: assignRank(donor.days),
    }));

      const order: DonorRank[] = ['SS+', 'S', 'A', 'B'];
      const groups = order.map(rank => ({
        rank,
        members: donorsWithRank
          .filter(d => d.rank === rank)
          .sort((a, b) => b.days - a.days)
      }));

    return groups.filter(g => g.members.length > 0);
  }, [topDonors]);

  const getRankConfig = (rank: string) => {
    switch (rank) {
      case 'SS+': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Crown size={12} fill="currentColor" /> };
      case 'S': return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Star size={12} fill="currentColor" /> };
      case 'A': return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: <ShieldCheck size={12} fill="currentColor" /> };
      default: return { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: <Heart size={12} fill="currentColor" /> };
    }
  };

  useEffect(() => {
    // TODO: Fetch user reading history from API
    if (logged && user) {
      // Mock data for now
      setUserHistory([]);
    }
  }, [logged, user]);

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        setLoadingDonors(true);
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/organization/${organizationSlug}/top-donors`, {
          credentials: 'include',
        });
        const result = await response.json();
        
        if (result?.status === true && result?.data) {
          setTopDonors(result.data);
        }
      } catch (error) {
        console.error('Error fetching top donors:', error);
      } finally {
        setLoadingDonors(false);
      }
    };

    if (organizationSlug) {
      fetchTopDonors();
    }
  }, [organizationSlug]);

  const handleLogin = () => {
    window.location.href = `/${organizationSlug}/login`;
  };

  const handleMangaClick = (mangaUrl: string) => {
    window.location.href = mangaUrl;
  };

  return (
    <aside className="lg:col-span-4 space-y-8 pt-16">
      <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar space-y-8">
        
        {/* Continuar Leyendo */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <BookMarked size={20} className="text-cyan-500" /> Continuar leyendo
            </h3>
          </div>

          {!logged ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/50">
                <LogIn size={24} className="text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                Regístrate o Inicia sesión para ver y guardar tu historial de lectura.
              </p>
              <button 
                onClick={handleLogin}
                className="w-full py-3.5 bg-cyan-500 text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
              >
                Ingresar ahora
              </button>
            </div>
          ) : userHistory.length > 0 ? (
            <div className="space-y-3">
              {userHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => handleMangaClick(item.mangaUrl)}
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
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm font-medium">No tienes historial de lectura aún</p>
            </div>
          )}
        </div>

        {/* Top Donadores Agrupados */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <Trophy size={20} className="text-yellow-500" /> Top Donadores
            </h3>
          </div>
          
          {loadingDonors ? (
            <div className="space-y-3 relative z-10">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950/40 rounded-xl animate-pulse">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-24" />
                    <div className="h-2 bg-zinc-800 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedDonors.length > 0 ? (
            <div className="pr-3 space-y-8 relative z-10">
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
                      {group.members.map((donor) => (
                        <div 
                          key={donor.id} 
                          className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/80 transition-all hover:translate-x-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs border border-zinc-800 transition-colors ${config.color} overflow-hidden`}>
                              {donor.imageUrl ? (
                                <img 
                                  src={donor.imageUrl} 
                                  alt={donor.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                donor.username[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-white font-bold text-xs leading-none mb-1">{donor.username}</p>
                              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                                {donor.days} días
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 relative z-10">
              <p className="text-zinc-500 text-sm font-medium mb-4">Aún no hay donadores</p>
            </div>
          )}

          <button 
            onClick={onSubscribeClick}
            className="w-full mt-6 py-3 bg-yellow-500 text-zinc-950 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg shadow-yellow-500/10"
          >
            Ser Patrocinador
          </button>
        </div>

        {/* Discord Advertisement Banner - Solo se muestra si hay discordUrl */}
        {discordUrl && (
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
                  <span className="text-white/80 font-black text-[10px] uppercase tracking-[0.3em]">Comunidad</span>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Discord Oficial</h3>
                </div>
              </div>
              
              <p className="text-white/90 text-sm font-bold leading-relaxed">
                ¿Quieres leer antes que nadie? ¡Únete a nuestro servidor para recibir alertas al instante y charlar con el staff!
              </p>
              
              <a 
                href={discordUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-3 bg-white text-[#5865F2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-xl active:scale-95 group-hover:shadow-white/20"
              >
                ¡Unirse Ahora!
              </a>
            </div>
          </div>
        )}

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

