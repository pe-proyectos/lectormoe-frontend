import React from 'react';
import { Eye, Edit, BookOpen } from 'lucide-react';
import Button from './ui/Button';

interface AdminMangaCustomCardProps {
  language?: string;
  mangaCustom: {
    slug: string;
    title: string;
    shortDescription?: string;
    imageUrl?: string;
    views: number;
  };
  onClick: (mangaCustom: any) => void;
  organizationSlug: string;
}

const AdminMangaCustomCard: React.FC<AdminMangaCustomCardProps> = ({
  mangaCustom,
  onClick,
  organizationSlug,
}) => {
  return (
    <div className="group bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
      {/* Image */}
      <div className="relative h-72 overflow-hidden bg-zinc-800">
        {mangaCustom.imageUrl ? (
          <img
            src={mangaCustom.imageUrl}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            alt={mangaCustom.title || 'Sin título'}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold text-sm">
            Sin Imagen
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-black text-white line-clamp-2 leading-tight uppercase tracking-tight">
          {mangaCustom.title || 'Sin título'}
        </h3>

        {/* Description */}
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {!mangaCustom.shortDescription && 'Sin descripción'}
          {mangaCustom.shortDescription &&
            (mangaCustom.shortDescription.length > 80
              ? mangaCustom.shortDescription.substring(0, 80) + '...'
              : mangaCustom.shortDescription)}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          {/* Views */}
          <div className="flex items-center gap-2 text-zinc-400">
            <Eye size={16} />
            <span className="text-sm font-bold">{mangaCustom.views.toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a href={`/${organizationSlug}/admin/mangas/${mangaCustom.slug}`}>
              <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group/btn">
                <BookOpen size={16} className="text-zinc-400 group-hover/btn:text-cyan-500 transition-colors" />
              </button>
            </a>
            <button
              onClick={() => onClick(mangaCustom)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group/btn"
            >
              <Edit size={16} className="text-zinc-400 group-hover/btn:text-cyan-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMangaCustomCard;

