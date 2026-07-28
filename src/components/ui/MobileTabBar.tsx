import React, { useEffect, useState } from 'react';
import { Home, Search, Bookmark, Bell, User, LogIn, Compass, BookOpen } from 'lucide-react';
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
  const writingsHref = nsfwMode ? '/red/writings' : '/writings';

  // Set logueado: navegación personal. Set anónimo: solo destinos públicos
  // (nada de Mi Lista/Alertas que exigen cuenta y rebotan a /login).
  const items = logged
    ? [
        { key: 'home', label: 'Inicio', icon: Home, href: homeHref },
        { key: 'search', label: 'Buscar', icon: Search, href: searchHref },
        { key: 'list', label: 'Mi Lista', icon: Bookmark, href: '/list' },
        { key: 'notif', label: 'Alertas', icon: Bell, href: '/notifications', badge: unread },
        { key: 'profile', label: 'Perfil', icon: User, href: profileHref },
      ]
    : [
        { key: 'home', label: 'Inicio', icon: Home, href: homeHref },
        { key: 'search', label: 'Buscar', icon: Search, href: searchHref },
        { key: 'scans', label: 'Scans', icon: Compass, href: '/scans' },
        { key: 'novels', label: 'Novelas', icon: BookOpen, href: writingsHref },
        { key: 'profile', label: 'Entrar', icon: LogIn, href: profileHref },
      ];

  const isActive = (href: string) => (href === '/' || href === '/red' ? path === href : path === href || path.startsWith(`${href}/`));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-900 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <a key={it.key} href={it.href} className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] active:scale-[0.95] transition-transform ${active ? 'text-cyan-400' : 'text-zinc-500'}`}>
              <Icon size={22} />
              {!!it.badge && it.badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-18px)] bg-cyan-500 text-zinc-950 text-[9px] font-black rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center">{it.badge > 9 ? '9+' : it.badge}</span>
              )}
              <span className="text-[9px] font-black uppercase tracking-wide">{it.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
