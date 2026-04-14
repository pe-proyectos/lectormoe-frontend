import React, { useState } from 'react';
import { callAPI } from '@/util/callApi';
import { Users, Plus, Trash2, ArrowRight } from 'lucide-react';

interface AdminJointDetailProps {
  joint: any;
  organization: any;
  organizationSlug: string;
  user?: any;
}

const AdminJointDetail: React.FC<AdminJointDetailProps> = ({
  joint: initialJoint,
  organization,
  organizationSlug,
}) => {
  const [joint, setJoint] = useState(initialJoint);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'chapters'>('info');
  const [inviteSlug, setInviteSlug] = useState('');
  const [inviteRole, setInviteRole] = useState<'UPLOADER' | 'VIEWER'>('UPLOADER');
  const [inviting, setInviting] = useState(false);

  const myMember = joint.members?.find((m: any) => m.organization.id === organization.id);
  const isLeader = myMember?.role === 'LEADER';
  const canEditJoint = isLeader || myMember?.canEditJoint;
  const canUpload = isLeader || myMember?.role === 'UPLOADER';

  const reload = async () => {
    try {
      const data = await callAPI(`/api/joint/${joint.slug}/admin`);
      if (data) setJoint(data);
    } catch (e) {}
  };

  const handleInvite = async () => {
    if (!inviteSlug.trim()) return;
    setInviting(true);
    try {
      await callAPI(`/api/joint/${joint.slug}/invite`, {
        method: 'POST',
        body: JSON.stringify({ organizationSlug: inviteSlug.trim(), role: inviteRole }),
      });
      alert('Invitación enviada');
      setInviteSlug('');
      reload();
    } catch (e: any) {
      alert(e?.message || 'Error al invitar');
    } finally {
      setInviting(false);
    }
  };

  const handleExpel = async (orgSlug: string) => {
    if (!confirm('¿Expulsar a este scan del joint?')) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/member/${orgSlug}`, { method: 'DELETE' });
      alert('Miembro expulsado');
      reload();
    } catch (e: any) {
      alert(e?.message || 'Error al expulsar');
    }
  };

  const handleTransfer = async (orgSlug: string) => {
    if (!confirm(`¿Transferir el liderazgo a ${orgSlug}? Tú pasarás a ser UPLOADER.`)) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ organizationSlug: orgSlug }),
      });
      alert('Liderazgo transferido');
      reload();
    } catch (e: any) {
      alert(e?.message || 'Error al transferir');
    }
  };

  const handleDissolve = async () => {
    if (!confirm('¿Disolver el joint? Esto eliminará todos los capítulos del joint.')) return;
    try {
      await callAPI(`/api/joint/${joint.slug}`, { method: 'DELETE' });
      alert('Joint disuelto');
      window.location.href = `/${organizationSlug}/admin/joints`;
    } catch (e: any) {
      alert(e?.message || 'Error al disolver');
    }
  };

  const handleDeleteChapter = async (number: number) => {
    if (!confirm(`¿Eliminar el capítulo ${number}?`)) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/chapter/${number}`, { method: 'DELETE' });
      alert('Capítulo eliminado');
      reload();
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href={`/${organizationSlug}/admin/joints`} className="text-zinc-500 hover:text-white text-sm">
              Joints
            </a>
            <span className="text-zinc-600">/</span>
            <span className="text-white text-sm font-bold">{joint.title}</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users size={24} /> {joint.title}
          </h1>
          <a href={`/joint/manga/${joint.slug}`} className="text-cyan-500 text-xs hover:underline">
            Ver página pública →
          </a>
        </div>
        {isLeader && (
          <button
            onClick={handleDissolve}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2"
          >
            <Trash2 size={14} /> Disolver joint
          </button>
        )}
      </div>

      {/* My role badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-500 uppercase">Tu rol:</span>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            isLeader
              ? 'bg-yellow-500/20 text-yellow-400'
              : myMember?.role === 'UPLOADER'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-zinc-700 text-zinc-400'
          }`}
        >
          {isLeader ? '★ Líder' : myMember?.role === 'UPLOADER' ? 'Uploader' : 'Viewer'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(['info', 'members', 'chapters'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-cyan-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'info' ? 'Información' : tab === 'members' ? 'Miembros' : 'Capítulos'}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="bg-zinc-900 rounded-2xl p-6 space-y-4">
          <p className="text-zinc-400 text-sm">
            {canEditJoint
              ? 'Puedes editar la información del joint.'
              : 'Solo el líder puede editar la información.'}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Título</p>
              <p className="text-white">{joint.title}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Estado</p>
              <p className="text-white capitalize">{joint.status}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Manga base</p>
              <p className="text-white">{joint.manga?.title}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Slug</p>
              <p className="text-zinc-400 font-mono text-xs">{joint.slug}</p>
            </div>
          </div>
          {canEditJoint && (
            <a
              href={`/${organizationSlug}/admin/joints/${joint.slug}/edit`}
              className="inline-block bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              Editar información
            </a>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Invite form (leader or canInvite) */}
          {(isLeader || myMember?.canInvite) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Plus size={16} /> Invitar scan
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inviteSlug}
                  onChange={e => setInviteSlug(e.target.value)}
                  placeholder="Slug del scan (ej: senshimanga)"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-cyan-500"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'UPLOADER' | 'VIEWER')}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none"
                >
                  <option value="UPLOADER">Uploader</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl text-sm disabled:opacity-50"
                >
                  {inviting ? '...' : 'Invitar'}
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            {joint.members?.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {m.organization.logoUrl && (
                    <img
                      src={m.organization.logoUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-bold text-sm">{m.organization.name}</p>
                    <p className="text-zinc-500 text-xs">{m.organization.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      m.role === 'LEADER'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : m.role === 'UPLOADER'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {m.role}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      m.status === 'ACCEPTED'
                        ? 'bg-green-500/10 text-green-400'
                        : m.status === 'INVITED'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {m.status}
                  </span>
                  {isLeader &&
                    m.organization.id !== organization.id &&
                    m.role !== 'LEADER' &&
                    m.status === 'ACCEPTED' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTransfer(m.organization.slug)}
                          title="Transferir liderazgo"
                          className="text-yellow-400 hover:text-yellow-300 p-1"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={() => handleExpel(m.organization.slug)}
                          title="Expulsar"
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          {canUpload && (
            <a
              href={`/${organizationSlug}/admin/joints/${joint.slug}/chapter/create`}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              <span>+ Subir capítulo</span>
            </a>
          )}
          <div className="space-y-2">
            {!joint.chapters || joint.chapters.length === 0 ? (
              <p className="text-zinc-500">No hay capítulos aún.</p>
            ) : (
              joint.chapters.map((ch: any) => {
                const isMine = ch.uploadedByOrganization?.id === organization.id;
                const canDelete = isMine || canEditJoint;
                return (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-sm">Cap. {ch.number}</span>
                      {ch.title && <span className="text-zinc-400 text-sm">{ch.title}</span>}
                      <div className="flex gap-1">
                        {ch.workedByOrganizations?.map((org: any) => (
                          <img
                            key={org.id}
                            src={org.logoUrl || ''}
                            alt={org.name}
                            title={org.name}
                            className="w-5 h-5 rounded-full object-cover bg-zinc-700"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">
                        {ch.releasedAt ? new Date(ch.releasedAt).toLocaleDateString('es') : '—'}
                      </span>
                      {isMine && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">Tuyo</span>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteChapter(ch.number)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {(isMine || canEditJoint) && (
                        <a
                          href={`/${organizationSlug}/admin/joints/${joint.slug}/chapter/${ch.number}/edit`}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Editar capítulo"
                        >
                          ✏️
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJointDetail;
