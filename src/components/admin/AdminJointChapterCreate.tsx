import React, { useState } from 'react';
import { callAPI } from '@/util/callApi';

interface AdminJointChapterCreateProps {
  joint: any;
  organization: any;
  organizationSlug: string;
  user?: any;
}

const AdminJointChapterCreate: React.FC<AdminJointChapterCreateProps> = ({ joint, organization, organizationSlug }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: '',
    title: '',
    releasedAt: '',
    isUnreleased: false,
    workedByOrganizationIds: [] as number[],
  });
  const [pagesText, setPagesText] = useState('');

  // Members that are ACCEPTED (for "worked by" selection)
  const acceptedMembers = joint.members?.filter((m: any) => m.status === 'ACCEPTED') || [];

  const handleSave = async () => {
    if (!form.number) {
      alert('El número de capítulo es obligatorio');
      return;
    }
    setSaving(true);
    try {
      // Parse pages from textarea (one URL per line)
      const pages = pagesText.split('\n').map((l: string) => l.trim()).filter(Boolean);

      await callAPI(`/api/joint/${joint.slug}/chapter`, {
        method: 'POST',
        body: JSON.stringify({
          number: parseFloat(form.number),
          title: form.title || null,
          releasedAt: form.releasedAt ? new Date(form.releasedAt).toISOString() : null,
          isUnreleased: form.isUnreleased,
          pages: pages.length > 0 ? pages : undefined,
          workedByOrganizationIds: form.workedByOrganizationIds.length > 0 ? form.workedByOrganizationIds : undefined,
        }),
      });
      alert('Capítulo creado correctamente');
      window.location.href = `/${organizationSlug}/admin/joints/${joint.slug}`;
    } catch (e: any) {
      alert(e?.message || 'Error al crear el capítulo');
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
        <span className="text-white font-bold">Nuevo capítulo</span>
      </div>

      <h1 className="text-2xl font-black text-white">Subir capítulo — {joint.title}</h1>

      <div className="bg-zinc-900 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Número *</label>
            <input
              type="number"
              step="0.1"
              value={form.number}
              onChange={e => setForm(prev => ({ ...prev, number: e.target.value }))}
              placeholder="ej: 1, 1.5, 100"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Título (opcional)</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título del capítulo"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
            />
          </div>
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
            <label className="text-xs font-bold text-zinc-500 uppercase">Acceso anticipado</label>
            <div className="flex items-center gap-3 pt-3">
              <input
                type="checkbox"
                id="isUnreleased"
                checked={form.isUnreleased}
                onChange={e => setForm(prev => ({ ...prev, isUnreleased: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
              />
              <label htmlFor="isUnreleased" className="text-zinc-300 text-sm">No publicado aún</label>
            </div>
          </div>
        </div>

        {/* Worked by */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase">Trabajado por (scans)</label>
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

        {/* Pages */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase">Páginas (una URL por línea)</label>
          <textarea
            value={pagesText}
            onChange={e => setPagesText(e.target.value)}
            rows={6}
            placeholder={'https://r2.capibaratraductor.com/page1.jpg\nhttps://r2.capibaratraductor.com/page2.jpg'}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 resize-none font-mono"
          />
          <p className="text-zinc-600 text-xs">{pagesText.split('\n').filter((l: string) => l.trim()).length} páginas</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-xl text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Publicar capítulo'}
        </button>
        <a
          href={`/${organizationSlug}/admin/joints/${joint.slug}`}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
};

export default AdminJointChapterCreate;
