import React from 'react';
import {
  ArrowUp,
  ArrowRight,
  Crown,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Twitch,
  Heart,
  Globe,
  X as XIcon,
} from 'lucide-react';
import DiscordIcon from '../icons/DiscordIcon';

interface FooterProps {
  onNavigate?: (page: any, id?: string) => void;
  organization?: any;
  organizationSlug?: string;
  language?: string;
}

const DISCORD_CAPIBARA = 'https://discord.gg/xJqCWAUxVt';

// Logo cuadrado de un scan; si no tiene logo, su inicial.
const LogoScan: React.FC<{ org: any; size?: string }> = ({ org, size = 'w-12 h-12' }) => (
  <a
    href={`/${org.slug}`}
    title={org.name}
    className={`${size} shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-2 ring-zinc-950 hover:ring-cyan-500 hover:-translate-y-0.5 hover:z-10 transition-all relative`}
  >
    {org.logoUrl ? (
      <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" loading="lazy" />
    ) : (
      <span className="w-full h-full flex items-center justify-center text-zinc-300 font-black">
        {org.name?.[0]?.toUpperCase() ?? '?'}
      </span>
    )}
  </a>
);

const Columna: React.FC<{ titulo: string; enlaces: Array<{ label: string; href: string; external?: boolean }> }> = ({ titulo, enlaces }) => (
  <div>
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">{titulo}</h4>
    <ul className="space-y-2.5">
      {enlaces.map((e) => (
        <li key={e.label}>
          <a
            href={e.href}
            target={e.external ? '_blank' : undefined}
            rel={e.external ? 'noopener noreferrer' : undefined}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            {e.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

// Redes que un scan tiene configuradas en su perfil.
function redesDe(org: any) {
  if (!org) return [];
  const redes: Array<{ href: string; label: string; icon: React.ReactNode }> = [];
  const add = (href: string | null | undefined, label: string, icon: React.ReactNode) => {
    if (href && /^https?:\/\//.test(href)) redes.push({ href, label, icon });
  };
  add(org.discordUrl, 'Discord', <DiscordIcon size={16} />);
  add(org.facebookUrl, 'Facebook', <Facebook size={16} />);
  add(org.instagramUrl, 'Instagram', <Instagram size={16} />);
  add(org.twitterUrl, 'X', <Twitter size={16} />);
  add(org.youtubeUrl, 'YouTube', <Youtube size={16} />);
  add(org.twitchUrl, 'Twitch', <Twitch size={16} />);
  add(org.tiktokUrl, 'TikTok', <span className="text-[11px] font-black">TT</span>);
  add(org.patreonUrl, 'Patreon', <Heart size={16} />);
  return redes;
}

const Footer: React.FC<FooterProps> = ({ organization }) => {
  const nsfw = typeof window !== 'undefined' && window.location.pathname.startsWith('/red');
  const pre = nsfw ? '/red' : '';

  const miembros: any[] = (organization?.jointMembers || []).map((m: any) => m.organization).filter(Boolean);
  const esJoint = miembros.length > 0;
  const scan = !esJoint && organization?.slug ? organization : null;

  const catalogo = scan ? `${pre}/${scan.slug}/search` : `${pre}/search`;
  const suscripciones = scan ? `${pre}/${scan.slug}/subscriptions` : '/subscriptions';
  const redes = redesDe(scan);

  const acento = nsfw ? 'text-red-500' : 'text-cyan-500';
  const glow = nsfw ? 'from-red-500/10' : 'from-cyan-500/10';

  const columnas = [
    {
      titulo: 'Explorar',
      enlaces: [
        { label: 'Catálogo', href: catalogo },
        { label: 'Populares', href: `${catalogo}?sort=popular` },
        { label: 'One-shots', href: `${catalogo}?isOneShot=true` },
        { label: 'Novelas', href: `${pre}/writings` },
        { label: 'Listas', href: '/listas' },
      ],
    },
    {
      titulo: 'Comunidad',
      enlaces: [
        { label: 'La Charca', href: 'https://lacharca.com', external: true },
        { label: 'Discord', href: DISCORD_CAPIBARA, external: true },
        { label: 'Directorio de scans', href: '/scans' },
        { label: 'Reclutamiento', href: '/reclutamiento' },
      ],
    },
    {
      titulo: 'Tu cuenta',
      enlaces: [
        { label: 'Suscripciones', href: suscripciones },
        { label: 'Descargas', href: '/descargas' },
        { label: 'Notificaciones', href: `${pre}/notifications` },
        { label: 'Ajustes', href: '/settings' },
      ],
    },
    {
      titulo: 'Para scans',
      enlaces: [
        { label: 'Registrar mi scan', href: '/organizations/register' },
        { label: 'Buscar staff', href: '/reclutamiento' },
        { label: 'Términos', href: '/terms' },
        { label: 'Privacidad', href: '/privacy' },
        { label: 'DMCA', href: '/dmca' },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-zinc-800/80 bg-zinc-950">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b ${glow} to-transparent`} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-3 md:px-8 pt-14 pb-24 md:pb-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Marca: Capibara, o Capibara × scan, o Capibara × miembros del joint */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <a href={nsfw ? '/red' : '/'} className="flex items-center gap-2.5 group">
                <img
                  src={nsfw ? '/images/redlogocaptrad.png' : '/images/logocaptrad.png'}
                  alt="CapibaraTraductor"
                  className="w-11 h-11 object-contain group-hover:scale-105 transition-transform"
                />
                {!scan && !esJoint && (
                  <span className="text-xl font-bold tracking-tight text-white">
                    {nsfw && <span className="text-red-500">Red </span>}Capibara<span className={acento}>Traductor</span>
                  </span>
                )}
              </a>

              {(scan || esJoint) && <XIcon size={16} className="text-zinc-600" />}

              {scan && (
                <div className="flex items-center gap-3">
                  <LogoScan org={scan} />
                  <span className="text-xl font-black italic uppercase tracking-tighter text-white">{scan.name}</span>
                </div>
              )}

              {esJoint && (
                <div className="flex items-center -space-x-2">
                  {miembros.map((m) => <LogoScan key={m.id ?? m.slug} org={m} size="w-11 h-11" />)}
                </div>
              )}
            </div>

            <p className="text-sm leading-relaxed text-zinc-500 max-w-md">
              {scan
                ? `${scan.name} publica en CapibaraTraductor, la casa de los scans en español. Lee sus obras, síguelos y apóyalos con tu suscripción.`
                : esJoint
                ? `Obra en colaboración entre ${miembros.map((m) => m.name).join(', ')}, publicada en CapibaraTraductor.`
                : 'La casa de los scans en español: miles de mangas, manhwas y novelas de decenas de grupos, en un solo lugar.'}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {redes.length > 0
                ? redes.map((r) => (
                    <a
                      key={r.label}
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${r.label} de ${scan.name}`}
                      className="w-10 h-10 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:ring-zinc-600 hover:-translate-y-0.5 transition-all"
                    >
                      {r.icon}
                    </a>
                  ))
                : null}
              <a
                href={DISCORD_CAPIBARA}
                target="_blank"
                rel="noopener noreferrer"
                title="Discord de CapibaraTraductor"
                className="h-10 px-3.5 rounded-xl bg-[#5865F2]/15 ring-1 ring-[#5865F2]/40 flex items-center gap-2 text-[#aab1ff] hover:bg-[#5865F2] hover:text-white text-xs font-bold transition-all"
              >
                <DiscordIcon size={16} /> Discord Capibara
              </a>
              <a
                href="https://lacharca.com"
                target="_blank"
                rel="noopener noreferrer"
                title="La Charca"
                className="w-10 h-10 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center text-teal-400 hover:ring-teal-500/50 hover:-translate-y-0.5 transition-all"
              >
                <Globe size={16} />
              </a>
            </div>

            <a
              href={suscripciones}
              className="group/cta mt-2 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 ring-1 ring-amber-400/25 hover:ring-amber-400/50 transition-all max-w-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                <Crown size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">Suscripción Capibara</span>
                <span className="block text-xs text-zinc-400">
                  {scan ? `Sin anuncios y capítulos anticipados. Apoyas a ${scan.name}.` : 'Sin anuncios y capítulos anticipados en todos los scans.'}
                </span>
              </span>
              <ArrowRight size={16} className="ml-auto text-amber-300 group-hover/cta:translate-x-1 transition-transform" />
            </a>
          </div>

          <nav className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columnas.map((c) => <Columna key={c.titulo} titulo={c.titulo} enlaces={c.enlaces} />)}
          </nav>
        </div>

        <div className="mt-14 border-t border-zinc-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600 text-center md:text-left">
            © {new Date().getFullYear()} CapibaraTraductor · Hecho con <Heart size={11} className="inline -mt-0.5 text-red-500" fill="currentColor" /> para la comunidad de scanlation.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800 px-3.5 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:ring-zinc-600 transition-all"
          >
            <ArrowUp size={14} /> Volver arriba
          </button>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-zinc-700 text-center md:text-left">
          CapibaraTraductor conecta a lectores con los scans que traducen sus obras. Todos los derechos de las obras pertenecen a sus respectivos autores y editoriales.
          Si eres titular de derechos, escríbenos desde <a href="/dmca" className="underline hover:text-zinc-400">DMCA</a>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
