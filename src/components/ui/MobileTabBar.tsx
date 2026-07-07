import React, { useEffect, useState } from 'react';
import { Home, Search, Bookmark, Bell, User, LogIn } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  logged?: boolean;
  organizationSlug?: string | null;
  nsfwMode?: boolean;
  profileSlug?: string | null;
}

// Barra inferior de navegación, solo móvil, solo vistas de lector/usuario (Tarea 19b).
const MobileTabBar: React.FC<Props> = ({ logged, organizationSlug, nsfwMode, profileSlug }) => {
  const [unread, setUnread] = useState(0);
  const [path, setPath] = useState('');

  useEffect(() => {
    setPath(window.location.pathname);
    if (!logged) return;
    callAPI('/api/notifications/unread-count')
      .then((d: any) => { if (typeof d?.count === 'number') setUnread(d.count); })
      .catch(() => {});
  }, [logged]);

  const homeHref = organizationSlug ? `/${organizationSlug}` : nsfwMode ? '/red' : '/';
  const searchHref = organizationSlug ? `/${organizationSlug}/search` : '/search';
  const profileHref = logged ? (profileSlug ? `/profile/${profileSlug}` : '/settings') : '/login';

  const items = [
    { key: 'home', label: 'Inicio', icon: Home, href: homeHref },
    { key: 'search', label: 'Buscar', icon: Search, href: searchHref },
    { key: 'list', label: 'Mi Lista', icon: Bookmark, href: '/list' },
    { key: 'notif', label: 'Alertas', icon: Bell, href: '/notifications', badge: unread },
    { key: 'profile', label: logged ? 'Perfil' : 'Entrar', icon: logged ? User : LogIn, href: profileHref },
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
