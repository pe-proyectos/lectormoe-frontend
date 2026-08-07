import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Riel horizontal con scroll táctil nativo (overflow-x auto) y flechas en
// desktop. Antes los estantes usaban `hscroll flex` sin overflow-x, así que en
// móvil desbordaban la pantalla (no se podían ver los últimos) en vez de
// scrollear. Aquí el riel está CONTENIDO y las flechas aparecen solo si hay
// más contenido hacia ese lado.
const HShelf: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Recalcular cuando cambie el tamaño del contenido (las imágenes cargan
    // después del montaje y crecen el ancho del riel; sin esto la flecha
    // derecha podía no aparecer en conexiones lentas hasta hacer scroll).
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
      for (const child of Array.from(el.children)) ro.observe(child);
    }
    const t = setTimeout(update, 400);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const by = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 640), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={ref} className="hscroll flex flex-nowrap gap-4 overflow-x-auto pb-2">
        {children}
      </div>
      {canL && (
        <button
          onClick={() => by(-1)}
          aria-label="Ver anteriores"
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center bg-zinc-900/90 border border-zinc-700 text-white hover:bg-cyan-500 hover:text-zinc-950 shadow-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canR && (
        <button
          onClick={() => by(1)}
          aria-label="Ver siguientes"
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center bg-zinc-900/90 border border-zinc-700 text-white hover:bg-cyan-500 hover:text-zinc-950 shadow-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default HShelf;
