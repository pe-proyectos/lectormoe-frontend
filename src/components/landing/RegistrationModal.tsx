
import React, { useState } from 'react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulación de llamada a la API
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 1500);
  };

  const benefits = [
    { title: 'Google Ads desde el día 1', desc: 'Monetiza tu contenido de inmediato.', icon: '📈' },
    { title: 'Soporte Técnico 24/7', desc: 'Nosotros nos encargamos de los bugs.', icon: '🛠️' },
    { title: 'Sistema de Suscripciones', desc: 'Crea fans leales con contenido VIP.', icon: '💎' },
    { title: 'Costo de Entrada $0', desc: 'Sin letras pequeñas, crecemos contigo.', icon: '💰' },
    { title: 'Roles y Permisos', desc: 'Gestiona traductores, types y editores.', icon: '🛡️' },
    { title: 'Mensajería y Moderación', desc: 'Control total sobre tu comunidad.', icon: '💬' },
    { title: 'Automatización con Discord', desc: 'Anuncia capítulos automáticamente.', icon: '🤖' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-5xl rounded-[2rem] shadow-[20px_20px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden animate-in zoom-in duration-300 flex flex-col md:flex-row">
        
        {/* Lado Izquierdo: Beneficios e Información */}
        <div className="md:w-5/12 bg-slate-50 border-r-4 border-black p-8 md:p-10 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-none scrollbar-manga">
          <div className="mb-8">
            <span className="bg-red-600 text-white px-3 py-1 font-black text-xs uppercase italic g-pen-border">PRO-SCAN FEATURES</span>
            <h3 className="text-4xl font-black mt-4 leading-none italic uppercase">EL MEJOR <br/> EQUIPAMIENTO</h3>
          </div>

          <div className="space-y-6 mb-10">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="text-3xl filter group-hover:scale-125 transition-transform">{benefit.icon}</div>
                <div>
                  <h4 className="font-black text-sm uppercase leading-tight group-hover:text-red-600 transition-colors">{benefit.title}</h4>
                  <p className="text-xs text-slate-500 font-bold leading-tight mt-0.5">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t-2 border-dashed border-slate-200">
            <h4 className="font-black text-xs uppercase text-slate-400 mb-4 tracking-widest">Contacto Directo</h4>
            <div className="space-y-3">
              <a href="mailto:luis.choque.castro@outlook.com" className="flex items-center gap-2 text-sm font-bold hover:text-red-600 transition-colors">
                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">📧</span>
                luis.choque.castro@outlook.com
              </a>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="w-8 h-8 bg-[#5865F2] text-white rounded-full flex items-center justify-center">💬</span>
                @shoko_cc
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="md:w-7/12 p-8 md:p-12 relative flex flex-col justify-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center border-4 border-black font-black text-2xl hover:bg-black hover:text-white transition-all z-10"
          >
            ×
          </button>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="inline-block bg-orange-500 text-white px-4 py-1 text-sm font-black italic mb-6 g-pen-border halftone-bg">PASO 01/02</div>
              <h2 className="text-5xl font-black text-slate-900 mb-6 italic uppercase leading-none">¡IMPULSA TU <br/> <span className="text-red-600">PROYECTO!</span></h2>
              <p className="text-slate-600 mb-8 font-bold leading-relaxed">
                Únete a la infraestructura líder para comunidades de traducción. Tu scan merece su propio espacio.
              </p>
              
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Nombre del Scan</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: SenshiManga"
                    className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Correo de contacto</label>
                  <input 
                    type="email" 
                    required
                    placeholder="lider@tuscan.com"
                    className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
                  />
                </div>
                <button className="w-full py-5 bg-black text-white font-black text-2xl manga-font hover:bg-red-600 transition-all shadow-[8px_8px_0px_#ccc] hover:shadow-none translate-y-[-4px] hover:translate-y-0 uppercase">
                  Siguiente nivel →
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="inline-block bg-orange-500 text-white px-4 py-1 text-sm font-black italic mb-6 g-pen-border halftone-bg">PASO 02/02</div>
              <h2 className="text-5xl font-black text-slate-900 mb-6 italic uppercase leading-none">DATOS <br/> <span className="text-red-600">TÉCNICOS</span></h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Subdominio deseado</label>
                  <div className="flex flex-col sm:flex-row items-stretch">
                    <input 
                      type="text" 
                      placeholder="mi-scan"
                      className="flex-grow px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-all" 
                    />
                    <div className="bg-slate-100 border-4 border-t-0 sm:border-t-4 sm:border-l-0 border-black px-4 flex items-center justify-center font-black text-xs text-slate-500">
                      .CAPIBARATRADUCTOR.COM
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Volumen de Series</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-4 border-black font-bold text-lg outline-none cursor-pointer">
                    <option>1 - 5 series activas</option>
                    <option>6 - 20 series activas</option>
                    <option>Legendario (+20 series)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 border-4 border-black font-black text-xl hover:bg-slate-100 transition-all uppercase"
                  >
                    Atrás
                  </button>
                  <button 
                    disabled={isSubmitting}
                    className="flex-[2] py-5 bg-red-600 text-white font-black text-2xl manga-font hover:bg-black transition-all shadow-[8px_8px_0px_#ccc] disabled:opacity-50 uppercase"
                  >
                    {isSubmitting ? 'ENVIANDO...' : '¡DESPLEGAR SCAN!'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-white text-black border-4 border-black rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[8px_8px_0px_#22c55e]">✓</div>
              <h2 className="text-5xl font-black text-slate-900 mb-6 italic uppercase leading-none">¡SOLICITUD <br/> ENVIADA!</h2>
              <p className="text-slate-600 mb-10 font-bold leading-relaxed max-w-sm mx-auto">
                Hemos recibido tu reporte. El equipo de CapibaraTraductor revisará tu perfil y te contactará en las próximas 24 horas para iniciar la configuración.
              </p>
              <button 
                onClick={onClose}
                className="w-full max-w-xs py-5 bg-black text-white font-black text-2xl manga-font hover:bg-red-600 transition-all uppercase"
              >
                CERRAR ARCHIVO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;

