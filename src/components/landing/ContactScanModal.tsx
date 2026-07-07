import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import BottomSheet from '../ui/BottomSheet';

interface Props {
  scanSlug: string;
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
  defaultSubject?: string;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'gracias', label: 'Agradecimiento' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'queja', label: 'Queja' },
  { value: 'unirme', label: 'Unirme al scan' },
  { value: 'otro', label: 'Otro' },
];

const ContactScanModal: React.FC<Props> = ({ scanSlug, open, onClose, defaultCategory = 'gracias', defaultSubject = '' }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (subject.trim().length < 3) { setError('El asunto debe tener al menos 3 caracteres.'); return; }
    if (body.trim().length < 10) { setError('El mensaje debe tener al menos 10 caracteres.'); return; }
    setBusy(true); setError(null);
    try {
      await callAPI(`/api/organization/${scanSlug}/messages`, { method: 'POST', body: JSON.stringify({ category, subject: subject.trim(), body: body.trim() }) });
      setDone(true);
    } catch (e: any) { setError(e?.message || 'No se pudo enviar el mensaje.'); } finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={() => !busy && onClose()} title="Contactar al scan">
      <>
        {done ? (
          <p className="text-green-400 text-sm py-4">Mensaje enviado. El scan te responderá aquí mismo; te avisaremos con una notificación.</p>
        ) : (
          <>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-2 focus:border-cyan-500 outline-none">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 200))} placeholder="Asunto" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-2 focus:border-cyan-500 outline-none" />
            <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 4000))} rows={4} placeholder="Escribe tu mensaje…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-1 focus:border-cyan-500 outline-none resize-none" />
            <p className="text-zinc-600 text-[10px] mb-3 text-right">{body.length}/4000</p>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button onClick={submit} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-3 min-h-[44px] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors active:scale-[0.98] disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />} Enviar mensaje</button>
          </>
        )}
      </>
    </BottomSheet>
  );
};

export default ContactScanModal;
