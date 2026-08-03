import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Loader2, Plus, Trash2, Pencil, X, Search, ArrowUp, ArrowDown, Globe, EyeOff, Star } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  organization: any;
  user: any;
  organizationSlug: string;
}

interface Reco {
  id: number;
  label: string;
  note: string | null;
  position: number;
  isActive: boolean;
  showOnGlobal: boolean;
  startsAt: string | null;
  endsAt: string | null;
  mangaCustom?: { id: number; title: string; imageUrl: string | null; manga?: { slug: string } } | null;
  joint?: { id: number; title: string; imageUrl: string | null; slug: string } | null;
}

const LABEL_PRESETS = [
  'La recomendación de la casa',
  'Joya oculta',
  'Para empezar',
  'El favorito del staff',
  'Imperdible',
];

const emptyForm = {
  mangaCustomId: null as number | null,
  workTitle: '',
  workImage: '' as string | null,
  label: LABEL_PRESETS[0],
  note: '',
  isActive: true,
  showOnGlobal: false,
  startsAt: '',
  endsAt: '',
};

const AdminRecommendations: React.FC<Props> = () => {
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reco | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Buscador de mangas del scan
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await callAPI('/api/organization/recommendation'); setRecos(res || []); } catch { setRecos([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Búsqueda de mangas del scan (solo al crear; en edición la obra es fija).
  useEffect(() => {
    if (!showForm || editing) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await callAPI(`/api/manga-custom?search=${encodeURIComponent(search)}&limit=20&order=alphabetical&nsfw=true`);
        setResults(Array.isArray(res?.items) ? res.items : []);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, showForm, editing]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSearch(''); setResults([]); setShowForm(true); };
  const openEdit = (r: Reco) => {
    setEditing(r);
    setForm({
      mangaCustomId: r.mangaCustom?.id ?? null,
      workTitle: r.mangaCustom?.title || r.joint?.title || '',
      workImage: r.mangaCustom?.imageUrl || r.joint?.imageUrl || '',
      label: r.label,
      note: r.note || '',
      isActive: r.isActive,
      showOnGlobal: r.showOnGlobal,
      startsAt: r.startsAt ? r.startsAt.slice(0, 10) : '',
      endsAt: r.endsAt ? r.endsAt.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const pickManga = (m: any) => {
    setForm((f) => ({ ...f, mangaCustomId: m.id, workTitle: m.title, workImage: m.imageUrl || '' }));
    setResults([]);
    setSearch('');
  };

  const save = async () => {
    if (!editing && !form.mangaCustomId) return alert('Elige un manga de tu scan.');
    if (!form.label.trim()) return alert('Escribe una etiqueta (ej. La recomendación de la casa).');
    setSaving(true);
    try {
      const common = {
        label: form.label.trim(),
        note: form.note.trim() || undefined,
        isActive: form.isActive,
        showOnGlobal: form.showOnGlobal,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      };
      if (editing) {
        await callAPI(`/api/organization/recommendation/${editing.id}`, { method: 'PATCH', body: JSON.stringify(common) });
      } else {
        await callAPI('/api/organization/recommendation', { method: 'POST', body: JSON.stringify({ ...common, mangaCustomId: form.mangaCustomId }) });
      }
      setShowForm(false); load();
    } catch (e: any) { alert(e?.message || 'No se pudo guardar.'); } finally { setSaving(false); }
  };

  const remove = async (r: Reco) => {
    if (!confirm(`¿Eliminar la recomendación "${r.mangaCustom?.title || r.joint?.title || ''}"?`)) return;
    await callAPI(`/api/organization/recommendation/${r.id}`, { method: 'DELETE' });
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...recos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRecos(next); // optimista
    try { await callAPI('/api/organization/recommendation/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((r) => r.id) }) }); }
    catch { load(); }
  };

  const workOf = (r: Reco) => r.mangaCustom || r.joint;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-zinc-400 text-sm max-w-xl">Elige las obras que quieres destacar en grande en tu página ("La recomendación de la casa"). Puedes marcar algunas para que también salgan en el inicio global. Máximo 6.</p>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2.5 font-black text-xs uppercase tracking-widest hover:bg-white transition-colors shrink-0"><Plus size={16} /> Nueva recomendación</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="animate-spin text-zinc-600" /></div>
      ) : recos.length === 0 ? (
        <div className="text-center py-14 text-zinc-600"><p>Todavía no destacaste ninguna obra.</p></div>
      ) : (
        <div className="space-y-3">
          {recos.map((r, i) => {
            const w = workOf(r);
            return (
              <div key={r.id} className={`bg-zinc-900 border rounded-2xl p-3 flex items-center gap-3 ${r.isActive ? 'border-zinc-800' : 'border-zinc-800/60 opacity-60'}`}>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Subir" className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === recos.length - 1} title="Bajar" className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30"><ArrowDown size={15} /></button>
                </div>
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  {w?.imageUrl && <img src={w.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-cyan-500/15 text-cyan-300 rounded-full px-2 py-0.5"><Star size={10} /> {r.label}</span>
                    {r.showOnGlobal && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-purple-500/15 text-purple-300 rounded-full px-2 py-0.5"><Globe size={10} /> Home global</span>}
                    {!r.isActive && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-zinc-700/40 text-zinc-400 rounded-full px-2 py-0.5"><EyeOff size={10} /> Oculta</span>}
                  </div>
                  <h3 className="text-white font-black truncate">{w?.title || '(obra no disponible)'}</h3>
                  {r.note && <p className="text-zinc-500 text-xs truncate italic">"{r.note}"</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(r)} title="Editar" className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(r)} title="Eliminar" className="p-2 rounded-lg hover:bg-zinc-800 text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black text-white">{editing ? 'Editar recomendación' : 'Nueva recomendación'}</h3><button onClick={() => setShowForm(false)}><X size={18} className="text-zinc-500" /></button></div>

            {/* Selección de obra */}
            {editing ? (
              <div className="flex items-center gap-3 mb-4 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
                <div className="w-10 h-14 rounded overflow-hidden bg-zinc-800 shrink-0">{form.workImage && <img src={form.workImage} alt="" className="w-full h-full object-cover" />}</div>
                <span className="text-white text-sm font-bold truncate">{form.workTitle}</span>
              </div>
            ) : form.mangaCustomId ? (
              <div className="flex items-center gap-3 mb-4 bg-zinc-950 border border-cyan-500/40 rounded-xl p-2">
                <div className="w-10 h-14 rounded overflow-hidden bg-zinc-800 shrink-0">{form.workImage && <img src={form.workImage} alt="" className="w-full h-full object-cover" />}</div>
                <span className="text-white text-sm font-bold truncate flex-1">{form.workTitle}</span>
                <button onClick={() => setForm({ ...form, mangaCustomId: null, workTitle: '', workImage: '' })} className="text-zinc-500 hover:text-white p-1"><X size={16} /></button>
              </div>
            ) : (
              <div className="mb-4">
                <div className="relative mb-2">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busca un manga de tu scan…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm focus:border-cyan-500 outline-none" />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {searching ? <div className="py-4 flex justify-center"><Loader2 size={18} className="animate-spin text-zinc-600" /></div> : results.length === 0 ? <p className="text-zinc-600 text-xs text-center py-3">Sin resultados.</p> : results.map((m) => (
                    <button key={m.id} onClick={() => pickManga(m)} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800 text-left">
                      <div className="w-8 h-11 rounded overflow-hidden bg-zinc-800 shrink-0">{m.imageUrl && <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                      <span className="text-zinc-200 text-sm truncate">{m.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etiqueta */}
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Etiqueta</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {LABEL_PRESETS.map((l) => <button key={l} onClick={() => setForm({ ...form, label: l })} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${form.label === l ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{l}</button>)}
            </div>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value.slice(0, 80) })} placeholder="La recomendación de la casa" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-3 focus:border-cyan-500 outline-none" />

            {/* Nota */}
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value.slice(0, 500) })} rows={3} placeholder="Por qué la recomiendas (opcional)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-1 focus:border-cyan-500 outline-none resize-none" />
            <p className="text-zinc-600 text-[10px] mb-3 text-right">{form.note.length}/500</p>

            {/* Programación opcional */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Desde (opcional)</label>
                <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-2.5 text-white text-sm focus:border-cyan-500 outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Hasta (opcional)</label>
                <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-2.5 text-white text-sm focus:border-cyan-500 outline-none mt-1" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-cyan-500 w-4 h-4" /> Activa (visible en tu página)
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={form.showOnGlobal} onChange={(e) => setForm({ ...form, showOnGlobal: e.target.checked })} className="accent-purple-500 w-4 h-4" /> Mostrar también en el inicio global de CapibaraTraductor
              </label>
            </div>

            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">{saving && <Loader2 size={14} className="animate-spin" />} {editing ? 'Guardar cambios' : 'Agregar recomendación'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecommendations;
