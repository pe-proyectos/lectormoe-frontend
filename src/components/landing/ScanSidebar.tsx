import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Star, Heart, MessageSquare, ShieldCheck, LogIn, Play, Clock, BookMarked, Sparkles } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface ScanSidebarProps {
  onSubscribeClick: () => void;
  user?: any;
  logged?: boolean;
  organization: any;
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
    id: number;
    name: string;
    price: number;
  };
  subscriptionId: number;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
}

interface GroupedDonor extends TopDonor {
  planIndex: number;
}

const ScanSidebar: React.FC<ScanSidebarProps> = ({ onSubscribeClick, user, logged, organization, discordUrl }) => {
  const [userHistory, setUserHistory] = useState<HistoryItem[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);

  // Obtener planes de suscripción
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const result = await callAPI('/api/subscription-plan');

        // El API retorna { items: [...], maxPage: X, total: Y }
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items) && result.items.length > 0) {
          // Ordenar por precio de mayor a menor (más caro primero)
          const sortedPlans = [...result.items].sort((a, b) => b.price - a.price);
          setSubscriptionPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };

    if (organization?.slug) {
      fetchPlans();
    }
  }, [organization]);

  // Agrupar donadores por plan de suscripción (ordenado por precio)
  const groupedDonors = useMemo(() => {
    if (topDonors.length === 0 || subscriptionPlans.length === 0) return [];

    // Crear un mapa de planId -> índice en la lista ordenada (más caro a más barato)
    const planIndexMap = new Map<number, number>();
    subscriptionPlans.forEach((plan, index) => {
      planIndexMap.set(plan.id, index);
    });

    // Asignar índice del plan a cada donador
    const donorsWithPlanIndex: GroupedDonor[] = topDonors
      .map(donor => {
        // Buscar el índice del plan del donador en la lista ordenada
        const planIndex = planIndexMap.get(donor.subscriptionPlan.id);
        
        // Si no se encuentra el plan, buscar por nombre como fallback
        if (planIndex === undefined) {
          // Fallback: buscar por nombre del plan
          const planByName = subscriptionPlans.findIndex(p => p.name === donor.subscriptionPlan.name);
          if (planByName !== -1) {
            return {
              ...donor,
              planIndex: planByName,
            };
          }
          
          // Si tampoco se encuentra por nombre, usar el índice 0 (más caro) como último recurso
          console.warn(`Plan ID ${donor.subscriptionPlan.id} and name "${donor.subscriptionPlan.name}" not found in subscriptionPlans`, {
            donorPlan: donor.subscriptionPlan,
            availablePlans: subscriptionPlans.map(p => ({ id: p.id, name: p.name }))
          });
          return {
            ...donor,
            planIndex: 0, // Fallback al más caro (índice 0)
          };
        }
        
        return {
          ...donor,
          planIndex,
        };
      })
      .sort((a, b) => {
        // Primero ordenar por índice del plan (más caro primero, índice 0 es el más caro)
        if (a.planIndex !== b.planIndex) {
          return a.planIndex - b.planIndex;
        }
        // Si tienen el mismo plan, ordenar por días (más días primero)
        return b.days - a.days;
      });

    // Agrupar por plan
    const groups = subscriptionPlans.map((plan, index) => {
      const members = donorsWithPlanIndex.filter(d => d.planIndex === index);
      return {
        planName: plan.name,
        planIndex: index,
        members: members.sort((a, b) => b.days - a.days),
      };
    });

    return groups.filter(g => g.members.length > 0);
  }, [topDonors, subscriptionPlans]);

  // Get color config based on plan index (sorted by price, most expensive first)
  // Los planes están ordenados de más caro (índice 0) a más barato (último índice)
  const getPlanColorConfig = (index: number, total: number) => {
    // Validar índice
    if (index < 0 || index >= total) {
      console.warn(`Invalid index in getPlanColorConfig: ${index}, total: ${total}`);
      index = Math.max(0, Math.min(index, total - 1));
    }
    
    // Definir los 4 colores base según el orden (más caro primero, índice 0)
    const colors = [
      { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Crown size={12} fill="currentColor" /> }, // SS+ - Más caro (índice 0)
      { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Star size={12} fill="currentColor" /> }, // S
      { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: <ShieldCheck size={12} fill="currentColor" /> },    // A
      { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: <Heart size={12} fill="currentColor" /> }     // B - Más barato (último índice)
    ];

    if (total === 1) {
      return colors[0]; // Si solo hay uno, usar el color más alto (yellow)
    } else if (total === 2) {
      // Si hay 2: el primero (más caro) = yellow, el segundo = zinc
      return index === 0 ? colors[0] : colors[3];
    } else if (total === 3) {
      // Si hay 3: yellow, cyan, zinc
      return index === 0 ? colors[0] : index === 1 ? colors[2] : colors[3];
    } else {
      // 4 o más planes: mapear directamente a los 4 colores
      // Dividir el rango total en 4 segmentos
      const lastIndex = total - 1;
      const segmentSize = lastIndex / 3; // Dividir en 3 segmentos (4 colores)
      
      if (index === 0) {
        return colors[0]; // Primer índice siempre = yellow (SS+)
      } else if (index === lastIndex) {
        return colors[3]; // Último índice siempre = zinc (B)
      } else if (index <= segmentSize) {
        return colors[1]; // Primer segmento = purple (S)
      } else if (index <= segmentSize * 2) {
        return colors[2]; // Segundo segmento = cyan (A)
      } else {
        return colors[3]; // Tercer segmento = zinc (B)
      }
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
        const response = await fetch(`${API_URL}/api/organization/${organization?.slug}/top-donors`, {
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

    if (organization?.slug) {
      fetchTopDonors();
    }
  }, [organization]);

  const handleLogin = () => {
    window.location.href = `/${organization?.slug}/login`;
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
                const config = getPlanColorConfig(group.planIndex, subscriptionPlans.length);
                return (
                  <div key={group.planName} className="space-y-4">
                    <div className="flex items-center gap-3 sticky top-0 bg-[#0c0c0e]/80 backdrop-blur-md py-1 z-10">
                      <div className={`px-3 py-1 rounded-lg border font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 ${config.bg} ${config.color} ${config.border}`}>
                        {config.icon} {group.planName}
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

