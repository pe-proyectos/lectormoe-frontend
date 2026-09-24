import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export const Popover: React.FC<PopoverProps> = ({ placement = 'bottom', children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, placement }}>
      <div className="relative" data-popover-root>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverHandler must be used within Popover');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setIsOpen(!context.isOpen);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer" data-popover-handler>
      {children}
    </div>,
    document.body
    )}
    </>
  );
};

export const PopoverContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(PopoverContext);
  const popoverRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  if (!context) throw new Error('PopoverContent must be used within Popover');

  useEffect(() => {
    // Find the PopoverHandler element
    const findHandler = () => {
      const popover = anchorRef.current?.closest('[data-popover-root]');
      if (popover) {
        const handler = popover.querySelector('[data-popover-handler]') as HTMLElement;
        if (handler) {
          handlerRef.current = handler;
        }
      }
    };

    if (context.isOpen) {
      findHandler();
    }
  }, [context.isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        if (handlerRef.current && !handlerRef.current.contains(event.target as Node)) {
          context.setIsOpen(false);
        }
      }
    };

    if (context.isOpen) {
      // Small delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context.isOpen, context]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.setIsOpen(false);
      }
    };

    if (context.isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [context.isOpen, context]);

  // Se pinta en <body> con posicion fija: asi ninguna tarjeta vecina (ni un
  // contenedor con overflow o su propio z-index) puede taparlo o recortarlo.
  useLayoutEffect(() => {
    if (!context.isOpen) return;
    const place = () => {
      const root = anchorRef.current?.closest('[data-popover-root]') as HTMLElement | null;
      if (!root) return;
      const r = root.getBoundingClientRect();
      const w = popoverRef.current?.offsetWidth || 0;
      const h = popoverRef.current?.offsetHeight || 0;
      const gap = 8;
      let top = r.bottom + gap;
      let left = r.left;
      if (context.placement === 'top') top = r.top - h - gap;
      if (context.placement === 'left') { top = r.top; left = r.left - w - gap; }
      if (context.placement === 'right') { top = r.top; left = r.right + gap; }
      // Si no cabe abajo, se abre arriba; y nunca se sale por los lados.
      if (context.placement === 'bottom' && top + h > window.innerHeight && r.top - h - gap > 0) top = r.top - h - gap;
      left = Math.max(gap, Math.min(left, window.innerWidth - w - gap));
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [context.isOpen, context.placement]);

  if (!context.isOpen) return <span ref={anchorRef} hidden />;

  return (
    <>
    <span ref={anchorRef} hidden />
    {createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className={`
        z-[1000]
        bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl
        p-4
        animate-in fade-in zoom-in-95 duration-200
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
    )}
    </>
  );
};

