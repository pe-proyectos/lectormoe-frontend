import React, { useEffect, useState } from 'react';
import { ChevronDown, ListChecks, ExternalLink, Users } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  profileSlug: string;
  isOwner?: boolean;
  nsfwMode?: boolean;
}

// Sección "Listas públicas" del perfil. Muestra las CustomList del usuario del
// perfil (todas si eres el dueño, solo públicas si eres visitante).
const ProfileCustomLists: React.FC<Props> = ({ profileSlug, isOwner, nsfwMode = false }) => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!profileSlug) { setLoading(false); return; }
    callAPI(`/api/lists/${profileSlug}`)
      .then((d: any) => { if (alive) setLists(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [profileSlug]);

  // Los visitantes no ven una sección vacía; el dueño sí (con CTA a crear).
  if (loading) return null;
  if (lists.length === 0 && !isOwner) return null;

  return (
    <section>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between mb-4 group" aria-expanded={open}>
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
          <ChevronDown size={20} className={`text-zinc-500 group-hover:text-white transition-transform ${open ? '' : '-rotate-90'}`} />
          {isOwner ? 'Mis' : 'Sus'} <span className="text-cyan-500">Listas</span>
          {lists.length > 0 && <span className="text-zinc-600 text-base font-bold">({lists.length})</span>}
        </h2>
        <a href="/listas" onClick={(e) => e.stopPropagation()} className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
          Ir a listas <ExternalLink size={12} />
        </a>
      </button>
      {open && (
        lists.length === 0 ? (
          <div className="text-zinc-600 text-sm bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-center">
            Todavía no creaste listas públicas. <a href="/listas" className="text-cyan-400 font-bold">Crea una</a> para compartir tus recomendaciones.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => {
              const covers = (l.items || [])
                .map((it: any) => it.mangaCustom?.imageUrl || it.mangaCustom?.manga?.imageUrl || it.joint?.imageUrl)
                .filter(Boolean).slice(0, 4);
              return (
                <a key={l.id} href={`/list/${profileSlug}/${l.slug}`} className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all">
                  <div className="grid grid-cols-2 grid-rows-2 h-24 bg-zinc-950">
                    {covers.length > 0 ? covers.map((c: string, i: number) => <img key={i} src={c} alt="" className="w-full h-full object-cover" />) : <div className="col-span-2 row-span-2 flex items-center justify-center text-zinc-700"><ListChecks size={24} /></div>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-black text-sm truncate group-hover:text-cyan-400 transition-colors">{l.name}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{l._count?.items ?? 0} obras</span>
                      {(l._count?.followers ?? 0) > 0 && <span className="inline-flex items-center gap-0.5">· <Users size={11} /> {l._count.followers}</span>}
                      {l.isPublic === false && <span>· Oculta</span>}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )
      )}
    </section>
  );
};

export default ProfileCustomLists;
