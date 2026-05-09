import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Trophy, Clock } from 'lucide-react';

// v5 — Capibara Aeronautics SMP launch (compact). Previous dismissers should see this.
const STORAGE_KEY = 'discord-invite-modal-v5';
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
      <div className="relative max-w-md w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <button
          onClick={snooze}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-2 text-zinc-200 bg-black/50 hover:text-white hover:bg-black/70 rounded-lg transition-colors z-10 backdrop-blur"
        >
          <X size={16} />
        </button>

        {/* Hero image */}
        <img
          src="/images/svmc.jpg"
          alt="Capibara Aeronautics — Nuevo SMP"
          className="block w-full object-cover rounded-t-3xl"
        />

        <div className="p-5 space-y-4">
          {/* Concurso pill + countdown */}
          <div className="rounded-2xl bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-yellow-400 shrink-0" />
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                75 USD · Mejor colonia al 31 de mayo
              </p>
            </div>
            {!expired ? (
              <div className="flex justify-center gap-2 text-center">
                {[{ v: d, l: 'd' }, { v: h, l: 'h' }, { v: m, l: 'm' }, { v: s, l: 's' }].map(({ v, l }) => (
                  <div key={l} className="flex-1">
                    <div className="text-xl font-black text-white tabular-nums leading-none">{v}</div>
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wide mt-1">{l}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-400 text-xs flex items-center justify-center gap-1">
                <Clock size={12} /> Concurso terminado
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={join}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            🚀 Unirme al Discord <ExternalLink size={14} />
          </button>

          <p className="text-center text-[10px] text-zinc-500">
            Únete al canal <span className="text-zinc-300 font-bold">#como-jugar</span> para descargar el modpack
          </p>

          <div className="flex gap-2">
            <button
              onClick={snooze}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Tal vez luego
            </button>
            <button
              onClick={dismissForever}
              className="flex-1 py-2.5 rounded-xl bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400 font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              No mostrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;
