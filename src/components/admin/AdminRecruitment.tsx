import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Zap, Trash2, Pencil, X, CheckCircle2, RotateCcw, Ban } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { toast } from 'react-toastify';
import { useDialog } from '../ui/useDialog';

interface Props {
  organization: any;
  user: any;
  organizationSlug: string;
}

interface Post {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  roles: string;
  language: string;
  urgent: boolean;
  status: string;
  updatedAt: string;
}

const ROLE_LABEL: Record<string, string> = { cleaner: 'Cleaner', typer: 'Typer', traductor: 'Traductor', redrawer: 'Redrawer', proofreader: 'Proofreader', editor: 'Editor', otro: 'Otro' };
const ROLES = Object.keys(ROLE_LABEL);

const emptyForm = { title: '', description: '', requirements: '', roles: [] as string[], language: 'es', urgent: false };

const AdminRecruitment: React.FC<Props> = () => {
  const dlg = useDialog();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await callAPI('/api/organization/recruitment'); setPosts(res || []); } catch { setPosts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description, requirements: p.requirements || '', roles: p.roles.split(',').filter(Boolean), language: p.language, urgent: p.urgent });
    setShowForm(true);
  };

  const toggleRole = (r: string) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));

  const save = async () => {
    if (form.title.trim().length < 3) { toast.error('El título debe tener al menos 3 caracteres.'); return; }
    if (form.description.trim().length < 10) { toast.error('La descripción debe tener al menos 10 caracteres.'); return; }
    if (form.roles.length === 0) { toast.error('Selecciona al menos un rol.'); return; }
    setSaving(true);
    const payload = { title: form.title.trim(), description: form.description.trim(), requirements: form.requirements.trim() || undefined, roles: form.roles.join(','), language: form.language, urgent: form.urgent };
    try {
      if (editing) await callAPI(`/api/organization/recruitment/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await callAPI('/api/organization/recruitment', { method: 'POST', body: JSON.stringify(payload) });
      setShowForm(false); load();
    } catch (e: any) { toast.error(e?.message || 'No se pudo guardar.'); } finally { setSaving(false); }
  };

  const setStatus = async (p: Post, status: string) => {
    await callAPI(`/api/organization/recruitment/${p.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (p: Post) => {
    if (!(await dlg.confirm(`¿Eliminar el anuncio "${p.title}"? Esta acción no se puede deshacer.`))) return;
    await callAPI(`/api/organization/recruitment/${p.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="mt-4">
      <dlg.DialogHost />
      <div className="flex items-center justify-between mb-4">
        <p className="text-zinc-400 text-sm">Publica los roles que tu scan busca. Aparecen en el mural público <a href="/reclutamiento" className="text-cyan-400 hover:underline">/reclutamiento</a>.</p>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl px-4 py-2.5 font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"><Plus size={16} /> Nuevo anuncio</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 className="animate-spin text-zinc-600" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-14 text-zinc-600"><p>Todavía no publicaste ningún anuncio.</p></div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className={`bg-zinc-900 border rounded-2xl p-4 ${p.status === 'closed' ? 'border-zinc-800 opacity-60' : p.urgent ? 'border-red-500/40' : 'border-zinc-800'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-black truncate">{p.title}</h3>
                    {p.urgent && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-red-500/15 text-red-400 rounded-full px-2 py-0.5"><Zap size={10} /> Urgente</span>}
                    <span className={`text-[10px] font-black uppercase rounded-full px-2 py-0.5 ${p.status === 'open' ? 'bg-green-500/15 text-green-400' : p.status === 'filled' ? 'bg-zinc-700/40 text-zinc-400' : 'bg-zinc-800 text-zinc-500'}`}>{p.status === 'open' ? 'Reclutando' : p.status === 'filled' ? 'Cupos llenos' : 'Cerrado'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.roles.split(',').filter(Boolean).map((r) => <span key={r} className="text-[11px] font-bold bg-cyan-500/10 text-cyan-300 rounded-md px-2 py-0.5">{ROLE_LABEL[r] || r}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} title="Editar" className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(p)} title="Eliminar" className="p-2 rounded-lg hover:bg-zinc-800 text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.status !== 'open' && <button onClick={() => setStatus(p, 'open')} className="inline-flex items-center gap-1 text-xs font-bold bg-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 hover:bg-zinc-700"><RotateCcw size={13} /> Reabrir</button>}
                {p.status === 'open' && <button onClick={() => setStatus(p, 'filled')} className="inline-flex items-center gap-1 text-xs font-bold bg-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 hover:bg-zinc-700"><CheckCircle2 size={13} /> Marcar cupos llenos</button>}
                {p.status !== 'closed' && <button onClick={() => setStatus(p, 'closed')} className="inline-flex items-center gap-1 text-xs font-bold bg-zinc-800 text-zinc-400 rounded-lg px-3 py-1.5 hover:bg-zinc-700"><Ban size={13} /> Cerrar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black text-white">{editing ? 'Editar anuncio' : 'Nuevo anuncio'}</h3><button onClick={() => setShowForm(false)}><X size={18} className="text-zinc-500" /></button></div>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 200) })} placeholder="Título (ej. Buscamos traductor de japonés)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm mb-3 focus:border-cyan-500 outline-none" />
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Roles buscados</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {ROLES.map((r) => <button key={r} onClick={() => toggleRole(r)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${form.roles.includes(r) ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>{ROLE_LABEL[r]}</button>)}
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 4000) })} rows={4} placeholder="Describe qué hace el scan y qué buscan…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-1 focus:border-cyan-500 outline-none resize-none" />
            <p className="text-zinc-600 text-[10px] mb-3 text-right">{form.description.length}/4000</p>
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value.slice(0, 2000) })} rows={3} placeholder="Requisitos (opcional)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm mb-3 focus:border-cyan-500 outline-none resize-none" />
            <div className="flex items-center gap-3 mb-4">
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none">
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="ambos">Ambos</option>
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} className="accent-red-500 w-4 h-4" /> Marcar como urgente
              </label>
            </div>
            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50">{saving && <Loader2 size={14} className="animate-spin" />} {editing ? 'Guardar cambios' : 'Publicar anuncio'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecruitment;
