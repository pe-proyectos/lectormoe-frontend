import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import HShelf from './HShelf';

interface Props {
  nsfwMode?: boolean;
}

interface Reco {
  id: number;
  label: string;
  note: string | null;
  organization?: { slug: string; name: string; logoUrl: string | null } | null;
  mangaCustom?: { id: number; title: string; imageUrl: string | null; manga?: { slug: string }; organization?: { slug: string; name: string } } | null;
  joint?: { id: number; title: string; imageUrl: string | null; slug: string } | null;
}

const GlobalRecommendations: React.FC<Props> = ({ nsfwMode = false }) => {
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    callAPI(`/api/recommendation/global?nsfw=${nsfwMode ? 'true' : 'false'}`)
      .then((res) => { if (alive) setRecos(Array.isArray(res) ? res : []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [nsfwMode]);

  if (!loaded || recos.length === 0) return null;

  const workOf = (r: Reco) => r.mangaCustom || r.joint;
  // El prefijo /red depende del NSFW de la OBRA, no del modo de la página: en
  // /red pueden mezclarse recos no-NSFW, cuyo enlace correcto es sin /red (con
  // /red redirigirían 302). Los joints son globales (sin /red).
  const isNsfwWork = (r: Reco) =>
    !!((r.mangaCustom as any)?.isNSFW || (r.mangaCustom?.organization as any)?.isNSFW || (r.organization as any)?.isNSFW);
  const urlOf = (r: Reco) => {
    if (r.mangaCustom?.manga?.slug) {
      const os = r.mangaCustom.organization?.slug || r.organization?.slug;
      if (!os) return '#';
      return `${isNsfwWork(r) ? '/red' : ''}/${os}/manga/${r.mangaCustom.manga.slug}`;
    }
    if (r.joint?.slug) return `/joint/manga/${r.joint.slug}`;
    return '#';
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={20} className="text-cyan-400" />
        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Recomendado por los scans</h2>
      </div>
      <HShelf>
        {recos.map((r) => {
          const w = workOf(r);
          if (!w) return null;
          const scanName = r.mangaCustom?.organization?.name || r.organization?.name;
          return (
            <a key={r.id} href={urlOf(r)} className="group shrink-0 w-40 md:w-48">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-cyan-500/50 transition-all bg-zinc-900">
                {w.imageUrl && <img src={w.imageUrl} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                <div className="absolute inset-x-0 top-0 p-2">
                  <span className="inline-block bg-cyan-500 text-zinc-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-full">{r.label}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
                  <p className="text-white font-black text-sm italic uppercase tracking-tight line-clamp-2">{w.title}</p>
                  {scanName && <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">{scanName}</p>}
                </div>
              </div>
            </a>
          );
        })}
      </HShelf>
    </div>
  );
};

export default GlobalRecommendations;
