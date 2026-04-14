import React, { useState, useEffect } from 'react';
import { callAPI } from '@/util/callApi';
import { toast, ToastContainer } from 'react-toastify';
import {
  Settings2, List, UploadCloud, Users, Plus, Trash2,
  Edit3, ArrowRight, BookOpen, Check,
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

type TabType = 'info' | 'members' | 'chapters' | 'upload';

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
  const [activeTab, setActiveTab] = useState<TabType>('chapters');
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [editingChapterNumber, setEditingChapterNumber] = useState<number | null>(null);

  // Permissions
  const myMember = joint.members?.find((m: any) => m.organization.id === organization.id);
  const isLeader = myMember?.role === 'LEADER';
  const canEditJoint = isLeader || myMember?.canEditJoint;
  const canUpload = isLeader || myMember?.role === 'UPLOADER';
  const canInvite = isLeader || myMember?.canInvite;

  // --- Info tab state ---
  const [formData, setFormData] = useState({
    title: initialJoint.title || '',
    shortDescription: initialJoint.shortDescription || '',
    description: initialJoint.description || '',
    status: initialJoint.status || 'ongoing',
    workType: initialJoint.workType || 'manga',
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // --- Members tab state ---
  const [inviteSlug, setInviteSlug] = useState('');
  const [inviteRole, setInviteRole] = useState<'UPLOADER' | 'VIEWER'>('UPLOADER');
  const [inviting, setInviting] = useState(false);

  // --- Chapter upload/edit tab state ---
  const [chapterForm, setChapterForm] = useState({
    number: '',
    title: '',
    releasedAt: '',
    isUnreleased: false,
  });
  const [pagesText, setPagesText] = useState('');
  const [workedByIds, setWorkedByIds] = useState<number[]>([]);
  const [savingChapter, setSavingChapter] = useState(false);

  const reload = async () => {
    try {
      const data = await callAPI(`/api/joint/${joint.slug}/admin`);
      if (data) setJoint(data);
    } catch {}
  };

  // --- Info handlers ---
  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      await callAPI(`/api/joint/${joint.slug}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      toast.success('Joint actualizado', { position: 'bottom-right' });
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar', { position: 'bottom-right' });
    } finally {
      setSavingInfo(false);
    }
  };

  // --- Member handlers ---
  const handleInvite = async () => {
    if (!inviteSlug.trim()) return;
    setInviting(true);
    try {
      await callAPI(`/api/joint/${joint.slug}/invite`, {
        method: 'POST',
        body: JSON.stringify({ organizationSlug: inviteSlug.trim(), role: inviteRole }),
      });
      toast.success('Invitación enviada', { position: 'bottom-right' });
      setInviteSlug('');
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Error al invitar', { position: 'bottom-right' });
    } finally {
      setInviting(false);
    }
  };

  const handleExpel = async (orgSlug: string) => {
    if (!confirm('¿Expulsar a este scan del joint?')) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/member/${orgSlug}`, { method: 'DELETE' });
      toast.success('Miembro expulsado', { position: 'bottom-right' });
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Error al expulsar', { position: 'bottom-right' });
    }
  };

  const handleTransfer = async (orgSlug: string) => {
    if (!confirm(`¿Transferir el liderazgo a ${orgSlug}? Tú pasarás a ser UPLOADER.`)) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ organizationSlug: orgSlug }),
      });
      toast.success('Liderazgo transferido', { position: 'bottom-right' });
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Error al transferir', { position: 'bottom-right' });
    }
  };

  const handleDissolve = async () => {
    if (!confirm('¿Disolver el joint? Esto eliminará todos los capítulos del joint.')) return;
    try {
      await callAPI(`/api/joint/${joint.slug}`, { method: 'DELETE' });
      toast.success('Joint disuelto', { position: 'bottom-right' });
      window.location.href = `/${organizationSlug}/admin/joints`;
    } catch (e: any) {
      toast.error(e?.message || 'Error al disolver', { position: 'bottom-right' });
    }
  };

  // --- Chapter handlers ---
  const resetChapterForm = () => {
    setChapterForm({ number: '', title: '', releasedAt: '', isUnreleased: false });
    setPagesText('');
    setWorkedByIds([]);
    setIsEditingChapter(false);
    setEditingChapterNumber(null);
  };

  const handleEditChapter = (ch: any) => {
    setIsEditingChapter(true);
    setEditingChapterNumber(ch.number);
    setChapterForm({
      number: String(ch.number),
      title: ch.title || '',
      releasedAt: ch.releasedAt ? new Date(ch.releasedAt).toISOString().slice(0, 16) : '',
      isUnreleased: ch.isUnreleased || false,
    });
    setPagesText('');
    setWorkedByIds((ch.workedByOrganizations || []).map((o: any) => o.id));
    setActiveTab('upload');
  };

  const handleDeleteChapter = async (number: number) => {
    if (!confirm(`¿Eliminar el capítulo ${number}?`)) return;
    try {
      await callAPI(`/api/joint/${joint.slug}/chapter/${number}`, { method: 'DELETE' });
      toast.success('Capítulo eliminado', { position: 'bottom-right' });
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Error al eliminar', { position: 'bottom-right' });
    }
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.number) {
      toast.error('El número de capítulo es obligatorio', { position: 'bottom-right' });
      return;
    }
    setSavingChapter(true);
    try {
      const pages = pagesText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const body: any = {
        title: chapterForm.title || null,
        releasedAt: chapterForm.releasedAt ? new Date(chapterForm.releasedAt).toISOString() : null,
        isUnreleased: chapterForm.isUnreleased,
        workedByOrganizationIds: workedByIds.length > 0 ? workedByIds : undefined,
      };
      if (!isEditingChapter) body.number = parseFloat(chapterForm.number);
      if (pages.length > 0) body.pages = pages;

      if (isEditingChapter && editingChapterNumber !== null) {
        await callAPI(`/api/joint/${joint.slug}/chapter/${editingChapterNumber}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Capítulo actualizado', { position: 'bottom-right' });
      } else {
        await callAPI(`/api/joint/${joint.slug}/chapter`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Capítulo creado', { position: 'bottom-right' });
      }
      resetChapterForm();
      reload();
      setActiveTab('chapters');
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar el capítulo', { position: 'bottom-right' });
    } finally {
      setSavingChapter(false);
    }
  };

  const toggleWorkedBy = (orgId: number) => {
    setWorkedByIds(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const acceptedMembers = joint.members?.filter((m: any) => m.status === 'ACCEPTED') || [];
  const cover = joint.imageUrl || joint.manga?.imageUrl || null;
  const banner = joint.bannerUrl || joint.imageUrl || joint.manga?.bannerUrl || joint.manga?.imageUrl || null;

  // Shared input style (same as AdminMangaEdit)
  const inputCls = 'w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-sm focus:border-cyan-500 transition-all outline-none';
  const labelCls = 'text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1';
  const panelCls = 'bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-8 space-y-6';

  return (
    <div className="pt-20 min-h-screen bg-zinc-950">

      {/* ── Banner + Cover header (same layout as AdminMangaEdit) ── */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden">
        {banner ? (
          <img
            src={banner}
            className="w-full h-full object-cover opacity-20"
            alt=""
            onError={(e: any) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-8 flex items-end gap-6 pb-6">
          {/* Cover */}
          <div className="relative w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-4 border-zinc-950 shadow-2xl bg-zinc-900 shrink-0">
            {cover ? (
              <img
                src={cover}
                className="w-full h-full object-cover"
                alt={joint.title}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Users size={32} />
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="flex-1 pb-4">
            <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {joint.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
                <Users size={12} /> Joint · {joint.manga?.title}
              </p>
              <span className="text-zinc-700">•</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isLeader ? 'bg-yellow-500/20 text-yellow-400'
                  : myMember?.role === 'UPLOADER' ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isLeader ? '★ Líder' : myMember?.role === 'UPLOADER' ? 'Uploader' : 'Viewer'}
              </span>
              <span className="text-zinc-700">•</span>
              <a
                href={`/joint/manga/${joint.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-cyan-500 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={12} /> Ver página pública
              </a>
              {isLeader && (
                <>
                  <span className="text-zinc-700">•</span>
                  <button
                    onClick={handleDissolve}
                    className="text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={12} /> Disolver joint
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Tab bar — same style as AdminMangaEdit */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit mb-10 flex-wrap">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'info' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Settings2 size={14} /> Información
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'members' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Users size={14} /> Miembros
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'chapters' ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <List size={14} /> Capítulos
          </button>
          {canUpload && (
            <button
              onClick={() => { resetChapterForm(); setActiveTab('upload'); }}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'upload' ? 'bg-cyan-500 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <UploadCloud size={14} /> {isEditingChapter ? 'Editar Capítulo' : 'Subir Capítulo'}
            </button>
          )}
        </div>

        {/* ── Info Tab ── */}
        {activeTab === 'info' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className={panelCls}>
                {/* Título */}
                <div className="space-y-3">
                  <label className={labelCls}>Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xl font-black italic tracking-tighter uppercase focus:border-cyan-500 transition-all outline-none"
                    placeholder="Título del joint"
                  />
                </div>

                {/* Descripción corta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Descripción corta (Opcional)</label>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${(formData.shortDescription?.length || 0) > 300 ? 'text-red-500' : 'text-zinc-600'}`}>
                      {formData.shortDescription?.length || 0}/300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.shortDescription}
                    onChange={e => {
                      if (e.target.value.length <= 300)
                        setFormData({ ...formData, shortDescription: e.target.value });
                    }}
                    className={inputCls + ' resize-none'}
                    placeholder="Breve descripción del joint..."
                  />
                </div>

                {/* Sinopsis */}
                <div className="space-y-3">
                  <label className={labelCls}>Sinopsis (Opcional)</label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={inputCls + ' resize-none'}
                    placeholder="Sinopsis completa..."
                  />
                </div>

                {/* Estado + Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className={labelCls}>Estado</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className={inputCls}
                    >
                      <option value="ongoing">En curso</option>
                      <option value="completed">Completado</option>
                      <option value="hiatus">Hiatus</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={labelCls}>Tipo de obra</label>
                    <select
                      value={formData.workType}
                      onChange={e => setFormData({ ...formData, workType: e.target.value })}
                      className={inputCls}
                    >
                      <option value="manga">Manga</option>
                      <option value="manhwa">Manhwa</option>
                      <option value="manhua">Manhua</option>
                      <option value="novel">Novel</option>
                      <option value="doujin">Doujin</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo || !canEditJoint}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-8 rounded-xl text-sm disabled:opacity-50 transition-colors uppercase tracking-widest"
                >
                  {savingInfo ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {!canEditJoint && (
                  <p className="text-zinc-600 text-xs">Solo el líder o miembros con permisos pueden editar.</p>
                )}
              </div>
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-4 space-y-6">
              <div className={panelCls.replace('space-y-6', 'space-y-4')}>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Manga base</h3>
                <p className="text-white font-bold">{joint.manga?.title || '—'}</p>
                <p className="text-zinc-500 text-xs font-mono">{joint.slug}</p>
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-zinc-600 text-xs">{joint.chapters?.length || 0} capítulos publicados</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <div className="space-y-6 max-w-3xl">
            {/* Invite form */}
            {canInvite && (
              <div className={panelCls}>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={12} /> Invitar scan
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inviteSlug}
                    onChange={e => setInviteSlug(e.target.value)}
                    placeholder="Slug del scan (ej: senshimanga)"
                    className={inputCls + ' flex-1 py-3'}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'UPLOADER' | 'VIEWER')}
                    className={inputCls + ' w-auto py-3'}
                  >
                    <option value="UPLOADER">Uploader</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteSlug.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-6 rounded-xl text-sm disabled:opacity-50 uppercase tracking-widest whitespace-nowrap"
                  >
                    {inviting ? '...' : 'Invitar'}
                  </button>
                </div>
              </div>
            )}

            {/* Members list — same table style as chapters */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-zinc-800">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Miembros del Joint</h3>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">
                  {joint.members?.length || 0} escáneres
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scan</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-28">Rol</th>
                      <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-28">Estado</th>
                      {isLeader && <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-32">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {(joint.members || []).map((m: any) => (
                      <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {m.organization.logoUrl ? (
                              <img
                                src={m.organization.logoUrl}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800" />
                            )}
                            <div>
                              <p className="text-white font-bold text-sm">{m.organization.name}</p>
                              <p className="text-zinc-500 text-xs">{m.organization.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            m.role === 'LEADER' ? 'bg-yellow-500/20 text-yellow-400'
                              : m.role === 'UPLOADER' ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {m.role === 'LEADER' ? '★ Líder' : m.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            m.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400'
                              : m.status === 'INVITED' ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {m.status === 'ACCEPTED' ? 'Activo' : m.status === 'INVITED' ? 'Invitado' : 'Expulsado'}
                          </span>
                        </td>
                        {isLeader && (
                          <td className="px-8 py-5 text-right">
                            {m.organization.id !== organization.id && m.role !== 'LEADER' && m.status === 'ACCEPTED' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleTransfer(m.organization.slug)}
                                  title="Transferir liderazgo"
                                  className="p-2 bg-zinc-950 text-zinc-500 hover:text-yellow-400 border border-zinc-800 rounded-lg transition-all"
                                >
                                  <ArrowRight size={14} />
                                </button>
                                <button
                                  onClick={() => handleExpel(m.organization.slug)}
                                  title="Expulsar"
                                  className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Chapters Tab (same table layout as AdminMangaEdit) ── */}
        {activeTab === 'chapters' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Índice de Capítulos</h3>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">
                    {joint.chapters?.length || 0} Episodios Publicados
                  </span>
                </div>
                {canUpload && (
                  <button
                    onClick={() => { resetChapterForm(); setActiveTab('upload'); }}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black py-2 px-5 rounded-xl text-[10px] uppercase tracking-widest transition-colors"
                  >
                    <Plus size={14} /> Subir capítulo
                  </button>
                )}
              </div>

              {!joint.chapters || joint.chapters.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <p className="text-sm font-bold uppercase">No hay capítulos publicados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 border-b border-zinc-800">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-32">Miniatura</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-20">N°</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scans</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-36">Fecha</th>
                        <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {[...joint.chapters].sort((a: any, b: any) => b.number - a.number).map((ch: any) => {
                        const isMine = ch.uploadedByOrganization?.id === organization.id;
                        const canDelete = isMine || canEditJoint;
                        return (
                          <tr key={ch.id} className="hover:bg-zinc-800/20 transition-colors group">
                            <td className="px-8 py-6">
                              {ch.imageUrl ? (
                                <img
                                  src={ch.imageUrl}
                                  alt={`Cap. ${ch.number}`}
                                  className="max-w-24 max-h-36 object-cover rounded-lg"
                                  decoding="async"
                                  loading="lazy"
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-24 h-36 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs text-center px-2">
                                  Sin miniatura
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 text-cyan-500 font-black italic">#{ch.number}</td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {ch.title || `Capítulo ${ch.number}`}
                              </p>
                              {ch.isUnreleased && (
                                <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Acceso anticipado</span>
                              )}
                              {isMine && (
                                <span className="block text-[9px] font-bold text-cyan-500 uppercase tracking-widest">Tuyo</span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex gap-1">
                                {(ch.workedByOrganizations || []).map((org: any) => (
                                  <img
                                    key={org.id}
                                    src={org.logoUrl || ''}
                                    alt={org.name}
                                    title={org.name}
                                    className="w-6 h-6 rounded-full object-cover bg-zinc-800"
                                    onError={(e: any) => { e.target.style.display = 'none'; }}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-zinc-500">
                              {ch.releasedAt ? new Date(ch.releasedAt).toLocaleDateString('es') : '—'}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(isMine || canEditJoint) && (
                                  <button
                                    onClick={() => handleEditChapter(ch)}
                                    className="p-2 bg-zinc-950 text-zinc-500 hover:text-cyan-400 border border-zinc-800 rounded-lg transition-all"
                                    title="Editar"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteChapter(ch.number)}
                                    className="p-2 bg-zinc-950 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-all"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Upload / Edit Chapter Tab ── */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                <Plus size={20} />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {isEditingChapter ? 'Editar' : 'Subir'} capítulo de <span className="text-cyan-500">{joint.title}</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Form */}
              <div className="lg:col-span-8 space-y-8">
                {/* Chapter metadata */}
                <div className={panelCls}>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-4">
                    Datos del capítulo
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className={labelCls}>Número *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={chapterForm.number}
                        onChange={e => setChapterForm(prev => ({ ...prev, number: e.target.value }))}
                        disabled={isEditingChapter}
                        placeholder="1, 1.5, 100..."
                        className={inputCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className={labelCls}>Título (opcional)</label>
                      <input
                        type="text"
                        value={chapterForm.title}
                        onChange={e => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título del capítulo"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className={labelCls}>Fecha de publicación</label>
                      <input
                        type="datetime-local"
                        value={chapterForm.releasedAt}
                        disabled={chapterForm.isUnreleased}
                        onChange={e => setChapterForm(prev => ({ ...prev, releasedAt: e.target.value }))}
                        className={inputCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className={labelCls}>Acceso anticipado</label>
                      <label className="flex items-center gap-3 pt-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chapterForm.isUnreleased}
                          onChange={e => setChapterForm(prev => ({ ...prev, isUnreleased: e.target.checked }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-950"
                        />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          No publicado aún
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Worked by */}
                  <div className="space-y-3">
                    <label className={labelCls}>Trabajado por</label>
                    <div className="flex flex-wrap gap-2">
                      {acceptedMembers.map((m: any) => (
                        <button
                          key={m.organization.id}
                          type="button"
                          onClick={() => toggleWorkedBy(m.organization.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                            workedByIds.includes(m.organization.id)
                              ? 'bg-cyan-500 text-black'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {m.organization.logoUrl && (
                            <img src={m.organization.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                          )}
                          {m.organization.name}
                          {workedByIds.includes(m.organization.id) && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pages */}
                <div className={panelCls}>
                  <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      Páginas (una URL por línea)
                    </h3>
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      {pagesText.split('\n').filter((l: string) => l.trim()).length} páginas
                    </span>
                  </div>
                  <textarea
                    value={pagesText}
                    onChange={e => setPagesText(e.target.value)}
                    rows={10}
                    placeholder={'https://cdn.example.com/page1.jpg\nhttps://cdn.example.com/page2.jpg\n...'}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs font-mono leading-relaxed focus:border-cyan-500 transition-all outline-none resize-none"
                  />
                  {isEditingChapter && (
                    <p className="text-zinc-600 text-xs">Deja vacío para mantener las páginas actuales.</p>
                  )}
                </div>
              </div>

              {/* Sidebar actions */}
              <div className="lg:col-span-4 space-y-6">
                <div className={panelCls.replace('space-y-6', 'space-y-4')}>
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Publicar</h3>
                  <button
                    onClick={handleSaveChapter}
                    disabled={savingChapter || !chapterForm.number}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 px-6 rounded-xl text-sm disabled:opacity-50 transition-colors uppercase tracking-widest"
                  >
                    {savingChapter ? 'Guardando...' : isEditingChapter ? 'Guardar cambios' : 'Publicar capítulo'}
                  </button>
                  <button
                    onClick={() => { resetChapterForm(); setActiveTab('chapters'); }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `}} />
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
};

export default AdminJointDetail;
