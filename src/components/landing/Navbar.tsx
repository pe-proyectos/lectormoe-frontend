import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronLeft,
  CreditCard,
  Shield,
  Crown,
  Gift,
} from "lucide-react";
import { callAPI } from '../../util/callApi';

interface NavbarProps {
  // Required props
  activeView: string;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onGoHome: () => void;
  onGoExplore: () => void;
  onGoSearch: () => void;

  // Optional props
  user?: any;
  logged?: boolean;
  activeScan?: any; // Organization/Scan object for contextual branding
  organization?: any;
  onGoSubscriptions?: () => void; // Optional callback for subscriptions navigation
  isSticky?: boolean; // Whether the navbar should be sticky (default true)
  nsfwMode?: boolean; // Whether currently in /red/ NSFW mode
}

const Navbar: React.FC<NavbarProps> = ({
  // Required props
  activeView,
  onOpenLogin,
  onGoHome,
  onGoSearch,
  
  // Optional props
  user: initialUser,
  logged: initialLogged,
  activeScan,
  organization,
  onGoSubscriptions,
  isSticky = true,
  nsfwMode = false,
  // Note: onOpenRegister and onGoExplore are in interface for API compatibility but not currently used
  onOpenRegister: _onOpenRegister,
  onGoExplore: _onGoExplore,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [nsfwModalOpen, setNsfwModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(initialUser);
  const [logged, setLogged] = useState(initialLogged);
  
  // Get user permissions for the current organization
  // Try to get permissions from user object, or fetch them if not available
  const [userPermissions, setUserPermissions] = useState<any>({});
  
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!logged || !user || !organization) {
        setUserPermissions({});
        return;
      }

      // If user already has permissions, use them
      if (user.permissions && Array.isArray(user.permissions)) {
        const found = user.permissions.find(
          (permission: any) => permission.organizationId === organization.id
        );
        if (found) {
          setUserPermissions(found);
          return;
        }
      }

      // If permissions are not available, try to fetch them from API
      try {
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {} as Record<string, string>);

        const token = cookies["token"];
        if (!token) {
          setUserPermissions({});
          return;
        }

        const result = await callAPI('/api/auth/check');

        if (result?.user?.permissions) {
          const found = result.user.permissions.find(
            (permission: any) => permission.organizationId === organization.id
          );
          if (found) {
            setUserPermissions(found);
            // Update user state with fresh permissions
            setUser({
              ...user,
              permissions: result.user.permissions,
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      }

      setUserPermissions({});
    };

    fetchUserPermissions();
  }, [logged, user, organization]);
  
  // Get the most expensive active subscription
  // If in organization page, get from that organization
  // If in landing page, get from all organizations
  const getMostExpensiveActiveSubscription = () => {
    if (!user?.subscriptions) return null;
    
    // Filter all active subscriptions
    const activeSubscriptions = user.subscriptions.filter((sub: any) => {
      return sub.active === true && sub.subscriptionPlan?.price;
    });
    
    if (activeSubscriptions.length === 0) return null;
    
    // If there's an organization, filter by that organization first
    const currentOrg = activeScan || organization;
    if (currentOrg?.id) {
      const orgSubscriptions = activeSubscriptions.filter(
        (sub: any) => sub.subscriptionPlan?.organizationId === currentOrg.id
      );
      
      if (orgSubscriptions.length > 0) {
        // Find the most expensive subscription from this organization
        return orgSubscriptions.reduce((prev: any, current: any) => {
          const prevPrice = prev.subscriptionPlan?.price || 0;
          const currentPrice = current.subscriptionPlan?.price || 0;
          return currentPrice > prevPrice ? current : prev;
        });
      }
    }
    
    // If no organization or no subscriptions from that organization, search in all
    const mostExpensive = activeSubscriptions.reduce((prev: any, current: any) => {
      const prevPrice = prev.subscriptionPlan?.price || 0;
      const currentPrice = current.subscriptionPlan?.price || 0;
      return currentPrice > prevPrice ? current : prev;
    });
    
    return mostExpensive;
  };
  
  const mostExpensiveSubscription = getMostExpensiveActiveSubscription();
  
  // Get color for subscription plan based on price
  const getSubscriptionColor = (subscription: any) => {
    if (!subscription?.subscriptionPlan) {
      return { bg: 'bg-zinc-800', text: 'text-zinc-500' };
    }
    
    // Use color based on absolute price
    const price = subscription.subscriptionPlan.price || 0;
    if (price >= 10) return { bg: 'bg-yellow-500', text: 'text-zinc-950' };
    if (price >= 5) return { bg: 'bg-purple-500', text: 'text-white' };
    if (price >= 2) return { bg: 'bg-cyan-500', text: 'text-zinc-950' };
    return { bg: 'bg-zinc-600', text: 'text-white' };
  };
  
  const subscriptionColor = mostExpensiveSubscription 
    ? getSubscriptionColor(mostExpensiveSubscription)
    : { bg: 'bg-zinc-800', text: 'text-zinc-500' };
  
  // Debug: Log permissions check
  useEffect(() => {
    if (logged && user && organization) {
      console.log('Navbar - User permissions check:', {
        userId: user.id,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        allPermissions: user.permissions,
        foundPermission: userPermissions,
        canSeeAdminPanel: userPermissions?.canSeeAdminPanel,
        activeScan: activeScan?.slug,
      });
    }
  }, [logged, user, organization, userPermissions, activeScan]);

  // Sincronizar con props cuando cambien
  useEffect(() => {
    setUser(initialUser);
    setLogged(initialLogged);
  }, [initialUser, initialLogged]);

  // Leer cookies del cliente para actualizar el estado después del login
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Si tenemos user y logged de props, usarlos directamente
        if (initialUser && initialLogged) {
          setUser(initialUser);
          setLogged(initialLogged);
          return;
        }

        // Fallback: leer cookies manualmente usando document.cookie (más confiable)
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {} as Record<string, string>);

        if (cookies["token"] && cookies["user"]) {
          try {
            const userData = JSON.parse(cookies["user"]);
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

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("focus", checkAuth); // Verificar cuando la ventana recupera el foco

    // Verificar periódicamente (cada 2 segundos) para detectar cambios en cookies
    const interval = setInterval(checkAuth, 2000);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("focus", checkAuth);
      clearInterval(interval);
    };
  }, [initialUser, initialLogged]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await callAPI('/api/auth/logout', { method: 'POST' });

      // Limpiar cookies manualmente con diferentes paths para asegurar que se eliminen todas
      const cookieNames = [
        "token",
        "username",
        "userSlug",
        "user",
        "x-organization",
        "auth-check-time",
      ];
      const paths = ["/", window.location.pathname];

      cookieNames.forEach((name) => {
        paths.forEach((path) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        });
      });

      // Limpiar localStorage también por si acaso
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (e) {
        // Ignorar errores de localStorage
      }

      setUser(null);
      setLogged(false);
      window.dispatchEvent(new Event("auth-changed"));
      window.location.href = "/";
    } catch (error) {
      // Limpiar cookies manualmente incluso si hay error
      const cookieNames = [
        "token",
        "username",
        "userSlug",
        "user",
        "x-organization",
        "auth-check-time",
      ];
      const paths = ["/", window.location.pathname];

      cookieNames.forEach((name) => {
        paths.forEach((path) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        });
      });

      setUser(null);
      setLogged(false);
      window.dispatchEvent(new Event("auth-changed"));
      window.location.href = "/";
    }
  };

  const navigateToProfile = () => {
    window.location.href = `/profile/${user?.slug}`;
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const getNsfwToggleTarget = () => {
    if (nsfwMode) {
      if (activeScan) return `/${activeScan.slug}`;
      if (activeView === 'search') return '/search';
      return '/';
    } else {
      if (activeScan) return `/red/${activeScan.slug}`;
      if (activeView === 'search') return '/red/search';
      return '/red';
    }
  };

  return (
    <>
    <nav
      className={`${
        isSticky ? "fixed" : "relative"
      } top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || activeView !== "home"
          ? "bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 py-3 shadow-2xl shadow-black/50"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Branding Area Contextual */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={onGoHome}
          >
            {activeScan ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-zinc-900/50 transition-transform group-hover:scale-110">
                    <img
                      src={
                        activeScan.logoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          activeScan.name
                        )}&background=27272a&color=fff&size=48`
                      }
                      alt={activeScan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none group-hover:text-cyan-400 transition-colors">
                    {activeScan.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img
                    src={nsfwMode ? "/images/redlogocaptrad.png" : "/images/logocaptrad.png"}
                    alt="CapibaraTraductor"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  {nsfwMode && <span className="text-red-500">Red </span>}Capibara<span className="text-cyan-500">Traductor</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {activeScan && (
            <a
              href={nsfwMode ? '/red' : '/'}
              className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-all mr-2 group/back"
            >
              <ChevronLeft
                size={16}
                className="group-hover/back:-translate-x-1 transition-transform"
              />{" "}
              Inicio
            </a>
          )}

          <a
            href={activeScan?.slug ? (nsfwMode ? `/red/${activeScan.slug}/search` : `/${activeScan.slug}/search`) : (nsfwMode ? '/red/search' : '/search')}
            className={`text-sm font-bold transition-colors flex items-center gap-2 ${
              activeView === "search"
                ? "text-cyan-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Search size={16} /> Catálogo
          </a>

          {/* Sorteo ended — hidden until next giveaway
          <button
            onClick={() => window.dispatchEvent(new Event('open-sorteo-modal'))}
            className="text-sm font-bold transition-colors flex items-center gap-2 text-yellow-500 hover:text-yellow-400"
          >
            <Gift size={16} /> SORTEO Luckybara
          </button>
          */}

          {activeScan && onGoSubscriptions && (
            <a
              href={`${nsfwMode ? `/red/${activeScan?.slug || organization?.slug}` : `/${activeScan?.slug || organization?.slug}`}/subscriptions`}
              onClick={(e) => {
                e.preventDefault();
                onGoSubscriptions();
              }}
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${
                activeView === "subscriptions"
                  ? "text-yellow-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CreditCard size={16} /> Suscripciones
            </a>
          )}

          <div className="h-6 w-px bg-zinc-800 mx-2" />

          {/* NSFW Mode Toggle Circle */}
          <button
            onClick={() => setNsfwModalOpen(true)}
            title={nsfwMode ? 'Salir del modo +18' : 'Activar modo +18'}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] tracking-tight transition-all shadow-lg group/nsfw cursor-pointer ${
              nsfwMode
                ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-400'
                : 'bg-cyan-500 text-zinc-950 shadow-cyan-500/30 hover:bg-red-500 hover:text-white hover:shadow-red-500/30'
            }`}
          >
            {nsfwMode ? '18+' : <span className="opacity-0 group-hover/nsfw:opacity-100 transition-opacity">18+</span>}
          </button>

          {logged && user && (user.username || user.email) ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/50 flex items-center justify-center bg-zinc-800">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-cyan-500 font-black text-xs">
                      {(user.username || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {user.username || user.email || "Usuario"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-zinc-500 transition-transform duration-300 ${
                    profileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Conectado como
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {user.email || user.username}
                    </p>
                    {mostExpensiveSubscription && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${subscriptionColor.bg} ${subscriptionColor.text}`}>
                        <Crown size={12} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-tight">
                          {mostExpensiveSubscription.subscriptionPlan?.name || 'Pro'}
                        </span>
                      </div>
                    )}
                  </div>
                  <a
                    href={`/profile/${user?.slug}`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <UserIcon size={16} className="text-cyan-500" /> Mi perfil
                  </a>
                  <a
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <Settings size={16} className="text-zinc-500" /> Ajustes
                  </a>
                  {user?.permissions?.some((p: any) => p.canSeeAdminPanel && p.organization) && (
                    <div className="max-h-48 overflow-y-auto">
                      {user.permissions
                        .filter((p: any) => p.canSeeAdminPanel && p.organization)
                        .map((p: any) => (
                          <a
                            key={p.organizationId}
                            href={`/${p.organization.slug}/admin/mangas`}
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                          >
                            {p.organization.logoUrl ? (
                              <img src={p.organization.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <Shield size={16} className="text-purple-500" />
                            )}
                            Panel {p.organization.name}
                          </a>
                        ))}
                    </div>
                  )}
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
            <a
              href="/login"
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 inline-block ${
                activeView === "login"
                  ? "bg-cyan-500 text-zinc-950"
                  : "bg-white text-zinc-950 hover:bg-cyan-500"
              }`}
            >
              Ingresar
            </a>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          {/* NSFW Mode Toggle Circle - mobile */}
          <button
            onClick={() => setNsfwModalOpen(true)}
            title={nsfwMode ? 'Salir del modo +18' : 'Activar modo +18'}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] transition-all shadow-md group/nsfw-m cursor-pointer ${
              nsfwMode
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-cyan-500 text-zinc-950 shadow-cyan-500/30 hover:bg-red-500 hover:text-white hover:shadow-red-500/30'
            }`}
          >
            {nsfwMode ? '18+' : <span className="opacity-0 group-hover/nsfw-m:opacity-100 transition-opacity">18+</span>}
          </button>

          {logged && user && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500 bg-zinc-800 flex items-center justify-center">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <span className="text-cyan-500 font-black text-xs">
                  {user.username?.[0] || "U"}
                </span>
              )}
            </div>
          )}
          <button
            className="text-zinc-100 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300 shadow-2xl max-h-[80vh] overflow-y-auto">
          {activeScan && (
            <a
              href={nsfwMode ? '/red' : '/'}
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-500 font-bold flex items-center gap-4 text-lg"
            >
              <ChevronLeft size={20} /> Inicio
            </a>
          )}
          <a
            href={activeScan?.slug ? (nsfwMode ? `/red/${activeScan.slug}/search` : `/${activeScan.slug}/search`) : (nsfwMode ? '/red/search' : '/search')}
            onClick={() => setMobileMenuOpen(false)}
            className={`text-xl font-bold flex items-center gap-4 ${
              activeView === "search" ? "text-cyan-500" : "text-zinc-100"
            }`}
          >
            <Search size={20} /> Catálogo
          </a>
          {/* Sorteo ended — hidden until next giveaway
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new Event('open-sorteo-modal'));
            }}
            className="text-xl font-bold flex items-center gap-4 text-yellow-500"
          >
            <Gift size={20} /> SORTEO Luckybara
          </button>
          */}
          {activeScan && onGoSubscriptions && (
            <a
              href={`${nsfwMode ? `/red/${activeScan?.slug || organization?.slug}` : `/${activeScan?.slug || organization?.slug}`}/subscriptions`}
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                onGoSubscriptions();
              }}
              className={`text-xl font-bold flex items-center gap-4 ${
                activeView === "subscriptions"
                  ? "text-yellow-500"
                  : "text-zinc-100"
              }`}
            >
              <CreditCard size={20} /> Suscripciones
            </a>
          )}

          {logged && user && (user.username || user.email) ? (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div
                className="flex items-center gap-4"
                onClick={() => {
                  navigateToProfile();
                  setMobileMenuOpen(false);
                }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-cyan-500 font-black text-lg">
                        {(user.username || user.email || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-black uppercase text-sm tracking-widest">
                    {user.username || user.email || "Usuario"}
                  </p>
                  <p className="text-zinc-500 text-xs font-bold">
                    {user.email || ""}
                  </p>
                </div>
              </div>
              <a
                href={`/profile/${user?.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"
              >
                <UserIcon size={20} /> Mi Perfil
              </a>
              <a
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-4 text-zinc-300 font-bold text-lg"
              >
                <Settings size={20} /> Ajustes
              </a>
              {user?.permissions
                ?.filter((p: any) => p.canSeeAdminPanel && p.organization)
                .map((p: any) => (
                  <a
                    key={p.organizationId}
                    href={`/${p.organization.slug}/admin/mangas`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-4 text-purple-400 font-bold text-lg"
                  >
                    {p.organization.logoUrl ? (
                      <img src={p.organization.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <Shield size={20} />
                    )}
                    Panel {p.organization.name}
                  </a>
                ))}
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
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-cyan-500 text-zinc-950 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl inline-block text-center"
            >
              Ingresar
            </a>
          )}
        </div>
      )}

    </nav>

    {/* NSFW Mode Confirmation Modal */}
    {nsfwModalOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setNsfwModalOpen(false)}
        />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            nsfwMode ? 'bg-zinc-800' : 'bg-red-500/20'
          }`}>
            <span className={`text-2xl font-black ${nsfwMode ? 'text-zinc-300' : 'text-red-400'}`}>
              {nsfwMode ? '🔓' : '🔞'}
            </span>
          </div>
          <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-3">
            {nsfwMode ? 'Salir del modo +18' : 'Contenido para adultos'}
          </h2>
          <p className="text-zinc-400 text-sm text-center leading-relaxed mb-8">
            {nsfwMode
              ? 'Volverás al catálogo general sin contenido para adultos.'
              : 'Confirma que tienes 18 años o más para acceder a contenido para adultos.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setNsfwModalOpen(false)}
              className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-2xl font-bold text-sm hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setNsfwModalOpen(false);
                window.location.href = getNsfwToggleTarget();
              }}
              className={`flex-1 px-4 py-3 rounded-2xl font-black text-sm transition-colors cursor-pointer ${
                nsfwMode
                  ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                  : 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/30'
              }`}
            >
              {nsfwMode ? 'Confirmar' : 'Tengo 18+ años'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
