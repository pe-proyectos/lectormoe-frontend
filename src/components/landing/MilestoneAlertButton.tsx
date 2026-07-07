import React, { useEffect, useState } from 'react';
import { BellPlus, BellRing, Loader2, X } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  mangaSlug: string;
  logged?: boolean;
  scanSlug?: string;
  lastPublished?: number;
}

const MilestoneAlertButton: React.FC<Props> = ({ mangaSlug, logged, scanSlug, lastPublished = 0 }) => {
  const [alert, setAlert] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSub, setNeedsSub] = useState(false);

  useEffect(() => {
    if (!logged) return;
    callAPI(`/api/manga-custom/${mangaSlug}/milestone-alert`)
      .then((a: any) => setAlert(a || null))
      .catch(() => {});
  }, [logged, mangaSlug]);

  const openModal = () => {
    if (!logged) { window.location.href = '/login'; return; }
    setError(null);
    setNeedsSub(false);
    setTarget(alert ? String(alert.targetNumber) : String(Math.max(lastPublished + 1, 1)));
    setOpen(true);
  };

  const save = async () => {
    const n = parseFloat(target);
    if (Number.isNaN(n) || n < 1) { setError('Ingresa un número de capítulo válido.'); return; }
    setBusy(true);
    setError(null);
    try {
      const a = await callAPI(`/api/manga-custom/${mangaSlug}/milestone-alert`, { method: 'PUT', body: JSON.stringify({ targetNumber: n }) });
      setAlert(a);
      setOpen(false);
    } catch (e: any) {
      const msg = e?.message || 'No se pudo guardar el aviso.';
      if (/suscriptores/i.test(msg)) setNeedsSub(true);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await callAPI(`/api/manga-custom/${mangaSlug}/milestone-alert`, { method: 'DELETE' });
      setAlert(null);
      setOpen(false);
    } catch { /* noop */ } finally { setBusy(false); }
  };

  return (
    <>
      <button
        onClick={openModal}
        title="Avísame en un capítulo"
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
          alert ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-400'
        }`}
      >
        {alert ? <BellRing size={18} fill="currentColor" /> : <BellPlus size={18} />}
        {alert ? `AVISO EN CAP. ${alert.targetNumber}` : 'AVÍSAME EN UN CAPÍTULO'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-white">Avísame en un capítulo</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            {needsSub ? (
              <>
                <p className="text-zinc-400 text-sm mb-4">Esta función es un beneficio para suscriptores de cualquier scan de la plataforma.</p>
                {scanSlug && (
                  <a href={`/${scanSlug}/subscriptions`} className="block text-center bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">Ver planes del scan</a>
                )}
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-xs mb-2">Te avisaremos cuando la obra llegue a ese capítulo. Último publicado: {lastPublished}.</p>
                <input
                  type="number"
                  min={lastPublished + 1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none mb-3"
                  placeholder={String(lastPublished + 1)}
                />
                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                <div className="flex items-center gap-2">
                  <button onClick={save} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">
                    {busy && <Loader2 size={14} className="animate-spin" />} {alert ? 'Cambiar número' : 'Avisarme'}
                  </button>
                  {alert && (
                    <button onClick={remove} disabled={busy} className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors">Quitar aviso</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MilestoneAlertButton;
