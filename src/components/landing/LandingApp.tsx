
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import TrendingSection from './TrendingSection';
import RecentlyAdded from './RecentlyAdded';
import RecruitmentSpotlight from './RecruitmentSpotlight';
import LatestUpdates from './LatestUpdates';
import PerOrgPopular from './PerOrgPopular';
import ScansSection from './ScansSection';
import TopReaders from './TopReaders';
import TopCommenters from './TopCommenters';
import ScansButtonsSection from './ScansButtonsSection';
import ContinueReading from './ContinueReading';
import Footer from './Footer';
import SearchView from './SearchView';

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
              <section className="max-w-[1600px] mx-auto px-3 md:px-8 pt-32 pb-12 text-center">
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
              <ScansButtonsSection
                nsfwMode={nsfwMode}
                onNavigate={(path) => navigateTo(path.startsWith('/') ? path : `/${path}`)}
                user={user}
                logged={logged}
              />
            )}

            {/* Continue Reading — logged-in users only */}
            {logged && !isWritings && (
              <ContinueReading />
            )}

            {/* Trending: día / semana / mes en una sola sección */}
            <TrendingSection user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />

            {/* Últimos añadidos a la plataforma */}
            <RecentlyAdded user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />

            <LatestUpdates user={user} logged={logged} nsfwMode={nsfwMode} contentKind={contentKind} />

            {/* Scans reclutando (muestra aleatoria del mural) */}
            {!isWritings && <RecruitmentSpotlight logged={logged} />}

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

