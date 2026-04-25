import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface JointMangaDetailPageProps {
  joint: any;
  user?: any;
  logged?: boolean;
}

const JointMangaDetailPage: React.FC<JointMangaDetailPageProps> = ({ joint, user, logged }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const activeMembers = joint.members?.filter((m: any) => m.status === 'ACCEPTED') || [];
  const chapters = joint.chapters || [];

  useEffect(() => {
    if (!logged) return;
    callAPI(`/api/joint/${joint.slug}/favorite`)
      .then((res: any) => { if (res?.data === true) setIsFavorite(true); })
      .catch(() => {});
  }, [logged, joint.slug]);

  const handleToggleFavorite = async () => {
    if (!logged) {
      window.location.href = '/login';
      return;
    }
    setLoadingFav(true);
    try {
      if (isFavorite) {
        await callAPI(`/api/joint/${joint.slug}/favorite`, { method: 'DELETE' });
        setIsFavorite(false);
      } else {
        await callAPI(`/api/joint/${joint.slug}/favorite`, { method: 'POST' });
        setIsFavorite(true);
      }
    } catch (e: any) {
      alert(e?.message || 'Error al actualizar favoritos');
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={joint.bannerUrl || joint.imageUrl || 'https://via.placeholder.com/1200x400'}
          alt={joint.title}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <img
              src={joint.imageUrl || 'https://via.placeholder.com/300x420'}
              alt={joint.title}
              className="w-48 h-72 object-cover rounded-2xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 pt-32 md:pt-0">
            {/* Joint participants — circular logos only, each clickable. Leader gets a small ★. */}
            <div className="flex flex-wrap items-center gap-2">
              {activeMembers.map((m: any) => (
                <a
                  key={m.organization.id}
                  href={`/${m.organization.slug}`}
                  title={`${m.organization.name}${m.role === 'LEADER' ? ' (líder)' : ''}`}
                  aria-label={m.organization.name}
                  className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-zinc-800 hover:ring-cyan-500 transition-all hover:-translate-y-0.5"
                >
                  {m.organization.logoUrl || m.organization.imageUrl ? (
                    <img
                      src={m.organization.logoUrl || m.organization.imageUrl}
                      alt={m.organization.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-sm font-black">
                      {m.organization.name[0]}
                    </div>
                  )}
                  {m.role === 'LEADER' && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-yellow-400 text-zinc-950 text-[8px] font-black flex items-center justify-center shadow"
                    >
                      ★
                    </span>
                  )}
                </a>
              ))}
            </div>

            <h1 className="text-3xl font-black text-white">{joint.title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{joint.shortDescription || joint.description}</p>

            {/* Add to favorites */}
            <button
              onClick={handleToggleFavorite}
              disabled={loadingFav}
              className={`flex items-center gap-2 font-bold py-3 px-6 rounded-2xl transition-colors text-sm ${
                isFavorite
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              } disabled:opacity-50`}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? 'EN FAVORITOS' : 'AÑADIR A FAVORITOS'}
            </button>
          </div>
        </div>

        {/* Chapters list */}
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Capítulos</h2>
          {chapters.length === 0 ? (
            <p className="text-zinc-500">No hay capítulos aún.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch: any) => (
                <a
                  key={ch.id}
                  href={`/joint/manga/${joint.slug}/chapters/${ch.number}`}
                  className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">Cap. {ch.number}</span>
                    {ch.title && <span className="text-zinc-400 text-sm">{ch.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Worked-by org logos */}
                    {(ch.workedByOrganizations || []).map((org: any) => (
                      <img
                        key={org.id}
                        src={org.logoUrl || ''}
                        alt={org.name}
                        title={org.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                    <span className="text-zinc-500 text-xs">
                      {ch.releasedAt ? new Date(ch.releasedAt).toLocaleDateString('es') : 'Sin fecha'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JointMangaDetailPage;
