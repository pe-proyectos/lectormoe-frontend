import React, { useEffect, useRef, useState } from 'react';
import { callAPI } from '../util/callApi';

interface ChapterReactionsProps {
  chapterId: number;
  logged?: boolean;
}

const EMOJIS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Me gusta' },
  { emoji: '❤️', label: 'Me encanta' },
  { emoji: '🔥', label: 'Increíble' },
  { emoji: '😂', label: 'Divertido' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😮', label: 'Sorprendente' },
];

const ChapterReactions: React.FC<ChapterReactionsProps> = ({ chapterId, logged }) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Carga perezosa: solo cuando la barra entra al viewport.
  useEffect(() => {
    if (!chapterId || !rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loaded) {
        io.disconnect();
        callAPI(`/api/chapter/${chapterId}/reactions`)
          .then((data: any) => {
            const map: Record<string, number> = {};
            (data?.counts || []).forEach((c: any) => { map[c.emoji] = c.count; });
            setCounts(map);
            setMyReaction(data?.myReaction ?? null);
            setLoaded(true);
          })
          .catch(() => setLoaded(true));
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [chapterId, loaded]);

  const react = async (emoji: string) => {
    if (!logged) { window.location.href = '/login'; return; }
    if (busy) return;
    setBusy(true);
    const prevReaction = myReaction;
    const prevCounts = { ...counts };
    // Optimistic
    const next = { ...counts };
    if (prevReaction === emoji) {
      next[emoji] = Math.max(0, (next[emoji] || 1) - 1);
      setMyReaction(null);
    } else {
      if (prevReaction) next[prevReaction] = Math.max(0, (next[prevReaction] || 1) - 1);
      next[emoji] = (next[emoji] || 0) + 1;
      setMyReaction(emoji);
    }
    setCounts(next);
    try {
      if (prevReaction === emoji) {
        await callAPI(`/api/chapter/${chapterId}/reaction`, { method: 'DELETE' });
      } else {
        await callAPI(`/api/chapter/${chapterId}/reaction`, { method: 'PUT', body: JSON.stringify({ emoji }) });
      }
    } catch {
      setCounts(prevCounts);
      setMyReaction(prevReaction);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="flex items-center gap-2 flex-wrap justify-center py-6">
      {EMOJIS.map(({ emoji, label }) => {
        const count = counts[emoji] || 0;
        const active = myReaction === emoji;
        return (
          <button
            key={emoji}
            onClick={() => react(emoji)}
            disabled={busy}
            title={label}
            aria-pressed={active}
            aria-label={label}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all min-h-[40px] active:scale-95 ${
              active ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-cyan-500/50'
            }`}
          >
            <span className="text-lg leading-none">{emoji}</span>
            {count > 0 && <span className="text-xs font-bold text-zinc-300 tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ChapterReactions;
