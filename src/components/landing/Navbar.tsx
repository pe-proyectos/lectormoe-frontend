
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Users, ChevronDown, User as UserIcon, LogOut, Settings, ChevronLeft, Sparkles, CreditCard } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onGoHome: () => void;
  onGoExplore: () => void;
  onGoSearch: () => void;
  onGoSubscriptions?: () => void; // Optional callback for subscriptions navigation
  activeView: string;
  user?: any;
  logged?: boolean;
  activeScan?: any; // Organization/Scan object for contextual branding
  isSticky?: boolean; // Whether the navbar should be sticky (default true)
}

const Navbar: React.FC<NavbarProps> = ({ onOpenRegister, onOpenLogin, onGoHome, onGoExplore, onGoSearch, onGoSubscriptions, activeView, user: initialUser, logged: initialLogged, activeScan, isSticky = true }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(initialUser);
  const [logged, setLogged] = useState(initialLogged);

  // Sincronizar con props cuando cambien
  useEffect(() => {
    setUser(initialUser);
    setLogged(initialLogged);
  }, [initialUser, initialLogged]);

  // Leer cookies del cliente para actualizar el estado después del login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fallback: leer cookies manualmente usando document.cookie (más confiable)
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {} as Record<string, string>);
        
        if (cookies['token'] && cookies['user']) {
          try {
            const userData = JSON.parse(cookies['user']);
            setUser(userData);
            setLogged(true);
          } catch (e) {
            setUser(null);
            setLogged(false);
          }
        } else {
          setUser(null);
          setLogged(false);
        }
      } catch (error) {
        // Error silencioso
      }
    };

    // Verificar inmediatamente al montar
    checkAuth();
    
    // Escuchar eventos personalizados de login/logout
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('focus', checkAuth); // Verificar cuando la ventana recupera el foco
    
    // Verificar periódicamente (cada 2 segundos) para detectar cambios en cookies
    const interval = setInterval(checkAuth, 2000);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('focus', checkAuth);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleScansClick = () => {
    if (activeView === 'home') {
      const element = document.getElementById('scans-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onGoExplore();
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await callAPI("/api/auth/logout", { method: "POST" });
      
      // Limpiar cookies manualmente
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userSlug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Limpiar localStorage también por si acaso
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (e) {
        // Ignorar errores de localStorage
      }
      
      setUser(null);
      setLogged(false);
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = "/";
    } catch (error) {
      // Limpiar cookies manualmente incluso si hay error
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userSlug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      setUser(null);
      setLogged(false);
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = "/";
    }
  };

  const navigateToProfile = () => {
    window.location.href = `/profile/${user?.slug}`;
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <nav className={`${isSticky ? 'fixed' : 'relative'} top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || activeView !== 'home' ? 'bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 py-3 shadow-2xl shadow-black/50' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Branding Area Contextual */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onGoHome}>
            {activeScan ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-lg shadow-cyan-500/10 transition-transform group-hover:scale-110">
                    <img 
                      src={activeScan.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeScan.name)}&background=27272a&color=fff&size=48`} 
                      alt={activeScan.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-yellow-500 p-0.5 rounded-full border-2 border-zinc-950">
                    <Sparkles size={8} className="text-zinc-950" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-cyan-400 transition-colors">{activeScan.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img 
                    src="/images/logocaptrad.png" 
                    alt="CapibaraTraductor" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  Capibara<span className="text-cyan-500">Traductor</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {activeScan && (
            <button 
              onClick={onGoHome} 
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-all mr-2 group/back"
            >
              <ChevronLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" /> Inicio
            </button>
          )}

          <button 
            onClick={onGoSearch} 
            className={`text-sm font-bold transition-colors flex items-center gap-2 ${activeView === 'search' ? 'text-cyan-500' : 'text-zinc-400 hover:text-white'}`}
          >
            <Search size={16} /> Catálogo
          </button>
          
          {activeScan && onGoSubscriptions ? (
            <button 
              onClick={onGoSubscriptions} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${activeView === 'subscriptions' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
            >
              <CreditCard size={16} /> Suscripciones
            </button>
          ) : !activeScan ? (
            <button 
              onClick={handleScansClick} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 text-zinc-400 hover:text-white`}
            >
              <Users size={16} /> Scans
            </button>
          ) : null}

          <div className="h-6 w-px bg-zinc-800 mx-2" />
          
          {logged && user && (user.username || user.email) ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/50 flex items-center justify-center bg-zinc-800">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-cyan-500 font-black text-xs">{(user.username || user.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">{user.username || user.email || 'Usuario'}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conectado como</p>
                    <p className="text-sm font-bold text-white truncate">{user.email || user.username}</p>
                  </div>
                  <button 
                    onClick={() => { navigateToProfile(); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <UserIcon size={16} className="text-cyan-500" /> Mi perfil
                  </button>
                  <button 
                    onClick={() => { 
                      navigateTo(activeScan ? `/${activeScan.slug}/settings` : '/settings'); 
                      setProfileDropdownOpen(false); 
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <Settings size={16} className="text-zinc-500" /> Ajustes
                  </button>
                  <div className="h-px bg-zinc-800 my-2" />
                  <button 
                    onClick={() => {
                      handleLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-xs font-black uppercase tracking-widest"
                  >
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onOpenLogin}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 ${activeView === 'login' ? 'bg-cyan-500 text-zinc-950' : 'bg-white text-zinc-950 hover:bg-cyan-500'}`}
            >
              Ingresar
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          {logged && user && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500 bg-zinc-800 flex items-center justify-center">
               {user.imageUrl ? (
                 <img src={user.imageUrl} className="w-full h-full object-cover" alt="" />
               ) : (
                 <span className="text-cyan-500 font-black text-xs">{user.username?.[0] || 'U'}</span>
               )}
            </div>
          )}
          <button className="text-zinc-100 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300 shadow-2xl">
          {activeScan && (
            <button onClick={() => { onGoHome(); setMobileMenuOpen(false); }} className="text-zinc-500 font-bold flex items-center gap-4 text-lg"><ChevronLeft size={20} /> Inicio</button>
          )}
          <button onClick={() => { onGoSearch(); setMobileMenuOpen(false); }} className={`text-xl font-bold flex items-center gap-4 ${activeView === 'search' ? 'text-cyan-500' : 'text-zinc-100'}`}><Search size={20} /> Catálogo</button>
          {activeScan && onGoSubscriptions ? (
            <button onClick={() => { onGoSubscriptions(); setMobileMenuOpen(false); }} className={`text-xl font-bold flex items-center gap-4 ${activeView === 'subscriptions' ? 'text-yellow-500' : 'text-zinc-100'}`}><CreditCard size={20} /> Suscripciones</button>
          ) : !activeScan ? (
            <button onClick={handleScansClick} className={`text-xl font-bold flex items-center gap-4 text-zinc-100`}><Users size={20} /> Scans</button>
          ) : null}
          
          {logged && user && (user.username || user.email) ? (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-4" onClick={() => { navigateToProfile(); setMobileMenuOpen(false); }}>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-cyan-500 font-black text-lg">{(user.username || user.email || 'U')[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-black uppercase text-sm tracking-widest">{user.username || user.email || 'Usuario'}</p>
                  <p className="text-zinc-500 text-xs font-bold">{user.email || ''}</p>
                </div>
              </div>
              <button onClick={() => { navigateToProfile(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"><UserIcon size={20} /> Mi Perfil</button>
              <button onClick={() => { navigateTo(activeScan ? `/${activeScan.slug}/settings` : '/settings'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"><Settings size={20} /> Ajustes</button>
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }} 
                className="w-full flex items-center gap-4 text-red-500 font-black text-lg uppercase tracking-widest"
              >
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }} className="bg-cyan-500 text-zinc-950 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Ingresar</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

