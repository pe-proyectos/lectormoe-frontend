import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Sparkles, Gift, Gamepad2, Users, Bell } from 'lucide-react';

// Key/value contract for the modal's persistent state:
// - 'forever'  → never show again
// - ISO date string → snooze until that instant
// Anything else (or missing) → show now
const STORAGE_KEY = 'discord-invite-modal-v1';
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
      <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
        {/* Subtle Discord brand gradient header */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-transparent pointer-events-none" />

        <button
          onClick={snooze}
          aria-label="Cerrar"
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="relative p-8 space-y-6">
          {/* Discord logo mark */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 127.14 96.36" fill="#818cf8" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
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
