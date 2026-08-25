import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Menu,
  Search,
  ExternalLink,
  LayoutDashboard,
  BookOpen,
  BookText,
  Users,
  Ticket,
  DollarSign,
  MessageSquare,
  Inbox,
  Megaphone,
  Star,
  Settings,
  Tag,
  UserCircle,
  Link2,
  CornerDownLeft,
} from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface AdminNavbarProps {
  organization: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  organizationSlug: string;
  page: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  keywords: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Secciones del panel agrupadas por área. El agrupamiento ES la navegación:
// un uploader piensa "voy a subir un capítulo" (Contenido), "me escribieron"
// (Comunidad) o "cuánto llevo este mes" (Ingresos).
const buildGroups = (slug: string): NavGroup[] => [
  {
    label: 'Panel',
    items: [
      { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard, href: `/${slug}/admin/analytics`, keywords: 'dashboard analytics estadisticas inicio' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { id: 'mangas', label: 'Mangas', icon: BookOpen, href: `/${slug}/admin/mangas`, keywords: 'mangas obras capitulos subir' },
      { id: 'writings', label: 'Novelas', icon: BookText, href: `/${slug}/admin/writings`, keywords: 'novelas escritos writings' },
      { id: 'authors', label: 'Autores', icon: UserCircle, href: `/${slug}/admin/authors`, keywords: 'autores artistas' },
      { id: 'genres', label: 'Géneros', icon: Tag, href: `/${slug}/admin/genres`, keywords: 'generos etiquetas tags' },
      { id: 'joints', label: 'Joints', icon: Link2, href: `/${slug}/admin/joints`, keywords: 'joints colaboraciones' },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { id: 'comments', label: 'Comentarios', icon: MessageSquare, href: `/${slug}/admin/comments`, keywords: 'comentarios moderar' },
      { id: 'messages', label: 'Mensajes', icon: Inbox, href: `/${slug}/admin/messages`, keywords: 'mensajes bandeja lectores' },
      { id: 'users', label: 'Usuarios', icon: Users, href: `/${slug}/admin/users`, keywords: 'usuarios staff permisos roles' },
      { id: 'recruitment', label: 'Reclutamiento', icon: Megaphone, href: `/${slug}/admin/recruitment`, keywords: 'reclutamiento anuncios vacantes' },
      { id: 'recommendations', label: 'Recomendaciones', icon: Star, href: `/${slug}/admin/recommendations`, keywords: 'recomendaciones destacados recomendacion de la casa estante' },
    ],
  },
  {
    label: 'Ingresos',
    items: [
      { id: 'subscription_plans', label: 'Planes', icon: Ticket, href: `/${slug}/admin/subscription-plans`, keywords: 'planes suscripcion vip precios' },
      { id: 'finance', label: 'Finanzas', icon: DollarSign, href: `/${slug}/admin/finance`, keywords: 'finanzas dinero retiros saldo' },
    ],
  },
  {
    label: 'Ajustes',
    items: [
      { id: 'settings', label: 'Ajustes', icon: Settings, href: `/${slug}/admin/settings`, keywords: 'configuracion ajustes scan logo discord' },
    ],
  },
];

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const AdminNavbar: React.FC<AdminNavbarProps> = ({ organization, organizationSlug, page }) => {
  const groups = useMemo(() => buildGroups(organizationSlug), [organizationSlug]);
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const current = allItems.find((i) => i.id === page);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Conversaciones con mensajes entrantes sin leer (para la burbuja de "Mensajes").
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!organizationSlug) return;
    let alive = true;
    const load = () => {
      callAPI('/api/organization/messages/unread-count', { headers: { 'x-organization': organizationSlug } })
        .then((d: any) => { if (alive && typeof d?.count === 'number') setUnreadMessages(d.count); })
        .catch(() => {});
    };
    load();
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); };
  }, [organizationSlug]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Paleta rápida: Ctrl+K (o Cmd+K) desde cualquier parte del panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (paletteOpen) setTimeout(() => inputRef.current?.focus(), 30);
  }, [paletteOpen]);

  // Bloquear scroll del fondo mientras hay overlay abierto.
  useEffect(() => {
    document.body.style.overflow = drawerOpen || paletteOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen, paletteOpen]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return allItems;
    return allItems.filter((i) => normalize(`${i.label} ${i.keywords}`).includes(q));
  }, [query, allItems]);

  const goTo = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  const onPaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      goTo(results[selected].href);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes an-rail-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes an-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes an-pop-in { from { opacity: 0; transform: scale(.98) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes an-drawer-in { from { transform: translateX(-16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .an-rail-item { animation: an-rail-in .3s ease-out both; }
        .an-underline { position: absolute; left: 10px; right: 10px; bottom: 4px; height: 2px; border-radius: 2px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .18s ease-out; opacity: .5; }
        .an-item:hover .an-underline { transform: scaleX(1); }
        @media (prefers-reduced-motion: reduce) {
          .an-rail-item, [class*='an-'] { animation: none !important; transition: none !important; }
        }
      `,
        }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Fila 1: identidad + acciones */}
        <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <button
            className="md:hidden relative min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            onClick={() => setDrawerOpen(true)}
            aria-label={unreadMessages > 0 ? `Abrir secciones del panel (${unreadMessages} mensajes sin leer)` : 'Abrir secciones del panel'}
          >
            <Menu size={22} />
            {unreadMessages > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-zinc-950" aria-hidden="true" />
            )}
          </button>

          <a
            href={`/${organizationSlug}`}
            className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial group"
            title="Ver mi scan"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0 ring-1 ring-zinc-800 group-hover:ring-cyan-500/50 transition-all">
              {organization.logoUrl ? (
                <img src={organization.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-cyan-500 font-black">{organization.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm md:text-base font-black tracking-tight text-white leading-none truncate">
                {organization.name}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] truncate">
                Admin{current ? ` · ${current.label}` : ''}
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPaletteOpen(true); setQuery(''); setSelected(0); }}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 text-xs transition-colors"
              aria-label="Ir a una sección"
            >
              <Search size={13} />
              <span>Ir a…</span>
              <kbd className="text-[9px] font-bold bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-400">Ctrl K</kbd>
            </button>
            <button
              onClick={() => { setPaletteOpen(true); setQuery(''); setSelected(0); }}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
              aria-label="Ir a una sección"
            >
              <Search size={20} />
            </button>
            <a
              href={`/${organizationSlug}`}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold transition-colors"
            >
              <ExternalLink size={13} /> Ver mi scan
            </a>
          </div>
        </div>

        {/* Fila 2 (desktop): rail de secciones agrupado, siempre visible */}
        <div className="hidden md:block border-t border-zinc-900">
          <div className="px-4 md:px-6 h-11 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 && <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" aria-hidden="true" />}
                {group.items.length > 1 && (
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 mr-1 shrink-0 select-none">
                    {group.label}
                  </span>
                )}
                {group.items.map((item, ii) => {
                  const isActive = page === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`an-item an-rail-item relative shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isActive
                          ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_16px_-4px] shadow-cyan-500/60'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      style={{ animationDelay: `${(gi * 4 + ii) * 20}ms` }}
                    >
                      {item.label}
                      {item.id === 'messages' && unreadMessages > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black align-middle">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                      {!isActive && <span className="an-underline" aria-hidden="true" />}
                    </a>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </nav>

      {/* Drawer móvil: secciones agrupadas, filas de 44px */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          style={{ animation: 'an-fade-in .15s ease-out both' }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-zinc-950 border-r border-zinc-800 flex flex-col"
            style={{ animation: 'an-drawer-in .2s ease-out both' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Secciones del panel"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900 shrink-0">
              <span className="text-xs font-black text-white uppercase tracking-widest">Secciones</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom)]">
              {groups.map((group, gi) => (
                <div key={group.label} className="px-2 mb-1" style={{ animation: `an-rail-in .25s ease-out ${gi * 40}ms both` }}>
                  <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 select-none">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = page === item.id;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors active:scale-[0.98] ${
                          isActive ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <Icon size={17} className={isActive ? '' : 'text-zinc-500'} />
                        {item.label}
                        {item.id === 'messages' && unreadMessages > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              ))}
              <div className="px-2 mt-2 pt-2 border-t border-zinc-900">
                <a href={`/${organizationSlug}`} className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">
                  <ExternalLink size={17} className="text-zinc-500" /> Ver mi scan
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paleta rápida (Ctrl+K): escribe y salta a la sección */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-start justify-center pt-[15vh] px-4"
          style={{ animation: 'an-fade-in .12s ease-out both' }}
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ animation: 'an-pop-in .15s ease-out both' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Ir a una sección"
          >
            <div className="flex items-center gap-2 px-4 border-b border-zinc-900">
              <Search size={16} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={onPaletteKey}
                placeholder="Escribe una sección… (mangas, finanzas, mensajes)"
                className="w-full bg-transparent py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                aria-label="Buscar sección"
              />
              <kbd className="hidden md:block text-[9px] font-bold bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-500 shrink-0">Esc</kbd>
            </div>
            <div className="max-h-[75vh] overflow-y-auto py-1.5">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-600">
                  Nada coincide con "{query}". Prueba con "mangas" o "finanzas".
                </p>
              ) : (
                results.map((item, i) => {
                  const Icon = item.icon;
                  const group = groups.find((g) => g.items.includes(item));
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.href)}
                      onMouseEnter={() => setSelected(i)}
                      className={`w-full flex items-center gap-3 px-4 min-h-[44px] text-left text-sm font-bold transition-colors ${
                        i === selected ? 'bg-zinc-900 text-white' : 'text-zinc-400'
                      }`}
                    >
                      <Icon size={16} className="text-zinc-500 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{group?.label}</span>
                      {i === selected && <CornerDownLeft size={13} className="text-zinc-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
