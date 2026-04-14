import React, { useState } from 'react';
import { callAPI } from '@/util/callApi';

interface AdminJointChapterEditProps {
  joint: any;
  chapter: any;
  organization: any;
  organizationSlug: string;
  user?: any;
}

const AdminJointChapterEdit: React.FC<AdminJointChapterEditProps> = ({ joint, chapter, organization, organizationSlug }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: chapter.title || '',
    releasedAt: chapter.releasedAt ? new Date(chapter.releasedAt).toISOString().slice(0, 16) : '',
    isUnreleased: chapter.isUnreleased || false,
    workedByOrganizationIds: (chapter.workedByOrganizations || []).map((o: any) => o.id) as number[],
  });

  const acceptedMembers = joint.members?.filter((m: any) => m.status === 'ACCEPTED') || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await callAPI(`/api/joint/${joint.slug}/chapter/${chapter.number}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title || null,
          releasedAt: form.releasedAt ? new Date(form.releasedAt).toISOString() : null,
          isUnreleased: form.isUnreleased,
          workedByOrganizationIds: form.workedByOrganizationIds,
        }),
      });
      alert('Capítulo actualizado');
      window.location.href = `/${organizationSlug}/admin/joints/${joint.slug}`;
    } catch (e: any) {
      alert(e?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkedBy = (orgId: number) => {
    setForm(prev => ({
      ...prev,
      workedByOrganizationIds: prev.workedByOrganizationIds.includes(orgId)
        ? prev.workedByOrganizationIds.filter(id => id !== orgId)
        : [...prev.workedByOrganizationIds, orgId],
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <a href={`/${organizationSlug}/admin/joints`} className="text-zinc-500 hover:text-white">Joints</a>
        <span className="text-zinc-600">/</span>
        <a href={`/${organizationSlug}/admin/joints/${joint.slug}`} className="text-zinc-500 hover:text-white">{joint.title}</a>
        <span className="text-zinc-600">/</span>
        <span className="text-white font-bold">Cap. {chapter.number}</span>
      </div>

      <h1 className="text-2xl font-black text-white">Editar capítulo {chapter.number}</h1>

      <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Fecha de publicación</label>
            <input
              type="datetime-local"
              value={form.releasedAt}
              onChange={e => setForm(prev => ({ ...prev, releasedAt: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Sin publicar</label>
            <div className="flex items-center gap-3 pt-3">
              <input
                type="checkbox"
                id="isUnreleased"
                checked={form.isUnreleased}
                onChange={e => setForm(prev => ({ ...prev, isUnreleased: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
              />
              <label htmlFor="isUnreleased" className="text-zinc-300 text-sm">No publicado</label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase">Trabajado por</label>
          <div className="flex flex-wrap gap-2">
            {acceptedMembers.map((m: any) => (
              <button
                key={m.organization.id}
                type="button"
                onClick={() => toggleWorkedBy(m.organization.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.workedByOrganizationIds.includes(m.organization.id)
                    ? 'bg-cyan-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {m.organization.logoUrl && (
                  <img src={m.organization.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                {m.organization.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-xl text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <a
          href={`/${organizationSlug}/admin/joints/${joint.slug}`}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl text-sm"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
};

export default AdminJointChapterEdit;
