
import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, ShieldCheck, AlertCircle, Eye, EyeOff, ChevronRight } from 'lucide-react';

interface Scan {
  id: string; // This is the slug
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  followerCount?: number;
  genres?: string[];
  totalMangas?: number;
  isNSFW?: boolean;
  url?: string; // This is the full URL path like "/senshimanga"
}

interface Props {
  onNavigate?: (scanId: string) => void;
}

const ScansSection: React.FC<Props> = ({ onNavigate }) => {
  const [showNSFW, setShowNSFW] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.PUBLIC_API_URL;
        // Landing shows only the top 5 by followers — the full directory lives at /scans.
        const qs = new URLSearchParams({ limit: '5', sort: 'followers' });
        if (showNSFW) qs.set('includeNSFW', 'true');
        const response = await fetch(`${API_URL}/api/landing/scans?${qs.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        const items = result?.data?.items ?? [];

        const mapped = items.map((scan: any) => ({
          id: scan.id,
          name: scan.name,
          description: scan.description || '',
          url: scan.url || `/${scan.id}`,
          logo: scan.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(scan.name)}&background=27272a&color=fff&size=128`,
          banner: scan.banner || null,
          isNSFW: scan.isNSFW || false,
          followerCount: scan.followerCount || 0,
          genres: scan.genres || [],
          totalMangas: scan.totalMangas || 0,
        }));
        setScans(mapped);
        setTotalScans(result?.data?.total ?? mapped.length);
      } catch (error) {
        console.error('Error fetching scans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [showNSFW]);

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

  const filteredScans = scans.filter(scan => showNSFW || !scan.isNSFW);

  const handleScanClick = (scan: Scan) => {
    // Navegar a la landing del scan
    const path = scan.url || `/${scan.id}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  if (loading) {
    return (
      <section id="scans-section" className="bg-zinc-950 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 animate-pulse">
                <div className="h-24 bg-zinc-800 rounded mb-4" />
                <div className="h-6 bg-zinc-800 rounded mb-2" />
                <div className="h-4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="scans-section" className="bg-[#050505] py-24 relative overflow-hidden">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredScans.map((scan) => (
            <div 
              key={scan.id} 
              className={`group relative bg-zinc-900/50 border rounded-3xl overflow-hidden hover:bg-zinc-900 transition-all duration-500 cursor-pointer ${
                scan.isNSFW ? 'border-red-900/30 hover:border-red-500/30 shadow-[0_10px_30px_rgba(239,68,68,0.05)]' : 'border-zinc-800 hover:border-cyan-500/30'
              }`}
              onClick={() => handleScanClick(scan)}
            >
              {/* Card Banner Background */}
              {scan.banner && (
                <div className="h-24 w-full relative overflow-hidden">
                  <img 
                    src={scan.banner} 
                    className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
                    alt=""
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${scan.isNSFW ? 'from-red-950/40' : 'from-zinc-900/50'}`} />
                </div>
              )}

              {/* Card Header Content */}
              <div className={`px-8 relative z-10 flex items-end justify-between mb-6 ${scan.banner ? '-mt-10' : 'pt-8'}`}>
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
                    <span className="text-lg font-black tracking-tighter">{scan.followerCount?.toLocaleString() || '0'}</span>
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
                {scan.description && (
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
                    {scan.description}
                  </p>
                )}
                
                {(scan.genres && scan.genres.length > 0) || scan.totalMangas > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {scan.genres && scan.genres.slice(0, 2).map((genre: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {genre}
                      </span>
                    ))}
                    {scan.totalMangas > 0 && (
                      <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        +{scan.totalMangas} {scan.totalMangas === 1 ? 'Proyecto' : 'Proyectos'}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Action Footer */}
              <div className="px-8 py-6 mt-4 border-t border-zinc-800/50 flex items-center justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScanClick(scan);
                  }}
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

        {totalScans > filteredScans.length && (
          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate ? onNavigate('/scans') : window.location.href = '/scans'}
              className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-cyan-500/10 active:scale-95"
            >
              Ver los {totalScans} scans del directorio <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScansSection;

