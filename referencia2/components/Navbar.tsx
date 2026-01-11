
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Users, ChevronLeft, CreditCard, Home, Sparkles, User as UserIcon, LogOut, Settings, ChevronDown, ShieldCheck } from 'lucide-react';
import { Scan, User } from '../types';

interface Props {
  onNavigate: (page: any, id?: string) => void;
  currentPage: string;
  activeScan?: Scan;
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<Props> = ({ onNavigate, currentPage, activeScan, user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLogoClick = () => {
    if (activeScan) {
      onNavigate('scan', activeScan.id);
    } else {
      onNavigate('home');
    }
  };

  const handleScansClick = () => {
    if (currentPage === 'home') {
      const element = document.getElementById('scans-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById('scans-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || currentPage !== 'home' ? 'bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 py-3 shadow-2xl shadow-black/50' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Branding Area Contextual */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleLogoClick}>
            {activeScan ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-lg shadow-cyan-500/10 transition-transform group-hover:scale-110">
                    <img src={activeScan.logo} alt={activeScan.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-yellow-500 p-0.5 rounded-full border-2 border-zinc-950">
                    <Sparkles size={8} className="text-zinc-950" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-cyan-400 transition-colors">{activeScan.name}</span>
                  <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1 opacity-80">Portal Oficial</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                  <span className="text-zinc-950 font-black text-xl">C</span>
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
              onClick={() => onNavigate('home')} 
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-all mr-2 group/back"
            >
              <ChevronLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" /> Inicio
            </button>
          )}

          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('explore', activeScan?.id)} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${currentPage === 'explore' ? 'text-cyan-500' : 'text-zinc-400 hover:text-white'}`}
            >
              <Search size={16} /> Catálogo
            </button>
            
            <button 
              onClick={() => onNavigate('admin')} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${currentPage === 'admin' ? 'text-cyan-500' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          </div>
          
          {activeScan ? (
            <button 
              onClick={() => onNavigate('subscriptions', activeScan.id)} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${currentPage === 'subscriptions' ? 'text-yellow-500' : 'text-zinc-400 hover:text-white'}`}
            >
              <CreditCard size={16} /> Suscripciones
            </button>
          ) : (
            <button 
              onClick={handleScansClick} 
              className={`text-sm font-bold transition-colors flex items-center gap-2 text-zinc-400 hover:text-white`}
            >
              <Users size={16} /> Scans
            </button>
          )}

          <div className="h-6 w-px bg-zinc-800 mx-2" />
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/50 flex items-center justify-center bg-zinc-800">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-cyan-500 font-black text-xs">{user.name[0]}</span>
                  )}
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">{user.name}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conectado como</p>
                    <p className="text-sm font-bold text-white truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { onNavigate('profile'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <UserIcon size={16} className="text-cyan-500" /> Mi perfil
                  </button>
                  <button 
                    onClick={() => { onNavigate('settings'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <Settings size={16} className="text-zinc-500" /> Ajustes
                  </button>
                  <div className="h-px bg-zinc-800 my-2" />
                  <button 
                    onClick={() => {
                      onLogout();
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
              onClick={() => onNavigate('login')}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 ${currentPage === 'login' ? 'bg-cyan-500 text-zinc-950' : 'bg-white text-zinc-950 hover:bg-cyan-500'}`}
            >
              Ingresar
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          {user && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500 bg-zinc-800 flex items-center justify-center">
               {user.avatar ? (
                 <img src={user.avatar} className="w-full h-full object-cover" alt="" />
               ) : (
                 <span className="text-cyan-500 font-black text-xs">{user.name[0]}</span>
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
             <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="text-zinc-500 font-bold flex items-center gap-4 text-lg"><ChevronLeft size={20} /> Inicio</button>
           )}
          <button onClick={() => { onNavigate('explore', activeScan?.id); setMobileMenuOpen(false); }} className={`text-xl font-bold flex items-center gap-4 ${currentPage === 'explore' ? 'text-cyan-500' : 'text-zinc-100'}`}><Search size={20} /> Catálogo</button>
          
          <button onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }} className={`text-xl font-bold flex items-center gap-4 ${currentPage === 'admin' ? 'text-cyan-500' : 'text-zinc-100'}`}><ShieldCheck size={20} /> Admin</button>
          
          {activeScan ? (
             <button onClick={() => { onNavigate('subscriptions', activeScan.id); setMobileMenuOpen(false); }} className={`text-xl font-bold flex items-center gap-4 ${currentPage === 'subscriptions' ? 'text-yellow-500' : 'text-zinc-100'}`}><CreditCard size={20} /> Suscripciones</button>
          ) : (
            <button onClick={handleScansClick} className={`text-xl font-bold flex items-center gap-4 text-zinc-100`}><Users size={20} /> Scans</button>
          )}
          
          {user ? (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-4" onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <p className="text-white font-black uppercase text-sm tracking-widest">{user.name}</p>
                  <p className="text-zinc-500 text-xs font-bold">{user.email}</p>
                </div>
              </div>
              <button onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"><UserIcon size={20} /> Mi Perfil</button>
              <button onClick={() => { onNavigate('settings'); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"><Settings size={20} /> Ajustes</button>
              <button 
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }} 
                className="w-full flex items-center gap-4 text-red-500 font-black text-lg uppercase tracking-widest"
              >
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} className="bg-cyan-500 text-zinc-950 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Ingresar</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
