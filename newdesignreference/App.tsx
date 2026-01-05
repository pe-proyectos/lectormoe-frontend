
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MangaCard3D from './components/MangaCard3D';
import ScansSection from './components/ScansSection';
import Footer from './components/Footer';
import ExplorePage from './components/ExplorePage';
import ScanLanding from './components/ScanLanding';
import SubscriptionPage from './components/SubscriptionPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import MangaDetail from './components/MangaDetail';
import RegisterScanPage from './components/RegisterScanPage';
import { WEEKLY_POPULAR, SCANS, POPULAR_MANGAS } from './constants';
import { User as UserType } from './types';
import { Star } from 'lucide-react';

type PageType = 'home' | 'explore' | 'scan' | 'subscriptions' | 'login' | 'profile' | 'settings' | 'manga-detail' | 'register-scan';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentMangaId, setCurrentMangaId] = useState<string | null>(null);
  const [initialExploreFilter, setInitialExploreFilter] = useState<string>('All');
  const [user, setUser] = useState<UserType | null>(null);

  const handleHash = useCallback(() => {
    const hash = window.location.hash;
    
    if (hash === '#explore') {
      setCurrentPage('explore');
      setCurrentScanId(null);
      setCurrentMangaId(null);
      setInitialExploreFilter('All');
    } else if (hash === '#login') {
      setCurrentPage('login');
    } else if (hash === '#profile') {
      setCurrentPage('profile');
    } else if (hash === '#settings') {
      setCurrentPage('settings');
    } else if (hash === '#register-scan') {
      setCurrentPage('register-scan');
    } else if (hash.startsWith('#/explore/')) {
      const scanId = hash.substring(10);
      const scan = SCANS.find(s => s.id === scanId);
      setCurrentPage('explore');
      setCurrentScanId(scanId);
      setCurrentMangaId(null);
      setInitialExploreFilter(scan ? scan.name : 'All');
    } else if (hash.startsWith('#/scan/')) {
      const scanId = hash.substring(7); 
      setCurrentScanId(scanId);
      setCurrentMangaId(null);
      setCurrentPage('scan');
    } else if (hash.startsWith('#/subscriptions/')) {
      const scanId = hash.substring(16);
      setCurrentScanId(scanId);
      setCurrentMangaId(null);
      setCurrentPage('subscriptions');
    } else if (hash.startsWith('#/manga/')) {
      const mangaId = hash.substring(8);
      setCurrentMangaId(mangaId);
      setCurrentPage('manga-detail');
      const manga = POPULAR_MANGAS.find(m => m.id === mangaId);
      if (manga) {
        const scan = SCANS.find(s => s.name === manga.scan);
        setCurrentScanId(scan?.id || null);
      }
    } else {
      setCurrentPage('home');
      setCurrentScanId(null);
      setCurrentMangaId(null);
      setInitialExploreFilter('All');
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleHash]);

  const navigateTo = (page: PageType, id?: string) => {
    switch (page) {
      case 'home': window.location.hash = ''; break;
      case 'login': window.location.hash = 'login'; break;
      case 'profile': window.location.hash = 'profile'; break;
      case 'settings': window.location.hash = 'settings'; break;
      case 'register-scan': window.location.hash = 'register-scan'; break;
      case 'explore': 
        window.location.hash = id && id !== 'All' ? `#/explore/${id}` : 'explore'; 
        break;
      case 'scan': if (id) window.location.hash = `#/scan/${id}`; break;
      case 'subscriptions': if (id) window.location.hash = `#/subscriptions/${id}`; break;
      case 'manga-detail': if (id) window.location.hash = `#/manga/${id}`; break;
    }
  };

  const handleLoginSuccess = () => {
    setUser({
      id: 'u1',
      name: 'CapiLector',
      email: 'lector@capibara.com',
      avatar: 'https://picsum.photos/seed/user1/200/200',
      banner: 'https://picsum.photos/seed/bannerprof/1200/400',
      description: 'Amante del manga y el café. Explorando mundos un capítulo a la vez. 🦦📖',
      isPro: true
    });
    if (currentPage === 'login') {
        if (currentScanId) navigateTo('scan', currentScanId);
        else if (currentMangaId) navigateTo('manga-detail', currentMangaId);
        else navigateTo('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScanId(null);
    setCurrentMangaId(null);
    navigateTo('home');
  };

  const activeScan = currentScanId ? SCANS.find(s => s.id === currentScanId) : null;

  const handleUpdateUser = (updatedUser: UserType) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 selection:text-cyan-400">
      <Navbar 
        onNavigate={navigateTo} 
        currentPage={currentPage} 
        activeScan={activeScan || undefined}
        user={user}
        onLogout={handleLogout}
      />
      
      <main>
        {currentPage === 'home' && (
          <>
            <Hero />
            
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 relative z-30">
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {SCANS.map(scan => (
                  <button 
                    key={scan.id}
                    onClick={() => navigateTo('scan', scan.id)}
                    className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full hover:border-cyan-500/50 hover:bg-zinc-800 transition-all group shadow-2xl"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 group-hover:border-cyan-500/50 transition-colors">
                      <img src={scan.logo} alt={scan.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{scan.name}</span>
                  </button>
                ))}
              </div>
            </div>

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
                {WEEKLY_POPULAR.map((manga) => (
                  <div key={`weekly-${manga.id}`} onClick={() => navigateTo('manga-detail', manga.id)} className="cursor-pointer">
                    <MangaCard3D 
                      manga={manga} 
                      onSubscribe={() => navigateTo('subscriptions', SCANS[0].id)} 
                    />
                  </div>
                ))}
              </div>
            </section>
            <ScansSection onNavigate={navigateTo} />
          </>
        )}
        {currentPage === 'explore' && <ExplorePage initialScan={initialExploreFilter} />}
        {currentPage === 'scan' && currentScanId && <ScanLanding scanId={currentScanId} />}
        {currentPage === 'subscriptions' && currentScanId && <SubscriptionPage scanId={currentScanId} />}
        {currentPage === 'manga-detail' && currentMangaId && <MangaDetail mangaId={currentMangaId} onNavigate={navigateTo} />}
        {currentPage === 'register-scan' && <RegisterScanPage />}
        {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} isScanContext={!!activeScan || !!currentMangaId} />}
        {currentPage === 'profile' && user && <ProfilePage user={user} onUpdateUser={handleUpdateUser} />}
        {currentPage === 'settings' && user && <SettingsPage user={user} onUpdateUser={handleUpdateUser} />}
      </main>

      <Footer onNavigate={navigateTo} />
    </div>
  );
};

export default App;
