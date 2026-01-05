
import React, { useState, useEffect } from 'react';
import type { Tenant } from '../../util/landing/types';

const ExplorarView: React.FC = () => {
  const [scans, setScans] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNSFW, setShowNSFW] = useState(false);
  const [loadingNSFW, setLoadingNSFW] = useState(false);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/landing/scans`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result?.status === true && Array.isArray(result.data)) {
          setScans(result.data);
        } else {
          console.warn('Scans response format unexpected:', result);
          setScans([]);
        }
      } catch (error) {
        console.error('Error fetching scans:', error);
        setScans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  const handleLoadNSFW = async () => {
    if (showNSFW) return; // Ya se cargaron
    
    try {
      setLoadingNSFW(true);
      const API_URL = import.meta.env['PUBLIC_API_URL'];
      const response = await fetch(`${API_URL}/api/landing/scans?includeNSFW=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result?.status === true && Array.isArray(result.data)) {
        // Agregar los scans NSFW a la lista existente
        setScans(prev => [...prev, ...result.data]);
        setShowNSFW(true);
      } else {
        console.warn('NSFW Scans response format unexpected:', result);
      }
    } catch (error) {
      console.error('Error fetching NSFW scans:', error);
    } finally {
      setLoadingNSFW(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-20 text-center">
          <h2 className="text-7xl md:text-9xl font-black italic uppercase drop-shadow-[6px_6px_0px_#000] mb-4">
            NUESTROS <span className="text-red-600">SCANS</span>
          </h2>
          <p className="jp-font text-3xl opacity-20">独立した翻訳チームのリスト</p>
        </div>
        <div className="text-center py-20">
          <p className="text-2xl font-black">Cargando scans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="mb-20 text-center">
        <h2 className="text-7xl md:text-9xl font-black italic uppercase drop-shadow-[6px_6px_0px_#000] mb-4">
          NUESTROS <span className="text-red-600">SCANS</span>
        </h2>
        <p className="jp-font text-3xl opacity-20">独立した翻訳チームのリスト</p>
      </div>

      <div className="space-y-32">
        {scans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-black">No hay scans disponibles</p>
          </div>
        ) : (
          scans.map((tenant) => (
          <div key={tenant.id} className="relative">
            {/* Scan Header Panel */}
            <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
              <div className={`w-32 h-32 ${tenant.color} border-4 border-black shadow-[8px_8px_0px_#000] flex items-center justify-center text-white text-6xl font-black g-pen-border transform rotate-3`}>
                {tenant.name[0]}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-6xl font-black uppercase italic leading-none mb-2">{tenant.name}</h3>
                <p className="text-xl font-bold text-slate-500">{tenant.description}</p>
              </div>
              <a href={tenant.url} className="bg-black text-white px-8 py-3 manga-font text-2xl g-pen-border hover:bg-orange-500 transition-all">
                VISITAR SITIO →
              </a>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-stretch">
              {/* TOP 5 LEIDOS - Updated to Vertical Scroll with 2 columns */}
              <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_#000] relative overflow-hidden flex flex-col h-[600px]">
                <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-xs transform translate-x-4 translate-y-2 rotate-45 z-10">HOT</div>
                <h4 className="manga-font text-4xl mb-6 flex items-center gap-4 border-b-4 border-black pb-2 flex-shrink-0">
                  <span className="text-5xl">🔥</span> TOP 5 MÁS LEÍDOS
                </h4>
                
                <div className="flex-grow overflow-y-auto pr-2 scrollbar-manga">
                  <div className="grid grid-cols-2 gap-6 justify-items-center py-4">
                    {(tenant.mostRead || []).length > 0 ? (
                      (tenant.mostRead || []).map((manga, idx) => (
                        <a key={manga.id} href={`/${tenant.id}/manga/${manga.slug}`} className="w-full max-w-[160px] group flex flex-col items-center text-center">
                          <div className="relative aspect-[2/3] w-full border-2 border-black mb-3 overflow-hidden shadow-[4px_4px_0px_#000] transition-transform group-hover:-translate-y-1">
                            <img 
                              src={manga.cover} 
                              alt={manga.title} 
                              className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${manga.isNSFW ? 'blur-md' : ''}`}
                            />
                            <div className="absolute top-0 left-0 bg-black text-white w-8 h-8 flex items-center justify-center font-black text-xl border-r-2 border-b-2 border-white">
                              {idx + 1}
                            </div>
                            {manga.isNSFW && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-black uppercase border-2 border-white">NSFW</span>
                              </div>
                            )}
                          </div>
                          <p className="font-black text-xs leading-tight uppercase line-clamp-2 px-1">{manga.title}</p>
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-slate-400">
                        <p className="font-black">No hay mangas disponibles</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP 5 RECIENTES */}
              <div className="bg-slate-50 border-4 border-black p-6 shadow-[12px_12px_0px_#000] halftone-bg bg-opacity-10 h-[600px] flex flex-col">
                <h4 className="manga-font text-4xl mb-6 flex items-center gap-4 border-b-4 border-black pb-2 flex-shrink-0">
                  <span className="text-5xl">✨</span> ÚLTIMOS LANZAMIENTOS
                </h4>
                <div className="flex-grow overflow-y-auto pr-2 scrollbar-manga space-y-4 py-2">
                  {(tenant.recent || []).length > 0 ? (
                    (tenant.recent || []).map((manga) => (
                      <a key={manga.id} href={`/${tenant.id}/manga/${manga.slug}`} className="flex items-center gap-4 bg-white border-2 border-black p-2 hover:translate-x-2 transition-transform cursor-pointer shadow-[4px_4px_0px_#000]">
                        <div className="relative w-12 h-16 border-2 border-black overflow-hidden flex-shrink-0">
                          <img 
                            src={manga.cover} 
                            alt={manga.title} 
                            className={`w-full h-full object-cover ${manga.isNSFW ? 'blur-md' : ''}`}
                          />
                          {manga.isNSFW && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <span className="bg-red-600 text-white px-1 py-0.5 text-[8px] font-black uppercase border border-white">NSFW</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-black text-sm uppercase leading-tight">{manga.title}</p>
                          <p className="text-[10px] font-bold text-slate-400">ACTUALIZADO: HOY</p>
                        </div>
                        <div className="bg-orange-500 text-white px-2 py-1 text-[10px] font-black g-pen-border">
                          NEW
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <p className="font-black">No hay lanzamientos recientes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Decoration */}
            <div className="absolute -z-10 -bottom-10 -right-10 text-[10rem] jp-font opacity-5 select-none uppercase pointer-events-none">
              {tenant.name}
            </div>
          </div>
          ))
        )}
      </div>
      
      <div className="mt-32 space-y-8">
        {!showNSFW && (
          <div className="text-center p-12 bg-red-600 text-white g-pen-border border-4 border-black">
            <h4 className="text-4xl font-black mb-4">⚠️ CONTENIDO +18</h4>
            <p className="text-xl mb-8 font-bold italic uppercase">Scans con contenido para adultos</p>
            <button 
              onClick={handleLoadNSFW}
              disabled={loadingNSFW}
              className="bg-white text-black px-12 py-4 manga-font text-3xl hover:bg-black hover:text-white transition-all shadow-[8px_8px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingNSFW ? 'CARGANDO...' : 'MOSTRAR SCANS CON CONTENIDO NSFW +18'}
            </button>
          </div>
        )}
        
        <div className="text-center p-12 bg-black text-white g-pen-border">
           <h4 className="text-4xl font-black mb-4">¿NO VES TU SCAN AQUÍ?</h4>
           <p className="text-xl mb-8 font-bold text-slate-400 italic uppercase">¡REGISTRA TU SCAN Y APARECE EN NUESTRO HUB GLOBAL!</p>
           <button className="bg-white text-black px-12 py-4 manga-font text-3xl hover:bg-red-600 hover:text-white transition-all shadow-[8px_8px_0px_#E63946]">
             SOLICITAR INGRESO
           </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorarView;

