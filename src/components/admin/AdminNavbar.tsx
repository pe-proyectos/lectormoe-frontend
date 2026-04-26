import React, { useState, useEffect, useRef } from 'react';
import { X, Menu, ChevronDown, Pin, PinOff, Sparkles } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Ticket,
  DollarSign,
  MessageSquare,
  Settings,
  Tag,
  UserCircle,
  Link2,
} from 'lucide-react';

interface AdminNavbarProps {
  organization: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  organizationSlug: string;
  page: string;
}

const STORAGE_KEY = 'admin_pinned_items';

const AdminNavbar: React.FC<AdminNavbarProps> = ({ organization, organizationSlug, page }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Cargar items fijados desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length <= 3) {
          setPinnedItems(parsed);
        }
      } catch (e) {
        console.error('Error loading pinned items:', e);
      }
    }
  }, []);

  const handleExit = () => {
    window.location.href = `/${organizationSlug}`;
  };

  const togglePin = (itemId: string) => {
    setPinnedItems((prev) => {
      let newPinned: string[];
      if (prev.includes(itemId)) {
        // Desfijar
        newPinned = prev.filter((id) => id !== itemId);
      } else {
        // Fijar (máximo 3)
        if (prev.length >= 3) {
          return prev; // Ya hay 3 fijados
        }
        newPinned = [...prev, itemId];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const menuItems = [
    {
      id: 'analytics',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: `/${organizationSlug}/admin/analytics`,
    },
    {
      id: 'authors',
      label: 'Autores',
      icon: UserCircle,
      href: `/${organizationSlug}/admin/authors`,
    },
    {
      id: 'genres',
      label: 'Géneros',
      icon: Tag,
      href: `/${organizationSlug}/admin/genres`,
    },
    {
      id: 'mangas',
      label: 'Mangas',
      icon: BookOpen,
      href: `/${organizationSlug}/admin/mangas`,
    },
    {
      id: 'writings',
      label: 'Novelas',
      icon: BookOpen,
      href: `/${organizationSlug}/admin/writings`,
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      href: `/${organizationSlug}/admin/users`,
    },
    {
      id: 'joints',
      label: 'Joints',
      icon: Link2,
      href: `/${organizationSlug}/admin/joints`,
    },
    {
      id: 'subscription_plans',
      label: 'Planes de Suscripción',
      icon: Ticket,
      href: `/${organizationSlug}/admin/subscription-plans`,
    },
    {
      id: 'finance',
      label: 'Finanzas',
      icon: DollarSign,
      href: `/${organizationSlug}/admin/finance`,
    },
    {
      id: 'comments',
      label: 'Comentarios',
      icon: MessageSquare,
      href: `/${organizationSlug}/admin/comments`,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      href: `/${organizationSlug}/admin/settings`,
    },
  ];

  const getPinnedItems = () => {
    return menuItems.filter((item) => pinnedItems.includes(item.id));
  };

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.admin-mobile-menu') && !target.closest('.admin-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Cerrar megamenu al hacer clic fuera (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isMegaMenuOpen &&
        megaMenuRef.current &&
        menuButtonRef.current &&
        !megaMenuRef.current.contains(target) &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMegaMenuOpen(false);
      }
    };

    if (isMegaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMegaMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 shadow-2xl shadow-black/50">
        <div className="max-w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
          {/* Botón hamburguesa (solo mobile) */}
          <button
            className="admin-menu-button md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors text-white"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo y Nombre */}
          <a 
            href={`/${organizationSlug}`}
            className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0">
              {organization.logoUrl ? (
                <img 
                  src={organization.logoUrl} 
                  alt={organization.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-cyan-500 font-black text-lg">
                  {organization.name[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter text-white uppercase leading-none truncate">
                {organization.name}
              </span>
              <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Panel de Administración
              </span>
            </div>
          </a>

          {/* Items fijados (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {getPinnedItems().map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl 
                    text-xs font-bold uppercase tracking-wider transition-all group relative
                    ${isActive 
                      ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/30' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                    }
                  `}
                  title={item.label}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    className="ml-1 p-0.5 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Desfijar"
                  >
                    <PinOff size={12} />
                  </button>
                </a>
              );
            })}
          </div>

          {/* Botón Menú (desktop) - Diseño mejorado */}
          <div className="hidden md:block relative">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-2xl 
                text-sm font-black uppercase tracking-widest transition-all duration-300
                overflow-hidden group
                ${isMegaMenuOpen 
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/50 scale-105' 
                  : 'bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 text-white shadow-lg hover:shadow-xl'
                }
              `}
            >
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <Menu size={18} className="relative z-10" />
                  {!isMegaMenuOpen && (
                    <Sparkles 
                      size={12} 
                      className="absolute -top-1 -right-1 text-cyan-400 animate-pulse" 
                    />
                  )}
                </div>
                <span>Menú</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Megamenu (desktop) */}
            {isMegaMenuOpen && (
              <div
                ref={megaMenuRef}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
                className="absolute top-full right-0 mt-2 w-[650px] max-w-[90vw] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
              >
                <div className="p-6">
                  {/* Header del megamenu */}
                  <div className="mb-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} className="text-cyan-400" />
                        Menú de Administración
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {pinnedItems.length}/3 fijados
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = page === item.id;
                      const isPinned = pinnedItems.includes(item.id);
                      const canPin = !isPinned && pinnedItems.length < 3;
                      
                      return (
                        <div
                          key={item.id}
                          className="relative group/item"
                        >
                          <a
                            href={item.href}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className={`
                              flex flex-col items-center gap-3 p-4 rounded-xl
                              transition-all cursor-pointer
                              ${isActive 
                                ? 'bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20' 
                                : 'hover:bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700'
                              }
                            `}
                          >
                            <div className="relative">
                              <div className={`
                                p-3 rounded-xl transition-all
                                ${isActive 
                                  ? 'bg-cyan-500 text-zinc-950 shadow-lg' 
                                  : 'bg-zinc-800 text-zinc-400 group-hover/item:bg-zinc-700 group-hover/item:text-white'
                                }
                              `}>
                                <Icon size={24} />
                              </div>
                              {isPinned && (
                                <div className="absolute -top-1 -right-1 p-1 bg-cyan-500 rounded-full">
                                  <Pin size={10} className="text-zinc-950" />
                                </div>
                              )}
                            </div>
                            <span className={`
                              text-xs font-bold uppercase tracking-wider text-center
                              ${isActive ? 'text-cyan-400' : 'text-zinc-400 group-hover/item:text-white'}
                            `}>
                              {item.label}
                            </span>
                          </a>
                          {/* Botón para fijar/desfijar */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePin(item.id);
                            }}
                            className={`
                              absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover/item:opacity-100
                              ${isPinned
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                : canPin
                                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
                                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                              }
                            `}
                            title={isPinned ? 'Desfijar' : canPin ? 'Fijar en navbar' : 'Máximo 3 opciones fijadas'}
                            disabled={!isPinned && !canPin}
                          >
                            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Botón Salir en megamenu */}
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <a
                      href={`/${organizationSlug}`}
                      onClick={() => setIsMegaMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border-2 border-red-500/50 hover:border-red-500 rounded-xl text-red-400 hover:text-red-300 text-sm font-bold uppercase tracking-widest transition-all group"
                    >
                      <X size={18} className="group-hover:rotate-90 transition-transform" />
                      <span>Salir del Panel</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Menú móvil (overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[45] md:hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside 
            className="admin-mobile-menu absolute left-0 top-0 h-full w-full max-w-sm border-r border-zinc-800 bg-zinc-950 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400" />
                  Menú de Administración
                </h2>
                <span className="text-xs text-zinc-500">
                  {pinnedItems.length}/3 fijados
                </span>
              </div>
            </div>
            <nav className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = page === item.id;
                  const isPinned = pinnedItems.includes(item.id);
                  const canPin = !isPinned && pinnedItems.length < 3;
                  
                  return (
                    <div
                      key={item.id}
                      className="relative group/item"
                    >
                      <a
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex flex-col items-center gap-2 p-4 rounded-xl 
                          text-xs font-bold uppercase tracking-wider
                          transition-all
                          ${isActive 
                            ? 'bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/20' 
                            : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }
                        `}
                      >
                        <div className="relative">
                          <Icon 
                            size={24} 
                            className={`flex-shrink-0 transition-transform group-hover/item:scale-110 ${isActive ? 'text-zinc-950' : ''}`}
                          />
                          {isPinned && (
                            <div className="absolute -top-1 -right-1 p-1 bg-cyan-500 rounded-full">
                              <Pin size={10} className="text-zinc-950" />
                            </div>
                          )}
                        </div>
                        <span className="text-center leading-tight">{item.label}</span>
                      </a>
                      {/* Botón para fijar/desfijar en mobile */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        className={`
                          absolute top-2 right-2 p-1.5 rounded-lg transition-all
                          ${isPinned
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 opacity-100'
                            : canPin
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 opacity-100'
                            : 'bg-zinc-800/50 text-zinc-600 opacity-50'
                          }
                        `}
                        title={isPinned ? 'Desfijar' : canPin ? 'Fijar en navbar' : 'Máximo 3 opciones fijadas'}
                        disabled={!isPinned && !canPin}
                      >
                        {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Botón Salir en menú móvil */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <a
                  href={`/${organizationSlug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 rounded-xl text-red-400 hover:text-red-300 text-sm font-bold uppercase tracking-widest transition-all group"
                >
                  <X size={18} className="group-hover:rotate-90 transition-transform" />
                  <span>Salir del Panel</span>
                </a>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;

