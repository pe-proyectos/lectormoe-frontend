import React, { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';

interface SorteoModalProps {
  organization?: any;
  logged?: boolean;
}

const SorteoModal: React.FC<SorteoModalProps> = ({ organization, logged }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSorteo = () => {
      setIsOpen(true);
    };

    const handleCloseSorteo = () => {
      setIsOpen(false);
    };

    window.addEventListener('open-sorteo-modal', handleOpenSorteo);
    window.addEventListener('close-sorteo-modal', handleCloseSorteo);

    return () => {
      window.removeEventListener('open-sorteo-modal', handleOpenSorteo);
      window.removeEventListener('close-sorteo-modal', handleCloseSorteo);
    };
  }, []);

  if (!isOpen) return null;

  const subscriptionUrl = (organization?.slug) 
    ? `/${organization.slug}/subscriptions` 
    : "/register";

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={() => {
        setIsOpen(false);
        window.dispatchEvent(new Event('close-sorteo-modal'));
      }}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          margin: 'auto',
          transform: 'translateY(0)'
        }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <Gift size={24} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                SORTEO Luckybara
              </h2>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event('close-sorteo-modal'));
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-300 text-base leading-relaxed mb-4">
                ¡Participa en nuestro sorteo especial hasta el <span className="text-yellow-500 font-bold">31 de Enero</span>!
              </p>
              <p className="text-zinc-300 text-base leading-relaxed mb-4">
                Participan automáticamente todas las personas con suscripción activa, y también puedes participar suscribiéndote.
              </p>
              <p className="text-zinc-300 text-base leading-relaxed mb-4">
                Habrán <span className="text-yellow-500 font-bold">3 ganadores</span> en total. Se anunciará un ganador cada sábado, comenzando el <span className="text-yellow-500 font-bold">sábado 17</span>.
              </p>
              <div className="mt-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <p className="text-zinc-400 text-sm italic">
                  Todas las suscripciones desde la web participarán automáticamente.
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  Primer Ganador
                </p>
                <div className="mb-3 flex justify-center">
                  <img 
                    src="/images/hy1.png" 
                    alt="Primer Premio" 
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
                <p className="text-xs font-black text-yellow-500">
                  @cabodemadagascar
                </p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  Segundo Ganador
                </p>
                <div className="mb-3 flex justify-center">
                  <img 
                    src="/images/hy2.png" 
                    alt="Segundo Premio" 
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
                <p className="text-xs font-black text-yellow-500">
                  @Buster
                </p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  Tercer Ganador
                </p>
                <div className="mb-3 flex justify-center">
                  <img 
                    src="/images/hy3.png" 
                    alt="Tercer Premio" 
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
                <p className="text-lg font-black text-yellow-500">
                  Sábado 31
                </p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm italic">
              Los ganadores tienen hasta el 7 de Febrero para reclamar su premio.
            </p>

            {/* CTA */}
            {!logged && (
              <div className="mt-6 text-center">
                <a
                  href={subscriptionUrl}
                  className="inline-block px-8 py-3 bg-yellow-500 text-zinc-950 rounded-full text-sm font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors"
                >
                  Suscríbete para Participar
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SorteoModal;
