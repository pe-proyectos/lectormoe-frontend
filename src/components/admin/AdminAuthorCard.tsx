import React from 'react';

interface AdminAuthorCardProps {
  language?: string;
  name: string;
  imageUrl?: string;
  shortDescription?: string;
}

const AdminAuthorCard: React.FC<AdminAuthorCardProps> = ({
  name,
  imageUrl,
  shortDescription,
}) => {
  return (
    <div className="group bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300">
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            alt={name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold text-sm">
            Sin Imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-black text-white uppercase tracking-tight">
          {name || 'Sin nombre'}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-2">
          {shortDescription || 'Sin descripción'}
        </p>
      </div>
    </div>
  );
};

export default AdminAuthorCard;

