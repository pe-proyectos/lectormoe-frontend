import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Search,
  Flame,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Bookmark,
  Users,
  Droplet,
  List as ListIcon,
  Megaphone,
  MessageCircle,
  HardDriveDownload,
  Crown,
  ArrowRight,
  Tags,
} from 'lucide-react';
import { callAPI } from '../../util/callApi';
import DiscordIcon from '../icons/DiscordIcon';

interface NavMegaMenuProps {
  catalogUrl: string;
  altContentLink: { label: string; href: string };
  urlSuscripciones: string;
  enSuscripciones: boolean;
  activeView: string;
  nsfwMode: boolean;
  logged: boolean;
}

type Panel = 'explorar' | 'comunidad' | null;

export interface Item {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  external?: boolean;
}

export const conParams = (base: string, params: Record<string, string>) =>
  `${base}?${new URLSearchParams(params).toString()}`;

// Enlace de un panel: icono, título y una línea de descripción.
const Enlace: React.FC<{ item: Item; tono: string }> = ({ item, tono }) => (
  <a
    href={item.href}
    target={item.external ? '_blank' : undefined}
    rel={item.external ? 'noopener noreferrer' : undefined}
    className="group/item flex items-start gap-3 rounded-2xl p-3 hover:bg-zinc-800/70 transition-colors"
  >
    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 ring-1 ring-zinc-700/60 transition-colors ${tono}`}>
      {item.icon}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-bold text-zinc-100 group-hover/item:text-white">{item.title}</span>
      <span className="block text-xs text-zinc-500 leading-snug">{item.desc}</span>
    </span>
  </a>
);

// Enlaces compartidos por el megamenú de escritorio y el menú móvil, para que
// ambos ofrezcan siempre las mismas opciones.
export function enlacesDescubrir(catalogUrl: string, altContentLink: { label: string; href: string }): Item[] {
  return [
    { href: catalogUrl, icon: <Search size={16} />, title: 'Catálogo', desc: 'Busca entre todas las obras' },
    { href: conParams(catalogUrl, { sort: 'popular' }), icon: <Flame size={16} />, title: 'Populares', desc: 'Lo más leído ahora' },
    { href: conParams(catalogUrl, { sort: 'latest' }), icon: <Sparkles size={16} />, title: 'Recientes', desc: 'Capítulos recién salidos' },
    { href: conParams(catalogUrl, { status: 'Completed' }), icon: <CheckCircle2 size={16} />, title: 'Finalizados', desc: 'Historias para leer de corrido' },
    { href: conParams(catalogUrl, { isOneShot: 'true' }), icon: <BookOpen size={16} />, title: 'One-shots', desc: 'Historias de un solo capítulo' },
    { href: altContentLink.href, icon: <Bookmark size={16} />, title: altContentLink.label, desc: altContentLink.label === 'Novelas' ? 'Novelas, libros y cuentos' : 'Vuelve a los mangas' },
  ];
}

export function enlacesComunidad(logged: boolean): Item[] {
  return [
    { href: 'https://lacharca.com', icon: <Droplet size={16} />, title: 'La Charca', desc: 'La red social de los lectores' },
    { href: '/listas', icon: <ListIcon size={16} />, title: 'Listas', desc: 'Colecciones hechas por la comunidad' },
    { href: '/scans', icon: <Users size={16} />, title: 'Scans', desc: 'Conoce a los grupos que traducen' },
    { href: '/reclutamiento', icon: <Megaphone size={16} />, title: 'Reclutamiento', desc: 'Únete a un scan y ayuda a traducir' },
    ...(logged
      ? [{ href: '/mensajes', icon: <MessageCircle size={16} />, title: 'Mensajes', desc: 'Tus conversaciones con los scans' }]
      : []),
    { href: '/descargas', icon: <HardDriveDownload size={16} />, title: 'Descargas', desc: 'Lee sin conexión' },
    { href: 'https://discord.gg/xJqCWAUxVt', icon: <DiscordIcon className="w-4 h-4" />, title: 'Discord', desc: 'Habla con el equipo y otros lectores', external: true },
  ];
}

// Géneros más buscados primero; el resto sigue en orden alfabético.
const GENEROS_DESTACADOS = [
  'Acción', 'Romance', 'Comedia', 'Fantasía', 'Drama', 'Isekai', 'Vida escolar',
  'Aventura', 'Recuentos de la vida', 'Harem', 'Shoujo', 'Seinen', 'Shounen',
  'Boys Love', 'BL', 'Girls Love', 'GL', 'Yuri', 'Psicológico', 'Misterio',
  'Sobrenatural', 'Horror', 'Deportes', 'Histórico', 'Artes marciales', 'Josei',
];
const rangoGenero = (n: string) => {
  const i = GENEROS_DESTACADOS.findIndex((g) => g.toLowerCase() === n.toLowerCase());
  return i === -1 ? GENEROS_DESTACADOS.length : i;
};

// Géneros para accesos rápidos. Se piden solo cuando `activo` pasa a true.
export function useGeneros(activo: boolean, nsfwMode: boolean, max = 18): string[] | null {
  const [generos, setGeneros] = useState<string[] | null>(null);
  useEffect(() => {
    if (!activo || generos) return;
    callAPI('/api/genre')
      .then((r: any) => {
        const lista = Array.isArray(r) ? r : [];
        setGeneros(
          lista
            .filter((g: any) => g?.name && (nsfwMode || !g.nsfw))
            .map((g: any) => g.name as string)
            .sort((a: string, b: string) => rangoGenero(a) - rangoGenero(b) || a.localeCompare(b, 'es'))
            .slice(0, max)
        );
      })
      .catch(() => setGeneros([]));
  }, [activo, generos, nsfwMode, max]);
  return generos;
}

// Navegación principal de escritorio: dos paneles amplios (Explorar y
// Comunidad) que se abren al pasar el mouse o con clic/teclado, y el acceso
// a Suscripciones siempre visible.
const NavMegaMenu: React.FC<NavMegaMenuProps> = ({
  catalogUrl,
  altContentLink,
  urlSuscripciones,
  enSuscripciones,
  activeView,
  nsfwMode,
  logged,
}) => {
  const [abierto, setAbierto] = useState<Panel>(null);
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const generos = useGeneros(abierto === 'explorar', nsfwMode);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(null); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const abrir = (p: Panel) => {
    if (cierre.current) clearTimeout(cierre.current);
    setAbierto(p);
  };
  const cerrarLuego = () => {
    if (cierre.current) clearTimeout(cierre.current);
    cierre.current = setTimeout(() => setAbierto(null), 160);
  };

  const descubrir = enlacesDescubrir(catalogUrl, altContentLink);
  const comunidad = enlacesComunidad(logged);

  const acento = nsfwMode ? 'text-red-400' : 'text-cyan-400';
  const tonoIcono = nsfwMode
    ? 'text-red-400 group-hover/item:bg-red-500/15'
    : 'text-cyan-400 group-hover/item:bg-cyan-500/15';

  const disparador = (panel: Exclude<Panel, null>, label: string, activo = false) => (
    <button
      type="button"
      aria-expanded={abierto === panel}
      aria-haspopup="true"
      onMouseEnter={() => abrir(panel)}
      onMouseLeave={cerrarLuego}
      onClick={() => setAbierto(abierto === panel ? null : panel)}
      className={`text-sm font-bold transition-colors flex items-center gap-1.5 py-2 ${
        abierto === panel || activo ? 'text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
      <ChevronDown size={14} className={`transition-transform duration-200 ${abierto === panel ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div ref={raiz} className="flex items-center gap-7">
      {disparador('explorar', 'Explorar', activeView === 'search')}
      {disparador('comunidad', 'Comunidad')}

      <a
        href={urlSuscripciones}
        className={`text-sm font-bold flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all ring-1 ${
          enSuscripciones
            ? 'bg-amber-400 text-zinc-950 ring-amber-300'
            : 'text-amber-300 ring-amber-400/40 bg-amber-400/10 hover:bg-amber-400 hover:text-zinc-950'
        }`}
      >
        <Crown size={15} /> Suscripciones
      </a>

      {abierto && (
        <div
          onMouseEnter={() => abrir(abierto)}
          onMouseLeave={cerrarLuego}
          className="absolute left-0 right-0 top-full pt-3"
        >
          <div className="mx-auto max-w-7xl px-3 md:px-8">
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/60">
              {abierto === 'explorar' ? (
                <div className="grid grid-cols-12">
                  <div className="col-span-5 p-5">
                    <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] ${acento}`}>Descubrir</p>
                    <div className="grid grid-cols-2 gap-1">
                      {descubrir.map((i) => <Enlace key={i.title} item={i} tono={tonoIcono} />)}
                    </div>
                  </div>

                  <div className="col-span-4 border-l border-zinc-800/80 p-5">
                    <p className={`px-1 pb-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${acento}`}>
                      <Tags size={12} /> Géneros
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {generos === null
                        ? [...Array(12)].map((_, i) => (
                            <span key={i} className="h-7 w-20 rounded-full bg-zinc-800/70 animate-pulse" />
                          ))
                        : generos.map((g) => (
                            <a
                              key={g}
                              href={conParams(catalogUrl, { genre: g })}
                              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                              {g}
                            </a>
                          ))}
                    </div>
                    <a href={catalogUrl} className={`mt-4 inline-flex items-center gap-1 px-1 text-xs font-bold ${acento} hover:underline`}>
                      Ver todo el catálogo <ArrowRight size={13} />
                    </a>
                  </div>

                  <a
                    href={urlSuscripciones}
                    className="group/promo col-span-3 relative m-3 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-500/5 to-zinc-900 p-5 ring-1 ring-amber-400/30 hover:ring-amber-400/60 transition-all flex flex-col"
                  >
                    <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
                    <Crown size={28} className="text-amber-300 mb-3" />
                    <span className="text-lg font-black italic uppercase tracking-tight text-white leading-tight">Suscripción Capibara</span>
                    <span className="mt-2 text-xs text-zinc-300 leading-relaxed">
                      Sin anuncios, más espacio en tu lista y capítulos anticipados en todos los scans.
                    </span>
                    <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-300 group-hover/promo:gap-2 transition-all">
                      Ver planes <ArrowRight size={14} />
                    </span>
                  </a>
                </div>
              ) : (
                <div className="p-5">
                  <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] ${acento}`}>Comunidad</p>
                  <div className="grid grid-cols-3 gap-1">
                    {comunidad.map((i) => <Enlace key={i.title} item={i} tono={tonoIcono} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavMegaMenu;
