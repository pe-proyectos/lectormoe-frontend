import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crown, Globe, Lock, Minus, RotateCcw } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { notify } from '../../util/feedback';

type Tier = 'gratis' | 'lector' | 'plus' | 'premium';
type Nivel = Tier | 'legacy';
interface Limites { miLista: number | null; favoritos: number | null; descargas: number | null }
interface Plan { id: number; planId: string; name: string; tier: Exclude<Tier, 'gratis'>; interval: 'MONTH' | 'YEAR'; price: number; currency: string }
interface Datos {
  lanzado: boolean;
  visible: boolean;
  nivel: Nivel;
  limitesPorNivel: Record<Tier, Limites>;
  planes: Plan[];
  actual: { planId: number; tier: Tier; interval: 'MONTH' | 'YEAR' } | null;
}

const ORDEN: Record<Tier, number> = { gratis: 0, lector: 1, plus: 2, premium: 3 };
const NOMBRE: Record<Tier, string> = { gratis: 'Gratis', lector: 'Lector', plus: 'Plus', premium: 'Premium' };

declare global {
  interface Window { paypal?: any }
}

// Aspecto de cada tarjeta. Plus destaca en azul y Premium en dorado.
const TEMA: Record<Tier, {
  tarjeta: string; titulo: string; acento: string; check: string; boton: string;
  etiqueta?: { texto: string; clase: string };
}> = {
  gratis: {
    tarjeta: 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700',
    titulo: 'text-white', acento: 'text-zinc-400', check: 'text-zinc-400',
    boton: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  },
  lector: {
    tarjeta: 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600',
    titulo: 'text-white', acento: 'text-cyan-400', check: 'text-cyan-400',
    boton: 'bg-zinc-100 text-zinc-950 hover:bg-white',
  },
  plus: {
    tarjeta: 'border-cyan-400/60 bg-gradient-to-b from-cyan-500/[0.12] to-zinc-900/70 shadow-[0_0_45px_-15px_rgba(34,211,238,0.55)] hover:border-cyan-300',
    titulo: 'text-cyan-300', acento: 'text-cyan-300', check: 'text-cyan-300',
    boton: 'bg-cyan-400 text-zinc-950 hover:bg-cyan-300',
    etiqueta: { texto: 'Más popular', clase: 'bg-cyan-400 text-zinc-950' },
  },
  premium: {
    tarjeta: 'border-amber-400/70 bg-gradient-to-b from-amber-400/[0.14] via-amber-500/[0.04] to-zinc-900/70 shadow-[0_0_55px_-12px_rgba(251,191,36,0.55)] hover:border-amber-300',
    titulo: 'text-amber-300', acento: 'text-amber-300', check: 'text-amber-300',
    boton: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-zinc-950 hover:from-amber-200 hover:to-yellow-400',
    etiqueta: { texto: 'Todo incluido', clase: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-zinc-950' },
  },
};

interface Props {
  user: any;
  logged: boolean;
  paypalClientId?: string;
  /** Nombre del scan desde el que se suscribe (se lleva el 25% de origen). */
  scanNombre?: string | null;
  /** Avisa si los planes Capibara se estan mostrando. */
  onVisible?: (visible: boolean) => void;
}

/**
 * Planes Capibara: validos en todos los scans. Se muestran tambien en la pagina
 * de suscripciones de cada scan, y ese scan queda como origen del suscriptor.
 */
const CapibaraPlans: React.FC<Props> = ({ user, logged, paypalClientId, scanNombre, onVisible }) => {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [anual, setAnual] = useState(false);
  const [sdkListo, setSdkListo] = useState(false);
  const renderizados = useRef<Set<string>>(new Set());

  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';

  useEffect(() => {
    callAPI(`/api/capibara-plans${preview ? '?preview=1' : ''}`)
      .then((d: Datos) => {
        setDatos(d);
        onVisible?.(!!d?.visible);
        if (d?.actual?.interval === 'YEAR') setAnual(true);
      })
      .catch(() => setDatos(null));
  }, [preview]);

  // SDK de PayPal (el mismo que usa la pagina de planes por scan).
  useEffect(() => {
    if (!paypalClientId || !datos?.visible) return;
    if (window.paypal) { setSdkListo(true); return; }
    const id = 'paypal-sdk';
    const previo = document.getElementById(id);
    if (previo) { previo.addEventListener('load', () => setSdkListo(true)); return; }
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`;
    s.onload = () => setSdkListo(true);
    document.body.appendChild(s);
  }, [paypalClientId, datos?.visible]);

  const intervalo = anual ? 'YEAR' : 'MONTH';
  const planesVisibles = useMemo(
    () => (datos?.planes || []).filter((p) => p.interval === intervalo),
    [datos, intervalo]
  );

  const nivel: Nivel = datos?.nivel || 'gratis';
  const tierActual: Tier = nivel === 'legacy' ? 'gratis' : nivel;
  const tienePlataforma = !!datos?.actual;

  // Subir de plan es contratar el nuevo a su precio completo: al activarse, el
  // API suspende la suscripcion anterior, asi que nunca se pagan dos.
  useEffect(() => {
    if (!sdkListo || !window.paypal || !logged) return;
    for (const plan of planesVisibles) {
      const cont = `capibara-pp-${plan.id}`;
      const nodo = document.getElementById(cont);
      if (!nodo || renderizados.current.has(cont)) continue;
      renderizados.current.add(cont);
      window.paypal
        .Buttons({
          style: { layout: 'vertical', shape: 'pill', label: 'subscribe', height: 40 },
          createSubscription: (_d: any, actions: any) =>
            actions.subscription.create({ plan_id: plan.planId, custom_id: String(user?.id ?? '') }),
          onApprove: async (d: any) => {
            try {
              await callAPI('/api/subscription', {
                method: 'POST',
                body: JSON.stringify({ paypalSubscriptionId: d.subscriptionID, subscriptionPlanId: plan.id, userId: user?.id }),
              });
              notify.success(`¡Ya eres ${NOMBRE[plan.tier]}!`);
              setTimeout(() => window.location.reload(), 1000);
            } catch (e: any) {
              notify.error(e?.message || 'El pago se hizo pero no pudimos activar tu plan. Escríbenos por Discord y lo activamos enseguida.');
            }
          },
          onError: () => notify.error('PayPal no pudo procesar el pago. Inténtalo de nuevo.'),
        })
        .render(`#${cont}`);
    }
  }, [sdkListo, planesVisibles, logged, user?.id, datos?.actual?.planId]);

  // Al cambiar mensual/anual los contenedores se regeneran.
  useEffect(() => { renderizados.current.clear(); }, [anual]);

  if (!datos?.visible) return null;

  const L = datos.limitesPorNivel;
  const tarjetas: Array<{ tier: Tier; plan?: Plan }> = [
    { tier: 'gratis' },
    ...(['lector', 'plus', 'premium'] as const).map((t) => ({ tier: t, plan: planesVisibles.find((p) => p.tier === t) })),
  ];

  // Cada fila es [texto, incluido]. Las cantidades se redactan completas para
  // que "ilimitado" concuerde con cada sustantivo.
  const filas = (t: Tier): Array<[string, boolean]> => {
    const { miLista, favoritos, descargas } = L[t];
    return [
      ['Sin anuncios', t !== 'gratis'],
      [miLista === null ? 'Mi lista ilimitada' : `${miLista} obras en Mi lista`, true],
      [favoritos === null ? 'Favoritos ilimitados' : `${favoritos} favoritos`, true],
      [descargas === null ? 'Descargas offline ilimitadas' : `${descargas} descargas offline`, true],
      ['Capítulos anticipados de todos los scans', t === 'premium'],
    ];
  };

  return (
    <section className="max-w-6xl mx-auto mb-20">
      {/* Cabecera compacta: las cuatro tarjetas y sus botones de pago tienen que
          verse sin hacer scroll. */}
      <header className="text-center mb-10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
          Suscripción Capibara{scanNombre ? ` · apoyas a ${scanNombre}` : ''}
        </p>
        <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
          Un plan, todos los scans
        </h1>
        {nivel === 'legacy' && (
          <p className="text-amber-400/90 text-sm">
            Tienes una suscripción anterior a un scan. Si eliges un plan Capibara, la reemplazará.
          </p>
        )}
        <div className="inline-flex p-1 rounded-full bg-zinc-900 border border-zinc-800">
          {[false, true].map((a) => (
            <button
              key={String(a)}
              type="button"
              onClick={() => setAnual(a)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${anual === a ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
            >
              {a ? 'Anual · 2 meses gratis' : 'Mensual'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {tarjetas.map(({ tier, plan }) => {
          const esActual = tier === tierActual && (tier === 'gratis' || datos.actual?.interval === intervalo);
          const esInferior = ORDEN[tier] < ORDEN[tierActual];
          const tema = TEMA[tier];
          return (
            <div
              key={tier}
              className={`relative flex flex-col h-full rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${tema.tarjeta}`}
            >
              {tema.etiqueta && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${tema.etiqueta.clase}`}>
                  {tema.etiqueta.texto}
                </span>
              )}
              <h3 className={`flex items-center gap-2 text-xl font-black uppercase italic tracking-tight ${tema.titulo}`}>
                {tier === 'premium' && <Crown size={20} className="text-amber-300" fill="currentColor" />}
                {NOMBRE[tier]}
              </h3>
              <div className="mt-2 mb-5">
                <span className="text-4xl font-black text-white">${tier === 'gratis' ? 0 : plan?.price ?? '—'}</span>
                <span className="text-zinc-500 text-sm">{tier === 'gratis' ? '' : anual ? ' /año' : ' /mes'}</span>
                {anual && plan && <p className={`text-[11px] mt-1 ${tema.acento}`}>Equivale a ${(plan.price / 12).toFixed(2)} al mes</p>}
              </div>

              <ul className="space-y-2.5 text-sm flex-1">
                {/* Solo lo que el plan incluye: listar tambien lo que no incluye con
                    un guion gris se leia como una viñeta mas, y parecia que el
                    plan Gratis traia capitulos anticipados. */}
                {filas(tier).filter(([, incluido]) => incluido).map(([texto]) => (
                  <li key={texto} className="flex items-start gap-2">
                    <Check size={16} className={`shrink-0 mt-0.5 ${tema.check}`} />
                    <span className="text-zinc-300">{texto}</span>
                  </li>
                ))}
                {tier === 'gratis' && (
                  <li className="flex items-start gap-2 text-zinc-400"><Minus size={16} className="shrink-0 mt-0.5 text-zinc-600" /> Con anuncios</li>
                )}
              </ul>

              <div className="mt-6 min-h-[44px]">
                {tier === 'gratis' && !logged ? (
                  <a href="/login" className="w-full text-center rounded-full min-h-[44px] px-3 py-2 flex items-center justify-center leading-tight border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors">
                    Inicia sesión para tener estos beneficios
                  </a>
                ) : esActual ? (
                  <div className="w-full text-center rounded-full min-h-[44px] px-3 py-2 flex items-center justify-center leading-tight bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-widest">Ya tienes esta</div>
                ) : esInferior ? (
                  <div className="w-full text-center rounded-full min-h-[44px] px-3 py-2 flex items-center justify-center leading-tight border border-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest">Ya eres {NOMBRE[tierActual]}</div>
                ) : tier === 'gratis' ? null : !logged ? (
                  <a href="/login" className={`w-full text-center rounded-full min-h-[44px] px-3 py-2 flex items-center justify-center leading-tight text-[11px] font-black uppercase tracking-widest transition-colors ${tema.boton}`}>
                    Inicia sesión para suscribirte
                  </a>
                ) : !plan ? (
                  <div className="text-center text-zinc-600 text-xs">No disponible</div>
                ) : (
                  <>
                    {tierActual !== 'gratis' && (
                      <p className={`text-center text-[11px] font-black uppercase tracking-widest mb-2 ${tema.acento}`}>
                        {ORDEN[tier] > ORDEN[tierActual] ? `Subir a ${NOMBRE[tier]}` : `Pasar a ${anual ? 'anual' : 'mensual'}`}
                      </p>
                    )}
                    <div id={`capibara-pp-${plan.id}`} key={`${plan.id}-${intervalo}`} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Señales de confianza justo debajo de los precios. */}
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-400">
        <li className="flex items-center gap-2"><Lock size={14} className="text-emerald-400" /> Pago seguro con PayPal</li>
        <li className="flex items-center gap-2"><RotateCcw size={14} className="text-emerald-400" /> Cancela cuando quieras</li>
        <li className="flex items-center gap-2"><Globe size={14} className="text-emerald-400" /> Válido en todos los scans</li>
      </ul>

      <p className="text-center text-zinc-500 text-xs mt-4">
        {tienePlataforma ? 'Al subir de plan pagas el precio del nuevo y tu plan actual se detiene: nunca pagas dos a la vez. ' : ''}
        ¿Problemas con el pago?{' '}
        <a href="https://capibaratraductor.com/discord" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
          Pide ayuda en Discord
        </a>
      </p>
    </section>
  );
};

export default CapibaraPlans;
