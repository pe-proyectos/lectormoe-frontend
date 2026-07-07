import React, { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  mangaSlug: string;
  organizationSlug?: string;
  jointSlug?: string;
  logged?: boolean;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'menores', label: 'Contenido sexual con menores (lolicon/shotacon)' },
  { value: 'ilegal', label: 'Otro contenido ilegal' },
  { value: 'no_etiquetado', label: 'Contenido +18 sin etiquetar' },
  { value: 'spam', label: 'Spam o contenido engañoso' },
  { value: 'otro', label: 'Otro' },
];

const ReportButton: React.FC<Props> = ({ mangaSlug, organizationSlug, jointSlug, logged }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('menores');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    if (!logged) { window.location.href = '/login'; return; }
    setDone(null); setError(null); setDetails(''); setCategory('menores'); setOpen(true);
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const body = jointSlug ? { jointSlug, category, details: details.trim() || null } : { mangaSlug, organizationSlug, category, details: details.trim() || null };
      const res = await callAPI('/api/reports', { method: 'POST', body: JSON.stringify(body) });
      setDone(res?.message || 'Gracias por tu reporte.');
      setTimeout(() => setOpen(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar el reporte.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={openModal} title="Reportar contenido" className="text-zinc-600 hover:text-red-400 transition-colors p-2">
        <Flag size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-white">Reportar contenido</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            {done ? (
              <p className="text-green-400 text-sm py-4">{done}</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {CATEGORIES.map((c) => (
                    <label key={c.value} className="flex items-start gap-2 text-sm text-zinc-300 cursor-pointer">
                      <input type="radio" name="report-cat" value={c.value} checked={category === c.value} onChange={() => setCategory(c.value)} className="mt-1" />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
                <textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 2000))} placeholder="Detalles (opcional)" rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm focus:border-red-500 outline-none resize-none mb-3" />
                <p className="text-zinc-500 text-[11px] mb-3">Los reportes son anónimos para el scan. Los reportes falsos repetidos pueden llevar a sanciones.</p>
                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                <button onClick={submit} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-50">
                  {busy && <Loader2 size={14} className="animate-spin" />} Enviar reporte
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;
