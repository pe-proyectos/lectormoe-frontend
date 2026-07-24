import React, { useEffect, useState } from 'react';
import { callAPI } from '../../util/callApi';
import { BookOpen } from 'lucide-react';

interface ContinueReadingEntry {
  type: 'mangaCustom' | 'joint';
  title: string;
  imageUrl: string | null;
  nextChapterNumber: number;
  orgSlug?: string;
  mangaSlug?: string;
  jointSlug?: string;
}

const ContinueReading: React.FC = () => {
  const [entries, setEntries] = useState<ContinueReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAPI('/api/user/continue-reading')
      .then((data: ContinueReadingEntry[]) => {
        setEntries(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || entries.length === 0) return null;

  const getUrl = (entry: ContinueReadingEntry) => {
    if (entry.type === 'joint') {
      return `/joint/manga/${entry.jointSlug}/chapters/${entry.nextChapterNumber}`;
    }
    return `/${entry.orgSlug}/manga/${entry.mangaSlug}/chapters/${entry.nextChapterNumber}`;
  };

  return (
    <section className="max-w-[1600px] mx-auto px-3 md:px-8 pt-8 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} className="text-cyan-400" />
        <span className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-[10px]">
          Lectura Rápida
        </span>
      </div>
      <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
        Continuar leyendo
      </h2>
      <div className="hscroll flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {entries.map((entry, i) => (
          <a
            key={i}
            href={getUrl(entry)}
            className="flex-shrink-0 flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl px-3 py-2.5 transition-all group min-w-[200px] max-w-[260px]"
          >
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt={entry.title}
                className="w-9 h-14 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-14 bg-zinc-800 rounded-md flex-shrink-0 flex items-center justify-center">
                <BookOpen size={16} className="text-zinc-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{entry.title}</p>
              <p className="text-cyan-400 text-xs font-bold mt-1 group-hover:text-cyan-300 transition-colors">
                Cap. {entry.nextChapterNumber} →
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default ContinueReading;
