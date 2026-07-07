// Badges de tipo de obra y demografía con color (estilo TMO). Los valores
// provienen de bookType.name/code y demography.name; el matching es
// case/acento-insensitive y cae a un badge zinc genérico si es desconocido.

const normalize = (s: string) =>
  (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

interface Badge {
  label: string;
  className: string;
}

const ZINC = 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';

const BOOK_TYPE: Record<string, string> = {
  manga: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  manhwa: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  manhua: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  novela: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'novela ligera': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  libro: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  cuento: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  oneshot: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

const DEMOGRAPHY: Record<string, string> = {
  shonen: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  seinen: 'bg-red-500/15 text-red-400 border-red-500/30',
  shojo: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  josei: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  kodomo: 'bg-green-500/15 text-green-400 border-green-500/30',
};

export function getBookTypeBadge(name?: string | null): Badge | null {
  if (!name) return null;
  return { label: name, className: BOOK_TYPE[normalize(name)] || ZINC };
}

export function getDemographyBadge(name?: string | null): Badge | null {
  if (!name) return null;
  return { label: name, className: DEMOGRAPHY[normalize(name)] || ZINC };
}
