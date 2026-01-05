import React, { useState, useEffect, useRef } from 'react';
import { Check, Shield, Crown, Trophy, MessageSquare, Heart, ExternalLink } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  planId?: string | null;
  canDownload?: boolean;
  canReadUnreleased?: boolean;
  hideAds?: boolean;
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

interface SubscriptionPageProps {
  organization: any;
  organizationSlug: string;
  user?: any;
  logged?: boolean;
  paypalClientId?: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ organization, organizationSlug, user, logged, paypalClientId }) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalButtonsRendered = useRef<Set<number>>(new Set());

  // Load PayPal SDK
  useEffect(() => {
    if (!paypalClientId || paypalLoaded || window.paypal) {
      return;
    }

    const scriptId = 'paypal-sdk';
    if (document.getElementById(scriptId)) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`;
    script.async = true;
    script.id = scriptId;
    script.onload = () => {
      setPaypalLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [paypalClientId, paypalLoaded]);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/subscription-plan`, {
          headers: {
            'x-organization': organizationSlug,
          },
          credentials: 'include',
        });
        const result = await response.json();
        
        if (result?.status === true && result?.data?.data) {
          // Ordenar por precio de menor a mayor
          const sortedPlans = [...result.data.data].sort((a, b) => a.price - b.price);
          setSubscriptionPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    if (organizationSlug) {
      fetchPlans();
    }
  }, [organizationSlug]);

  // Fetch top donors
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

  // Assign ranks to donors
  const assignRank = (days: number, allDays: number[]): DonorRank => {
    if (allDays.length === 0) return 'B';
    const sortedDays = [...allDays].sort((a, b) => b - a);
    const maxDays = sortedDays[0] || 0;
    const minDays = sortedDays[sortedDays.length - 1] || 0;
    const range = maxDays - minDays;
    
    if (range === 0) return 'B';
    const percentile = (days - minDays) / range;
    if (percentile >= 0.8) return 'SS+';
    if (percentile >= 0.6) return 'S';
    if (percentile >= 0.4) return 'A';
    return 'B';
  };

  // Get plan color config based on price (sorted ascending)
  const getPlanColorConfig = (index: number, total: number) => {
    // Los colores van del más bajo al más alto: zinc (Ex) -> cyan (A) -> purple (S) -> yellow (SS+)
    if (total === 1) {
      return { color: 'text-zinc-400', border: 'border-zinc-500' };
    } else if (total === 2) {
      return index === 0 
        ? { color: 'text-zinc-400', border: 'border-zinc-500' }
        : { color: 'text-yellow-400', border: 'border-yellow-500' };
    } else if (total === 3) {
      const colors = [
        { color: 'text-zinc-400', border: 'border-zinc-500' },
        { color: 'text-cyan-400', border: 'border-cyan-500' },
        { color: 'text-yellow-400', border: 'border-yellow-500' }
      ];
      return colors[index];
    } else {
      // 4 o más planes
      const colors = [
        { color: 'text-zinc-400', border: 'border-zinc-500' },
        { color: 'text-cyan-400', border: 'border-cyan-500' },
        { color: 'text-purple-400', border: 'border-purple-500' },
        { color: 'text-yellow-400', border: 'border-yellow-500' }
      ];
      // Si hay más de 4, los primeros son zinc, y los últimos siguen el patrón
      if (index < total - 3) {
        return { color: 'text-zinc-400', border: 'border-zinc-500' };
      }
      return colors[3 - (total - 1 - index)];
    }
  };

  // Get rank config for donors
  const getRankConfig = (rank: string) => {
    switch (rank) {
      case 'SS+': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Crown size={12} fill="currentColor" /> };
      case 'S': return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Shield size={12} fill="currentColor" /> };
      case 'A': return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: <Shield size={12} fill="currentColor" /> };
      default: return { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: <Shield size={12} fill="currentColor" /> };
    }
  };

  // Process top donors for podium
  const allDays = topDonors.map(d => d.days);
  const donorsWithRank: GroupedDonor[] = topDonors.map(donor => ({
    ...donor,
    rank: assignRank(donor.days, allDays),
  })).sort((a, b) => b.days - a.days);

  // Organizar para la pirámide (Podio: 1ro al centro, 2do izquierda, 3ro derecha)
  const topThree = donorsWithRank.slice(0, 3);
  const podium = topThree.length >= 3 ? [
    topThree[1], // #2
    topThree[0], // #1
    topThree[2], // #3
  ] : topThree;
  
  const others = donorsWithRank.slice(3);

  // Render PayPal button for a plan
  const renderPayPalButton = (plan: SubscriptionPlan, containerId: string) => {
    if (!window.paypal || !plan.planId || paypalButtonsRendered.current.has(plan.id)) {
      return;
    }

    try {
      window.paypal
        .Buttons({
          createSubscription: function (data: any, actions: any) {
            return actions.subscription.create({
              plan_id: plan.planId,
            });
          },
          onApprove: async function (data: any) {
            try {
              const result = await callAPI('/api/subscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paypalSubscriptionId: data.subscriptionID,
                  subscriptionPlanId: plan.id,
                  userId: user?.id,
                }),
              });

              if (!result?.status) {
                alert(result?.message || 'Error al guardar la suscripción. Por favor, contacta con soporte.');
                return;
              }

              alert('¡Te has suscrito exitosamente!');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err: any) {
              console.error('Error saving subscription:', err);
              alert(err?.message || err || 'Ocurrió un error al guardar tu suscripción.');
            }
          },
          onError: function (err: any) {
            console.error('Error creating subscription:', err);
            alert(err?.message || err || 'Ocurrió un error al procesar tu suscripción.');
          },
        })
        .render(`#${containerId}`);
      
      paypalButtonsRendered.current.add(plan.id);
    } catch (error) {
      console.error('Error rendering PayPal button:', error);
    }
  };

  // Check if user has active subscription for a plan
  const hasActiveSubscription = (planId: number): boolean => {
    if (!user?.subscriptions) return false;
    return user.subscriptions.some(
      (sub: any) => sub.subscriptionPlan?.id === planId && sub.active === true
    );
  };

  // Render PayPal buttons when plans are loaded and PayPal SDK is ready
  useEffect(() => {
    if (!paypalLoaded || !logged || subscriptionPlans.length === 0 || !window.paypal) {
      return;
    }

    const timer = setTimeout(() => {
      subscriptionPlans.forEach((plan) => {
        if (plan.planId && !hasActiveSubscription(plan.id)) {
          const containerId = `paypal-button-container-${plan.id}`;
          const container = document.getElementById(containerId);
          if (container && !paypalButtonsRendered.current.has(plan.id)) {
            // Clear container before rendering
            container.innerHTML = '';
            renderPayPalButton(plan, containerId);
          }
        }
      });
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalLoaded, logged, subscriptionPlans.length, user?.id]);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-zinc-950 relative overflow-hidden">
        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <Shield size={12} className="text-cyan-500" /> Membresías de {organization?.name || organization?.title}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
              Suscripciones
            </h1>
            <p className="text-zinc-400 text-lg font-medium">
              ¡Accede a contenido exclusivo y olvídate de los anuncios! Compra un plan de suscripción para apoyar al scan.
            </p>
          </div>

          {/* Pricing Cards */}
          {loadingPlans ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-zinc-900/40 border-2 border-zinc-800 rounded-[32px] p-8 animate-pulse">
                  <div className="h-8 bg-zinc-800 rounded mb-4" />
                  <div className="h-16 bg-zinc-800 rounded mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-zinc-800 rounded" />
                    <div className="h-4 bg-zinc-800 rounded" />
                    <div className="h-4 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : subscriptionPlans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {subscriptionPlans.map((plan, index) => {
                const colorConfig = getPlanColorConfig(index, subscriptionPlans.length);
                
                // Parse benefits from description
                const benefits: string[] = plan.description 
                  ? plan.description.split(/[.\n]/).filter(line => line.trim()).map(line => line.trim())
                  : ['Acceso a contenido exclusivo'];
                
                return (
                  <div 
                    key={plan.id}
                    className={`relative bg-zinc-900/40 border-2 rounded-[32px] p-8 flex flex-col transition-all duration-500 hover:scale-[1.02] hover:bg-zinc-900 ${colorConfig.border}`}
                  >
                    <div className="mb-8">
                      <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${colorConfig.color}`}>
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white text-4xl font-black italic">{plan.currency === 'USD' ? '$' : plan.currency}</span>
                        <span className="text-white text-6xl font-black italic tracking-tighter">{plan.price}</span>
                        <span className="text-zinc-500 font-bold uppercase text-[10px] ml-1">/ MES</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-10 flex-1">
                      {benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex gap-3">
                          <div className="mt-1 shrink-0 w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-cyan-500">
                            <Check size={10} />
                          </div>
                          <span className="text-zinc-300 text-xs font-medium leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {!logged ? (
                      <a
                        href={`/${organizationSlug}/login`}
                        className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all text-center block"
                      >
                        Por favor, inicia sesión para suscribirte
                      </a>
                    ) : hasActiveSubscription(plan.id) ? (
                      <div className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 font-black uppercase text-[10px] tracking-widest text-center">
                        Ya estás suscrito
                      </div>
                    ) : plan.planId ? (
                      <div 
                        id={`paypal-button-container-${plan.id}`}
                        className="paypal-button-container min-h-[48px] flex items-center justify-center"
                      />
                    ) : (
                      <div className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">
                        Plan no disponible
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 mb-20">
              <p className="text-zinc-500 text-lg font-medium">No hay planes de suscripción disponibles</p>
            </div>
          )}

          {/* External Support Grid */}
          {(organization?.patreonUrl || organization?.discordUrl) && (
            <div className="grid md:grid-cols-2 gap-8 mb-24">
              {/* Patreon CTA */}
              {organization?.patreonUrl && (
                <a 
                  href={organization.patreonUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative bg-gradient-to-br from-[#FF424D]/20 to-zinc-900 border border-[#FF424D]/30 rounded-[40px] p-10 flex items-center justify-between overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(255,66,77,0.1)]"
                >
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                      Suscríbete desde Patreon
                    </h2>
                    <p className="text-zinc-400 font-medium">Apoya directamente y obtén beneficios premium.</p>
                    <div className="inline-flex items-center gap-2 text-[#FF424D] font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                      Ir a Patreon <ExternalLink size={16} />
                    </div>
                  </div>
                  <div className="w-24 h-24 bg-[#FF424D] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform shrink-0">
                    <span className="text-white font-black text-4xl italic">P</span>
                  </div>
                </a>
              )}

              {/* Discord CTA */}
              {organization?.discordUrl && (
                <a 
                  href={organization.discordUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative bg-gradient-to-br from-[#5865F2]/20 to-zinc-900 border border-[#5865F2]/30 rounded-[40px] p-10 flex items-center justify-between overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(88,101,242,0.1)]"
                >
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                      Únete a nuestro Discord
                    </h2>
                    <p className="text-zinc-400 font-medium">Reclama tu rango de Patreon en la web y el servidor.</p>
                    <div className="inline-flex items-center gap-2 text-[#5865F2] font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                      Ir a Discord <MessageSquare size={16} />
                    </div>
                  </div>
                  <div className="w-24 h-24 bg-[#5865F2] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform shrink-0">
                    <MessageSquare size={40} className="text-white" fill="currentColor" />
                  </div>
                </a>
              )}
            </div>
          )}

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
          ) : donorsWithRank.length > 0 ? (
            <div className="space-y-12">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                    <Trophy size={28} />
                  </div>
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ranking de Suscriptores</h3>
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Los pilares que mantienen vivo a {organization?.name || organization?.title}</p>
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
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 border border-zinc-700 ${getRankConfig(podium[0].rank).bg} ${getRankConfig(podium[0].rank).border}`}>
                        {podium[0].rank}
                      </div>
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
                      <div className="px-5 py-1.5 bg-yellow-500/10 rounded-lg text-xs font-black uppercase text-yellow-500 tracking-widest mb-2 border border-yellow-500/20">{podium[1].rank}</div>
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
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 ${getRankConfig(podium[2].rank).bg} ${getRankConfig(podium[2].rank).color} ${getRankConfig(podium[2].rank).border}`}>
                        {podium[2].rank}
                      </div>
                      <p className="text-zinc-500 font-bold text-[10px] uppercase">{podium[2].days} días</p>
                    </div>
                  </div>
                )}

                {/* Sub-Ranking Grid */}
                {others.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-zinc-800/50">
                    {others.map((user) => {
                      const rankConfig = getRankConfig(user.rank);
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
                            {user.rank}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
    </div>
  );
};

export default SubscriptionPage;

