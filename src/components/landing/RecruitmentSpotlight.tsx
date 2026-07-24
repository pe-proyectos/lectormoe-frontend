import React, { useEffect, useMemo, useState } from 'react';
import { Megaphone, Zap, ArrowRight, CalendarDays } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import ContactScanModal from './ContactScanModal';

interface Props {
  // Con scanSlug: muestra solo los anuncios de ese scan (1-3, al azar) y
  // permite postularse ahí mismo. Sin scanSlug: mezcla global (3-5, al azar).
  scanSlug?: string;
  logged?: boolean;
  maxItems?: number;
}

interface Post {
  id: number;
  title: string;
  roles: string;
  language: string;
  urgent: boolean;
  createdAt: string;
  organization: { name: string; slug: string; logoUrl: string | null };
}

const ROLE_LABEL: Record<string, string> = { cleaner: 'Cleaner', typer: 'Typer', traductor: 'Traductor', redrawer: 'Redrawer', proofreader: 'Proofreader', editor: 'Editor', otro: 'Otro' };

const publishedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Publicado hoy';
  if (days === 1) return 'Publicado ayer';
  if (days < 30) return `Publicado hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Publicado hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const RecruitmentSpotlight: React.FC<Props> = ({ scanSlug, logged, maxItems }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [applyPost, setApplyPost] = useState<Post | null>(null);
  const limit = maxItems ?? (scanSlug ? 3 : 5);

  useEffect(() => {
    const orgParam = scanSlug ? `&org=${scanSlug}` : '';
    callAPI(`/api/recruitment?status=open${orgParam}`)
      .then((data: any) => {
        if (Array.isArray(data)) setPosts(shuffle(data).slice(0, limit));
      })
      .catch(() => {});
  }, [scanSlug, limit]);

  const heading = useMemo(
    () => (scanSlug ? 'Únete al equipo' : 'Scans buscando talento'),
    [scanSlug]
  );

  if (posts.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-8">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            <Megaphone size={12} /> Reclutamiento
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{heading}</h2>
        </div>
        <a href="/reclutamiento" className="shrink-0 inline-flex items-center gap-1.5 text-cyan-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
          Ver mural <ArrowRight size={13} />
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {posts.map((p) => (
          <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-2.5 ${p.urgent ? 'border-red-500/40' : 'border-zinc-800'}`}>
            <div className="flex items-center gap-2 min-w-0">
              {p.organization.logoUrl ? (
                <img src={p.organization.logoUrl} alt="" loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 font-black text-sm shrink-0">{p.organization.name.charAt(0)}</div>
              )}
              <a href={`/${p.organization.slug}`} className="text-xs font-bold text-zinc-400 hover:text-cyan-400 truncate transition-colors">{p.organization.name}</a>
              {p.urgent && <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-black uppercase bg-red-500/15 text-red-400 rounded-full px-1.5 py-0.5 shrink-0"><Zap size={9} /> Urgente</span>}
            </div>
            <p className="text-white font-black text-sm leading-tight line-clamp-2">{p.title}</p>
            <div className="flex flex-wrap gap-1">
              {p.roles.split(',').filter(Boolean).slice(0, 3).map((r) => (
                <span key={r} className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 rounded px-1.5 py-0.5">{ROLE_LABEL[r] || r}</span>
              ))}
            </div>
            <p className="inline-flex items-center gap-1 text-[10px] text-zinc-500 mt-auto">
              <CalendarDays size={11} /> {publishedAgo(p.createdAt)}
            </p>
            {scanSlug ? (
              logged ? (
                <button onClick={() => setApplyPost(p)} className="w-full bg-cyan-500 text-zinc-950 rounded-xl py-2 min-h-[38px] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors active:scale-[0.98]">Postularme</button>
              ) : (
                <a href="/login" className="w-full text-center bg-zinc-800 text-zinc-300 rounded-xl py-2 min-h-[38px] font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-colors">Inicia sesión</a>
              )
            ) : (
              <a href="/reclutamiento" className="w-full text-center bg-zinc-800 text-zinc-300 rounded-xl py-2 min-h-[38px] font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-zinc-950 transition-colors">Ver anuncio</a>
            )}
          </div>
        ))}
      </div>

      {applyPost && (
        <ContactScanModal
          scanSlug={applyPost.organization.slug}
          open={!!applyPost}
          onClose={() => setApplyPost(null)}
          defaultCategory="unirme"
          defaultSubject={`Postulación: ${applyPost.title}`}
        />
      )}
    </section>
  );
};

export default RecruitmentSpotlight;
