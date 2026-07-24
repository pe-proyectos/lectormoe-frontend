import React, { useState, useEffect } from 'react';
import { BookOpen, Medal, TrendingUp } from 'lucide-react';

interface TopReader {
  id: number;
  username: string;
  slug: string;
  imageUrl: string | null;
  chaptersRead: number;
}

const TopReaders: React.FC = () => {
  const [readers, setReaders] = useState<TopReader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopReaders = async () => {
      try {
        const API_URL = import.meta.env['PUBLIC_API_URL'];
        const response = await fetch(`${API_URL}/api/landing/top-readers`);
        const result = await response.json();

        if (result?.status === true && result?.data) {
          setReaders(result.data);
        }
      } catch (error) {
        console.error('Error fetching global top readers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopReaders();
  }, []);

  if (!loading && readers.length === 0) return null;

  const getRankStyle = (index: number) => {
    if (index === 0) return {
      border: 'border-yellow-500/40',
      bg: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5',
      rank: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      glow: 'shadow-yellow-500/10',
    };
    if (index === 1) return {
      border: 'border-zinc-400/30',
      bg: 'bg-gradient-to-br from-zinc-400/10 to-zinc-500/5',
      rank: 'text-zinc-300 bg-zinc-400/20 border-zinc-400/30',
      glow: 'shadow-zinc-400/10',
    };
    if (index === 2) return {
      border: 'border-amber-600/30',
      bg: 'bg-gradient-to-br from-amber-600/10 to-amber-700/5',
      rank: 'text-amber-500 bg-amber-600/20 border-amber-600/30',
      glow: 'shadow-amber-600/10',
    };
    return {
      border: 'border-zinc-800/50',
      bg: 'bg-zinc-950/40',
      rank: 'text-zinc-500 bg-zinc-800/50 border-zinc-700/30',
      glow: '',
    };
  };

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            <TrendingUp size={12} /> Los Mas Activos
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Top Lectores de la Semana</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-zinc-800 rounded-full" />
                <div className="h-3 bg-zinc-800 rounded w-20" />
                <div className="h-2 bg-zinc-800 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {readers.map((reader, index) => {
            const style = getRankStyle(index);
            return (
              <a
                key={reader.id}
                href={`/profile/${reader.slug}`}
                className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.border} ${style.bg} ${style.glow}`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`absolute top-3 left-3 w-7 h-7 rounded-full border flex items-center justify-center font-black text-[10px] ${style.rank}`}>
                    {index < 3 ? <Medal size={13} fill="currentColor" /> : index + 1}
                  </div>

                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 font-black text-lg group-hover:border-cyan-500/50 transition-colors">
                    {reader.imageUrl ? (
                      <img
                        src={reader.imageUrl}
                        alt={reader.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      reader.username[0].toUpperCase()
                    )}
                  </div>

                  <div className="text-center min-w-0 w-full">
                    <p className="text-white font-bold text-sm leading-none mb-1 truncate">{reader.username}</p>
                    <div className="flex items-center justify-center gap-1 text-cyan-500">
                      <BookOpen size={10} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {reader.chaptersRead} caps
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default TopReaders;
