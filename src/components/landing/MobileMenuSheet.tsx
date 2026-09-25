import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  Crown,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Tags,
  Bookmark,
  Bell,
  HardDriveDownload,
  Settings,
  User as UserIcon,
  Shield,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { enlacesDescubrir, enlacesComunidad, useGeneros, conParams, type Item } from './NavMegaMenu';

interface MobileMenuSheetProps {
  open: boolean;
  onClose: () => void;
  user?: any;
  logged: boolean;
  nsfwMode: boolean;
  activeScan?: any;
  catalogUrl: string;
  altContentLink: { label: string; href: string };
  urlSuscripciones: string;
  onNsfwToggle: () => void;
  onLogout: () => void;
}

const Seccion: React.FC<{ titulo: string; acento: string; children: React.ReactNode; icono?: React.ReactNode }> = ({ titulo, acento, children, icono }) => (
  <section className="px-4 mt-6">
    <p className={`px-1 mb-2.5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${acento}`}>
      {icono}
      {titulo}
    </p>
    {children}
  </section>
);

// Tarjeta compacta de la cuadrícula: icono arriba, título y una línea.
const Tarjeta: React.FC<{ item: Item; tono: string; onClose: () => void }> = ({ item, tono, onClose }) => (
  <a
    href={item.href}
    target={item.external ? '_blank' : undefined}
    rel={item.external ? 'noopener noreferrer' : undefined}
    onClick={onClose}
    className="flex items-start gap-2.5 rounded-2xl bg-zinc-900/70 ring-1 ring-zinc-800 p-3 active:scale-[0.98] active:bg-zinc-800 transition-all"
  >
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 ${tono}`}>{item.icon}</span>
    <span className="min-w-0">
      <span className="block text-[13px] font-bold text-zinc-100 leading-tight">{item.title}</span>
      <span className="block text-[11px] text-zinc-500 leading-snug mt-0.5 line-clamp-2">{item.desc}</span>
    </span>
  </a>
);

const Fila: React.FC<{ href: string; icon: React.ReactNode; label: string; onClose: () => void; badge?: React.ReactNode }> = ({ href, icon, label, onClose, badge }) => (
  <a
    href={href}
    onClick={onClose}
    className="flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-200 active:bg-zinc-800 transition-colors"
  >
    <span className="text-zinc-500">{icon}</span>
    <span className="text-sm font-bold flex-1 truncate">{label}</span>
    {badge}
    <ChevronRight size={16} className="text-zinc-600" />
  </a>
);

// Menú completo de móvil: hoja inferior con buscador, las mismas secciones del
// megamenú de escritorio (Descubrir, Géneros, Comunidad), la cuenta del usuario
// y sus paneles de scan.
const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  open,
  onClose,
  user,
  logged,
  nsfwMode,
  activeScan,
  catalogUrl,
  altContentLink,
  urlSuscripciones,
  onNsfwToggle,
  onLogout,
}) => {
  const [q, setQ] = useState('');
  const generos = useGeneros(open, nsfwMode, 24);
  const pre = nsfwMode ? '/red' : '';

  // Bloquea el scroll de la página mientras el menú está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const acento = nsfwMode ? 'text-red-400' : 'text-cyan-400';
  const tono = nsfwMode ? 'text-red-400' : 'text-cyan-400';
  const anillo = nsfwMode ? 'focus-within:ring-red-500/60' : 'focus-within:ring-cyan-500/60';
  const paneles = (user?.permissions || []).filter((p: any) => p.canSeeAdminPanel && p.organization);
  const miembros: any[] = (activeScan?.jointMembers || []).map((m: any) => m.organization).filter(Boolean);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    window.location.href = t ? conParams(catalogUrl, { q: t }) : catalogUrl;
  };

  return (
    <div className="md:hidden fixed inset-0 z-[60] flex items-end" role="dialog" aria-modal="true" aria-label="Menú">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative w-full max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-zinc-800 bg-zinc-950 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-in slide-in-from-bottom duration-300">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${nsfwMode ? 'from-red-500/10' : 'from-cyan-500/10'} to-transparent`} />

        {/* Cabecera fija: asa, marca y cerrar */}
        <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl px-4 pt-2.5 pb-3">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-700" />
          <div className="flex items-center justify-between">
            <a href={nsfwMode ? '/red' : '/'} className="flex items-center gap-2" onClick={onClose}>
              <img src={nsfwMode ? '/images/redlogocaptrad.png' : '/images/logocaptrad.png'} alt="" className="w-8 h-8 object-contain" />
              <span className="text-base font-bold tracking-tight text-white">
                {nsfwMode && <span className="text-red-500">Red </span>}Capibara<span className={nsfwMode ? 'text-red-500' : 'text-cyan-500'}>Traductor</span>
              </span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 text-zinc-300 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={buscar} className={`mt-3 flex items-center gap-2 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 px-3.5 ${anillo} transition-shadow`}>
            <Search size={18} className="text-zinc-500 shrink-0" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={activeScan?.name && !miembros.length ? `Buscar en ${activeScan.name}` : 'Buscar mangas, manhwas, novelas...'}
              className="w-full bg-transparent py-3 text-base text-white placeholder:text-zinc-500 outline-none"
              enterKeyHint="search"
            />
          </form>
        </div>

        <div className="relative">
          {/* Cuenta */}
          <div className="px-4 mt-1">
            {logged && user ? (
              <a
                href={`${pre}/profile/${user.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/70 ring-1 ring-zinc-800 active:bg-zinc-800 transition-colors"
              >
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="" className={`w-12 h-12 rounded-full object-cover ring-2 ${nsfwMode ? 'ring-red-500/60' : 'ring-cyan-500/60'}`} />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${nsfwMode ? 'bg-red-500' : 'bg-cyan-500'} text-zinc-950 text-lg font-black flex items-center justify-center`}>
                    {(user.username || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold truncate">{user.username || user.email}</p>
                  <p className="text-zinc-500 text-xs">Ver mi perfil</p>
                </div>
                <ChevronRight size={18} className="text-zinc-600" />
              </a>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`${pre}/login`}
                  className={`flex items-center justify-center gap-2 min-h-[48px] rounded-2xl ${nsfwMode ? 'bg-red-500 text-white' : 'bg-cyan-500 text-zinc-950'} text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform`}
                >
                  <LogIn size={16} /> Ingresar
                </a>
                <a
                  href={`${pre}/register`}
                  className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 text-white text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
                >
                  <UserPlus size={16} /> Crear cuenta
                </a>
              </div>
            )}
          </div>

          {/* Contexto: dentro de un scan o joint, acceso a su portada y al inicio general */}
          {activeScan && (
            <div className="px-4 mt-3 flex gap-2">
              <a
                href={nsfwMode ? '/red' : '/'}
                onClick={onClose}
                className="flex items-center gap-1 px-3 min-h-[44px] rounded-xl bg-zinc-900 ring-1 ring-zinc-800 text-xs font-bold text-zinc-300 active:bg-zinc-800"
              >
                <ChevronLeft size={16} /> Inicio
              </a>
              {miembros.length ? (
                <div className="flex-1 flex items-center gap-2 px-3 min-h-[44px] rounded-xl bg-zinc-900 ring-1 ring-zinc-800 overflow-x-auto">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 shrink-0">Joint</span>
                  {miembros.map((m) => (
                    <a key={m.id ?? m.slug} href={`/${m.slug}`} title={m.name} className="w-7 h-7 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                      {m.logoUrl ? <img src={m.logoUrl} alt={m.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[10px] font-black text-zinc-300">{m.name?.[0]}</span>}
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  href={`${pre}/${activeScan.slug}`}
                  onClick={onClose}
                  className="flex-1 flex items-center gap-2 px-3 min-h-[44px] rounded-xl bg-zinc-900 ring-1 ring-zinc-800 active:bg-zinc-800 min-w-0"
                >
                  {activeScan.logoUrl && <img src={activeScan.logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                  <span className="text-xs font-bold text-white truncate">{activeScan.name}</span>
                </a>
              )}
            </div>
          )}

          <Seccion titulo="Descubrir" acento={acento}>
            <div className="grid grid-cols-2 gap-2">
              {enlacesDescubrir(catalogUrl, altContentLink).map((i) => <Tarjeta key={i.title} item={i} tono={tono} onClose={onClose} />)}
            </div>
          </Seccion>

          <Seccion titulo="Géneros" acento={acento} icono={<Tags size={12} />}>
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {generos === null
                ? [...Array(8)].map((_, i) => <span key={i} className="h-9 w-24 shrink-0 rounded-full bg-zinc-800/70 animate-pulse" />)
                : generos.map((g) => (
                    <a
                      key={g}
                      href={conParams(catalogUrl, { genre: g })}
                      onClick={onClose}
                      className="shrink-0 rounded-full bg-zinc-900 ring-1 ring-zinc-800 px-4 min-h-[36px] flex items-center text-xs font-semibold text-zinc-300 active:bg-zinc-800"
                    >
                      {g}
                    </a>
                  ))}
            </div>
          </Seccion>

          <div className="px-4 mt-6">
            <a
              href={urlSuscripciones}
              onClick={onClose}
              className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/25 via-amber-500/10 to-zinc-900 p-4 ring-1 ring-amber-400/30 active:scale-[0.99] transition-transform"
            >
              <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <Crown size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-white">Suscripción Capibara</span>
                <span className="block text-xs text-zinc-300">Sin anuncios y capítulos anticipados</span>
              </span>
              <ArrowRight size={18} className="text-amber-300" />
            </a>
          </div>

          <Seccion titulo="Comunidad" acento={acento}>
            <div className="grid grid-cols-2 gap-2">
              {enlacesComunidad(logged).map((i) => <Tarjeta key={i.title} item={i} tono={tono} onClose={onClose} />)}
            </div>
          </Seccion>

          {logged && user && (
            <Seccion titulo="Mi cuenta" acento={acento}>
              <div className="rounded-2xl bg-zinc-900/50 ring-1 ring-zinc-800 p-1">
                {user.slug && <Fila href={`${pre}/list/${user.slug}`} icon={<Bookmark size={18} />} label="Mi lista" onClose={onClose} />}
                <Fila href={`${pre}/notifications`} icon={<Bell size={18} />} label="Notificaciones" onClose={onClose} />
                <Fila href="/descargas" icon={<HardDriveDownload size={18} />} label="Descargas" onClose={onClose} />
                <Fila href={`${pre}/profile/${user.slug}`} icon={<UserIcon size={18} />} label="Mi perfil" onClose={onClose} />
                <Fila href="/settings" icon={<Settings size={18} />} label="Ajustes" onClose={onClose} />
              </div>
            </Seccion>
          )}

          {paneles.length > 0 && (
            <Seccion titulo="Mis scans" acento="text-purple-400">
              <div className="rounded-2xl bg-zinc-900/50 ring-1 ring-zinc-800 p-1">
                {paneles.map((p: any) => (
                  <Fila
                    key={p.organizationId}
                    href={`/${p.organization.slug}/admin/mangas`}
                    onClose={onClose}
                    label={`Panel ${p.organization.name}`}
                    icon={p.organization.logoUrl
                      ? <img src={p.organization.logoUrl} alt="" className="w-[18px] h-[18px] rounded-md object-cover" />
                      : <Shield size={18} className="text-purple-400" />}
                  />
                ))}
              </div>
            </Seccion>
          )}

          <div className="px-4 mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { onClose(); onNsfwToggle(); }}
              className={`flex items-center justify-center gap-2 min-h-[48px] rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${
                nsfwMode
                  ? 'bg-cyan-500/15 ring-1 ring-cyan-500/40 text-cyan-300'
                  : 'bg-red-500/15 ring-1 ring-red-500/40 text-red-400'
              } ${logged ? '' : 'col-span-2'}`}
            >
              {nsfwMode ? 'Salir del modo +18' : 'Activar modo +18'}
            </button>
            {logged && (
              <button
                type="button"
                onClick={() => { onClose(); onLogout(); }}
                className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-400 active:bg-zinc-800"
              >
                <LogOut size={15} /> Salir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuSheet;
