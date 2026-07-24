
import React, { useState, useEffect } from 'react';
import { Play, Plus, ChevronRight, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Manga {
  id: string;
  slug?: string;
  mangaSlug?: string;
  title: string;
  cover: string;
  scan?: string;
  scanSlug?: string;
  scanName?: string;
  status?: 'Ongoing' | 'Completed' | 'Hiatus';
  lastUpdate?: string;
  chapter?: string;
  chapterTitle?: string;
  isNSFW?: boolean;
}

interface HeroProps {
  onExplore: () => void;
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
}

const Hero: React.FC<HeroProps> = ({ onExplore, logged, nsfwMode = false }) => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchFeaturedManga = async () => {
      try {
        setLoading(true);
        const result = await callAPI(`/api/landing/featured-manga?limit=5&nsfw=${nsfwMode}`);

        if (Array.isArray(result)) {
          setMangas(result);
        }
      } catch (error) {
        console.error('Error fetching featured manga:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedManga();
  }, []);

  // Load favorites
  useEffect(() => {
    if (logged && mangas.length > 0) {
      const loadFavorites = async () => {
        const favStatus: Record<string, boolean> = {};
        for (const manga of mangas) {
          const mangaSlug = manga.mangaSlug || manga.slug;
          if (mangaSlug) {
            try {
              const result = await callAPI(`/api/favorites/manga-custom/${mangaSlug}`);
              favStatus[mangaSlug] = result === true;
            } catch {
              favStatus[mangaSlug] = false;
            }
          }
        }
        setFavorites(favStatus);
      };
      loadFavorites();
    }
  }, [logged, mangas]);

  // Auto-slide effect
  useEffect(() => {
    if (mangas.length === 0) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % mangas.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [mangas.length]);

  const toggleFavorite = async () => {
    if (!logged) {
      setFeedback({ message: 'Inicia sesión para agregar a favoritos', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const currentManga = mangas[active];
    const mangaSlug = currentManga.mangaSlug || currentManga.slug;
    if (!mangaSlug) return;

    const isFavorite = favorites[mangaSlug];

    // Optimistic update
    setFavorites({ ...favorites, [mangaSlug]: !isFavorite });

    try {
      if (isFavorite) {
        await callAPI(`/api/favorites/manga-custom/${mangaSlug}`, {
          method: 'DELETE',
        });
        setFeedback({ message: 'Eliminado de favoritos', type: 'success' });
      } else {
        await callAPI(`/api/favorites/manga-custom/${mangaSlug}`, {
          method: 'POST',
        });
        setFeedback({ message: 'Agregado a favoritos', type: 'success' });
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      // Revert on error
      setFavorites({ ...favorites, [mangaSlug]: isFavorite });
      setFeedback({ message: error?.message || 'Error al actualizar favoritos', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading || mangas.length === 0) {
    return (
      <div className="relative h-[550px] md:h-[600px] w-full bg-zinc-950 overflow-hidden pt-20">
        <div className="relative z-10 h-full max-w-7xl mx-auto px-3 md:px-8 flex items-center">
          <div className="w-full h-64 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const current = mangas[active];

  return (
    <div className="relative h-[550px] md:h-[600px] w-full bg-black overflow-hidden pt-20">
      {/* Background Layer with optimized visibility */}
      <div className="absolute inset-0">
        <img 
          src={current.cover} 
          className="w-full h-full object-cover opacity-30 blur-sm scale-105 transition-all duration-1000"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 h-full max-w-7xl mx-auto px-3 md:px-8 flex items-center">
        <div className="grid lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* Text Content - Compressed for smaller height */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-cyan-500 text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">Featured</span>
                <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em]">{current.scan || current.scanName || 'Capibara Traductor'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white italic leading-tight tracking-tighter uppercase drop-shadow-2xl line-clamp-2">
                {current.title.split(' ')[0]}
                <span className="text-outline-white text-transparent ml-2">{current.title.split(' ').slice(1).join(' ') || 'Manga'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {current.chapter && (
                <span className="text-zinc-300 font-bold bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/50">Chapter {current.chapter}</span>
              )}
              {current.lastUpdate && (
                <span className="text-zinc-500 font-bold uppercase tracking-widest">{current.lastUpdate}</span>
              )}
            </div>

            <p className="text-zinc-400 text-base max-w-xl leading-relaxed line-clamp-2 md:line-clamp-3">
              Descubre la historia que está cautivando a todos. Un despliegue visual impresionante y una narrativa profunda, ahora disponible gracias a {current.scan || current.scanName || 'nuestros scans'}.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  const mangaSlug = current.mangaSlug || current.slug;
                  const scanSlug = current.scanSlug || current.scan;
                  
                  if (mangaSlug && scanSlug) {
                    // Navegar al detalle del manga
                    window.location.href = `/${scanSlug}/manga/${mangaSlug}`;
                  } else if (mangaSlug) {
                    // Si no hay scan, buscar en todos
                    window.location.href = `/manga/${mangaSlug}`;
                  } else {
                    // Fallback al explorador
                    onExplore();
                  }
                }}
                className="bg-cyan-500 text-black font-black px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105 active:scale-95 text-sm"
              >
                <Play size={16} fill="currentColor" /> LEER AHORA
              </button>
              <div className="relative">
                <button 
                  onClick={toggleFavorite}
                  className={`backdrop-blur-md font-black px-8 py-3.5 rounded-xl border flex items-center gap-2 transition-all text-sm ${
                    favorites[current.mangaSlug || current.slug || '']
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                      : 'bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800'
                  }`}
                >
                  {favorites[current.mangaSlug || current.slug || ''] ? (
                    <><Check size={16} /> EN FAVORITOS</>
                  ) : (
                    <><Plus size={16} /> MI LISTA</>
                  )}
                </button>
                {feedback && (
                  <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-10 ${
                    feedback.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
                  }`}>
                    {feedback.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Image - Smaller scale */}
          <div className="hidden lg:block lg:col-span-5 justify-self-end">
            <div className="relative w-[300px] h-[440px] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 group transform rotate-2 hover:rotate-0 transition-all duration-500">
              <img src={current.cover} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!nsfwMode && current.isNSFW ? 'blur-xl scale-110' : ''}`} alt={current.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {!nsfwMode && current.isNSFW && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-red-500/90 text-white px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <AlertTriangle size={16} /> +18
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                 <p className="text-white font-black italic text-lg drop-shadow-lg line-clamp-2">{current.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-2 translate-y-2 right-8 z-20 flex items-center gap-4">
        <div className="flex gap-2 mr-4">
          {mangas.map((_, i) => (
            <button 
              key={i}
              onClick={() => setActive(i)}
              className={`h-1 transition-all duration-500 rounded-full ${active === i ? 'w-8 bg-cyan-500' : 'w-2 bg-zinc-800 hover:bg-zinc-600'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActive((prev) => (prev - 1 + mangas.length) % mangas.length)}
            className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setActive((prev) => (prev + 1) % mangas.length)}
            className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;


