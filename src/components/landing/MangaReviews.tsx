import React, { useEffect, useState } from 'react';
import { Loader2, EyeOff } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import StarRating from '../StarRating';
import { useDialog } from '../ui/useDialog';

interface Props {
  mangaSlug: string;
  user?: any;
  logged?: boolean;
  organization?: any;
  scanSlug?: string;
}

const MangaReviews: React.FC<Props> = ({ mangaSlug, user, logged, organization, scanSlug }) => {
  const dlg = useDialog();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSub, setNeedsSub] = useState(false);

  const canModerate = !!user?.permissions?.find((p: any) => p.organizationId === organization?.id && p.canHideComment);

  const load = () => {
    setLoading(true);
    callAPI(`/api/manga-custom/${mangaSlug}/reviews`)
      .then((d: any) => {
        setData(d);
        if (d?.myReview) { setRating(d.myReview.rating); setBody(d.myReview.body || ''); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [mangaSlug]);

  const submit = async () => {
    if (rating < 1) { setError('Elige un puntaje de 1 a 5 estrellas.'); return; }
    setBusy(true); setError(null); setNeedsSub(false);
    try {
      await callAPI(`/api/manga-custom/${mangaSlug}/reviews`, { method: 'PUT', body: JSON.stringify({ rating, body: body.trim() || null }) });
      load();
    } catch (e: any) {
      const msg = e?.message || 'No se pudo guardar la reseña.';
      if (/suscriptores/i.test(msg)) setNeedsSub(true);
      setError(msg);
    } finally { setBusy(false); }
  };

  const removeMine = async () => {
    setBusy(true);
    try { await callAPI(`/api/manga-custom/${mangaSlug}/reviews`, { method: 'DELETE' }); setRating(0); setBody(''); load(); }
    catch { /* noop */ } finally { setBusy(false); }
  };

  const hide = async (id: number) => {
    if (!(await dlg.confirm('¿Ocultar esta reseña?'))) return;
    try { await callAPI(`/api/manga-custom/${mangaSlug}/reviews/${id}/hide`, { method: 'PATCH' }); load(); } catch { /* noop */ }
  };

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-zinc-600" /></div>;

  const avg = data?.average as number | null;
  const count = data?.count || 0;
  const dist = data?.distribution || {};

  return (
    <div id="reviews" className="mt-10 space-y-6">
      <dlg.DialogHost />
      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Reseñas</h3>

      {/* Resumen */}
      <div className="flex flex-col md:flex-row gap-6 items-start bg-zinc-900/40 border border-zinc-800 rounded-[24px] p-6">
        <div className="text-center shrink-0">
          <div className="text-4xl font-black text-white">{avg != null ? avg.toFixed(1) : '—'}</div>
          <StarRating value={Math.round(avg || 0)} readOnly size={16} />
          <div className="text-zinc-500 text-xs mt-1">{count} {count === 1 ? 'reseña' : 'reseñas'}</div>
        </div>
        <div className="flex-1 w-full space-y-1">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = dist[String(n)] || 0;
            const pct = count > 0 ? (c / count) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 w-3">{n}</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${pct}%` }} /></div>
                <span className="text-zinc-600 w-8 text-right">{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mi reseña */}
      {logged ? (
        needsSub ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm mb-3">Las reseñas son un beneficio para suscriptores de cualquier scan.</p>
            {scanSlug && <a href={`/${scanSlug}/subscriptions`} className="inline-block bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">Ver planes</a>}
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <StarRating value={rating} onChange={setRating} size={26} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              placeholder="Escribe tu reseña (opcional)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:border-cyan-500 outline-none resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 text-[10px]">{body.length}/500</span>
              <div className="flex items-center gap-2">
                {data?.myReview && <button onClick={removeMine} disabled={busy} className="text-zinc-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest">Eliminar</button>}
                <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">
                  {busy && <Loader2 size={14} className="animate-spin" />} {data?.myReview ? 'Actualizar reseña' : 'Publicar reseña'}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
        )
      ) : (
        <a href="/login" className="block text-center text-cyan-400 hover:text-cyan-300 text-sm font-bold py-3">Inicia sesión para reseñar</a>
      )}

      {/* Lista */}
      <div className="space-y-4">
        {(data?.reviews || []).map((rev: any) => (
          <div key={rev.id} className="flex gap-3 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4">
            <img src={rev.user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user?.username || 'U')}&background=27272a&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <a href={`/profile/${rev.user?.slug}`} className="text-white font-bold text-sm hover:text-cyan-400 truncate">{rev.user?.username}</a>
                {canModerate && <button onClick={() => hide(rev.id)} title="Ocultar" className="text-zinc-600 hover:text-red-400"><EyeOff size={14} /></button>}
              </div>
              <StarRating value={rev.rating} readOnly size={14} />
              {rev.body && <p className="text-zinc-300 text-sm mt-1 whitespace-pre-wrap break-words">{rev.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MangaReviews;
