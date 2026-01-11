
import React, { useState } from 'react';
import { SCANS } from '../constants';
import { Users, ExternalLink, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onNavigate: (page: 'home' | 'explore' | 'scan', id?: string) => void;
}

const ScansSection: React.FC<Props> = ({ onNavigate }) => {
  const [showNSFW, setShowNSFW] = useState(false);

  const handleNSFWToggle = () => {
    if (!showNSFW) {
      const confirm = window.confirm("¿Eres mayor de 18 años? Estás a punto de habilitar la visualización de scans que publican contenido explícito (NSFW).");
      if (confirm) {
        setShowNSFW(true);
      }
    } else {
      setShowNSFW(false);
    }
  };

  const filteredScans = SCANS.filter(scan => showNSFW || !scan.isNSFW);

  return (
    <section id="scans-section" className="bg-zinc-950 py-24 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Comunidad Activa
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              Directorio de <span className="text-cyan-500">Scans</span>
            </h2>
            <p className="text-zinc-500 max-w-xl font-medium text-lg">
              Conoce a los equipos detrás de tus traducciones favoritas. Transparencia y calidad en cada proyecto.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleNSFWToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showNSFW 
                ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
              }`}
            >
              {showNSFW ? <EyeOff size={14} /> : <Eye size={14} />}
              {showNSFW ? 'Ocultar NSFW' : 'Mostrar NSFW'}
            </button>
            <button className="text-white font-black text-sm uppercase tracking-widest border-b-2 border-cyan-500 pb-1 hover:text-cyan-400 transition-colors">
              Ver Ranking Completo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredScans.map((scan) => (
            <div 
              key={scan.id} 
              className={`group relative bg-zinc-900/50 border rounded-3xl overflow-hidden hover:bg-zinc-900 transition-all duration-500 ${
                scan.isNSFW ? 'border-red-900/30 hover:border-red-500/30 shadow-[0_10px_30px_rgba(239,68,68,0.05)]' : 'border-zinc-800 hover:border-cyan-500/30'
              }`}
            >
              {/* Card Banner Background */}
              <div className="h-24 w-full relative overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/banner-${scan.id}/600/200`} 
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
                  alt=""
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${scan.isNSFW ? 'from-red-950/40' : 'from-zinc-900/50'}`} />
              </div>

              {/* Card Header Content */}
              <div className="px-8 -mt-10 relative z-10 flex items-end justify-between mb-6">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-800 transition-colors shadow-2xl ${scan.isNSFW ? 'group-hover:border-red-500/50' : 'group-hover:border-cyan-500/50'}`}>
                    <img src={scan.logo} alt={scan.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-950 shadow-lg ${scan.isNSFW ? 'bg-red-500 shadow-red-500/40' : 'bg-cyan-500 shadow-cyan-500/40'}`}>
                    {scan.isNSFW ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
                  </div>
                </div>
                <div className="text-right pb-2">
                  <div className={`flex items-center justify-end gap-1 mb-0.5 ${scan.isNSFW ? 'text-red-500' : 'text-cyan-500'}`}>
                    <Users size={14} />
                    <span className="text-lg font-black tracking-tighter">{scan.memberCount.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Seguidores</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="px-8 pb-4 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className={`text-2xl font-black italic transition-colors ${scan.isNSFW ? 'text-red-400 group-hover:text-red-300' : 'text-white group-hover:text-cyan-400'}`}>
                    {scan.name}
                  </h3>
                  {scan.isNSFW && (
                    <span className="px-2 py-0.5 bg-red-500 text-zinc-950 text-[8px] font-black uppercase rounded tracking-tighter">18+ NSFW</span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
                  {scan.isNSFW 
                    ? "Especialistas en contenido adulto de alta calidad. Traducción fiel y edición impecable."
                    : "Especializados en Seinen y Acción. Comprometidos con la limpieza y reconstrucción de alta fidelidad."
                  }
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {scan.isNSFW ? 'Adulto' : 'Seinen'}
                  </span>
                  <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Acción</span>
                  <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">+50 Proyectos</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-8 py-6 mt-4 border-t border-zinc-800/50 flex items-center justify-between">
                <button 
                  onClick={() => onNavigate('scan', scan.id)}
                  className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.1em] transition-colors group/btn ${
                    scan.isNSFW ? 'text-red-400 hover:text-red-200' : 'text-white hover:text-cyan-400'
                  }`}
                >
                  Visitar página del scan 
                  <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
                
                <div className={`w-2 h-2 rounded-full transition-colors animate-pulse ${scan.isNSFW ? 'bg-red-800 group-hover:bg-red-500' : 'bg-zinc-800 group-hover:bg-cyan-500'}`} />
              </div>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-3xl bg-transparent transition-colors pointer-events-none ${scan.isNSFW ? 'group-hover:bg-red-500/[0.02]' : 'group-hover:bg-cyan-500/[0.01]'}`} />
            </div>
          ))}

          {filteredScans.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px]">
               <EyeOff size={40} className="mx-auto mb-4 text-zinc-700" />
               <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">No hay scans públicos disponibles en este momento</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ScansSection;
