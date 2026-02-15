import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { setAgeVerification } from '../../util/nsfw';

interface NSFWAgeModalProps {
  onConfirm: () => void;
}

const NSFWAgeModal: React.FC<NSFWAgeModalProps> = ({ onConfirm }) => {
  const handleConfirm = () => {
    setAgeVerification();
    onConfirm();
  };

  const handleGoBack = () => {
    window.location.href = 'https://capibaratraductor.com/';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      <div className="relative w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-[32px] shadow-2xl shadow-red-500/10 overflow-hidden">
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} className="text-red-500" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              Contenido para Adultos (+18)
            </h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              Este contenido esta dirigido unicamente a personas mayores de 18 anos. Al continuar, confirmas que tienes la edad legal requerida.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-400 transition-all transform active:scale-95 shadow-lg shadow-red-500/20"
            >
              Si, soy mayor de 18
            </button>
            <button
              onClick={handleGoBack}
              className="w-full py-4 bg-zinc-800 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-700 hover:text-white transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NSFWAgeModal;
