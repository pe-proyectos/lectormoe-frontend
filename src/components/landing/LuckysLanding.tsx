import React, { useEffect, useState } from 'react';
import { Sparkles, Ticket, Trophy, Clock, Users, X } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';

interface RaffleSummary {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  ticketPrice: number;
  currency: string;
  minTickets: number;
  maxTickets: number;
  maxTicketsPerUser: number;
  drawType: 'countdown' | 'max-tickets';
  drawAt: string | null;
  status: string;
  cancelReason: string | null;
  sold: number;
  available: number;
  winner: { ticketNumber: string; userSlug: string; userUsername: string; userImageUrl: string | null } | null;
  createdAt: string;
}

interface Props {
  user: any;
  logged: boolean;
  nsfwMode?: boolean;
}

const useCountdown = (target: string | null) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return 'Sorteando...';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const RaffleCard: React.FC<{ raffle: RaffleSummary; mode: 'active' | 'past' }> = ({ raffle, mode }) => {
  const countdown = useCountdown(raffle.drawType === 'countdown' ? raffle.drawAt : null);
  const isFree = raffle.ticketPrice === 0;
  return (
    <a
      href={`/luckys/${raffle.slug}`}
      className="group block bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden hover:border-yellow-500/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10"
    >
      <div className="relative aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
        {raffle.imageUrl ? (
          <img
            src={raffle.imageUrl}
            alt={raffle.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={48} className="text-yellow-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/30 to-transparent" />
        {mode === 'active' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/40">
            <Sparkles size={10} className="animate-pulse" /> Activo
          </span>
        )}
        {mode === 'past' && raffle.status === 'cancelled' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/80 text-white text-[10px] font-black uppercase tracking-widest">
            Cancelado
          </span>
        )}
        {mode === 'past' && raffle.status === 'completed' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-zinc-950 text-[10px] font-black uppercase tracking-widest">
            <Trophy size={10} /> Completado
          </span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-white font-black text-lg leading-tight line-clamp-2">{raffle.title}</h3>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Ticket size={14} className="text-yellow-500" />
            {isFree ? <span className="text-emerald-400 font-black">GRATIS</span> : `$${raffle.ticketPrice.toFixed(2)} ${raffle.currency}`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-cyan-400" />
            {raffle.sold}/{raffle.maxTickets}
          </span>
        </div>
        {mode === 'active' && raffle.drawType === 'countdown' && countdown && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock size={14} className="text-amber-400" />
            <span className="font-bold">{countdown}</span>
          </div>
        )}
        {mode === 'active' && raffle.drawType === 'max-tickets' && (
          <p className="text-xs text-zinc-400">Se sortea al llenarse.</p>
        )}
        {mode === 'past' && raffle.winner && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            {raffle.winner.userImageUrl ? (
              <img src={raffle.winner.userImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-black">
                {raffle.winner.userUsername?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Ganador #{raffle.winner.ticketNumber}</p>
              <p className="text-sm font-bold text-white truncate">{raffle.winner.userUsername}</p>
            </div>
          </div>
        )}
      </div>
    </a>
  );
};

const Sparkle: React.FC<{ delay: number; left: number; top: number }> = ({ delay, left, top }) => (
  <span
    className="absolute pointer-events-none animate-pulse"
    style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}
  >
    <Sparkles size={14 + Math.random() * 12} className="text-yellow-400/60" />
  </span>
);

const LuckysLanding: React.FC<Props> = ({ user, logged, nsfwMode }) => {
  const [active, setActive] = useState<RaffleSummary[]>([]);
  const [past, setPast] = useState<RaffleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [a, p] = await Promise.all([
          callAPI('/api/raffle?status=active'),
          callAPI('/api/raffle?status=completed'),
        ]);
        if (cancelled) return;
        setActive(a?.items ?? []);
        setPast(p?.items ?? []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'No se pudieron cargar los sorteos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const sparkles = Array.from({ length: 18 }, (_, i) => ({
    delay: (i * 0.21) % 3,
    left: (i * 53) % 100,
    top: (i * 37) % 100,
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        activeView=""
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
        onOpenLogin={() => { window.location.href = '/login'; }}
        onOpenRegister={() => { window.location.href = '/register'; }}
        onGoHome={() => { window.location.href = '/'; }}
        onGoExplore={() => { window.location.href = '/search'; }}
        onGoSearch={() => { window.location.href = '/search'; }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,0.15),transparent_50%)]" />
        <div className="absolute inset-0">
          {sparkles.map((s, i) => <Sparkle key={i} {...s} />)}
        </div>
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={14} className="animate-pulse" /> Sorteos exclusivos
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic leading-[1.1] overflow-visible">
            {/* pr keeps the italic slant of the final S inside its bounding box;
                bg-clip-text on italic glyphs otherwise crops the trailing pixels. */}
            <span className="inline-block pr-[0.15em] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
              LUCKYS
            </span>
          </h1>
          <p className="mt-6 text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Participa en sorteos exclusivos de la comunidad. Mangas, suscripciones, merch y más.
          </p>
        </div>
      </section>

      {/* Active */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles size={20} className="text-yellow-400" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sorteos activos</h2>
        </div>
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>
        )}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl aspect-[4/3] animate-pulse" />
            ))}
          </div>
        )}
        {!loading && active.length === 0 && !error && (
          <div className="p-10 text-center bg-zinc-950 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500">No hay sorteos activos por ahora. Vuelve pronto.</p>
          </div>
        )}
        {!loading && active.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((r) => <RaffleCard key={r.id} raffle={r} mode="active" />)}
          </div>
        )}
      </section>

      {/* Past */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
        <div className="flex items-center gap-3 mb-8">
          <Trophy size={20} className="text-amber-400" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Historial</h2>
        </div>
        {!loading && past.length === 0 && (
          <div className="p-10 text-center bg-zinc-950 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500">Aún no hay sorteos pasados.</p>
          </div>
        )}
        {past.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map((r) => <RaffleCard key={r.id} raffle={r} mode="past" />)}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default LuckysLanding;
