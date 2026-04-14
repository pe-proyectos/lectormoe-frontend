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

  const coverImage = joint.imageUrl || joint.manga?.imageUrl || null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <a href={`/${organizationSlug}/admin/joints`} className="text-zinc-500 hover:text-white">
          Joints
        </a>
        <span className="text-zinc-600">/</span>
        <span className="text-white font-bold">{joint.title}</span>
      </div>

      {/* Header card with cover */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
          {(joint.bannerUrl || coverImage) && (
            <img
              src={joint.bannerUrl || coverImage}
              alt=""
              className="w-full h-full object-cover opacity-30"
              onError={(e: any) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex items-end gap-4">
            {/* Cover */}
            <div className="w-20 h-28 rounded-xl overflow-hidden bg-zinc-800 border-2 border-zinc-900 shrink-0 shadow-xl">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={joint.title}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users size={24} className="text-zinc-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-black text-white truncate">{joint.title}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isLeader
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : myMember?.role === 'UPLOADER'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {isLeader ? '★ Líder' : myMember?.role === 'UPLOADER' ? 'Uploader' : 'Viewer'}
                </span>
                <a href={`/joint/manga/${joint.slug}`} className="text-cyan-500 text-xs hover:underline flex items-center gap-1">
                  Ver página pública →
                </a>
              </div>
            </div>

            {isLeader && (
              <button
                onClick={handleDissolve}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-3 rounded-xl text-sm flex items-center gap-1.5 shrink-0"
              >
                <Trash2 size={13} /> Disolver
              </button>
            )}
          </div>
        </div>
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
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Manga base</p>
              <p className="text-white">{joint.manga?.title || '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Estado</p>
              <p className="text-white capitalize">{joint.status || '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Slug</p>
              <p className="text-zinc-400 font-mono text-xs">{joint.slug}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Capítulos</p>
              <p className="text-white">{joint.chapters?.length || 0}</p>
            </div>
            {joint.shortDescription && (
              <div className="col-span-2">
                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Descripción corta</p>
                <p className="text-zinc-300 text-sm">{joint.shortDescription}</p>
              </div>
            )}
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
              <Plus size={14} /> Subir capítulo
            </a>
          )}
          <div className="space-y-2">
            {!joint.chapters || joint.chapters.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                <p className="font-bold">No hay capítulos aún</p>
                {canUpload && <p className="text-sm mt-1">Sube el primer capítulo del joint.</p>}
              </div>
            ) : (
              joint.chapters.map((ch: any) => {
                const isMine = ch.uploadedByOrganization?.id === organization.id;
                const canDelete = isMine || canEditJoint;
                return (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                  >
                    {ch.imageUrl && (
                      <img
                        src={ch.imageUrl}
                        alt=""
                        className="w-8 h-11 object-cover rounded shrink-0"
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">Cap. {ch.number}</span>
                        {ch.title && <span className="text-zinc-400 text-sm truncate">{ch.title}</span>}
                        {isMine && (
                          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">Tuyo</span>
                        )}
                        {ch.isUnreleased && (
                          <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">No publicado</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-600 text-xs">
                          {ch.releasedAt ? new Date(ch.releasedAt).toLocaleDateString('es') : 'Sin fecha'}
                        </span>
                        <div className="flex gap-1">
                          {ch.workedByOrganizations?.map((org: any) => (
                            <img
                              key={org.id}
                              src={org.logoUrl || ''}
                              alt={org.name}
                              title={org.name}
                              className="w-4 h-4 rounded-full object-cover bg-zinc-700"
                              onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(isMine || canEditJoint) && (
                        <a
                          href={`/${organizationSlug}/admin/joints/${joint.slug}/chapter/${ch.number}/edit`}
                          className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Editar"
                        >
                          <ArrowRight size={14} />
                        </a>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteChapter(ch.number)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
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
