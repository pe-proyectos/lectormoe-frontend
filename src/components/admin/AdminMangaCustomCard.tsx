import React from 'react';
import { Eye, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';

interface AdminMangaCustomCardProps {
  language?: string;
  mangaCustom: {
    slug: string;
    title: string;
    shortDescription?: string;
    imageUrl?: string;
    views: number;
    requireLogin?: boolean;
  };
  onClick: (mangaCustom: any) => void;
  organizationSlug: string;
  // 'writing' routes the card to /admin/writings/[slug] so the whole writings
  // surface stays under its own URL hierarchy.
  contentKind?: 'manga' | 'writing';
}

const AdminMangaCustomCard: React.FC<AdminMangaCustomCardProps> = ({
  mangaCustom,
  onClick,
  organizationSlug,
  contentKind = 'manga',
}) => {
  // Función helper para obtener el slug del manga (puede estar en diferentes lugares)
  const getMangaSlug = (manga: any): string | undefined => {
    return manga?.slug || manga?.manga?.slug || manga?.mangaSlug;
  };

  const mangaSlug = getMangaSlug(mangaCustom);
  const adminSection = contentKind === 'writing' ? 'writings' : 'mangas';
  const mangaUrl = mangaSlug
    ? `/${organizationSlug}/admin/${adminSection}/${mangaSlug}`
    : '#';

  return (
    <div className="group bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
      {/* Image */}
      <a href={mangaUrl} className="block">
        <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden bg-zinc-800">
          {mangaCustom.imageUrl ? (
            <img
              src={mangaCustom.imageUrl}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              alt={mangaCustom.title || 'Sin título'}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold text-xs sm:text-sm">
              Sin Imagen
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        </div>
      </a>

      {/* Content */}
      <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
        {/* Title */}
        <a href={mangaUrl} className="block hover:text-cyan-400 transition-colors">
          <h3 className="text-sm sm:text-base md:text-lg font-black text-white line-clamp-2 leading-tight uppercase tracking-tight">
            {mangaCustom.title || 'Sin título'}
          </h3>
        </a>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {!mangaCustom.shortDescription && 'Sin descripción'}
          {mangaCustom.shortDescription &&
            (mangaCustom.shortDescription.length > 80
              ? mangaCustom.shortDescription.substring(0, 80) + '...'
              : mangaCustom.shortDescription)}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-zinc-800">
          {/* Views */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400">
            <Eye size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-bold">{mangaCustom.views.toLocaleString()}</span>
          </div>

          {/* Lock Status */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (mangaCustom.requireLogin) {
                  toast.info('Este manga requiere inicio de sesión para ser leído', {
                    position: 'bottom-right',
                    autoClose: 3000,
                  });
                } else {
                  toast.info('Este manga es de acceso público, no requiere inicio de sesión', {
                    position: 'bottom-right',
                    autoClose: 3000,
                  });
                }
              }}
              className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition-colors group/btn"
              title={mangaCustom.requireLogin ? 'Requiere inicio de sesión' : 'Acceso público'}
            >
              {mangaCustom.requireLogin ? (
                <Lock size={14} className="sm:w-4 sm:h-4 text-yellow-500 group-hover/btn:text-yellow-400 transition-colors" />
              ) : (
                <Unlock size={14} className="sm:w-4 sm:h-4 text-zinc-400 group-hover/btn:text-cyan-500 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMangaCustomCard;

