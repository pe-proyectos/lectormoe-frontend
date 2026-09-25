import React, { useEffect, useState } from 'react';
import { Home, Search, Bookmark, Bell, LogIn, BookOpen, LayoutGrid } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  logged?: boolean;
  organizationSlug?: string | null;
  nsfwMode?: boolean;
  profileSlug?: string | null;
}

// Barra inferior de navegación, solo móvil, solo vistas de lector/usuario (Tarea 19b).
const MobileTabBar: React.FC<Props> = ({ logged, nsfwMode, profileSlug }) => {
  const [unread, setUnread] = useState(0);
  const [path, setPath] = useState('');

  // La barra se persiste entre transiciones de vista (no se re-monta), así que
  // el resaltado de la pestaña activa debe actualizarse en cada navegación.
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    update();
    document.addEventListener('astro:page-load', update);
    return () => document.removeEventListener('astro:page-load', update);
  }, []);

  useEffect(() => {
    if (!logged) return;
    callAPI('/api/notifications/unread-count')
      .then((d: any) => { if (typeof d?.count === 'number') setUnread(d.count); })
      .catch(() => {});
  }, [logged]);

  // La barra inferior es navegación GLOBAL de la app: Inicio y Buscar llevan
  // siempre al inicio/búsqueda generales, no a los del scan que se esté viendo
  // (salir de un scan sin esto resultaba frustrante). Se respeta el modo +18.
  const homeHref = nsfwMode ? '/red' : '/';
  const searchHref = nsfwMode ? '/red/search' : '/search';
  const profileHref = logged ? (profileSlug ? `/profile/${profileSlug}` : '/settings') : '/login';
  // La lista personal vive en /list/{slug} (NO /list): sin el slug la pestaña
  // quedaba en una ruta inexistente y "no se veía nada". Es gratis (lo de
  // suscriptores es crear listas de comunidad en /listas, otra función).
  const listHref = profileSlug
    ? (nsfwMode ? `/red/list/${profileSlug}` : `/list/${profileSlug}`)
    : '/settings';
  const writingsHref = nsfwMode ? '/red/writings' : '/writings';

  // Dos accesos a cada lado y, al centro, el botón que abre el menú completo
  // (MobileMenuSheet, dentro del Navbar). El perfil vive en ese menú; la
  // barra se queda con lo que se usa a diario.
  const izquierda = [
    { key: 'home', label: 'Inicio', icon: Home, href: homeHref },
    { key: 'search', label: 'Buscar', icon: Search, href: searchHref },
  ];
  const derecha = logged
    ? [
        { key: 'list', label: 'Mi Lista', icon: Bookmark, href: listHref },
        { key: 'notif', label: 'Alertas', icon: Bell, href: '/notifications', badge: unread },
      ]
    : [
        { key: 'novels', label: 'Novelas', icon: BookOpen, href: writingsHref },
        { key: 'profile', label: 'Entrar', icon: LogIn, href: profileHref },
      ];

  const isActive = (href: string) => (href === '/' || href === '/red' ? path === href : path === href || path.startsWith(`${href}/`));

  const activo = nsfwMode ? 'text-red-400' : 'text-cyan-400';
  const pastilla = nsfwMode ? 'bg-red-500/15' : 'bg-cyan-500/15';

  const abrirMenu = () => {
    // Si la página no tiene Navbar (sin menú que abrir), lleva al directorio.
    if ((window as any).__capiMobileMenu) window.dispatchEvent(new Event('open-mobile-menu'));
    else window.location.href = '/scans';
  };

  const Pestana = (it: { key: string; label: string; icon: any; href: string; badge?: number }) => {
    const Icon = it.icon;
    const on = isActive(it.href);
    return (
      <a
        key={it.key}
        href={it.href}
        aria-current={on ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[58px] active:scale-95 transition-transform ${on ? activo : 'text-zinc-500'}`}
      >
        <span className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors ${on ? pastilla : ''}`}>
          <Icon size={20} strokeWidth={on ? 2.5 : 2} />
          {!!it.badge && it.badge > 0 && (
            <span className={`absolute -top-1 right-1.5 ${nsfwMode ? 'bg-red-500 text-white' : 'bg-cyan-500 text-zinc-950'} text-[9px] font-black rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center ring-2 ring-zinc-950`}>
              {it.badge > 9 ? '9+' : it.badge}
            </span>
          )}
        </span>
        <span className="text-[10px] font-bold tracking-wide">{it.label}</span>
      </a>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-around px-1">
        {izquierda.map(Pestana)}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={abrirMenu}
            aria-label="Abrir menú"
            className={`-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl ring-4 ring-zinc-950 active:scale-95 transition-transform shadow-xl ${
              nsfwMode
                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-500/30'
                : 'bg-gradient-to-br from-cyan-300 to-cyan-500 text-zinc-950 shadow-cyan-500/30'
            }`}
          >
            <LayoutGrid size={22} strokeWidth={2.5} />
          </button>
        </div>
        {derecha.map(Pestana)}
      </div>
    </nav>
  );
};

export default MobileTabBar;
