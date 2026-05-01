import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Trophy, Sword, Shield, Youtube, Clock } from 'lucide-react';

// v3 — Minecraft airplane contest announcement. Previous dismissers should see this.
const STORAGE_KEY = 'discord-invite-modal-v3';
const DISCORD_INVITE = 'https://discord.gg/xJqCWAUxVt';
const TUTORIAL_URL = 'https://www.youtube.com/watch?v=K6y5Bw3YhUE';
const SNOOZE_MS = 60 * 60 * 1000; // 1 hour

// 2026-04-30 23:59:00 local time
const DEADLINE = new Date(2026, 3, 30, 23, 59, 0);

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
  const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return { h, m, s, expired: ms === 0 };
}

const DiscordInviteModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { h, m, s, expired } = useCountdown(DEADLINE);

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

  const openTutorial = () => {
    window.open(TUTORIAL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-[32px] shadow-2xl">
        <button
          onClick={snooze}
          aria-label="Cerrar"
          className="absolute top-4 right-4 p-2 text-zinc-300 bg-black/40 hover:text-white hover:bg-black/60 rounded-xl transition-colors z-10 backdrop-blur"
        >
          <X size={18} />
        </button>

        {/* Hero image */}
        <img
          src="/images/discordmc.png"
          alt="Concurso Avión Minecraft - CapibaraTraductor"
          className="block w-full object-cover rounded-t-[32px]"
        />

        <div className="relative p-6 space-y-5">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-black uppercase tracking-widest">
              Concurso Minecraft
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
              Nuevo servidor
            </span>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-black text-white uppercase leading-tight tracking-tight">
              El primero en hacer un <span className="text-green-400">avión funcional</span> en Minecraft gana
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              En el nuevo servidor de CapibaraTraductor. Todo en survival, siguiendo el tutorial.
            </p>
          </div>

          {/* Prizes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center">
              <Trophy className="mx-auto mb-1 text-yellow-400" size={20} />
              <p className="text-xs text-yellow-300 font-bold uppercase tracking-wide">1er lugar</p>
              <p className="text-2xl font-black text-white">$10</p>
              <p className="text-[10px] text-zinc-400">Avión funcional</p>
            </div>
            <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/50 p-4 text-center">
              <Trophy className="mx-auto mb-1 text-zinc-400" size={20} />
              <p className="text-xs text-zinc-300 font-bold uppercase tracking-wide">Consuelo</p>
              <p className="text-2xl font-black text-white">$5</p>
              <p className="text-[10px] text-zinc-400">Más cerca de terminar</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-zinc-800/80 border border-zinc-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-red-400 shrink-0" />
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                {expired ? 'Tiempo terminado' : 'Tiempo restante — hoy hasta las 23:59'}
              </p>
            </div>
            {!expired ? (
              <div className="flex justify-center gap-3 text-center">
                {[{ v: h, l: 'horas' }, { v: m, l: 'min' }, { v: s, l: 'seg' }].map(({ v, l }) => (
                  <div key={l} className="flex-1">
                    <div className="text-3xl font-black text-white tabular-nums">{v}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{l}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-400 text-sm">El concurso ha finalizado</p>
            )}
          </div>

          {/* Rules */}
          <div className="space-y-2 text-sm">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reglas</p>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-start gap-2">
                <Shield size={13} className="text-green-400 mt-0.5 shrink-0" />
                <span>Todo en <strong className="text-white">survival</strong>, avión 90% similar al tutorial</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield size={13} className="text-green-400 mt-0.5 shrink-0" />
                <span>Debe <strong className="text-white">volar 1 minuto</strong> y girar a los lados, arriba y abajo</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield size={13} className="text-green-400 mt-0.5 shrink-0" />
                <span>Se permite <strong className="text-white">trabajo en equipo</strong>, pero solo uno recibe el premio</span>
              </li>
              <li className="flex items-start gap-2">
                <Sword size={13} className="text-orange-400 mt-0.5 shrink-0" />
                <span>Se permite <strong className="text-white">sabotear</strong> (matar o romper aviones ajenos) — usa protecciones de terreno</span>
              </li>
              <li className="flex items-start gap-2">
                <X size={13} className="text-red-400 mt-0.5 shrink-0" />
                <span>Trampa o hack = <strong className="text-red-400">descalificación y baneo</strong></span>
              </li>
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={openTutorial}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Youtube size={15} /> Ver tutorial del avión
            </button>
            <button
              onClick={join}
              className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              Unirme al Discord <ExternalLink size={14} />
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
        </div>
      </div>
    </div>
  );
};

export default DiscordInviteModal;
