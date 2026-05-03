
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import FeaturedManga from './FeaturedManga';
import PopularToday from './PopularToday';
import LatestUpdates from './LatestUpdates';
import PerOrgPopular from './PerOrgPopular';
import ScansSection from './ScansSection';
import TopReaders from './TopReaders';
import TopCommenters from './TopCommenters';
import ScansButtonsSection from './ScansButtonsSection';
import ContinueReading from './ContinueReading';
import Footer from './Footer';
import SearchView from './SearchView';
import { Star, Flame } from 'lucide-react';

interface LandingAppProps {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
  contentKind?: 'manga' | 'writing';
}

const LandingApp: React.FC<LandingAppProps> = ({ user, logged, nsfwMode = false, contentKind = 'manga' }) => {
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);
    
    // Check path on mount
    handleLocationChange();
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const openUserRegistration = () => navigateTo('/register'); // Para usuarios
  const openLogin = () => navigateTo('/login');

  const isWritings = contentKind === 'writing';
  const isHome = nsfwMode || currentPath === '/' || currentPath === '/writings' || currentPath === '/red/writings';
  const isScans = currentPath === '/scans';
  const isSearch = currentPath === '/search';

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar
        onOpenRegister={openUserRegistration}
        onOpenLogin={openLogin}
        onGoHome={() => navigateTo(nsfwMode ? '/red' : '/')}
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo(nsfwMode ? '/red/search' : '/search')}
        activeView={isScans ? 'explore' : isSearch ? 'search' : 'home'}
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
      />
      
      <main>
        {isHome && (
          <>
            {isWritings ? (
              <section className="max-w-[1600px] mx-auto px-4 md:px-8 pt-32 pb-12 text-center">
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-white">
                  Novelas y libros
                </h1>
                <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">
                  Explora capítulos en formato texto: novelas, novelas ligeras, libros y cuentos.
                </p>
              </section>
            ) : (
              <Hero
                onExplore={() => navigateTo('/scans')}
                user={user}
                logged={logged}
                nsfwMode={nsfwMode}
              />
            )}

            {/* Scans Buttons Section */}
            {!isWritings && (
              <ScansButtonsSection nsfwMode={nsfwMode} onNavigate={(path) => navigateTo(path.startsWith('/') ? path : `/${path}`)} />
            )}

            {/* Continue Reading — logged-in users only */}
            {logged && !isWritings && (
              <ContinueReading />
            )}

            {/* Popular Today Section */}
            <section className="max-w-[1600px] mx-auto px-4 md:px-8 pt-16 pb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <Flame size={12} fill="currentColor" /> Tendencias Globales
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares del Día</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
                <PopularToday user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />
              </div>
            </section>

            {/* Featured Mangas Section */}
            <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <Star size={12} fill="currentColor" /> Tendencias Globales
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares de la Semana</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
                <FeaturedManga user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />
              </div>
            </section>



            <LatestUpdates user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />

            {!isWritings && (
              <div className="grid md:grid-cols-2 gap-0">
                <TopReaders />
                <TopCommenters />
              </div>
            )}

            {!isWritings && (
              <ScansSection onNavigate={(path) => navigateTo(path.startsWith('/') ? path : `/${path}`)} />
            )}
          </>
        )}
        
        {isSearch && <SearchView />}
      </main>

      <Footer 
        onNavigate={(page) => {
          if (page === 'explore') navigateTo('/scans');
          else if (page === 'home') navigateTo('/');
        }} 
      />
    </div>
  );
};

export default LandingApp;

