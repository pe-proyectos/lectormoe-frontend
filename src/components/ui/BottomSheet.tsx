import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '../../util/useIsMobile';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  desktopMode?: 'modal' | 'sheet';
  maxWidthClass?: string;
}

// Modal en desktop, hoja inferior deslizante en móvil (Tarea 19b).
const BottomSheet: React.FC<Props> = ({ open, onClose, title, children, desktopMode = 'modal', maxWidthClass = 'max-w-md' }) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const asSheet = isMobile || desktopMode === 'sheet';

  // La "manija" superior sugiere que la hoja se puede arrastrar; la hacemos
  // funcional: deslizar hacia abajo sobre la manija/cabecera la cierra. Antes
  // la línea gris no hacía nada y confundía (parecía expandible).
  const dragStartY = useRef<number | null>(null);
  const onGrabStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; };
  const onGrabEnd = (e: React.TouchEvent) => {
    if (dragStartY.current != null && e.changedTouches[0].clientY - dragStartY.current > 55) onClose();
    dragStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[130] flex bg-black/60 animate-[fadeIn_150ms_ease-out]" onClick={onClose} style={{ alignItems: asSheet ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          asSheet
            ? 'w-full bg-zinc-900 border-t border-zinc-800 rounded-t-[24px] max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)] animate-[slideUp_200ms_ease-out]'
            : `bg-zinc-900 border border-zinc-800 rounded-[24px] w-full ${maxWidthClass} max-h-[90dvh] overflow-y-auto m-4 animate-[slideUp_150ms_ease-out]`
        }
      >
        {asSheet && (
          <div
            onTouchStart={onGrabStart}
            onTouchEnd={onGrabEnd}
            className="pt-3 pb-1 -mb-1 cursor-grab active:cursor-grabbing"
            aria-hidden="true"
          >
            <div className="w-10 h-1.5 rounded-full bg-zinc-600 mx-auto" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between px-6 pt-2 pb-3">
            <h3 className="text-lg font-black text-white">{title}</h3>
            <button onClick={onClose} aria-label="Cerrar" className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"><X size={18} className="text-zinc-500" /></button>
          </div>
        )}
        <div className={title ? 'px-6 pb-6' : 'p-6'}>{children}</div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: .6 } to { transform: translateY(0); opacity: 1 } }
      ` }} />
    </div>
  );
};

export default BottomSheet;
