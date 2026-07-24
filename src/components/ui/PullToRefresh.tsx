import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// Pull-to-refresh estilo app nativa. Solo móvil. Al arrastrar hacia abajo
// estando en el tope de la página, muestra un indicador y, si se supera el
// umbral, recarga para traer datos frescos. El rebote nativo del navegador ya
// está desactivado (overscroll-behavior-y: none), así que este es el único.
const THRESHOLD = 72; // px que hay que arrastrar para disparar la recarga
const MAX_PULL = 120; // tope visual del arrastre
const RESISTANCE = 0.5; // el arrastre se siente "pesado" como en iOS/Android

const PullToRefresh: React.FC = () => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    // Solo en pantallas de teléfono; en escritorio no se monta ninguna lógica.
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    const canStart = () => {
      // Debe estar en el tope y no dentro de un overlay/scroller propio.
      if (window.scrollY > 0) return false;
      if (document.querySelector('[data-ptr-lock]')) return false;
      return true;
    };

    const onStart = (e: TouchEvent) => {
      if (refreshing || !canStart()) { active.current = false; return; }
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Si el usuario ya hizo scroll hacia abajo en medio del gesto, cancelar.
      if (window.scrollY > 0) { active.current = false; setPull(0); return; }
      const dist = Math.min(dy * RESISTANCE, MAX_PULL);
      setPull(dist);
      if (dist > 6 && e.cancelable) e.preventDefault(); // frena el scroll mientras se jala
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // Pequeño respiro para que se vea el spinner antes de recargar.
        window.setTimeout(() => window.location.reload(), 350);
      } else {
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  // Ref espejo para leer el valor actual dentro de onEnd sin recrear listeners.
  const pullRef = useRef(0);
  useEffect(() => { pullRef.current = pull; }, [pull]);

  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(pull / THRESHOLD, 1);
  const ready = pull >= THRESHOLD;

  return (
    <div
      className="md:hidden fixed inset-x-0 top-0 z-[60] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pull - 40}px)`, transition: active.current ? 'none' : 'transform 0.25s ease' }}
      aria-hidden="true"
    >
      <div className="mt-2 w-10 h-10 rounded-full bg-zinc-900/95 border border-zinc-700 shadow-lg flex items-center justify-center backdrop-blur">
        <RefreshCw
          size={20}
          className={`text-cyan-400 ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)`, opacity: 0.4 + progress * 0.6, color: ready ? undefined : undefined }}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
