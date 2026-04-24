import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Sparkles, Gift, Gamepad2, Users, Bell } from 'lucide-react';

// Key/value contract for the modal's persistent state:
// - 'forever'  → never show again
// - ISO date string → snooze until that instant
// Anything else (or missing) → show now
// Bumped to v2 when the giveaway announcement was added — users who had
// dismissed v1 should still see this time-sensitive notice.
const STORAGE_KEY = 'discord-invite-modal-v2';
const DISCORD_INVITE = 'https://discord.gg/xJqCWAUxVt';
const SNOOZE_MS = 60 * 60 * 1000; // 1 hour

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

// Admin pages shouldn't see the community invite — mods already know.
const isAdminPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/admin');
};

const DiscordInviteModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAdminPath()) return;
    // Small delay so the modal doesn't slam in on the first paint
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
      // Treat 'joined' the same as forever — no reason to keep pestering.
      window.localStorage.setItem(STORAGE_KEY, 'forever');
    } catch {}
    window.open(DISCORD_INVITE, '_blank', 'noopener,noreferrer');
    setOpen(false);
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

        {/* Hero — sorteo image */}
        <img
          src="/images/dc.png"
          alt="Sorteo CapibaraTraductor en Discord"
          className="block w-full aspect-[4/3] object-cover"
        />

        <div className="relative p-8 space-y-6">
          {/* Giveaway callout */}
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-300">
              <Gift size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-yellow-300 uppercase tracking-[0.25em] mb-1">¡Sorteo!</p>
              <p className="text-sm text-zinc-200 leading-snug">
                El primer sorteo arranca el <span className="font-bold text-white">lunes 27 de abril</span>. Tienes
                {' '}<span className="font-bold text-white">24 horas</span> para entrar al Discord y votar el premio.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Nuevo Discord</p>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">
              Únete a la <span className="text-indigo-400">comunidad</span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Estrenamos servidor oficial de CapibaraTraductor. Nos vas a encontrar ahí para enterarte primero de todo.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-yellow-400"><Gift size={14} /></span>
              <span><span className="font-bold text-white">Sorteos y rifas</span> para la comunidad</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-green-400"><Gamepad2 size={14} /></span>
              <span><span className="font-bold text-white">Servidor de Minecraft</span> comunitario</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-pink-400"><Users size={14} /></span>
              <span><span className="font-bold text-white">Actividades y eventos</span> con toda la comunidad</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-cyan-400"><Bell size={14} /></span>
              <span>Anuncios de <span className="font-bold text-white">cambios, mejoras y publicaciones</span> de scans y proyectos en tiempo real</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-purple-400"><Sparkles size={14} /></span>
              <span>Y más cositas que estamos preparando</span>
            </li>
          </ul>

          <div className="flex flex-col gap-2 pt-2">
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
