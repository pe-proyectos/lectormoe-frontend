
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import FeaturedManga from './FeaturedManga';
import MangaCard3D from './MangaCard3D';
import ScansSection from './ScansSection';
import ScansButtonsSection from './ScansButtonsSection';
import Footer from './Footer';
import SearchView from './SearchView';
import { Star } from 'lucide-react';

interface LandingAppProps {
  user?: any;
  logged?: boolean;
}

const LandingApp: React.FC<LandingAppProps> = ({ user, logged }) => {
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

  const openRegistration = () => navigateTo('/register'); // Para scans
  const openUserRegistration = () => navigateTo('/register'); // Para usuarios
  const openLogin = () => navigateTo('/login');

  const isHome = currentPath === '/';
  const isScans = currentPath === '/scans';
  const isSearch = currentPath === '/search';

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar 
        onOpenRegister={openUserRegistration}
        onOpenLogin={openLogin}
        onGoHome={() => navigateTo('/')} 
        onGoExplore={() => navigateTo('/scans')}
        onGoSearch={() => navigateTo('/search')}
        activeView={isScans ? 'explore' : isSearch ? 'search' : 'home'}
        user={user}
        logged={logged}
      />
      
      <main>
        {isHome && (
          <>
            <Hero 
              onExplore={() => navigateTo('/scans')} 
              user={user}
              logged={logged}
            />
            
            {/* Scans Buttons Section */}
            <ScansButtonsSection onNavigate={(path) => navigateTo(path.startsWith('/') ? path : `/${path}`)} />

            {/* Featured Mangas Section */}
            <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <Star size={12} fill="currentColor" /> Tendencias Globales
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares de la Semana</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
                <FeaturedManga user={user} logged={logged} userPermissions={user?.permissions} />
              </div>
            </section>
            
            <ScansSection onNavigate={(path) => navigateTo(path.startsWith('/') ? path : `/${path}`)} />
          </>
        )}
        
        {isSearch && <SearchView />}
        
        {/* ExplorarView se renderiza en la página /scans.astro */}
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

