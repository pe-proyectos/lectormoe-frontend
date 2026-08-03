import React, { useEffect, useState } from 'react';
import { Star, BookOpen } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  scanSlug: string;
  orgPrefix: string; // p.ej. "/totorofansub" o "/red/totorofansub"
  scanName?: string;
}

interface Reco {
  id: number;
  label: string;
  note: string | null;
  mangaCustom?: { id: number; title: string; imageUrl: string | null; manga?: { slug: string } } | null;
  joint?: { id: number; title: string; imageUrl: string | null; slug: string } | null;
}

const ScanRecommendations: React.FC<Props> = ({ scanSlug, orgPrefix }) => {
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    callAPI(`/api/recommendation?org=${encodeURIComponent(scanSlug)}`)
      .then((res) => { if (alive) setRecos(Array.isArray(res) ? res : []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [scanSlug]);

  if (!loaded || recos.length === 0) return null;

  const workOf = (r: Reco) => r.mangaCustom || r.joint;
  const urlOf = (r: Reco) => {
    if (r.mangaCustom?.manga?.slug) return `${orgPrefix}/manga/${r.mangaCustom.manga.slug}`;
    if (r.joint?.slug) return `/joint/manga/${r.joint.slug}`;
    return '#';
  };

  const [first, ...rest] = recos;
  const firstWork = workOf(first);

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-8 pt-10">
      <div className="flex items-center gap-2 mb-5">
        <Star size={18} className="text-cyan-400" fill="currentColor" />
        <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Recomendado por el scan</h2>
      </div>

      {/* Recomendación principal (grande) */}
      {firstWork && (
        <a
          href={urlOf(first)}
          className="group block relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900 hover:border-cyan-500/50 transition-all"
        >
          {/* Fondo difuso */}
          {firstWork.imageUrl && (
            <img src={firstWork.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
          <div className="relative flex items-center gap-4 md:gap-8 p-4 md:p-8">
            <div className="w-28 h-40 md:w-44 md:h-64 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-2xl bg-zinc-800">
              {firstWork.imageUrl && <img src={firstWork.imageUrl} alt={firstWork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 bg-cyan-500 text-zinc-950 font-black text-[10px] md:text-xs px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
                <Star size={12} fill="currentColor" /> {first.label}
              </span>
              <h3 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-2 mb-2">{firstWork.title}</h3>
              {first.note && <p className="text-zinc-300 text-sm md:text-base italic line-clamp-3 mb-4 max-w-xl">"{first.note}"</p>}
              <span className="inline-flex items-center gap-2 bg-white group-hover:bg-cyan-400 text-zinc-950 font-black px-5 py-2.5 rounded-xl text-xs md:text-sm uppercase tracking-widest transition-colors">
                <BookOpen size={16} /> Leer ahora
              </span>
            </div>
          </div>
        </a>
      )}

      {/* Otras recomendaciones (fila horizontal) */}
      {rest.length > 0 && (
        <div className="hscroll flex gap-4 mt-5 pb-2">
          {rest.map((r) => {
            const w = workOf(r);
            if (!w) return null;
            return (
              <a key={r.id} href={urlOf(r)} className="group shrink-0 w-36 md:w-44">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-cyan-500/50 transition-all bg-zinc-900">
                  {w.imageUrl && <img src={w.imageUrl} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute inset-x-0 top-0 p-2">
                    <span className="inline-block bg-cyan-500 text-zinc-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-full">{r.label}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                    <p className="text-white font-black text-xs italic uppercase tracking-tight line-clamp-2">{w.title}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanRecommendations;
