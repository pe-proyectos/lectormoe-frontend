import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableCardRowProps {
  children: React.ReactNode;
  // Tailwind columns that should kick in at sm+. The strip mode is mobile-only.
  // Example: "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5".
  desktopCols: string;
  // Mobile slide width (CSS length). Defaults to 60% so two cards peek per row.
  mobileItemWidth?: string;
  // Tailwind gap classes. Defaults match the existing landing rows.
  gapClass?: string;
  // Click distance in px for the chevron buttons.
  scrollStep?: number;
}

// Wraps a row of cards so it becomes a swipe-able strip on mobile (with chevron
// affordances for users without a visible scrollbar) and a normal grid at sm+.
// Direct children flow straight into the grid — fragments from nested
// components (PopularToday, FeaturedManga, etc.) propagate correctly.
const ScrollableCardRow: React.FC<ScrollableCardRowProps> = ({
  children,
  desktopCols,
  mobileItemWidth = '60%',
  gapClass = 'gap-4 sm:gap-6',
  scrollStep = 280,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => ref.current?.scrollBy({ left: -scrollStep, behavior: 'smooth' })}
        aria-label="Anterior"
        className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-950/85 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center justify-center shadow-lg backdrop-blur"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => ref.current?.scrollBy({ left: scrollStep, behavior: 'smooth' })}
        aria-label="Siguiente"
        className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-950/85 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center justify-center shadow-lg backdrop-blur"
      >
        <ChevronRight size={16} />
      </button>

      <div
        ref={ref}
        style={{ ['--scroll-item-width' as any]: mobileItemWidth }}
        className={`grid grid-flow-col auto-cols-[var(--scroll-item-width)] overflow-x-auto sm:overflow-visible sm:grid-flow-row sm:auto-cols-auto ${desktopCols} ${gapClass} px-9 sm:px-0 scroll-smooth scrollbar-thin`}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollableCardRow;
