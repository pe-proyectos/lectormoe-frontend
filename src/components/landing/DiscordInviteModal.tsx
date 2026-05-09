import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Trophy, Plane, Rocket, Castle, Factory, Mic, Globe, Clock } from 'lucide-react';

// v4 — Capibara Aeronautics SMP launch. Previous dismissers should see this.
const STORAGE_KEY = 'discord-invite-modal-v4';
const DISCORD_INVITE = 'https://capibaratraductor.com/discord';
const SNOOZE_MS = 60 * 60 * 1000; // 1 hour

// 2026-05-31 23:59:00 local time
const DEADLINE = new Date(2026, 4, 31, 23, 59, 0);

const shouldShow = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    if (raw === 'forever') return false;
    const until = new Date(raw).getTime();
    if (isNaN(until)) return true;
    return Date.now() >= until;
  } catch {
    return true;
  }
};

const isAdminPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/admin');
};

function useCountdown(target: Date) {
  const calc = () => Math.max(0, target.getTime() - Date.now());
  const [ms, setMs] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400).toString().padStart(2, '0');
  const h = Math.floor((totalSecs % 86400) / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return { d, h, m, s, expired: ms === 0 };
}

const FEATURES = [
  { icon: Plane,   color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    title: 'Surca los cielos',     desc: 'Dirigibles, aviones y cañones voladores con Create: Aeronautics' },
  { icon: Rocket,  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  title: 'Construye tu nave',    desc: 'Diseña tu propia nave espacial y viaja a otros planetas' },
  { icon: Castle,  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   title: 'Funda tu colonia',     desc: 'Estilo Age of Empires con MineColonies — recluta aldeanos, granjeros, caballeros' },
  { icon: Factory, color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  title: 'Automatiza fábricas',  desc: 'Ecosistema Create completo + TFMG y Powergrid' },
  { icon: Globe,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', title: 'Coloniza planetas',    desc: 'Northstar para expandirte por todo el sistema solar' },
  { icon: Mic,     color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    title: 'Todo en español',      desc: 'Voicechat, claims, mapa en vivo y traducción completa' },
];

const DiscordInviteModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { d, h, m, s, expired } = useCountdown(DEADLINE);

  useEffect(() => {
    setMounted(true);
    if (isAdminPath()) return;
    const t = window.setTimeout(() => {
      if (shouldShow()) setOpen(true);
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted || !open) return null;

  const snooze = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date(Date.now() + SNOOZE_MS).toISOString());
    } catch {}
    setOpen(false);
  };

  const dismissForever = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'forever');
    } catch {}
    setOpen(false);
  };

  const join = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'forever');
    } catch {}
    window.open(DISCORD_INVITE, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border border-zinc-800 rounded-[32px] shadow-2xl">
        <button
          onClick={snooze}
          aria-label="Cerrar"
          className="absolute top-4 right-4 p-2 text-zinc-300 bg-black/40 hover:text-white hover:bg-black/60 rounded-xl transition-colors z-10 backdrop-blur"
        >
          <X size={18} />
        </button>

        {/* Hero with sky gradient */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-[32px] bg-gradient-to-b from-indigo-600 via-cyan-500 to-cyan-300">
          {/* Cloud decorations */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-6 w-20 h-6 bg-white rounded-full blur-md" />
            <div className="absolute top-12 right-10 w-32 h-8 bg-white rounded-full blur-md" />
            <div className="absolute bottom-6 left-1/3 w-24 h-7 bg-white rounded-full blur-md" />
            <div className="absolute bottom-12 right-1/4 w-16 h-5 bg-white rounded-full blur-md" />
          </div>
          {/* Big icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-2 drop-shadow-lg">🛸</div>
            <div className="text-white font-black text-xl uppercase tracking-widest drop-shadow-lg">Capibara</div>
            <div className="text-white/95 font-black text-3xl uppercase tracking-tight drop-shadow-lg">Aeronautics</div>
            <div className="mt-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur text-white/95 text-[10px] font-black uppercase tracking-widest border border-white/20">
              Nuevo SMP en español
            </div>
          </div>
        </div>

        <div className="relative p-6 space-y-5">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-black text-white uppercase leading-tight tracking-tight">
              Acabamos de abrir un <span className="text-cyan-400">SMP nuevo</span> y este no es uno más de Create
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Desde el primer eje hasta tu primera nave interplanetaria. Cada vuelo, cada fábrica y cada colonia tienen su lugar.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} className={`rounded-2xl ${bg} border ${border} p-3`}>
                <Icon className={`${color} mb-1.5`} size={18} />
                <p className="text-[11px] font-black text-white uppercase tracking-wide leading-tight">{title}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Contest banner */}
          <div className="rounded-2xl bg-gradient-to-r from-yellow-500/15 via-orange-500/15 to-yellow-500/15 border border-yellow-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-yellow-400 shrink-0" />
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                Concurso de lanzamiento · 75 USD en premios
              </p>
            </div>
            <p className="text-white text-sm font-bold leading-snug">
              Mejor colonia al <span className="text-yellow-400">31 de mayo</span>
            </p>
            <p className="text-zinc-400 text-xs mt-1">Detalles completos en el canal de Discord</p>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-zinc-800/80 border border-zinc-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-cyan-400 shrink-0" />
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                {expired ? 'Concurso terminado' : 'Tiempo restante'}
              </p>
            </div>
            {!expired ? (
              <div className="flex justify-center gap-2 text-center">
                {[{ v: d, l: 'días' }, { v: h, l: 'hrs' }, { v: m, l: 'min' }, { v: s, l: 'seg' }].map(({ v, l }) => (
                  <div key={l} className="flex-1">
                    <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{v}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{l}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-400 text-sm">El concurso ha finalizado</p>
            )}
          </div>

          {/* How to join */}
          <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/30 p-4">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">¿Cómo entrar?</p>
            <p className="text-zinc-200 text-sm">
              Únete al Discord y ve al canal <span className="text-indigo-300 font-bold">#como-jugar</span> para descargar el modpack.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={join}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              🚀 Unirme al Discord <ExternalLink size={14} />
            </button>
            <div className="flex gap-2">
              <button
                onClick={snooze}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Tal vez luego
              </button>
              <button
                onClick={dismissForever}
                className="flex-1 py-3 rounded-2xl bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400 font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                No volver a mostrar
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-600 italic pt-1">
            Los cielos son solo el principio ☁️✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;
