import React, { useState, useEffect, useMemo } from 'react';
import { Crown, Trophy, Heart } from 'lucide-react';

interface TopDonor {
  id: number;
  username: string;
  slug: string;
  imageUrl: string | null;
  days: number;
  legacy?: boolean;
  subscriptionPlan: { id: number; name: string; price: number; tier?: string | null };
}

interface GroupedDonor extends TopDonor {
  planIndex: number;
}

// Ranking de suscriptores de un scan, o de toda la página con slug 'capibara'.
const SubscribersRanking: React.FC<{ slug?: string; nombre?: string }> = ({ slug, nombre }) => {
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoadingDonors(true);
    fetch(`${import.meta.env['PUBLIC_API_URL']}/api/organization/${slug}/top-donors`, { credentials: 'include' })
      .then((r) => r.json())
      .then((result) => { if (result?.status === true && result?.data) setTopDonors(result.data); })
      .catch((error) => console.error('Error fetching top donors:', error))
      .finally(() => setLoadingDonors(false));
  }, [slug]);

  // Ranking de suscriptores del scan. Primero los del plan Capibara (por nivel)
  // y despues los de los planes propios anteriores, agrupados como Legacy;
  // dentro de cada grupo, por precio y antiguedad. Ya no depende de la lista
  // de planes del scan, que tras el lanzamiento viene vacia.
  const ORDEN_TIER: Record<string, number> = { premium: 3, plus: 2, lector: 1 };
  const donorsWithPlanIndex: GroupedDonor[] = useMemo(() => {
    return topDonors
      .map((d) => ({ ...d, planIndex: d.legacy ? 0 : ORDEN_TIER[d.subscriptionPlan?.tier || ''] || 0 }))
      .sort((a, b) => {
        if (!!a.legacy !== !!b.legacy) return a.legacy ? 1 : -1;
        if (a.planIndex !== b.planIndex) return b.planIndex - a.planIndex;
        if (a.subscriptionPlan.price !== b.subscriptionPlan.price) return b.subscriptionPlan.price - a.subscriptionPlan.price;
        return b.days - a.days;
      });
  }, [topDonors]);

  // Insignia de cada suscriptor en el ranking.
  const getRankConfig = (d: GroupedDonor) => {
    if (d.legacy) {
      return { planName: 'Legacy', color: 'text-zinc-300', bg: 'bg-zinc-800/60', border: 'border-zinc-700' };
    }
    const porTier: Record<number, { color: string; bg: string; border: string }> = {
      3: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40' },
      2: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40' },
      1: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40' },
    };
    return { planName: d.subscriptionPlan.name, ...(porTier[d.planIndex] || porTier[1]) };
  };

  // Organizar para la pirámide (Podio: 1ro al centro, 2do izquierda, 3ro derecha)
  const topThree = donorsWithPlanIndex.slice(0, 3);
  const podium = topThree.length >= 3 ? [
    topThree[1], // #2
    topThree[0], // #1
    topThree[2], // #3
  ] : topThree;
  
  const others = donorsWithPlanIndex.slice(3);

  return (
    <>
          {/* Top Subscribers Full Width Ranking */}
          {loadingDonors ? (
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[48px] p-8 md:p-16">
              <div className="text-center mb-12">
                <div className="h-12 bg-zinc-800 rounded w-64 mx-auto animate-pulse mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-48 mx-auto animate-pulse" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-zinc-950/40 border border-zinc-800 rounded-[32px] p-6 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-800 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-zinc-800 rounded w-24" />
                        <div className="h-3 bg-zinc-800 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : donorsWithPlanIndex.length > 0 ? (
            <div className="space-y-12">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                    <Trophy size={28} />
                  </div>
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ranking de Suscriptores</h3>
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Los pilares que mantienen vivo a {nombre}</p>
              </div>

              <div className="bg-zinc-900/20 border border-zinc-800 rounded-[48px] p-8 md:p-16 relative overflow-hidden">
                {/* Pyramid / Podium Layout */}
                {podium.length >= 3 && (
                  <div className="flex flex-col md:flex-row items-end justify-center gap-12 md:gap-4 mb-24 mt-12">
                    {/* #2 - Left */}
                    <div className="order-2 md:order-1 flex flex-col items-center group w-full max-w-[200px]">
                      <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-zinc-700 to-zinc-400 shadow-2xl overflow-hidden ring-4 ring-zinc-800 ring-offset-4 ring-offset-zinc-950">
                          {podium[0].imageUrl ? (
                            <img src={podium[0].imageUrl} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt={podium[0].username} />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-white font-black text-2xl">
                              {podium[0].username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-black italic shadow-lg border-2 border-zinc-900 text-lg">2</div>
                      </div>
                      <h4 className="text-white font-black italic text-xl mb-1 truncate w-full text-center">{podium[0].username}</h4>
                      {(() => {
                        const rankConfig = getRankConfig(podium[0]);
                        return (
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 border ${rankConfig.bg} ${rankConfig.color} ${rankConfig.border}`}>
                            {rankConfig.planName}
                          </div>
                        );
                      })()}
                      <p className="text-zinc-500 font-bold text-[10px] uppercase">{podium[0].days} días</p>
                    </div>

                    {/* #1 - Center (Tallest) */}
                    <div className="order-1 md:order-2 flex flex-col items-center group w-full max-w-[280px] md:-translate-y-8">
                      <div className="relative mb-8">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce transition-transform duration-1000">
                          <Crown size={56} fill="currentColor" />
                        </div>
                        <div className="w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-yellow-600 to-yellow-200 shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden ring-4 ring-yellow-500 ring-offset-8 ring-offset-zinc-950">
                          {podium[1].imageUrl ? (
                            <img src={podium[1].imageUrl} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt={podium[1].username} />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-white font-black text-4xl">
                              {podium[1].username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-zinc-950 font-black italic text-2xl shadow-xl border-4 border-zinc-950">1</div>
                      </div>
                      <h4 className="text-white font-black italic text-3xl mb-1 tracking-tighter truncate w-full text-center">{podium[1].username}</h4>
                      {(() => {
                        const rankConfig = getRankConfig(podium[1]);
                        return (
                          <div className={`px-5 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest mb-2 border ${rankConfig.bg} ${rankConfig.color} ${rankConfig.border}`}>
                            {rankConfig.planName}
                          </div>
                        );
                      })()}
                      <p className="text-zinc-300 font-bold text-xs uppercase flex items-center gap-2">
                        <Heart size={14} fill="currentColor" className="text-red-500 animate-pulse" /> {podium[1].days} días de apoyo
                      </p>
                    </div>

                    {/* #3 - Right */}
                    <div className="order-3 md:order-3 flex flex-col items-center group w-full max-w-[200px]">
                      <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-orange-800 to-orange-400 shadow-2xl overflow-hidden ring-4 ring-zinc-800 ring-offset-4 ring-offset-zinc-950">
                          {podium[2].imageUrl ? (
                            <img src={podium[2].imageUrl} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt={podium[2].username} />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-white font-black text-2xl">
                              {podium[2].username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-white font-black italic shadow-lg border-2 border-zinc-900 text-lg">3</div>
                      </div>
                      <h4 className="text-white font-black italic text-xl mb-1 truncate w-full text-center">{podium[2].username}</h4>
                      {(() => {
                        const rankConfig = getRankConfig(podium[2]);
                        return (
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 border ${rankConfig.bg} ${rankConfig.color} ${rankConfig.border}`}>
                            {rankConfig.planName}
                          </div>
                        );
                      })()}
                      <p className="text-zinc-500 font-bold text-[10px] uppercase">{podium[2].days} días</p>
                    </div>
                  </div>
                )}

                {/* Sub-Ranking Grid */}
                {others.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-zinc-800/50">
                    {others.map((user) => {
                      const rankConfig = getRankConfig(user);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-6 bg-zinc-950/40 border border-zinc-800 rounded-[32px] hover:bg-zinc-800/80 hover:border-cyan-500/50 transition-all group shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-cyan-500 transition-colors shadow-inner">
                              {user.imageUrl ? (
                                <img src={user.imageUrl} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" alt={user.username} />
                              ) : (
                                <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-white font-black text-lg">
                                  {user.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-bold group-hover:text-cyan-400 transition-colors leading-none mb-1 text-base">{user.username}</h4>
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{user.days} días suscrito</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${rankConfig.bg} ${rankConfig.color} ${rankConfig.border}`}>
                            {rankConfig.planName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
    </>
  );
};

export default SubscribersRanking;
