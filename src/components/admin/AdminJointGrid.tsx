import React, { useEffect, useState, useMemo } from 'react';
import { callAPI } from '@/util/callApi';
import { Users, Plus, Clock, Search, X, Check } from 'lucide-react';

interface AdminJointGridProps {
  organization: any;
  organizationSlug: string;
  user?: any;
  token?: string;
}

const AdminJointGrid: React.FC<AdminJointGridProps> = ({ organization, organizationSlug }) => {
  const [joints, setJoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manga picker state
  const [mangaCatalog, setMangaCatalog] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedManga, setSelectedManga] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await callAPI('/api/joint');
      if (Array.isArray(result)) setJoints(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateForm = async () => {
    setShowCreateForm(true);
    setSelectedManga(null);
    setSearch('');
    if (mangaCatalog.length === 0) {
      setLoadingCatalog(true);
      try {
        const result = await callAPI('/api/manga/autocomplete');
        if (Array.isArray(result)) setMangaCatalog(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setSelectedManga(null);
    setSearch('');
  };

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return mangaCatalog.slice(0, 20);
    const q = search.toLowerCase();
    return mangaCatalog
      .filter(m => m.title.toLowerCase().includes(q) || m.slug.includes(q))
      .slice(0, 20);
  }, [mangaCatalog, search]);

  const handleCreate = async () => {
    if (!selectedManga) return;
    setCreating(true);
    try {
      await callAPI('/api/joint', {
        method: 'POST',
        body: JSON.stringify({ mangaSlug: selectedManga.slug }),
      });
      closeCreateForm();
      load();
    } catch (e: any) {
      alert(e?.message || 'Error al crear el joint');
    } finally {
      setCreating(false);
    }
  };

  const handleRespond = async (jointSlug: string, accept: boolean) => {
    if (accept) {
      const ok = window.confirm(
        'Si tu scan ya tiene capítulos de este manga, al aceptar serán visibles desde el joint sin moverse de tu espacio.\n\n¿Aceptar la invitación?',
      );
      if (!ok) return;
    }
    try {
      await callAPI(`/api/joint/${jointSlug}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ accept }),
      });
      load();
    } catch (e: any) {
      alert(e?.message || 'Error al responder la invitación');
    }
  };

  if (loading) return <div className="text-zinc-400">Cargando joints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Users size={24} /> Joints
        </h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Crear Joint
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">Crear nuevo joint</h3>
            <button onClick={closeCreateForm} className="text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <p className="text-zinc-400 text-sm">
            Busca y selecciona el manga base del joint. El slug se genera automáticamente.
          </p>

          {/* Selected manga preview */}
          {selectedManga && (
            <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3">
              {selectedManga.imageUrl && (
                <img
                  src={selectedManga.imageUrl}
                  alt={selectedManga.title}
                  className="w-10 h-14 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{selectedManga.title}</p>
                <p className="text-zinc-400 text-xs font-mono">{selectedManga.slug}</p>
              </div>
              <Check size={18} className="text-cyan-400 shrink-0" />
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar manga por título..."
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm outline-none focus:border-cyan-500"
            />
          </div>

          {/* Manga list */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {loadingCatalog ? (
              <p className="text-zinc-500 text-sm text-center py-4">Cargando catálogo...</p>
            ) : filteredCatalog.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">Sin resultados</p>
            ) : (
              filteredCatalog.map(manga => {
                const isSelected = selectedManga?.slug === manga.slug;
                return (
                  <button
                    key={manga.id}
                    type="button"
                    onClick={() => setSelectedManga(isSelected ? null : manga)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-500/40'
                        : 'hover:bg-zinc-800 border border-transparent'
                    }`}
                  >
                    {manga.imageUrl ? (
                      <img
                        src={manga.imageUrl}
                        alt={manga.title}
                        className="w-8 h-11 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-zinc-700 rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{manga.title}</p>
                      <p className="text-zinc-500 text-xs font-mono truncate">{manga.slug}</p>
                    </div>
                    {isSelected && <Check size={14} className="text-cyan-400 shrink-0 ml-auto" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={!selectedManga || creating}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creando...' : 'Crear joint'}
            </button>
            <button
              onClick={closeCreateForm}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {joints.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold">No tienes joints activos</p>
          <p className="text-sm mt-1">Crea uno o espera ser invitado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {joints.map((item: any) => {
            const joint = item.joint;
            const myStatus = item.status;
            const myRole = item.role;
            const cover = joint.imageUrl || joint.manga?.imageUrl;

            return (
              <div key={joint.id} className="group bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-cyan-500/40 transition-all duration-300">
                {/* Cover image — portrait format */}
                <div className="relative overflow-hidden bg-zinc-800" style={{ aspectRatio: '2/3' }}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={joint.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Users size={28} className="text-zinc-600" />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    {myStatus === 'INVITED' && (
                      <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Clock size={8} /> Invitado
                      </span>
                    )}
                    {myStatus === 'ACCEPTED' && myRole === 'LEADER' && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        ★ Líder
                      </span>
                    )}
                  </div>
                  {/* Member orgs */}
                  <div className="absolute bottom-2 left-2 flex -space-x-1">
                    {(joint.members || []).slice(0, 4).map((m: any) => (
                      <div key={m.organization.id} title={m.organization.name} className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700 border border-zinc-900">
                        {m.organization.logoUrl && (
                          <img src={m.organization.logoUrl} alt="" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-2">
                  <h3 className="text-white font-bold text-xs leading-snug line-clamp-2">{joint.title}</h3>
                  {myStatus === 'INVITED' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRespond(joint.slug, true)}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-1.5 rounded-lg text-[10px]"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleRespond(joint.slug, false)}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold py-1.5 rounded-lg text-[10px]"
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <a
                      href={`/${organizationSlug}/admin/joints/${joint.slug}`}
                      className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-1.5 rounded-lg text-[10px] transition-colors"
                    >
                      Gestionar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminJointGrid;
