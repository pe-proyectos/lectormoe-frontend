import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface JointMangaDetailPageProps {
  joint: any;
  user?: any;
  logged?: boolean;
}

const JointMangaDetailPage: React.FC<JointMangaDetailPageProps> = ({ joint, user, logged }) => {
  const [addedToFavorites, setAddedToFavorites] = useState(false);

  const activeMembers = joint.members?.filter((m: any) => m.status === 'ACCEPTED') || [];
  const chapters = joint.chapters || [];

  const handleAddToFavorites = async () => {
    alert('Favoritos para joints próximamente');
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
            {/* Joint badge */}
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Users size={12} />
                Joint
              </span>
            </div>

            <h1 className="text-3xl font-black text-white">{joint.title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{joint.shortDescription || joint.description}</p>

            {/* Participating scans logos */}
            <div className="space-y-2">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Scans participantes</p>
              <div className="flex flex-wrap gap-3">
                {activeMembers.map((m: any) => (
                  <a
                    key={m.organization.id}
                    href={`/${m.organization.slug}`}
                    className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl px-3 py-2 transition-colors"
                  >
                    {m.organization.logoUrl ? (
                      <img src={m.organization.logoUrl} alt={m.organization.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                        {m.organization.name[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-300">{m.organization.name}</span>
                    {m.role === 'LEADER' && (
                      <span className="text-xs text-yellow-400">★</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Add to favorites */}
            <button
              onClick={handleAddToFavorites}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-2xl transition-colors text-sm"
            >
              AÑADIR A FAVORITOS
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
