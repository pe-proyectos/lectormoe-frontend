import React from 'react';

// Selector de géneros agrupado por categoría (estilo MangaDex). Chips clicables
// por Formato / Género / Temática / Contenido. Los +18 (nsfw) se marcan y solo
// se muestran si showNsfw es true.

export interface GenreOption {
  id: number;
  name: string;
  category?: string | null;
  nsfw?: boolean;
  description?: string;
}

const CATEGORY_ORDER = ['FORMAT', 'GENRE', 'THEME', 'CONTENT'] as const;
const CATEGORY_LABEL: Record<string, string> = {
  FORMAT: 'Formato',
  GENRE: 'Género',
  THEME: 'Temática',
  CONTENT: 'Contenido'
};

interface Props {
  options: GenreOption[];
  value: GenreOption[];
  onChange: (next: GenreOption[]) => void;
  showNsfw?: boolean;
}

const GenreCategoryPicker: React.FC<Props> = ({ options, value, onChange, showNsfw = true }) => {
  const selectedIds = new Set(value.map((v) => v.id));

  const toggle = (g: GenreOption) => {
    if (selectedIds.has(g.id)) onChange(value.filter((v) => v.id !== g.id));
    else onChange([...value, g]);
  };

  const visible = options.filter((g) => showNsfw || !g.nsfw);
  const byCat: Record<string, GenreOption[]> = {};
  for (const g of visible) {
    const c = g.category && (CATEGORY_ORDER as readonly string[]).includes(g.category) ? g.category : 'GENRE';
    (byCat[c] = byCat[c] || []).push(g);
  }

  if (visible.length === 0) {
    return <p className="text-xs text-zinc-500">No hay géneros disponibles.</p>;
  }

  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.filter((c) => byCat[c]?.length).map((cat) => (
        <div key={cat}>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            {CATEGORY_LABEL[cat]}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {byCat[cat]
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((g) => {
                const on = selectedIds.has(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggle(g)}
                    title={g.description || ''}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      on
                        ? 'bg-cyan-500 text-zinc-950 border-cyan-500'
                        : 'bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    } ${g.nsfw && !on ? 'border-pink-500/40 text-pink-300' : ''}`}
                  >
                    {g.name}
                    {g.nsfw ? ' 🔞' : ''}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GenreCategoryPicker;
