
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
import AdminMangaEdit from './components/AdminMangaEdit';
import { WEEKLY_POPULAR, SCANS } from './constants';
import { User as UserType } from './types';
import { Star } from 'lucide-react';

type PageType = 'home' | 'explore' | 'scan' | 'subscriptions' | 'login' | 'profile' | 'settings' | 'admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [initialExploreFilter, setInitialExploreFilter] = useState<string>('All');
  const [user, setUser] = useState<UserType | null>(null);

  const handleHash = useCallback(() => {
    const hash = window.location.hash;
    
    if (hash === '#explore') {
      setCurrentPage('explore');
    } else if (hash === '#login') {
      setCurrentPage('login');
    } else if (hash === '#profile') {
      setCurrentPage('profile');
    } else if (hash === '#settings') {
      setCurrentPage('settings');
    } else if (hash === '#admin') {
      setCurrentPage('admin');
    } else if (hash.startsWith('#/scan/')) {
      const scanId = hash.substring(7); 
      setCurrentScanId(scanId);
      setCurrentPage('scan');
    } else if (hash.startsWith('#/subscriptions/')) {
      const scanId = hash.substring(16);
      setCurrentScanId(scanId);
      setCurrentPage('subscriptions');
    } else {
      setCurrentPage('home');
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
      case 'admin': window.location.hash = 'admin'; break;
      case 'explore': window.location.hash = 'explore'; break;
      case 'scan': if (id) window.location.hash = `#/scan/${id}`; break;
      case 'subscriptions': if (id) window.location.hash = `#/subscriptions/${id}`; break;
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
    navigateTo('home');
  };

  const handleLogout = () => {
    setUser(null);
    navigateTo('home');
  };

  const activeScan = currentScanId ? SCANS.find(s => s.id === currentScanId) : null;

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
            <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <Star size={12} fill="currentColor" /> Tendencias Globales
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Populares de la Semana</h2>
                </div>
                <button onClick={() => navigateTo('admin')} className="bg-zinc-900 text-zinc-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:text-white hover:border-zinc-700 transition-all">
                  Panel Admin
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-6">
                {WEEKLY_POPULAR.map((manga) => (
                  <MangaCard3D key={manga.id} manga={manga} />
                ))}
              </div>
            </section>
            <ScansSection onNavigate={navigateTo} />
          </>
        )}
        {currentPage === 'explore' && <ExplorePage />}
        {currentPage === 'scan' && currentScanId && <ScanLanding scanId={currentScanId} />}
        {currentPage === 'subscriptions' && currentScanId && <SubscriptionPage scanId={currentScanId} />}
        {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
        {currentPage === 'profile' && user && <ProfilePage user={user} onUpdateUser={setUser} />}
        {currentPage === 'settings' && user && <SettingsPage user={user} onUpdateUser={setUser} />}
        {currentPage === 'admin' && <AdminMangaEdit />}
      </main>
      <Footer />
    </div>
  );
};

export default App;
