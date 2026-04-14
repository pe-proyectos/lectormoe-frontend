import React, { useState } from 'react';
import { callAPI } from '@/util/callApi';

interface AdminJointEditProps {
  joint: any;
  organization: any;
  organizationSlug: string;
  user?: any;
}

const AdminJointEdit: React.FC<AdminJointEditProps> = ({ joint: initialJoint, organization, organizationSlug }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initialJoint.title || '',
    shortDescription: initialJoint.shortDescription || '',
    description: initialJoint.description || '',
    status: initialJoint.status || 'ongoing',
    workType: initialJoint.workType || 'manga',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await callAPI(`/api/joint/${initialJoint.slug}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      alert('Joint actualizado correctamente');
      window.location.href = `/${organizationSlug}/admin/joints/${initialJoint.slug}`;
    } catch (e: any) {
      alert(e?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type: 'text' | 'textarea' | 'select' = 'text', options?: string[]) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 resize-none"
        />
      ) : type === 'select' && options ? (
        <select
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <a href={`/${organizationSlug}/admin/joints`} className="text-zinc-500 hover:text-white">Joints</a>
        <span className="text-zinc-600">/</span>
        <a href={`/${organizationSlug}/admin/joints/${initialJoint.slug}`} className="text-zinc-500 hover:text-white">{initialJoint.title}</a>
        <span className="text-zinc-600">/</span>
        <span className="text-white font-bold">Editar</span>
      </div>

      <h1 className="text-2xl font-black text-white">Editar Joint</h1>

      <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
        {field('Título', 'title')}
        {field('Descripción corta', 'shortDescription', 'textarea')}
        {field('Descripción completa', 'description', 'textarea')}
        {field('Estado', 'status', 'select', ['ongoing', 'completed', 'hiatus', 'dropped'])}
        {field('Tipo de obra', 'workType', 'select', ['manga', 'manhwa', 'manhua', 'novel', 'doujin'])}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-xl text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <a
          href={`/${organizationSlug}/admin/joints/${initialJoint.slug}`}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
};

export default AdminJointEdit;
