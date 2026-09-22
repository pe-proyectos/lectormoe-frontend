import type React from 'react';
import { useState } from 'react';

export interface JointMember {
  slug: string;
  name: string;
  title?: string | null;
  logoUrl?: string | null;
  isLeader?: boolean;
}

interface Props {
  members: JointMember[];
  /** Nombre a mostrar si no se puede determinar el líder. */
  fallback?: string;
  className?: string;
}

/**
 * Crédito de una obra hecha en colaboración.
 *
 * Un joint puede tener muchos participantes y no caben en la tarjeta, así que
 * se acredita al líder y el resto se resume en un "+N" que despliega la lista
 * completa al pasar el ratón (o al tocar, en móvil).
 */
const JointCredit: React.FC<Props> = ({ members, fallback, className = '' }) => {
  const [abierto, setAbierto] = useState(false);
  if (!members || members.length === 0) {
    return <span className={className}>{fallback || ''}</span>;
  }

  const lider = members.find((m) => m.isLeader) || members[0];
  const resto = members.filter((m) => m.slug !== lider.slug);

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 min-w-0 ${className}`}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <span
        aria-label="Obra en colaboración"
        title="Obra en colaboración entre scans"
        className="shrink-0 inline-flex items-center justify-center w-[13px] h-[13px] rounded-[3px] bg-purple-600 text-white text-[9px] font-black leading-none"
      >
        J
      </span>
      <span className="truncate">{lider.name || lider.title || fallback}</span>
      {resto.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAbierto((v) => !v);
          }}
          className="shrink-0 px-1 rounded bg-zinc-800 text-zinc-300 hover:bg-purple-600 hover:text-white transition-colors"
        >
          +{resto.length}
        </button>
      )}

      {abierto && resto.length > 0 && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 mb-1.5 z-50 min-w-[160px] max-w-[240px] p-2 rounded-lg bg-zinc-950 border border-zinc-700 shadow-xl normal-case tracking-normal"
        >
          <span className="block text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">
            Colaboración
          </span>
          {members.map((m) => (
            <span key={m.slug} className="flex items-center gap-1.5 py-0.5 text-[11px] text-zinc-200 font-semibold">
              {m.logoUrl ? (
                <img src={m.logoUrl} alt="" width={14} height={14} className="w-3.5 h-3.5 rounded object-cover shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded bg-zinc-800 shrink-0" />
              )}
              <span className="truncate">{m.name || m.title}</span>
              {m.isLeader && <span className="text-[8px] text-purple-400 font-black uppercase shrink-0">líder</span>}
            </span>
          ))}
        </span>
      )}
    </span>
  );
};

export default JointCredit;
