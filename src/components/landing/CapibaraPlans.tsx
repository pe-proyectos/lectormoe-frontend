import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Minus, Sparkles } from 'lucide-react';
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
  const [cambiando, setCambiando] = useState<number | null>(null);
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

  // Vuelta de PayPal tras aprobar un cambio de plan.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const cambio = qs.get('cambio');
    if (!cambio) return;
    const limpiar = () => {
      qs.delete('cambio');
      qs.delete('plan');
      const resto = qs.toString();
      window.history.replaceState(null, '', window.location.pathname + (resto ? `?${resto}` : ''));
    };
    if (cambio === 'cancelado') {
      notify.error('Cambio de plan cancelado. Sigues con tu plan actual.');
      limpiar();
      return;
    }
    const planId = Number(qs.get('plan'));
    if (cambio === 'ok' && planId) {
      callAPI('/api/capibara-plans/change/confirm', { method: 'POST', body: JSON.stringify({ planId }) })
        .then(() => {
          notify.success('Tu plan se actualizó.');
          limpiar();
          setTimeout(() => window.location.reload(), 800);
        })
        .catch((e: any) => {
          notify.error(e?.message || 'No pudimos confirmar el cambio. Si PayPal ya te lo cobró, escríbenos por Discord.');
          limpiar();
        });
    }
  }, []);

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

  // Botones de PayPal solo para quien aun no tiene un plan Capibara: los que
  // ya lo tienen cambian de plan con "Subir a", sin pagar dos suscripciones.
  useEffect(() => {
    if (!sdkListo || !window.paypal || !logged || tienePlataforma) return;
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
  }, [sdkListo, planesVisibles, logged, tienePlataforma, user?.id]);

  // Al cambiar mensual/anual los contenedores se regeneran.
  useEffect(() => { renderizados.current.clear(); }, [anual]);

  if (!datos?.visible) return null;

  const cambiarA = async (plan: Plan) => {
    setCambiando(plan.id);
    try {
      const r = await callAPI('/api/capibara-plans/change', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id, returnPath: window.location.pathname }),
      });
      if (r?.approveUrl) {
        window.location.href = r.approveUrl;
        return;
      }
      notify.success('Tu plan se actualizó.');
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      notify.error(e?.message || 'No se pudo cambiar el plan.');
      setCambiando(null);
    }
  };

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
    <section className="mb-20">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <Sparkles size={12} /> Suscripción Capibara
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
          Un plan para todos los scans
        </h2>
        <p className="text-zinc-400">
          Válido en todos los scans de CapibaraTraductor.
          {scanNombre ? ` Suscribiéndote desde aquí también apoyas a ${scanNombre}.` : ''}
        </p>
        {nivel === 'legacy' && (
          <p className="text-amber-400/90 text-sm">
            Tienes una suscripción anterior a un scan. Si eliges un plan Capibara, la reemplazará.
          </p>
        )}
        {!datos.lanzado && (
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Vista previa: aún no anunciado</p>
        )}

        <div className="inline-flex p-1 rounded-full bg-zinc-900 border border-zinc-800 mt-4">
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map(({ tier, plan }) => {
          const esActual = tier === tierActual && (tier === 'gratis' || datos.actual?.interval === intervalo);
          const esInferior = ORDEN[tier] < ORDEN[tierActual];
          const destacado = tier === 'premium';
          return (
            <div
              key={tier}
              className={`flex flex-col rounded-3xl border p-6 ${destacado ? 'border-cyan-500/50 bg-cyan-500/[0.04]' : 'border-zinc-800 bg-zinc-900/60'}`}
            >
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{NOMBRE[tier]}</h3>
              <div className="mt-2 mb-5">
                <span className="text-4xl font-black text-white">${tier === 'gratis' ? 0 : plan?.price ?? '—'}</span>
                <span className="text-zinc-500 text-sm">{tier === 'gratis' ? '' : anual ? ' /año' : ' /mes'}</span>
                {anual && plan && <p className="text-[11px] text-cyan-400 mt-1">Equivale a ${(plan.price / 12).toFixed(2)} al mes</p>}
              </div>

              <ul className="space-y-2.5 text-sm flex-1">
                {filas(tier).map(([texto, incluido]) => (
                  <li key={texto} className="flex items-start gap-2">
                    {incluido ? (
                      <Check size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    ) : (
                      <Minus size={16} className="text-zinc-700 shrink-0 mt-0.5" />
                    )}
                    <span className={incluido ? 'text-zinc-300' : 'text-zinc-600'}>{texto}</span>
                  </li>
                ))}
                {tier === 'gratis' && (
                  <li className="flex items-start gap-2 text-zinc-500"><Minus size={16} className="shrink-0 mt-0.5" /> Con anuncios</li>
                )}
              </ul>

              <div className="mt-6 min-h-[44px]">
                {esActual ? (
                  <div className="w-full text-center rounded-full py-2.5 bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-widest">Ya tienes esta</div>
                ) : esInferior ? (
                  <div className="w-full text-center rounded-full py-2.5 border border-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest">Ya eres {NOMBRE[tierActual]}</div>
                ) : tier === 'gratis' ? null : !logged ? (
                  <a href="/login" className="block w-full text-center rounded-full py-2.5 bg-cyan-500 text-zinc-950 text-xs font-black uppercase tracking-widest">Inicia sesión para suscribirte</a>
                ) : !plan ? (
                  <div className="text-center text-zinc-600 text-xs">No disponible</div>
                ) : tienePlataforma ? (
                  <button
                    type="button"
                    disabled={cambiando !== null}
                    onClick={() => cambiarA(plan)}
                    className="w-full rounded-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-zinc-950 text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    {cambiando === plan.id ? 'Abriendo PayPal…' : ORDEN[tier] > ORDEN[tierActual] ? `Subir a ${NOMBRE[tier]}` : `Cambiar a ${anual ? 'anual' : 'mensual'}`}
                  </button>
                ) : (
                  <div id={`capibara-pp-${plan.id}`} key={`${plan.id}-${intervalo}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tienePlataforma && (
        <p className="text-center text-zinc-500 text-xs mt-6">
          Al cambiar de plan no pagas dos suscripciones: el precio nuevo se aplica desde tu próximo cobro.
        </p>
      )}
    </section>
  );
};

export default CapibaraPlans;
