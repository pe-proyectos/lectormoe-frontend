
import React, { useState, useMemo, useEffect } from 'react';
import type { Manga, Tenant } from '../../util/landing/types';

const SearchView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanFilter, setScanFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('popular');
  const [scans, setScans] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Pool de todos los mangas de todos los scans
  // Note: mostRead and recent are no longer returned by /api/landing/scans
  const allManga = useMemo(() => {
    const pool: Manga[] = [];
    // Scans no longer include mostRead or recent, so this will be empty
    // This component should be replaced with ExplorePage which uses /api/manga-custom
    return pool;
  }, [scans]);

  // Simulación de Top 10 Global (Mezcla de los más leídos de cada scan)
  const globalTop10 = useMemo(() => {
    const top: Manga[] = [];
    // Scans no longer include mostRead, so this will be empty
    return top;
  }, [scans]);

  const filteredManga = useMemo(() => {
    return allManga
      .filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesScan = scanFilter === 'all' || m.scanName === scanFilter;
        return matchesSearch && matchesScan;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        return 0; 
      });
  }, [searchTerm, scanFilter, sortBy, allManga]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Estilo Manga Magazine Index */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 border-b-8 border-black pb-8">
        <div>
          <h2 className="text-6xl md:text-8xl font-black italic uppercase drop-shadow-[4px_4px_0px_#000]">
            BIBLIO<span className="text-red-600">TECA</span>
          </h2>
          <p className="jp-font text-2xl opacity-30 mt-2">すべてのマンガアーカイブ</p>
        </div>
        
        {/* Search Input Box "G-Pen Style" */}
        <div className="relative w-full max-w-md">
          <input 
            type="text"
            placeholder="¿Qué quieres leer hoy?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-4 border-black p-5 text-2xl font-black placeholder-slate-300 focus:outline-none focus:bg-yellow-50 g-pen-border"
          />
          <div className="absolute -top-3 -right-3 bg-red-600 text-white p-2 font-black rotate-12 g-pen-border text-xs">
            SEARCH
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar de Filtros y Rankings */}
        <aside className="lg:w-1/4 space-y-10">
          <div className="bg-black text-white p-6 g-pen-border halftone-bg bg-opacity-20">
            <h3 className="manga-font text-3xl mb-6 border-b-2 border-white pb-2 flex justify-between items-center">
              FILTROS <span className="text-xs jp-font opacity-50">フィルタ</span>
            </h3>
            
            <div className="space-y-8">
              <div>
                <label className="block font-black text-sm uppercase mb-3 text-red-500">Filtrar por Scan</label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setScanFilter('all')}
                    className={`w-full text-left p-3 font-bold border-2 border-transparent transition-all hover:border-white ${scanFilter === 'all' ? 'bg-white text-black' : 'bg-white/10'}`}
                  >
                    TODOS LOS SCANS
                  </button>
                  {scans.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setScanFilter(t.name)}
                      className={`w-full text-left p-3 font-bold border-2 border-transparent transition-all hover:border-white ${scanFilter === t.name ? 'bg-white text-black' : 'bg-white/10'}`}
                    >
                      {t.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-black text-sm uppercase mb-3 text-red-500">Ordenar por</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white/10 text-white p-3 font-bold border-2 border-transparent focus:border-white outline-none"
                >
                  <option value="popular" className="text-black">MÁS POPULAR</option>
                  <option value="recent" className="text-black">MÁS RECIENTE</option>
                  <option value="name" className="text-black">ALFABÉTICO (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Decorative Comic Bubble */}
          <div className="bg-white border-4 border-black p-4 rounded-3xl relative shadow-[8px_8px_0px_#000]">
            <p className="font-bold text-sm italic">"¡Encuentra el tesoro escondido entre miles de páginas!"</p>
            <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-r-4 border-b-4 border-black rotate-45"></div>
          </div>

          {/* TOP 10 GLOBAL - HALL OF FAME */}
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_#E63946] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 text-[10px] font-black italic transform translate-x-3 translate-y-3 rotate-12">ALL TIME</div>
            <h4 className="manga-font text-4xl mb-6 border-b-4 border-black pb-2">
              HALL OF FAME
            </h4>
            
            <div className="space-y-4">
              {globalTop10.map((manga, idx) => (
                <div key={idx} className="flex items-center gap-3 group cursor-pointer border-b border-slate-100 pb-2 last:border-0">
                  <span className={`text-4xl font-black ${idx < 3 ? 'text-red-600 italic' : 'text-slate-200'} transition-all group-hover:scale-125`}>
                    {idx + 1}
                  </span>
                  <div className="overflow-hidden">
                    <p className="font-black text-sm uppercase truncate group-hover:text-red-600 transition-colors">{manga.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1 font-black text-white ${manga.scanName === 'SenshiManga' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        {manga.scanName}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">LEIDO X10K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom decoration */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200 text-center">
              <div className="flex flex-col items-center gap-1 opacity-25 select-none">
                <span className="jp-font text-xs">最も読まれたシリーズ</span>
                <span className="text-[9px] font-black uppercase italic tracking-widest leading-none">Series más leídas</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Grid de Resultados */}
        <div className="lg:w-3/4">
          <div className="flex justify-between items-center mb-8 bg-slate-200 p-2 border-l-8 border-black">
            <span className="font-black uppercase text-sm">{filteredManga.length} RESULTADOS ENCONTRADOS</span>
            <span className="jp-font opacity-20 hidden sm:block">検索結果</span>
          </div>

          {filteredManga.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredManga.map((manga) => (
                <a 
                  key={manga.id}
                  href={manga.scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="g-pen-border bg-white overflow-hidden group hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative aspect-[2/3] border-b-4 border-black overflow-hidden">
                    <img 
                      src={manga.cover} 
                      alt={manga.title} 
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                    />
                    <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-black text-[10px] uppercase">
                      {manga.scanName}
                    </div>
                  </div>
                  <div className="p-4 relative">
                    <h3 className="manga-font text-2xl leading-tight line-clamp-1 mb-1">{manga.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400">TANKŌBON</span>
                      <span className="bg-red-600 text-white px-2 py-0.5 text-[8px] font-black italic">READ</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border-4 border-dashed border-black">
              <div className="text-8xl mb-6 grayscale opacity-20">🔎</div>
              <h3 className="text-4xl font-black uppercase italic mb-2">¡NADA POR AQUÍ!</h3>
              <p className="text-xl font-bold text-slate-400">No hemos encontrado ningún manga con esos filtros.</p>
              <button 
                onClick={() => {setSearchTerm(''); setScanFilter('all');}}
                className="mt-8 bg-black text-white px-8 py-3 manga-font text-2xl g-pen-border hover:bg-red-600 transition-all"
              >
                REINICIAR BÚSQUEDA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchView;

