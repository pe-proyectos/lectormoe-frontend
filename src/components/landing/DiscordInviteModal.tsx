import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Trophy,
  Gift,
  Sparkles,
  Gamepad2,
  Clock,
  Users,
} from 'lucide-react';

// v8 — staged relaunch. Same Capibara Aeronautics redesign, but gated behind
// an activation date so the modal stays dark until tomorrow and then surfaces
// to everyone (new storage key wipes prior dismissals).
const STORAGE_KEY = 'discord-invite-modal-v8';
const DISCORD_INVITE = 'https://discord.gg/MD6VwVTNBd';
const SNOOZE_MS = 60 * 60 * 1000; // 1 hour

// Hold the modal until this moment. Before it, the component renders nothing.
// 2026-05-13 12:00 local time.
const ACTIVATION_DATE = new Date(2026, 4, 13, 12, 0, 0);

// First active concurso — Gran Desafío de Población, deadline 2026-05-31 12:00.
const DEADLINE = new Date(2026, 4, 31, 12, 0, 0);

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

const PERKS = [
  {
    icon: Trophy,
    color: 'text-yellow-400',
    title: 'Torneos',
    body: 'Eventos exclusivos con premios en USD',
  },
  {
    icon: Gift,
    color: 'text-pink-400',
    title: 'Sorteos',
    body: 'Suscripciones, claves y skins cada mes',
  },
  {
    icon: Sparkles,
    color: 'text-cyan-400',
    title: 'Concursos',
    body: 'Retos de arte, escritura y comunidad',
  },
];

const DiscordInviteModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { d, h, m, s, expired } = useCountdown(DEADLINE);

  useEffect(() => {
    setMounted(true);
    if (isAdminPath()) return;
    // Hard activation gate — until ACTIVATION_DATE we never open the modal.
    if (Date.now() < ACTIVATION_DATE.getTime()) return;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full max-h-[94vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl shadow-cyan-500/10">
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />

        <button
          onClick={snooze}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-2 text-white bg-black/60 hover:bg-black/80 rounded-xl transition-colors z-20 backdrop-blur"
        >
          <X size={16} />
        </button>

        {/* Hero artwork */}
        <div className="relative">
          <img
            src="/images/bannermodal.png"
            alt="Capibara Aeronautics — Discord oficial"
            className="block w-full object-cover rounded-t-3xl"
          />
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-b from-transparent to-zinc-950" />

          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/30">
            <Gamepad2 size={12} /> Nuevo servidor
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 space-y-4 relative z-10">
          {/* Pitch */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
              Únete al Discord de
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                Capibara Aeronautics
              </span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              El nuevo servidor enfocado en <span className="text-white font-bold">Minecraft</span>, torneos, sorteos y concursos.
              <br className="hidden sm:block" />
              <span className="text-zinc-500">Participa, gana premios y conoce a la comunidad.</span>
            </p>
          </div>

          {/* Active tournament card */}
          <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/15 via-orange-500/10 to-transparent p-3">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_theme(colors.yellow.400),_transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={14} className="text-yellow-400 shrink-0" />
                <p className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">
                  Torneo activo
                </p>
                <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-yellow-200/80 uppercase tracking-widest">
                  <Users size={10} /> Cupos abiertos
                </span>
              </div>
              <p className="text-white text-sm font-black tracking-tight mb-2">
                Gran Desafío de Población · <span className="text-yellow-300">$50 + $25 USD</span>
              </p>
              {!expired ? (
                <div className="flex justify-between gap-2 text-center">
                  {[{ v: d, l: 'd' }, { v: h, l: 'h' }, { v: m, l: 'm' }, { v: s, l: 's' }].map(({ v, l }) => (
                    <div key={l} className="flex-1 rounded-lg bg-zinc-950/40 border border-yellow-500/20 py-1.5">
                      <div className="text-lg font-black text-white tabular-nums leading-none">{v}</div>
                      <div className="text-[9px] text-yellow-200/60 uppercase tracking-widest mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-zinc-400 text-xs flex items-center justify-center gap-1">
                  <Clock size={12} /> Concurso terminado — pero hay más en camino
                </p>
              )}
            </div>
          </div>

          {/* Perks grid */}
          <div className="grid grid-cols-3 gap-2">
            {PERKS.map(({ icon: Icon, color, title, body }) => (
              <div
                key={title}
                className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-2.5 flex flex-col items-center text-center gap-1 hover:border-zinc-700 transition-colors"
              >
                <Icon size={18} className={color} />
                <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none">{title}</p>
                <p className="text-zinc-500 text-[9px] leading-snug">{body}</p>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={join}
            className="group w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white font-black text-xs uppercase tracking-widest transition-all duration-500 active:scale-[0.98] shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
          >
            <span className="text-base">🚀</span>
            Unirme al Discord
            <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-center text-[10px] text-zinc-500 leading-relaxed">
            Discord oficial de Minecraft y eventos de CapibaraTraductor.
            <br />
            <span className="text-zinc-600">Solo te tomará 10 segundos unirte.</span>
          </p>

          {/* Dismiss controls */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={snooze}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Tal vez luego
            </button>
            <button
              onClick={dismissForever}
              className="flex-1 py-2.5 rounded-xl bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400 font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              No mostrar más
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;
