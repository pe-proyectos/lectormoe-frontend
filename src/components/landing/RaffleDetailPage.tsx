import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Ticket, Trophy, Clock, Users, Send, Plus, Minus, AlertTriangle, Loader2, Skull, Wind,
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface Winner {
  ticketNumber: string;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  comment?: string | null;
}

interface ViewerDiscord { linked: boolean; verified: boolean; reason?: string }

interface Raffle {
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
  winnersCount: number;
  eliminationIntervalMs: number;
  drawType: 'countdown' | 'max-tickets';
  drawAt: string | null;
  status: string;
  cancelReason: string | null;
  sold: number;
  available: number;
  userTicketCount: number;
  winner: Winner | null;
  winners: Winner[] | null;
  viewer?: { discord?: ViewerDiscord; canParticipate?: boolean; blockReason?: string | null };
  createdAt: string;
}

const DISCORD_INVITE = 'https://discord.gg/xJqCWAUxVt';

interface Comment {
  id: number;
  userId: number;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  isTicketHolder: boolean;
  ticketCount?: number;
  body: string;
  createdAt: string;
}

interface TicketRow {
  id: number;
  number: string;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  comment: string | null;
  eliminatedAt: string | null;
  eliminationOrder: number | null;
  createdAt: string;
}

interface AliveTicket {
  id: number;
  number: string;
  rawNumber: number;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  horseSteps: number;
  blownAt: string | null;
}

interface DrawState {
  status: string;
  phase: 'phase1' | 'phase2' | 'phase3_intro' | 'phase3' | null;
  totalTickets: number;
  eliminatedCount: number;
  remainingCount: number;
  winnersCount: number;
  eliminationsRemaining: number;
  eliminationIntervalMs: number;
  lastEliminationAt: string | null;
  nextEliminationAt: string | null;
  // Phase 2
  lightState: 'red' | 'green' | null;
  nextWindAt: string | null;
  nextLightChangeAt: string | null;
  // Phase 3
  phase3StartsAt: string | null;
  nextHorseAdvanceAt: string | null;
  nextHorseEliminationAt: string | null;
  lastPlace: AliveTicket | null;
  // Roster (phase 2 grid + phase 3 columns)
  aliveTickets: AliveTicket[];
  winners: Winner[] | null;
}

interface MyTicket {
  id: number;
  number: string;
  comment: string | null;
  refunded: boolean;
  eliminated: boolean;
  eliminationOrder: number | null;
  isWinner: boolean;
  alive: boolean;
}

interface Props {
  raffle: Raffle;
  user: any;
  logged: boolean;
  nsfwMode?: boolean;
  paypalClientId: string;
}

// Joins parts as natural Spanish prose: "A, B, C y D" / "A y B" / "A".
const joinEs = (parts: string[]): string => {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
};

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
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  // Always show seconds when there's no minute/hour/day component, otherwise
  // include them too so the counter visibly ticks instead of feeling frozen.
  if (parts.length === 0 || seconds > 0 || (days === 0 && hours === 0)) {
    parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
  }
  return joinEs(parts);
};

const formatRaffleDateLong = (iso: string): string => {
  try {
    const formatted = new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
    // Capitalise first letter (Intl returns "lunes 5 de mayo de 2025, 15:30").
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return iso;
  }
};

const linkifyMentions = (text: string) => {
  const parts: React.ReactNode[] = [];
  const regex = /@(\w+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={`m-${i++}-${match.index}`}
        href={`/profile/${match[1]}`}
        className="text-cyan-400 hover:text-cyan-300 font-bold"
      >
        @{match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const RaffleDetailPage: React.FC<Props> = ({ raffle: initialRaffle, user, logged, nsfwMode, paypalClientId }) => {
  const [raffle, setRaffle] = useState<Raffle>(initialRaffle);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);
  const wasAtBottomRef = useRef(true);

  const [buyComment, setBuyComment] = useState('');
  const [buyCount, setBuyCount] = useState(1);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState('');

  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [tick, setTick] = useState(0);

  // Viewer's own tickets in this raffle (alive / eliminated / winner).
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);

  // Phase 2 transient state — when a wind_gust event arrives, we mark the
  // affected tickets as "blowing" for ~1.2s so the FE can animate them with
  // a translate/shake. After the timeout the set clears and the next polling
  // cycle reflects whether they were eliminated (red light) or remain alive.
  const [blowingIds, setBlowingIds] = useState<Set<number>>(() => new Set());
  const [redKilledIds, setRedKilledIds] = useState<Set<number>>(() => new Set());

  const countdown = useCountdown(raffle.drawType === 'countdown' ? raffle.drawAt : null);
  const isFree = raffle.ticketPrice === 0;
  const drawingDone = raffle.status === 'completed';
  const drawingNow = raffle.status === 'drawing';

  const maxBuy = Math.max(0, Math.min(
    raffle.maxTicketsPerUser - raffle.userTicketCount,
    raffle.available,
  ));

  const loadTickets = async (page = 1) => {
    setTicketsLoading(true);
    try {
      const data = await callAPI(`/api/raffle/${raffle.slug}/tickets?page=${page}&limit=30`);
      setTickets(data?.items ?? []);
      setTicketsTotal(data?.total ?? 0);
      setTicketsPage(page);
    } catch (err) {
      // ignore
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await callAPI(`/api/raffle/${raffle.slug}/comments?limit=50`);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore
    }
  };

  const loadMyTickets = async () => {
    if (!logged) { setMyTickets([]); return; }
    try {
      const data = await callAPI(`/api/raffle/${raffle.slug}/my-tickets`);
      setMyTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore — strip just won't render
    }
  };

  const refetchRaffle = async () => {
    try {
      const data = await callAPI(`/api/raffle/${raffle.slug}`);
      if (data) setRaffle(data as Raffle);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => { loadTickets(1); loadComments(); loadMyTickets(); /* eslint-disable-next-line */ }, [raffle.slug]);

  // ─── Draw-state polling: source of truth during 'drawing' ────────────────────
  useEffect(() => {
    if (raffle.status !== 'drawing') return;
    let cancelled = false;
    let stopped = false;
    const poll = async () => {
      if (cancelled || stopped) return;
      try {
        const data = await callAPI(`/api/raffle/${raffle.slug}/draw-state`);
        if (cancelled) return;
        if (data) {
          setDrawState(data as DrawState);
          if ((data as DrawState).status === 'completed') {
            stopped = true;
            // Pull the full detail for winners + status flip + ticket badges.
            await refetchRaffle();
            await loadTickets(1);
          } else if ((data as DrawState).status === 'cancelled') {
            stopped = true;
            await refetchRaffle();
          }
        }
      } catch (_e) { /* swallow — try again next tick */ }
    };
    poll();
    const id = window.setInterval(poll, 1000);
    return () => { cancelled = true; window.clearInterval(id); };
    // eslint-disable-next-line
  }, [raffle.slug, raffle.status]);

  // 200ms re-render driver so the "Próxima eliminación en Xs" countdown ticks
  // smoothly between server polls without re-firing fetches.
  useEffect(() => {
    if (raffle.status !== 'drawing') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [raffle.status]);

  // ─── SSE with exp backoff ───────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource | null = null;
    let backoff = 1000;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const apiBase = import.meta.env.PUBLIC_API_URL || '';
      es = new EventSource(`${apiBase}/api/raffle/${raffle.slug}/events`);
      es.onmessage = (msg) => {
        try {
          const evt = JSON.parse(msg.data);
          handleEvent(evt);
          backoff = 1000;
        } catch (e) { /* ignore */ }
      };
      es.onerror = () => {
        es?.close();
        if (stopped) return;
        setTimeout(connect, backoff);
        backoff = Math.min(30_000, backoff * 2);
      };
    };

    const pollDrawStateNow = async () => {
      try {
        const data = await callAPI(`/api/raffle/${raffle.slug}/draw-state`);
        if (data) setDrawState(data as DrawState);
      } catch (_e) { /* ignore */ }
    };

    const handleEvent = (e: any) => {
      if (e.type === 'snapshot') {
        setRaffle((r) => ({
          ...r,
          status: e.raffle.status,
          sold: e.raffle.sold,
          available: e.raffle.available,
          winnersCount: e.raffle.winnersCount ?? r.winnersCount,
          eliminationIntervalMs: e.raffle.eliminationIntervalMs ?? r.eliminationIntervalMs,
          winner: e.raffle.winner,
          winners: e.raffle.winners ?? r.winners,
          userTicketCount: e.raffle.viewerTicketsCount ?? r.userTicketCount,
        }));
      } else if (e.type === 'ticket_purchased') {
        setRaffle((r) => ({ ...r, sold: e.sold, available: e.available }));
        loadTickets(ticketsPage);
        // Refresh comments so 🎟️N badges on existing comments by the buyer
        // reflect their new ticket count (otherwise they stay stamped at the
        // count they had when the comment was posted).
        loadComments();
        loadMyTickets();
      } else if (e.type === 'comment') {
        setComments((prev) => [...prev, e.comment]);
      } else if (e.type === 'draw_started') {
        setRaffle((r) => ({ ...r, status: 'drawing' }));
        // SSE is just a hint — kick the polling loop immediately.
        pollDrawStateNow();
      } else if (e.type === 'elimination') {
        pollDrawStateNow();
        loadMyTickets();
      } else if (e.type === 'phase_started') {
        pollDrawStateNow();
      } else if (e.type === 'wind_gust') {
        // Mark blown tickets so the FE can animate them. If the gust hit
        // during red light, also mark them as red-killed so the X overlay
        // sticks for the brief window before they drop off the alive list.
        const ids: number[] = Array.isArray(e.ticketIds) ? e.ticketIds : [];
        const killed: number[] = Array.isArray(e.eliminatedTicketIds) ? e.eliminatedTicketIds : [];
        setBlowingIds((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.add(id);
          return next;
        });
        if (killed.length > 0) {
          setRedKilledIds((prev) => {
            const next = new Set(prev);
            for (const id of killed) next.add(id);
            return next;
          });
        }
        // Clear blowing animation after 1.2s; clear killed mark after 2s.
        setTimeout(() => {
          setBlowingIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.delete(id);
            return next;
          });
        }, 1200);
        if (killed.length > 0) {
          setTimeout(() => {
            setRedKilledIds((prev) => {
              const next = new Set(prev);
              for (const id of killed) next.delete(id);
              return next;
            });
            loadMyTickets();
          }, 2000);
        }
        pollDrawStateNow();
      } else if (e.type === 'light_change') {
        pollDrawStateNow();
      } else if (e.type === 'horse_advance') {
        pollDrawStateNow();
      } else if (e.type === 'horse_elimination') {
        pollDrawStateNow();
        loadMyTickets();
      } else if (e.type === 'draw_completed') {
        setRaffle((r) => ({
          ...r,
          status: 'completed',
          winners: e.winners ?? r.winners,
          winner: (e.winners && e.winners[0]) ?? r.winner,
        }));
        refetchRaffle();
        loadTickets(1);
        loadMyTickets();
      } else if (e.type === 'cancelled') {
        setRaffle((r) => ({ ...r, status: 'cancelled', cancelReason: e.reason }));
        loadMyTickets();
      }
    };

    connect();
    return () => { stopped = true; es?.close(); };
    // eslint-disable-next-line
  }, [raffle.slug]);

  // Belt-and-suspenders: 1s polling for new comments. SSE through reverse
  // proxies sometimes drops events; polling catches anything the stream missed.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const lastId = comments.length > 0 ? comments[comments.length - 1].id : 0;
        const data = await callAPI(`/api/raffle/${raffle.slug}/comments?after=${lastId}&limit=50`);
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setComments((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            const incoming = (data as Comment[]).filter((c) => !seen.has(c.id));
            if (incoming.length === 0) return prev;
            return [...prev, ...incoming];
          });
        }
      } catch (_e) { /* swallow */ }
    };
    const id = window.setInterval(poll, 1000);
    return () => { cancelled = true; window.clearInterval(id); };
    // eslint-disable-next-line
  }, [raffle.slug, comments]);

  useEffect(() => {
    const el = commentsScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      wasAtBottomRef.current = atBottom;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!wasAtBottomRef.current) return;
    const el = commentsScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments]);

  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || commentBusy) return;
    if (!logged) { window.location.href = '/login'; return; }
    setCommentBusy(true);
    try {
      await callAPI(`/api/raffle/${raffle.slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setCommentDraft('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setCommentBusy(false);
    }
  };

  const buyFree = async () => {
    if (!logged) { window.location.href = '/login'; return; }
    setBuyError('');
    setBuyBusy(true);
    try {
      const res = await callAPI(`/api/raffle/${raffle.slug}/tickets`, {
        method: 'POST',
        body: JSON.stringify({ count: buyCount, comment: buyComment || undefined }),
      });
      const minted = res?.tickets?.length ?? 0;
      setRaffle((r) => ({
        ...r,
        userTicketCount: r.userTicketCount + minted,
        sold: r.sold + minted,
        available: Math.max(0, r.available - minted),
      }));
      setBuyComment('');
      setBuyCount(1);
      loadTickets(1);
    } catch (err: any) {
      setBuyError(err?.message || 'Error al obtener el ticket.');
    } finally {
      setBuyBusy(false);
    }
  };

  // ─── Right-side chat block ──────────────────────────────────────────────────
  const Chat = (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 flex flex-col h-[600px]">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
        <Sparkles size={14} className="text-yellow-400" />
        <h3 className="text-xs font-black text-white uppercase tracking-widest">Chat en vivo</h3>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">{comments.length}</span>
      </div>
      <div ref={commentsScrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {comments.length === 0 && (
          <p className="text-zinc-600 text-xs italic text-center mt-4">Sé el primero en comentar.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className={`flex gap-2 px-2 py-1.5 rounded-lg text-[12px] leading-snug ${
              c.isTicketHolder
                ? 'bg-cyan-500/8 border-l-2 border-cyan-500/40'
                : ''
            }`}
          >
            {c.userImageUrl ? (
              <img src={c.userImageUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                {c.userUsername?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <a
                href={`/profile/${c.userSlug}`}
                className={`text-[11px] font-black ${c.isTicketHolder ? 'text-cyan-300' : 'text-zinc-300'} hover:underline`}
              >
                {c.userUsername}
              </a>
              {c.isTicketHolder && c.ticketCount && c.ticketCount > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-black tabular-nums" title={`${c.ticketCount} ticket(s)`}>
                  🎟️{c.ticketCount}
                </span>
              )}
              <span className="text-zinc-200 ml-1.5 break-words">{linkifyMentions(c.body)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-2">
        <input
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
          placeholder={logged ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
          disabled={!logged || commentBusy}
          maxLength={500}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 disabled:opacity-50"
        />
        <button
          onClick={submitComment}
          disabled={!logged || commentBusy || !commentDraft.trim()}
          className="px-3 py-2 bg-yellow-400 text-zinc-950 rounded-xl font-black hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );

  // ─── Center column ──────────────────────────────────────────────────────────
  // Helper: ISO → seconds remaining (clamped at 0; null if invalid/missing).
  const secondsUntil = (iso: string | null | undefined): number | null => {
    if (!iso) return null;
    const target = new Date(iso).getTime();
    if (!Number.isFinite(target)) return null;
    return Math.max(0, Math.ceil((target - Date.now()) / 1000));
  };

  const nextEliminationSeconds = useMemo(
    () => secondsUntil(drawState?.nextEliminationAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.nextEliminationAt, tick],
  );
  const nextWindSeconds = useMemo(
    () => secondsUntil(drawState?.nextWindAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.nextWindAt, tick],
  );
  const nextLightSeconds = useMemo(
    () => secondsUntil(drawState?.nextLightChangeAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.nextLightChangeAt, tick],
  );
  const phase3IntroSeconds = useMemo(
    () => secondsUntil(drawState?.phase3StartsAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.phase3StartsAt, tick],
  );
  const nextHorseAdvanceSeconds = useMemo(
    () => secondsUntil(drawState?.nextHorseAdvanceAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.nextHorseAdvanceAt, tick],
  );
  const nextHorseEliminationSeconds = useMemo(
    () => secondsUntil(drawState?.nextHorseEliminationAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.nextHorseEliminationAt, tick],
  );

  // Viewer's own tickets in this raffle, color-coded by status. Renders nothing
  // for logged-out viewers or when the user has no tickets.
  const MyTicketsRow = logged && myTickets.length > 0 ? (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
        <Ticket size={12} /> Mis tickets ({myTickets.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {myTickets.map((t) => {
          const cls = t.refunded
            ? 'bg-zinc-900 border-zinc-700 text-zinc-500 line-through'
            : t.isWinner
            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200 shadow-emerald-400/30 shadow-md'
            : t.eliminated
            ? 'bg-red-500/15 border-red-400 text-red-300 grayscale opacity-80'
            : 'bg-cyan-500/15 border-cyan-400 text-cyan-200';
          const label = t.refunded
            ? 'Reembolsado'
            : t.isWinner
            ? '¡Ganador!'
            : t.eliminated
            ? 'Eliminado'
            : 'En juego';
          return (
            <div
              key={`mt-${t.id}`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-black tabular-nums ${cls}`}
              title={label}
            >
              #{t.number}
              <span className="ml-1.5 text-[9px] uppercase font-black tracking-widest opacity-80">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  // Phase 1 / pre-phase fallback view (used when drawing started but the
  // tournament is in classic per-tick eliminations).
  const Phase1View = (
    <div className="w-full max-w-xl space-y-5">
      <div className="text-center">
        <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3 animate-pulse flex items-center justify-center gap-2">
          <Sparkles size={14} className="animate-pulse" /> Fase 1 · Eliminación rápida
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Tickets vivos</p>
            <p className="mt-1 text-4xl font-black text-white tabular-nums">
              {drawState?.remainingCount ?? '—'}
            </p>
          </div>
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Próxima eliminación</p>
            <p className="mt-1 text-4xl font-black text-amber-300 tabular-nums">
              {nextEliminationSeconds !== null ? `${nextEliminationSeconds}s` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Phase 2 — Squid Game grid with parallel wind + light timers.
  const Phase2View = (
    <div className="w-full space-y-4">
      <div className="text-center">
        <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3 animate-pulse flex items-center justify-center gap-2">
          <Wind size={14} /> Fase 2 · Luz Roja, Luz Verde
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center justify-center gap-1">
              <Wind size={10} /> Próxima ráfaga
            </p>
            <p className="mt-1 text-3xl font-black text-cyan-300 tabular-nums text-center">
              {nextWindSeconds !== null ? `${nextWindSeconds}s` : '—'}
            </p>
          </div>
          <div
            className={`border rounded-2xl p-3 ${
              drawState?.lightState === 'red'
                ? 'bg-red-500/15 border-red-500/50'
                : 'bg-emerald-500/15 border-emerald-500/40'
            }`}
          >
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
              Luz {drawState?.lightState === 'red' ? 'roja' : 'verde'} · cambia en
            </p>
            <p
              className={`mt-1 text-3xl font-black tabular-nums text-center ${
                drawState?.lightState === 'red' ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              {nextLightSeconds !== null ? `${nextLightSeconds}s` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of all alive ticket holders */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
        {drawState?.aliveTickets?.map((t) => {
          const blowing = blowingIds.has(t.id);
          const killed = redKilledIds.has(t.id);
          return (
            <div
              key={`p2-${t.id}`}
              className={`relative flex flex-col items-center gap-1 transition-transform duration-700 ${
                blowing ? 'animate-[wind-blow_1.2s_ease-out]' : ''
              }`}
              title={`@${t.userUsername} · #${t.number}`}
              style={blowing ? { transform: `translate(${(Math.random() * 40 - 20).toFixed(0)}px, ${(Math.random() * 30 - 10).toFixed(0)}px) rotate(${(Math.random() * 30 - 15).toFixed(0)}deg)` } : undefined}
            >
              {t.userImageUrl ? (
                <img
                  src={t.userImageUrl}
                  alt=""
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-1 ${
                    killed ? 'ring-red-500 grayscale opacity-60' : 'ring-zinc-700'
                  }`}
                />
              ) : (
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 ring-1 ${killed ? 'ring-red-500 grayscale opacity-60' : 'ring-zinc-700'}`}>
                  {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-[9px] font-mono font-bold text-zinc-400 tabular-nums">#{t.number}</span>
              {killed && (
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-red-500 pointer-events-none drop-shadow-lg">✕</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-zinc-500 italic">
        Quedan {drawState?.remainingCount ?? '—'} tickets · siguen hasta llegar a 10
      </p>
    </div>
  );

  // Phase 3 intro — 30s lobby before the horse race.
  const Phase3IntroView = (
    <div className="w-full max-w-xl space-y-5 text-center">
      <div className="text-amber-300 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
        🐎 Fase final · La carrera de caballos
      </div>
      <div className="bg-zinc-900/70 border border-amber-500/30 rounded-2xl p-6">
        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">La carrera empieza en</p>
        <p className="mt-2 text-6xl font-black text-amber-300 tabular-nums">
          {phase3IntroSeconds !== null ? `${phase3IntroSeconds}s` : '—'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {drawState?.aliveTickets?.map((t) => (
          <div key={`p3i-${t.id}`} className="flex flex-col items-center gap-1">
            {t.userImageUrl ? (
              <img src={t.userImageUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400/60" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-base font-black ring-2 ring-amber-400/60">
                {t.userUsername?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="text-[10px] font-mono font-bold text-amber-200 tabular-nums">#{t.number}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Phase 3 — vertical horse race. Track auto-scales so the trailing ticket
  // always sits at the top and the leader is offset down by their relative
  // step gap.
  const Phase3View = (() => {
    const alive = drawState?.aliveTickets ?? [];
    const minSteps = alive.length > 0 ? Math.min(...alive.map((t) => t.horseSteps)) : 0;
    const maxSteps = alive.length > 0 ? Math.max(...alive.map((t) => t.horseSteps)) : 0;
    const range = Math.max(1, maxSteps - minSteps);
    const trackHeight = 240;
    // Auto-scale the per-step pixel size so the visible delta fits in the
    // track without horizontal overflow as the race progresses.
    const stepHeight = Math.min(20, trackHeight / range);
    return (
      <div className="w-full space-y-4">
        <div className="text-center">
          <div className="text-amber-300 text-xs font-black uppercase tracking-widest mb-3 animate-pulse flex items-center justify-center gap-2">
            🐎 Carrera de caballos en vivo
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Próximo avance</p>
              <p className="mt-1 text-3xl font-black text-cyan-300 tabular-nums text-center">
                {nextHorseAdvanceSeconds !== null ? `${nextHorseAdvanceSeconds}s` : '—'}
              </p>
            </div>
            <div className="bg-zinc-900/70 border border-red-500/30 rounded-2xl p-3">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Próxima eliminación</p>
              <p className="mt-1 text-2xl font-black text-red-300 tabular-nums text-center">
                {nextHorseEliminationSeconds !== null ? `${nextHorseEliminationSeconds}s` : '—'}
                {drawState?.lastPlace && (
                  <span className="ml-1 text-base text-zinc-400">#{drawState.lastPlace.number}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-zinc-900/40 to-zinc-950 border border-zinc-800 rounded-2xl p-3 overflow-hidden">
          <div className="flex justify-around items-start" style={{ minHeight: trackHeight + 80 }}>
            {alive.map((t) => {
              const offsetTop = (t.horseSteps - minSteps) * stepHeight;
              const isLast = drawState?.lastPlace?.id === t.id;
              return (
                <div key={`p3-${t.id}`} className="flex flex-col items-center" style={{ width: '10%' }}>
                  {/* Ticket number above */}
                  <span className={`text-[10px] font-mono font-bold tabular-nums mb-1 ${isLast ? 'text-red-400' : 'text-amber-200'}`}>
                    #{t.number}
                  </span>
                  {/* Avatar */}
                  {t.userImageUrl ? (
                    <img
                      src={t.userImageUrl}
                      alt=""
                      className={`w-9 h-9 rounded-full object-cover ring-2 transition-all duration-700 ${isLast ? 'ring-red-500' : 'ring-amber-400/60'}`}
                      style={{ transform: `translateY(${offsetTop}px)` }}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-200 text-sm font-black ring-2 transition-all duration-700 ${isLast ? 'ring-red-500' : 'ring-amber-400/60'}`}
                      style={{ transform: `translateY(${offsetTop}px)` }}
                    >
                      {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  {/* Horse */}
                  <span
                    className="text-2xl mt-0.5 transition-all duration-700"
                    style={{ transform: `translateY(${offsetTop}px)` }}
                  >
                    🐎
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-[10px] text-zinc-500 italic">
          El líder está más abajo · cada 15s se elimina al de último lugar
        </p>
      </div>
    );
  })();

  const Center = (
    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px]">
      {raffle.status === 'active' && raffle.drawType === 'countdown' && (
        <>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> El sorteo comienza en
          </div>
          <div className="text-3xl md:text-5xl font-black text-white tracking-tight text-center leading-tight">
            {countdown ?? '—'}
          </div>
          {raffle.drawAt && (
            <p className="text-zinc-500 text-xs mt-3 text-center">
              {formatRaffleDateLong(raffle.drawAt)}
            </p>
          )}
          {raffle.winnersCount > 1 && (
            <p className="mt-4 text-amber-300 text-xs font-bold uppercase tracking-widest">
              Sorteo de {raffle.winnersCount} ganadores
            </p>
          )}
        </>
      )}
      {raffle.status === 'active' && raffle.drawType === 'max-tickets' && (
        <>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Ticket size={14} className="text-cyan-400" /> Llenando tickets
          </div>
          <div className="text-5xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
            {raffle.sold}<span className="text-zinc-700">/{raffle.maxTickets}</span>
          </div>
          <p className="text-zinc-400 text-sm mt-4">Se sortea al alcanzar {raffle.maxTickets} tickets.</p>
          {raffle.winnersCount > 1 && (
            <p className="mt-3 text-amber-300 text-xs font-bold uppercase tracking-widest">
              Sorteo de {raffle.winnersCount} ganadores
            </p>
          )}
        </>
      )}

      {drawingNow && drawState?.phase === 'phase2' && Phase2View}
      {drawingNow && drawState?.phase === 'phase3_intro' && Phase3IntroView}
      {drawingNow && drawState?.phase === 'phase3' && Phase3View}
      {drawingNow && (drawState?.phase === 'phase1' || !drawState?.phase) && Phase1View}

      {drawingDone && (
        <div className="w-full max-w-xl space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-zinc-950 text-xs font-black uppercase tracking-widest">
              <Trophy size={14} />
              {raffle.winners && raffle.winners.length > 1 ? 'Ganadores' : 'Ganador'}
            </div>
          </div>
          <div className="space-y-3">
            {(raffle.winners ?? (raffle.winner ? [raffle.winner] : [])).map((w, idx) => (
              <div
                key={`w-${w.ticketNumber}-${idx}`}
                className="bg-gradient-to-r from-yellow-500/10 via-amber-400/5 to-transparent border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4"
              >
                {w.userImageUrl ? (
                  <img
                    src={w.userImageUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-zinc-950 text-xl font-black ring-2 ring-yellow-300 flex-shrink-0">
                    {w.userUsername?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-yellow-400 tabular-nums">
                      #{w.ticketNumber}
                    </span>
                    <a
                      href={`/profile/${w.userSlug}`}
                      className="text-lg font-black text-white hover:text-yellow-400 transition-colors truncate"
                    >
                      {w.userUsername}
                    </a>
                  </div>
                  {w.comment && (
                    <p className="mt-1 text-zinc-400 text-sm italic truncate">
                      &ldquo;{w.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(!raffle.winners || raffle.winners.length === 0) && !raffle.winner && (
              <p className="text-center text-zinc-500 text-sm italic">Sin ganadores registrados.</p>
            )}
          </div>
        </div>
      )}

      {raffle.status === 'cancelled' && (
        <>
          <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Cancelado
          </div>
          <p className="text-zinc-300 text-center max-w-md">{raffle.cancelReason || 'El sorteo fue cancelado.'}</p>
        </>
      )}
    </div>
  );

  // ─── Sidebar ────────────────────────────────────────────────────────────────
  const purchaseDisabled = raffle.status !== 'active' || maxBuy <= 0;

  const discord = raffle.viewer?.discord;
  const needsLogin = !logged;
  const canParticipate = !!raffle.viewer?.canParticipate;
  const blockReason = raffle.viewer?.blockReason;
  const needsEmailVerify = logged && !canParticipate && blockReason === 'email-not-verified';

  const Sidebar = (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-5">
      <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
        {raffle.imageUrl ? (
          <img src={raffle.imageUrl} alt={raffle.title} className="w-full h-full object-cover" />
        ) : (
          <Sparkles size={56} className="text-yellow-500/40" />
        )}
      </div>
      <div>
        <h1 className="text-xl font-black text-white leading-tight">{raffle.title}</h1>
        {raffle.description && (
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{raffle.description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-zinc-900 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Ticket</p>
          <p className="text-white font-black text-base">
            {isFree ? <span className="text-emerald-400">GRATIS</span> : `$${raffle.ticketPrice.toFixed(2)} ${raffle.currency}`}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Vendidos</p>
          <p className="text-white font-black text-base tabular-nums">{raffle.sold}/{raffle.maxTickets}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Ganadores</p>
          <p className="text-white font-black text-base tabular-nums">{raffle.winnersCount}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Tienes</p>
          <p className="text-white font-black text-base tabular-nums">{raffle.userTicketCount}</p>
        </div>
      </div>

      {raffle.status === 'active' && (
        <>
          {maxBuy > 0 && (
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comentario opcional</label>
              <input
                value={buyComment}
                onChange={(e) => setBuyComment(e.target.value.slice(0, 500))}
                placeholder="Mensaje al comprar el ticket"
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"
              />
            </div>
          )}

          {maxBuy > 0 && (
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cantidad</label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => setBuyCount((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500 text-white flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center text-2xl font-black tabular-nums text-white">{buyCount}</div>
                <button
                  onClick={() => setBuyCount((c) => Math.min(maxBuy, c + 1))}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500 text-white flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1 text-center">Máximo {maxBuy} en esta compra</p>
            </div>
          )}

          {buyError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {buyError}
            </div>
          )}

          {purchaseDisabled && raffle.userTicketCount >= raffle.maxTicketsPerUser && (
            <p className="text-zinc-500 text-xs text-center italic">Ya alcanzaste el máximo de tickets.</p>
          )}
          {purchaseDisabled && raffle.available <= 0 && (
            <p className="text-zinc-500 text-xs text-center italic">No quedan tickets disponibles.</p>
          )}

          {!purchaseDisabled && needsLogin && (
            <a
              href="/login"
              className="block text-center w-full bg-yellow-400 text-zinc-950 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-yellow-300"
            >
              Inicia sesión para participar
            </a>
          )}

          {!purchaseDisabled && needsEmailVerify && (
            <a
              href="/settings"
              className="block text-center w-full bg-orange-500 text-zinc-950 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-400 transition-colors"
            >
              Verifica tu correo para participar
            </a>
          )}

          {!purchaseDisabled && logged && !needsEmailVerify && discord && !discord.linked && (
            <a
              href="/settings#discord"
              className="block text-center w-full bg-zinc-900 hover:bg-zinc-800 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              Vincula tu Discord (opcional)
            </a>
          )}

          {!purchaseDisabled && isFree && !needsLogin && !needsEmailVerify && (
            <button
              onClick={buyFree}
              disabled={buyBusy}
              className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buyBusy ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
              Obtener {buyCount > 1 ? `${buyCount} tickets` : 'mi ticket'}
            </button>
          )}

          {!purchaseDisabled && !isFree && logged && !needsEmailVerify && paypalClientId && (
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: raffle.currency, intent: 'capture' }}>
              <PayPalButtons
                style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                createOrder={async () => {
                  setBuyError('');
                  try {
                    const res = await callAPI(`/api/raffle/${raffle.slug}/orders`, {
                      method: 'POST',
                      body: JSON.stringify({ count: buyCount }),
                    });
                    return res.orderId;
                  } catch (err: any) {
                    setBuyError(err?.message || 'No se pudo crear la orden.');
                    throw err;
                  }
                }}
                onApprove={async (data) => {
                  setBuyBusy(true);
                  try {
                    const res = await callAPI(`/api/raffle/${raffle.slug}/tickets`, {
                      method: 'POST',
                      body: JSON.stringify({
                        count: buyCount,
                        comment: buyComment || undefined,
                        paypalOrderId: data.orderID,
                      }),
                    });
                    const minted = res?.tickets?.length ?? 0;
                    setRaffle((r) => ({
                      ...r,
                      userTicketCount: r.userTicketCount + minted,
                      sold: r.sold + minted,
                      available: Math.max(0, r.available - minted),
                    }));
                    setBuyComment('');
                    setBuyCount(1);
                    loadTickets(1);
                  } catch (err: any) {
                    setBuyError(err?.message || 'No se pudo confirmar el ticket.');
                  } finally {
                    setBuyBusy(false);
                  }
                }}
                onError={(err: any) => {
                  setBuyError(err?.message || 'PayPal devolvió un error.');
                  setBuyBusy(false);
                }}
              />
            </PayPalScriptProvider>
          )}

        </>
      )}
    </div>
  );

  // Set of surviving ticket numbers (5-padded) for the trophy badge in the
  // tickets table.
  const survivingNumbers = useMemo(() => {
    if (!raffle.winners) return new Set<string>();
    return new Set(raffle.winners.map((w) => w.ticketNumber));
  }, [raffle.winners]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* One-off keyframes for the phase-2 wind-gust animation. Tailwind
          arbitrary `animate-[name_…]` references it by name. */}
      <style>{`
        @keyframes wind-blow {
          0%   { transform: translate(0, 0) rotate(0); }
          25%  { transform: translate(-20px, -8px) rotate(-12deg); }
          50%  { transform: translate(20px, 6px) rotate(10deg); }
          75%  { transform: translate(-10px, -4px) rotate(-6deg); }
          100% { transform: translate(0, 0) rotate(0); }
        }
      `}</style>
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

      <div className="relative pt-20 h-64 md:h-80 overflow-hidden bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950">
        {raffle.bannerUrl && (
          <img src={raffle.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 h-full flex items-end pb-8">
          <div>
            <a href="/luckys" className="text-yellow-400 text-xs font-black uppercase tracking-widest hover:text-yellow-300">← Luckys</a>
            <h1 className="mt-2 text-4xl md:text-5xl font-black text-white tracking-tighter">{raffle.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">{Sidebar}</div>
          <div className="lg:col-span-6 space-y-4">
            {Center}
            {MyTicketsRow}
          </div>
          <div className="lg:col-span-3">{Chat}</div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Users size={18} className="text-cyan-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Participantes</h2>
            <span className="text-zinc-500 text-sm">({ticketsTotal})</span>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            {ticketsLoading && (
              <div className="p-8 flex justify-center"><Loader2 size={20} className="text-zinc-500 animate-spin" /></div>
            )}
            {!ticketsLoading && tickets.length === 0 && (
              <p className="p-8 text-center text-zinc-500 text-sm">Sin participantes aún.</p>
            )}
            {!ticketsLoading && tickets.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-left bg-zinc-900/40">
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Estado</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Ticket</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Usuario</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Comentario</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => {
                      const isEliminated = !!t.eliminatedAt;
                      const isWinner = drawingDone && survivingNumbers.has(t.number);
                      return (
                        <tr
                          key={t.id}
                          className={`border-t border-zinc-800 hover:bg-zinc-900/40 transition-colors ${
                            isEliminated ? 'bg-red-500/10 border-l-2 border-l-red-500/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            {isWinner && <span title="Ganador" className="text-lg">🏆</span>}
                            {isEliminated && (
                              <span title={`Eliminado #${t.eliminationOrder ?? '?'}`} className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                                Out #{t.eliminationOrder ?? '?'}
                              </span>
                            )}
                            {!isWinner && !isEliminated && (
                              <span className="text-zinc-600 text-[10px]">—</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-black tabular-nums ${isEliminated ? 'text-zinc-500 line-through' : 'text-yellow-400'}`}>
                            #{t.number}
                          </td>
                          <td className="px-4 py-3">
                            <a href={`/profile/${t.userSlug}`} className={`flex items-center gap-2 hover:text-cyan-400 ${isEliminated ? 'opacity-60' : ''}`}>
                              {t.userImageUrl ? (
                                <img src={t.userImageUrl} alt="" className={`w-7 h-7 rounded-full object-cover ${isEliminated ? 'grayscale' : ''}`} />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                                  {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                                </div>
                              )}
                              <span className="font-bold text-white">{t.userUsername}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 max-w-md truncate">{t.comment ?? '—'}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {ticketsTotal > 30 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => loadTickets(Math.max(1, ticketsPage - 1))}
                disabled={ticketsPage <= 1 || ticketsLoading}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-xs text-zinc-400">
                Página {ticketsPage} de {Math.ceil(ticketsTotal / 30)}
              </span>
              <button
                onClick={() => loadTickets(ticketsPage + 1)}
                disabled={ticketsPage >= Math.ceil(ticketsTotal / 30) || ticketsLoading}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 disabled:opacity-30"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RaffleDetailPage;
