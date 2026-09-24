import React, { useState, useEffect, useRef } from 'react';
import { notify } from '../../util/feedback';
import { Check, Shield, Crown, MessageSquare, ExternalLink } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import CapibaraPlans from './CapibaraPlans';
import SubscribersRanking from './SubscribersRanking';
import DiscordIcon from '../icons/DiscordIcon';

interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  interval: string;
  planId?: string | null;
  canDownload?: boolean;
  canReadUnreleased?: boolean;
  hideAds?: boolean;
}


interface SubscriptionPageProps {
  organization: any;
  user?: any;
  logged?: boolean;
  paypalClientId?: string;
}

interface MangaData {
  id: number;
  slug: string;
  title: string;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  subscriptionPlansCanReadUnreleased?: Array<{ id: number; name: string; canReadUnreleased?: boolean }>;
  subscriptionPlansCanReadReleased?: Array<{ id: number; name: string }>;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ organization, user, logged, paypalClientId }) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [capibaraVisible, setCapibaraVisible] = useState(false);
  const paypalButtonsRendered = useRef<Set<number>>(new Set());
  const [mangaSlug, setMangaSlug] = useState<string | null>(null);
  const [chapterNumber, setChapterNumber] = useState<string | null>(null);
  const [mangaData, setMangaData] = useState<MangaData | null>(null);
  const [loadingManga, setLoadingManga] = useState(false);

  // Read URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('mangaSlug') || urlParams.get('MangaSLug') || urlParams.get('MangaSlug');
    const chapter = urlParams.get('chapterNumber');
    
    if (slug) {
      setMangaSlug(slug);
    }
    if (chapter) {
      setChapterNumber(chapter);
    }
  }, []);

  // Fetch manga data if mangaSlug exists
  useEffect(() => {
    const fetchMangaData = async () => {
      if (!mangaSlug || !organization?.slug) return;
      
      try {
        setLoadingManga(true);
        const result = await callAPI(`/api/manga-custom/${mangaSlug}`);
        if (result && result.id) {
          setMangaData(result);
        }
      } catch (error) {
        console.error('Error fetching manga data:', error);
      } finally {
        setLoadingManga(false);
      }
    };

    if (mangaSlug) {
      fetchMangaData();
    }
  }, [mangaSlug, organization?.slug]);

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
        const result = await callAPI('/api/subscription-plan');

        // El API retorna { items: [...], maxPage: X, total: Y }
        if (result && typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.items) && result.items.length > 0) {
          // Ordenar por precio de menor a mayor (más barato primero)
          const sortedPlans = [...result.items].sort((a, b) => a.price - b.price);
          setSubscriptionPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    if (organization?.slug) {
      fetchPlans();
    }
  }, [organization]);


  // Get rank config for donors based on plan price
  const getRankConfigByPlanIndex = (planIndex: number) => {
    // Validar que planIndex esté en rango
    if (planIndex < 0 || planIndex >= subscriptionPlans.length) {
      console.warn(`Invalid planIndex: ${planIndex}, total plans: ${subscriptionPlans.length}`);
      // Usar el último plan como fallback
      planIndex = subscriptionPlans.length - 1;
    }
    
    const config = getPlanColorConfig(planIndex, subscriptionPlans.length);
    // Convert plan color config to rank config format
    // Ahora el orden es de más barato a más caro, así que invertimos los iconos
    const totalPlans = subscriptionPlans.length;
    const reversedIndex = totalPlans - 1 - planIndex; // Invertir el índice para asignar iconos
    
    const icons = [
      <Shield size={12} fill="currentColor" />, // B - Más barato (índice 0 en la lista)
      <Shield size={12} fill="currentColor" />, // A
      <Shield size={12} fill="currentColor" />, // S
      <Crown size={12} fill="currentColor" />, // SS+ - Más caro (último índice)
    ];
    
    // Get plan name
    const planName = subscriptionPlans[planIndex]?.name || '';
    
    // Convert color classes properly
    let bg = '';
    let borderColor = '';
    if (config.color.includes('yellow')) {
      bg = 'bg-yellow-500/10';
      borderColor = 'border-yellow-500/20';
    } else if (config.color.includes('purple')) {
      bg = 'bg-purple-400/10';
      borderColor = 'border-purple-400/20';
    } else if (config.color.includes('cyan')) {
      bg = 'bg-cyan-400/10';
      borderColor = 'border-cyan-400/20';
    } else {
      bg = 'bg-zinc-400/10';
      borderColor = 'border-zinc-400/20';
    }
    
    return {
      color: config.color,
      bg,
      border: borderColor,
      icon: icons[Math.min(reversedIndex, 3)],
      planName,
    };
  };

  // Get plan color config based on price order (sorted ascending - cheapest first)
  // Los colores van del más barato al más caro: zinc (B) -> cyan (A) -> purple (S) -> yellow (SS+)
  const getPlanColorConfig = (index: number, total: number) => {
    // Validar índice
    if (index < 0 || index >= total) {
      console.warn(`Invalid index in getPlanColorConfig: ${index}, total: ${total}`);
      index = Math.max(0, Math.min(index, total - 1));
    }
    
    // Definir los 4 colores base según el orden (más barato primero)
    const colors = [
      { color: 'text-zinc-400', border: 'border-zinc-500' },     // B - Más barato (índice 0)
      { color: 'text-cyan-400', border: 'border-cyan-500' },    // A
      { color: 'text-purple-400', border: 'border-purple-500' }, // S
      { color: 'text-yellow-400', border: 'border-yellow-500' }, // SS+ - Más caro (último índice)
    ];

    if (total === 1) {
      return colors[3]; // Si solo hay uno, usar el color más alto (yellow)
    } else if (total === 2) {
      // Si hay 2: el primero (más barato) = zinc, el último (más caro) = yellow
      return index === 0 ? colors[0] : colors[3];
    } else if (total === 3) {
      // Si hay 3: zinc, cyan, yellow
      return index === 0 ? colors[0] : index === 1 ? colors[1] : colors[3];
    } else {
      // 4 o más planes: mapear directamente a los 4 colores
      // Dividir el rango total en 4 segmentos iguales
      const lastIndex = total - 1;
      const segmentSize = lastIndex / 3; // Dividir en 3 segmentos (4 colores)
      
      if (index === 0) {
        return colors[0]; // Primer índice siempre = zinc
      } else if (index === lastIndex) {
        return colors[3]; // Último índice siempre = yellow
      } else if (index <= segmentSize) {
        return colors[1]; // Primer segmento = cyan
      } else if (index <= segmentSize * 2) {
        return colors[2]; // Segundo segmento = purple
      } else {
        return colors[3]; // Tercer segmento = yellow (cerca del final)
      }
    }
  };


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
              custom_id: String(user?.id ?? ''),
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
                notify.error(result?.message || 'Hubo un problema al activar tu suscripción tras el pago. Usa el botón "Pedir ayuda" para escribirnos en Discord y te la activamos enseguida.');
                return;
              }

              notify.success('¡Te has suscrito exitosamente!');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err: any) {
              console.error('Error saving subscription:', err);
              notify.error(err?.message || err || 'Ocurrió un error al guardar tu suscripción.');
            }
          },
          onError: function (err: any) {
            console.error('Error creating subscription:', err);
            notify.error(err?.message || err || 'Ocurrió un error al procesar tu suscripción.');
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

  // Get extra benefit text based on mangaSlug, chapterNumber, and plan properties
  const getExtraBenefitText = (plan: SubscriptionPlan): string | null => {
    if (!mangaSlug || !mangaData) return null;
    
    // Check if this plan is in the manga's subscription plans arrays
    const unreleasedPlans = mangaData.subscriptionPlansCanReadUnreleased || [];
    const releasedPlans = mangaData.subscriptionPlansCanReadReleased || [];
    
    // Check if the plan is in unreleased plans
    const isInUnreleased = unreleasedPlans.some(p => p.id === plan.id);
    // Check if the plan is in released plans
    const isInReleased = releasedPlans.some(p => p.id === plan.id);
    
    // Only add benefit if the plan is in at least one of the arrays
    if (!isInUnreleased && !isInReleased) return null;
    
    const mangaName = mangaData.title || mangaSlug.toUpperCase();
    
    // Determine access type based on which arrays the plan is in
    if (chapterNumber) {
      if (isInUnreleased && isInReleased) {
        return `Acceso exclusivo y anticipado al capitulo ${chapterNumber} de ${mangaName}`;
      } else if (isInUnreleased) {
        return `Acceso anticipado al capitulo ${chapterNumber} de ${mangaName}`;
      } else {
        return `Acceso exclusivo al capitulo ${chapterNumber} de ${mangaName}`;
      }
    } else {
      if (isInUnreleased && isInReleased) {
        return `Acceso exclusivo y anticipado a ${mangaName}`;
      } else if (isInUnreleased) {
        return `Acceso anticipado a ${mangaName}`;
      } else {
        return `Acceso exclusivo a ${mangaName}`;
      }
    }
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

  // Get banner style for gradient background
  const getBannerStyle = () => {
    const bannerImage = mangaData?.bannerUrl || mangaData?.imageUrl;
    if (!bannerImage || !mangaSlug) return {};
    // Use banner as background if mangaSlug exists (with or without chapterNumber)
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${bannerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    };
  };

  // Check if we should show background banner
  const hasBackgroundBanner = mangaSlug && (mangaData?.bannerUrl || mangaData?.imageUrl);
  const bannerImage = mangaData?.bannerUrl || mangaData?.imageUrl;

  return (
    <div 
      className={`pt-24 pb-24 min-h-screen relative ${hasBackgroundBanner ? '' : 'bg-zinc-950'}`}
      style={getBannerStyle()}
    >
        {/* Fondo: luz suave desde arriba y una rejilla tenue que se desvanece,
            para dar profundidad sin competir con las tarjetas. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute top-40 right-[8%] w-[420px] h-[420px] rounded-full bg-amber-400/[0.06] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-3 md:px-8 relative z-10">
          {/* Planes Capibara (validos en todos los scans). Este scan queda como
              origen del suscriptor y se lleva el 25% de cada pago. */}
          <CapibaraPlans
            user={user}
            logged={logged}
            paypalClientId={paypalClientId}
            scanNombre={organization?.name || organization?.title}
            onVisible={setCapibaraVisible}
          />

          {/* Los planes propios del scan (legacy) ya no admiten altas: no se
              muestran. Sus suscriptores siguen en el ranking, como Legacy. */}

          {/* Discord: comunidad y soporte, en una franja a todo el ancho. */}
          <a
            href={organization?.discordUrl || 'https://capibaratraductor.com/discord'}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mb-24 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 overflow-hidden rounded-3xl border border-[#5865F2]/30 bg-gradient-to-r from-[#5865F2]/15 via-zinc-900/60 to-zinc-900/60 px-6 py-7 sm:px-10 sm:py-8 transition-all hover:border-[#5865F2]/60 hover:shadow-[0_0_50px_-12px_rgba(88,101,242,0.45)]"
          >
            <div className="shrink-0 grid place-items-center w-16 h-16 rounded-2xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 transition-transform group-hover:scale-105">
              <DiscordIcon size={34} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Únete al Discord de {organization?.name || organization?.title || 'CapibaraTraductor'}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">Avisos de capítulos nuevos, comunidad y ayuda con tu suscripción.</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-bold text-white transition-colors group-hover:bg-[#4752c4]">
              Entrar al servidor <ExternalLink size={15} />
            </span>
          </a>

          <SubscribersRanking slug={organization?.slug} nombre={organization?.name || organization?.title} />
        </div>
    </div>
  );
};

export default SubscriptionPage;

