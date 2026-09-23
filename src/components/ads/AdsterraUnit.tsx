import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ADSTERRA_BANNERS, ADSTERRA_NATIVE_KEY, urlInvoke, type AdsterraSize } from '@/util/adsterra';

interface Props {
  /** Tamaño del banner, o 'native' para el banner nativo en rejillas. */
  slot: AdsterraSize | 'native';
  /** Tamaño alternativo por debajo de 768px. Útil para 728x90 → 320x50. */
  mobileSlot?: AdsterraSize;
  className?: string;
  /** Texto pequeño sobre el hueco. Se puede quitar en zonas muy densas. */
  etiqueta?: boolean;
}

/**
 * Hueco de Adsterra.
 *
 * Los snippets de Adsterra usan una global (`atOptions`) que el script lee al
 * cargarse, así que dos unidades en la misma página pisarían su configuración
 * si se cargaran a la vez. Por eso cada hueco se monta dentro de un iframe
 * propio: así cada script ve su `atOptions` y no hay carrera entre unidades.
 *
 * Además solo se carga cuando el hueco entra en pantalla, para no penalizar la
 * carga inicial ni pedir impresiones que nadie va a ver.
 */
const AdsterraUnit: React.FC<Props> = ({ slot, mobileSlot, className = '', etiqueta = true }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [esMovil, setEsMovil] = useState(false);

  // El layout decide si esta pagina lleva anuncios (scan con publicidad
  // desactivada, suscriptor que paga por quitarlos, rutas de login...) y lo
  // publica en <html data-ads>. Las islas de React lo leen de ahi.
  const [permitido, setPermitido] = useState(false);
  useEffect(() => {
    setPermitido(document.documentElement.dataset.ads === 'adsterra');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setEsMovil(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || visible || !permitido) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [visible, permitido]);

  const efectivo = esMovil && mobileSlot ? mobileSlot : slot;

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || !visible) return;
    nodo.innerHTML = '';

    const esNativo = efectivo === 'native';
    const unidad = esNativo ? null : ADSTERRA_BANNERS[efectivo as AdsterraSize];
    if (!esNativo && !unidad) return;

    // El cierre de etiqueta se parte para que este fichero no pueda romper el
    // HTML si alguna vez se sirve el bundle en linea dentro de un <script>.
    const cierre = '</scr' + 'ipt>';
    const cuerpo = esNativo
      ? `<div id="container-${ADSTERRA_NATIVE_KEY}"></div>` +
        `<script async data-cfasync="false" src="${urlInvoke(ADSTERRA_NATIVE_KEY)}">${cierre}`
      : `<script>atOptions=${JSON.stringify({
          key: unidad!.key,
          format: 'iframe',
          height: unidad!.height,
          width: unidad!.width,
          params: {},
        })};${cierre}` + `<script src="${urlInvoke(unidad!.key)}">${cierre}`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('title', 'Publicidad');
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.width = esNativo ? '100%' : String(unidad!.width);
    iframe.height = esNativo ? '280' : String(unidad!.height);
    iframe.srcdoc =
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>` +
      `</head><body>${cuerpo}</body></html>`;

    nodo.appendChild(iframe);

    return () => {
      nodo.innerHTML = '';
    };
  }, [visible, efectivo]);

  const unidad = efectivo === 'native' ? null : ADSTERRA_BANNERS[efectivo as AdsterraSize];

  if (!permitido) return null;

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {etiqueta && (
        <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 mb-1 select-none">
          Publicidad
        </span>
      )}
      <div
        ref={ref}
        // Reservar el alto evita que el contenido salte cuando entra el anuncio.
        style={{ minHeight: unidad ? unidad.height : 280, width: '100%' }}
      />
    </div>
  );
};

export default AdsterraUnit;
