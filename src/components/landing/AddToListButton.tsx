import React, { useEffect, useState } from 'react';
import { ListPlus, Loader2, X, Plus } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props { mangaCustomId?: number; jointId?: number; logged?: boolean; scanSlug?: string; }

const AddToListButton: React.FC<Props> = ({ mangaCustomId, jointId, logged, scanSlug }) => {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [inList, setInList] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSub, setNeedsSub] = useState(false);

  const load = async () => {
    setLoading(true); setError(null); setNeedsSub(false);
    try {
      const me = JSON.parse(localStorage.getItem('user') || 'null');
      if (!me?.slug) { setLists([]); return; }
      const mine = await callAPI(`/api/lists/${me.slug}`);
      setLists(Array.isArray(mine) ? mine : []);
    } catch { setLists([]); } finally { setLoading(false); }
  };

  const openModal = () => { if (!logged) { window.location.href = '/login'; return; } setOpen(true); load(); };

  const toggle = async (listId: number) => {
    const has = inList.has(listId);
    setError(null); setNeedsSub(false);
    try {
      const body = JSON.stringify(mangaCustomId ? { mangaCustomId } : { jointId });
      await callAPI(`/api/lists/${listId}/items`, { method: has ? 'DELETE' : 'POST', body });
      const next = new Set(inList); if (has) next.delete(listId); else next.add(listId); setInList(next);
    } catch (e: any) {
      const msg = e?.message || 'No se pudo actualizar la lista.';
      if (/suscriptores/i.test(msg)) setNeedsSub(true);
      setError(msg);
    }
  };

  const createAndAdd = async () => {
    if (newName.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres.'); return; }
    setBusy(true); setError(null); setNeedsSub(false);
    try {
      const list = await callAPI('/api/lists', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      await callAPI(`/api/lists/${list.id}/items`, { method: 'POST', body: JSON.stringify(mangaCustomId ? { mangaCustomId } : { jointId }) });
      setNewName(''); await load(); setInList(new Set([...inList, list.id]));
    } catch (e: any) {
      const msg = e?.message || 'No se pudo crear la lista.';
      if (/suscriptores/i.test(msg)) setNeedsSub(true);
      setError(msg);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={openModal} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all active:scale-95">
        <ListPlus size={18} /> AGREGAR A LISTA
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-black text-white">Agregar a lista</h3><button onClick={() => setOpen(false)}><X size={18} className="text-zinc-500" /></button></div>
            {needsSub ? (
              <>
                <p className="text-zinc-400 text-sm mb-3">Crear y editar listas públicas es un beneficio para suscriptores de cualquier scan.</p>
                {scanSlug && <a href={`/${scanSlug}/subscriptions`} className="inline-block bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest">Ver planes</a>}
              </>
            ) : (
              <>
                {loading ? <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-zinc-600" /></div> : (
                  <div className="space-y-1 mb-3 max-h-56 overflow-y-auto">
                    {lists.length === 0 && <p className="text-zinc-600 text-sm">Aún no tienes listas.</p>}
                    {lists.map((l) => (
                      <label key={l.id} className="flex items-center gap-2 text-sm text-zinc-300 py-1.5 cursor-pointer">
                        <input type="checkbox" checked={inList.has(l.id)} onChange={() => toggle(l.id)} />
                        <span className="truncate">{l.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Crear lista nueva" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white text-sm focus:border-cyan-500 outline-none" />
                  <button onClick={createAndAdd} disabled={busy} className="p-2 rounded-xl bg-cyan-500 text-zinc-950 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}</button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AddToListButton;
