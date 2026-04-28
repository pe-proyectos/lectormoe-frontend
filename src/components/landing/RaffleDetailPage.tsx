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
  completedAt?: string | null;
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
  aliveTicketCount?: number;
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
  horseSteps: number;
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

interface RecentEliminatedEntry {
  id: number;
  number: string;
  rawNumber: number;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  eliminationOrder: number;
}

interface DrawState {
  status: string;
  phase: 'phase1' | 'phase2_intro' | 'phase2' | 'phase3_intro' | 'phase3' | null;
  totalTickets: number;
  eliminatedCount: number;
  remainingCount: number;
  winnersCount: number;
  eliminationsRemaining: number;
  eliminationsUntilNextPhase: number | null;
  phaseEndsApproxAt: string | null;
  eliminationIntervalMs: number;
  lastEliminationAt: string | null;
  nextEliminationAt: string | null;
  // Phase 2
  lightState: 'red' | 'green' | null;
  nextWindAt: string | null;
  nextLightChangeAt: string | null;
  // Phase 3 / shared lobby
  phase3StartsAt: string | null;
  phaseIntroEndsAt: string | null;
  phase3StartedAt: string | null;
  nextHorseAdvanceAt: string | null;
  nextHorseEliminationAt: string | null;
  lastPlace: AliveTicket | null;
  isFinaleStretch?: boolean;
  phase1Bombs?: {
    bombTicketIds: number[];
    explodeCount: number;
    placedAt: string;
    fuseMs: number;
  } | null;
  intervals?: {
    phase1Ms: number;
    phase2WindMs: number;
    phase2LightMs: number;
    phase3AdvanceMs: number;
    phase3EliminationMs: number;
  };
  // Rosters
  aliveTickets: AliveTicket[];
  recentEliminated: RecentEliminatedEntry[];
  winners: Winner[] | null;
}

// Splash banner content per phase. Drives the 3s overlay that introduces
// each phase so viewers understand the rules before the action starts.
const PHASE_SPLASH: Record<string, { title: string; subtitle: string; emoji: string; gradient: string }> = {
  phase1: {
    title: 'Fase 1 · Eliminación rápida',
    subtitle: 'Cada 4 segundos cae uno al azar. Hasta 30 sobrevivientes.',
    emoji: '⚡',
    gradient: 'from-amber-500/30 via-zinc-950 to-amber-500/30',
  },
  phase2_intro: {
    title: 'Sobrevivientes · Pausa de 60 segundos',
    subtitle: 'La fase 2 empieza pronto. Quedan los 30 más afortunados.',
    emoji: '⏳',
    gradient: 'from-cyan-500/30 via-zinc-950 to-cyan-500/30',
  },
  phase2: {
    title: 'Fase 2 · Luz Roja, Luz Verde',
    subtitle: 'Cada 3s una ráfaga sopla 5 tickets. Los movidos durante luz ROJA caen.',
    emoji: '🚦',
    gradient: 'from-red-500/30 via-zinc-950 to-emerald-500/30',
  },
  phase3_intro: {
    title: 'Finalistas · Pausa de 60 segundos',
    subtitle: 'La carrera de caballos está por empezar. Quedan los 10 más fuertes.',
    emoji: '🐎',
    gradient: 'from-amber-400/30 via-zinc-950 to-amber-400/30',
  },
  phase3: {
    title: 'Fase 3 · ¡Que comience la carrera!',
    subtitle: 'Cada 3s avanzan 1-3 pasos. Cada 12s cae el último.',
    emoji: '🏁',
    gradient: 'from-amber-400/30 via-amber-500/20 to-amber-400/30',
  },
};

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
  const [commentError, setCommentError] = useState('');
  // Last successful comment timestamp (FE-side spam guard mirroring the
  // backend's 3s cooldown — keeps the button disabled so users don't even
  // try to submit during the cooldown window).
  const [commentLastSentAt, setCommentLastSentAt] = useState<number>(0);
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
  // Phase 1 / 3 explosion animation — ticket id added on elimination event,
  // removed after ~2.5s (matches the keyframe duration so the avatar
  // settles into "dead" styling without snapping).
  const [popExitIds, setPopExitIds] = useState<Set<number>>(() => new Set());

  // Phase 1 bomb-round state.
  //   bombArmedIds: tickets currently ticking with bomb emoji + shake.
  //                 Populated by phase1_bombs_placed; cleared on _exploded.
  //   smokeIds:     tickets that survived the round (bomb fizzled into smoke).
  //                 Held briefly so the smoke puff animation finishes.
  //   bombsPlacedAt: ISO timestamp of when the current round started, used
  //                  to drive the depleting fuse bar.
  //   bombFuseMs:   how long the fuse runs (default 5000 from server).
  const [bombArmedIds, setBombArmedIds] = useState<Set<number>>(() => new Set());
  const [smokeIds, setSmokeIds] = useState<Set<number>>(() => new Set());
  const [bombsPlacedAt, setBombsPlacedAt] = useState<string | null>(null);
  const [bombFuseMs, setBombFuseMs] = useState<number>(5000);
  const [bombExplodeCount, setBombExplodeCount] = useState<number>(5);

  // Phase-change splash overlay: shows the phase title + rules for 3s when
  // a phase_started event arrives. Adds a beat of drama between transitions.
  const [phaseSplash, setPhaseSplash] = useState<string | null>(null);
  // Light-change flash overlay (phase 2): brief tinted full-card overlay
  // when the light flips so viewers can't miss it.
  const [lightFlash, setLightFlash] = useState<'red' | 'green' | null>(null);

  const countdown = useCountdown(raffle.drawType === 'countdown' ? raffle.drawAt : null);
  const isFree = raffle.ticketPrice === 0;
  const drawingDone = raffle.status === 'completed';
  const drawingNow = raffle.status === 'drawing';

  const maxBuy = Math.max(0, Math.min(
    raffle.maxTicketsPerUser - raffle.userTicketCount,
    raffle.available,
  ));

  // Single-page load: pull every ticket in one request so the table can
  // surface the whole roster with real-time elimination state. Cap at 1000
  // (matches the controller); for larger raffles we'd need to paginate
  // again, but the elimination tournament typically tops out under that.
  //
  // `silent` skips the loading flag for background polls — otherwise the 3s
  // poll flashes a spinner over the table every cycle (causes layout shift).
  const loadTickets = async (silent = false) => {
    if (!silent) setTicketsLoading(true);
    try {
      const data = await callAPI(`/api/raffle/${raffle.slug}/tickets?page=1&limit=1000`);
      const items = data?.items;
      if (Array.isArray(items)) {
        setTickets((prev) => {
          // Defensive: ignore an empty silent response when we already had
          // rows on screen — a transient API hiccup or in-flight race
          // shouldn't blink the whole table away. If the previous render
          // had data, keep it until a future poll confirms it's gone.
          if (silent && items.length === 0 && prev.length > 0) return prev;
          // Skip the state update entirely when nothing changed — same
          // length, same ids in same positions, same elimination state.
          // Avoids re-rendering 99 rows on every 3s tick.
          if (prev.length === items.length) {
            let identical = true;
            for (let i = 0; i < prev.length; i++) {
              if (
                prev[i].id !== items[i].id ||
                prev[i].eliminatedAt !== items[i].eliminatedAt ||
                prev[i].eliminationOrder !== items[i].eliminationOrder ||
                prev[i].horseSteps !== items[i].horseSteps
              ) { identical = false; break; }
            }
            if (identical) return prev;
          }
          return items;
        });
        setTicketsTotal(data?.total ?? 0);
        setTicketsPage(1);
      }
    } catch (err) {
      // ignore
    } finally {
      if (!silent) setTicketsLoading(false);
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

  useEffect(() => {
    loadTickets(false);
    loadComments();
    loadMyTickets();
    // Re-run on login state change too so a viewer who logs in mid-session
    // immediately gets their "Mis tickets" strip populated.
    // eslint-disable-next-line
  }, [raffle.slug, logged]);

  // ─── Draw-state polling: source of truth during 'drawing' ────────────────────
  // Also fires when status='active' but drawAt has passed — that's the window
  // where the cron is about to / has just fired executeDraw, and we want to
  // catch the active→drawing transition even if the SSE draw_started event
  // got dropped (CloudFlare idle-timeout, brief network hiccup, etc.).
  useEffect(() => {
    const drawAtPassed = !!raffle.drawAt && new Date(raffle.drawAt).getTime() <= Date.now();
    const shouldPoll = raffle.status === 'drawing'
      || (raffle.status === 'active' && drawAtPassed);
    if (!shouldPoll) return;
    let cancelled = false;
    let stopped = false;
    const poll = async () => {
      if (cancelled || stopped) return;
      try {
        const data = await callAPI(`/api/raffle/${raffle.slug}/draw-state`);
        if (cancelled) return;
        if (data) {
          const ds = data as DrawState;
          setDrawState(ds);
          // Sync raffle.status from the draw-state if they diverge — covers
          // the missed-SSE case so we transition into the phase view as soon
          // as the backend flips status, regardless of whether draw_started
          // ever reached the FE.
          setRaffle((r) => (ds.status !== r.status ? { ...r, status: ds.status } : r));
          // Hydrate phase-1 bomb state from the snapshot. If we joined
          // mid-round we need to render the ticking bombs even though the
          // SSE phase1_bombs_placed event already fired before we connected.
          if (ds.phase1Bombs && ds.phase1Bombs.bombTicketIds.length > 0) {
            const ids = new Set(ds.phase1Bombs.bombTicketIds);
            setBombArmedIds((prev) => {
              if (prev.size === ids.size) {
                let same = true;
                for (const id of ids) if (!prev.has(id)) { same = false; break; }
                if (same) return prev;
              }
              return ids;
            });
            setBombsPlacedAt(ds.phase1Bombs.placedAt);
            setBombFuseMs(ds.phase1Bombs.fuseMs);
            setBombExplodeCount(ds.phase1Bombs.explodeCount);
          } else if (bombArmedIds.size > 0) {
            setBombArmedIds(new Set());
            setBombsPlacedAt(null);
          }
          if (ds.status === 'completed') {
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
  }, [raffle.slug, raffle.status, raffle.drawAt]);

  // 200ms re-render driver so the "Próxima eliminación en Xs" countdown ticks
  // smoothly between server polls without re-firing fetches.
  useEffect(() => {
    if (raffle.status !== 'drawing') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [raffle.status]);

  // When status='active' and drawAt is in the future, schedule a one-shot
  // refetchRaffle() shortly after drawAt is supposed to pass — protects
  // against the case where the page sits open across the cron tick and the
  // SSE draw_started event was never delivered. Once status flips, the
  // drawState polling effect above takes over.
  useEffect(() => {
    if (raffle.status !== 'active' || !raffle.drawAt) return;
    const ms = new Date(raffle.drawAt).getTime() - Date.now();
    if (ms < 0) {
      // drawAt already passed — poll the raffle endpoint every 5s until the
      // status changes (the cron has up to 60s of jitter).
      const id = window.setInterval(refetchRaffle, 5000);
      return () => window.clearInterval(id);
    }
    // Schedule the first refetch 3s after drawAt so the cron has time to
    // claim and broadcast.
    const id = window.setTimeout(refetchRaffle, ms + 3000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line
  }, [raffle.slug, raffle.status, raffle.drawAt]);

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
        if (typeof e.ticketId === 'number') {
          const id = e.ticketId;
          setPopExitIds((prev) => new Set(prev).add(id));
          // Hold the explosion animation full 2.5s so it doesn't get cut
          // off when the next poll redraws the grid with the now-eliminated
          // ticket marked.
          setTimeout(() => {
            setPopExitIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }, 2500);
        }
        pollDrawStateNow();
        loadMyTickets();
        loadComments();
      } else if (e.type === 'phase_started') {
        if (typeof e.phase === 'string' && PHASE_SPLASH[e.phase]) {
          setPhaseSplash(e.phase);
          setTimeout(() => setPhaseSplash(null), 3500);
        }
        // Clear phase-1 bomb leftovers on phase change.
        setBombArmedIds(new Set());
        setSmokeIds(new Set());
        setBombsPlacedAt(null);
        pollDrawStateNow();
      } else if (e.type === 'phase1_bombs_placed') {
        const ids: number[] = Array.isArray(e.bombTicketIds) ? e.bombTicketIds : [];
        setBombArmedIds(new Set(ids));
        setBombsPlacedAt(new Date().toISOString());
        setBombFuseMs(typeof e.fuseMs === 'number' ? e.fuseMs : 5000);
        setBombExplodeCount(typeof e.explodeCount === 'number' ? e.explodeCount : 5);
      } else if (e.type === 'phase1_bombs_exploded') {
        const exploded: number[] = Array.isArray(e.explodedTicketIds) ? e.explodedTicketIds : [];
        const smoke: number[] = Array.isArray(e.smokeTicketIds) ? e.smokeTicketIds : [];
        // Pop the explosion animation on the actually-eliminated tickets.
        setPopExitIds((prev) => {
          const n = new Set(prev);
          for (const id of exploded) n.add(id);
          return n;
        });
        setTimeout(() => {
          setPopExitIds((prev) => {
            const n = new Set(prev);
            for (const id of exploded) n.delete(id);
            return n;
          });
        }, 2500);
        // Smoke puff for the survivors of the round (bombs that fizzled).
        setSmokeIds(new Set(smoke));
        setTimeout(() => setSmokeIds(new Set()), 1800);
        // Clear the armed-bomb visuals — they've now resolved one way or another.
        setBombArmedIds(new Set());
        setBombsPlacedAt(null);
        pollDrawStateNow();
        loadMyTickets();
        loadComments();
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
            loadComments();
          }, 2000);
        }
        pollDrawStateNow();
      } else if (e.type === 'light_change') {
        const next: 'red' | 'green' = e.lightState === 'red' ? 'red' : 'green';
        setLightFlash(next);
        setTimeout(() => setLightFlash(null), 700);
        pollDrawStateNow();
      } else if (e.type === 'horse_advance') {
        pollDrawStateNow();
      } else if (e.type === 'horse_elimination') {
        if (typeof e.ticketId === 'number') {
          const id = e.ticketId;
          setPopExitIds((prev) => new Set(prev).add(id));
          setTimeout(() => {
            setPopExitIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }, 2500);
        }
        pollDrawStateNow();
        loadMyTickets();
        loadComments();
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

  // 3s polling for the participants table so eliminations show up in
  // real-time even if SSE drops. Silent fetch — keeps the table on screen
  // and only swaps the row data so no layout shift.
  useEffect(() => {
    let cancelled = false;
    const id = window.setInterval(() => {
      if (!cancelled) loadTickets(true);
    }, 3000);
    return () => { cancelled = true; window.clearInterval(id); };
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

  const COMMENT_COOLDOWN_MS = 3_000;
  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || commentBusy) return;
    if (!logged) { window.location.href = '/login'; return; }
    const sinceLast = Date.now() - commentLastSentAt;
    if (sinceLast < COMMENT_COOLDOWN_MS) {
      const waitS = Math.ceil((COMMENT_COOLDOWN_MS - sinceLast) / 1000);
      setCommentError(`Espera ${waitS}s antes de enviar otro mensaje.`);
      return;
    }
    setCommentBusy(true);
    setCommentError('');
    try {
      await callAPI(`/api/raffle/${raffle.slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setCommentDraft('');
      setCommentLastSentAt(Date.now());
    } catch (err: any) {
      // Surface backend errors (cooldown collision, chat closed, etc.)
      // to the user instead of silently swallowing in the console.
      setCommentError(err?.message || 'No se pudo enviar el mensaje.');
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
      loadTickets(true);
      loadMyTickets();
    } catch (err: any) {
      setBuyError(err?.message || 'Error al obtener el ticket.');
    } finally {
      setBuyBusy(false);
    }
  };

  // ─── Right-side chat block ──────────────────────────────────────────────────
  // Chat closes 1 hour after the raffle finishes — server enforces this on
  // POST, FE mirrors so the input is hidden + a "cerrado" notice replaces it.
  const CHAT_CLOSE_AFTER_MS = 60 * 60 * 1000;
  const chatClosed = (raffle.status === 'cancelled')
    || (raffle.status === 'completed' && raffle.completedAt
        && (Date.now() - new Date(raffle.completedAt).getTime()) > CHAT_CLOSE_AFTER_MS);
  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ''; }
  };

  const Chat = (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 flex flex-col h-[600px] lg:h-full lg:max-h-[700px] lg:min-h-[600px]">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
        <Sparkles size={14} className="text-yellow-400" />
        <h3 className="text-xs font-black text-white uppercase tracking-widest">Chat en vivo</h3>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">{comments.length}</span>
      </div>
      <div ref={commentsScrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {comments.length === 0 && (
          <p className="text-zinc-600 text-xs italic text-center mt-4">Sé el primero en comentar.</p>
        )}
        {comments.map((c) => {
          // Three states for the badge based on (alive, total) ticket counts:
          //   total=0      → no badge (regular comment)
          //   alive>0      → blue: still in the draw
          //   alive=0      → red: had tickets but all eliminated
          const total = c.ticketCount ?? 0;
          const alive = c.aliveTicketCount ?? total; // back-compat: assume alive when field absent
          const stillIn = total > 0 && alive > 0;
          const allOut = total > 0 && alive === 0;
          const badgeText = total === 0
            ? null
            : alive === total
            ? `${total}`
            : `${alive}/${total}`;
          return (
            <div
              key={c.id}
              className={`flex gap-2 px-2 py-1.5 rounded-lg text-[12px] leading-snug ${
                stillIn ? 'bg-cyan-500/8 border-l-2 border-cyan-500/40'
                : allOut ? 'bg-red-500/5 border-l-2 border-red-500/30'
                : ''
              }`}
            >
              {c.userImageUrl ? (
                <img src={c.userImageUrl} alt="" className={`w-6 h-6 rounded-full object-cover flex-shrink-0 ${allOut ? 'grayscale opacity-70' : ''}`} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                  {c.userUsername?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={`/profile/${c.userSlug}`}
                  className={`text-[11px] font-black ${
                    stillIn ? 'text-cyan-300' : allOut ? 'text-red-400' : 'text-zinc-300'
                  } hover:underline`}
                >
                  {c.userUsername}
                </a>
                {badgeText && (
                  <span
                    className={`ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black tabular-nums ${
                      stillIn ? 'bg-cyan-500/20 text-cyan-300' : 'bg-red-500/20 text-red-300'
                    }`}
                    title={
                      stillIn
                        ? `${alive} de ${total} ticket(s) en juego`
                        : `${total} ticket(s), todos eliminados`
                    }
                  >
                    {badgeText} 🎟️
                  </span>
                )}
                <span
                  className="ml-1 text-[9px] text-zinc-500 font-mono tabular-nums"
                  title={new Date(c.createdAt).toLocaleString('es-ES')}
                >
                  {formatTime(c.createdAt)}
                </span>
                <span className={`ml-1.5 break-words ${allOut ? 'text-zinc-400' : 'text-zinc-200'}`}>
                  {linkifyMentions(c.body)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {chatClosed ? (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-[11px] text-zinc-500 italic text-center px-3 py-2 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            🔒 El chat está cerrado.
          </p>
        </div>
      ) : (
      <div className="mt-3 pt-3 border-t border-zinc-800">
        {commentError && (
          <p className="mb-2 text-[10px] text-red-400 italic px-2">{commentError}</p>
        )}
        <div className="flex gap-2">
        <input
          value={commentDraft}
          onChange={(e) => { setCommentDraft(e.target.value); if (commentError) setCommentError(''); }}
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
      )}
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
  // Shared by phase2_intro AND phase3_intro — same timestamp slot.
  const phaseIntroSeconds = useMemo(
    () => secondsUntil(drawState?.phaseIntroEndsAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.phaseIntroEndsAt, tick],
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
  const phaseEndsApproxSeconds = useMemo(
    () => secondsUntil(drawState?.phaseEndsApproxAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState?.phaseEndsApproxAt, tick],
  );

  // Format "Xm Ys" / "Ys" for short countdowns (sub-1h).
  const formatCountdown = (sec: number | null): string => {
    if (sec === null) return '—';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // Fuse countdown for phase-1 bombs: shows the seconds remaining from a
  // wall-clock placed-at + duration anchor. Stays visually at "0s" once the
  // fuse hits zero, until the explosion event clears bombArmedIds — gives
  // the user a beat of "any moment now…" tension.
  const BombFuseCountdown: React.FC<{ placedAt: string | null; fuseMs: number; tick: number }> = ({ placedAt, fuseMs }) => {
    if (!placedAt) return <span className="text-2xl font-black text-amber-300 tabular-nums">—</span>;
    const elapsed = Date.now() - new Date(placedAt).getTime();
    const remainingMs = Math.max(0, fuseMs - elapsed);
    const remainingS = Math.ceil(remainingMs / 1000);
    const danger = remainingMs <= 1500;
    return (
      <span className={`font-black tabular-nums tracking-tighter transition-all ${
        danger
          ? 'text-red-400 text-4xl animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.9)]'
          : 'text-amber-300 text-3xl'
      }`}>
        {remainingS}s
      </span>
    );
  };

  // Dramatic countdown: red + pulse + visual zoom when ≤3s. Uses CSS scale
  // transform (NOT a font-size change) so the slot it occupies in the layout
  // stays exactly the same and doesn't push other elements around.
  const DramaticCountdown: React.FC<{ seconds: number | null; dangerThreshold?: number }> = ({ seconds, dangerThreshold = 3 }) => {
    const inDanger = seconds !== null && seconds <= dangerThreshold && seconds > 0;
    return (
      <span className="inline-block relative w-full text-center" style={{ height: '2.25rem' /* 36px reserved for 3xl text */ }}>
        <span
          className={`absolute inset-0 flex items-center justify-center font-black tabular-nums tracking-tighter text-3xl transition-all duration-300 origin-center ${
            inDanger
              ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.9)] scale-150'
              : 'text-amber-300 scale-100'
          }`}
        >
          {seconds !== null ? `${seconds}s` : '—'}
        </span>
      </span>
    );
  };

  // Phase splash overlay — fades in / scales the rules card for 3s on every
  // phase transition. Sits absolutely on top of the Center column.
  const PhaseSplash = phaseSplash ? (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl overflow-hidden pointer-events-none animate-[splash-fade_3.5s_ease-in-out_forwards]">
      <div className={`absolute inset-0 bg-gradient-to-br ${PHASE_SPLASH[phaseSplash].gradient} backdrop-blur-sm`} />
      <div className="relative text-center px-6">
        <div className="text-7xl mb-2">{PHASE_SPLASH[phaseSplash].emoji}</div>
        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
          {PHASE_SPLASH[phaseSplash].title}
        </h3>
        <p className="mt-2 text-zinc-300 text-sm md:text-base max-w-md mx-auto">
          {PHASE_SPLASH[phaseSplash].subtitle}
        </p>
      </div>
    </div>
  ) : null;

  // Light-change flash — quick full-card tint that fades out.
  const LightFlash = lightFlash ? (
    <div
      className={`absolute inset-0 z-20 rounded-3xl pointer-events-none animate-[flash-fade_0.7s_ease-out_forwards] ${
        lightFlash === 'red' ? 'bg-red-500/40' : 'bg-emerald-500/40'
      }`}
    />
  ) : null;

  // Depleting progress bar for the secondary cyclic counters (wind cycle,
  // light cycle, horse-advance interval). The CSS keyframe linearly drains
  // width 100% → 0% over the interval. We restart the animation by changing
  // the `key` prop whenever the cycle anchor (lastEventAt) updates, which
  // remounts the bar — no JS tick loop needed, GPU-cheap, no layout shift.
  const TimedProgressBar: React.FC<{
    durationMs: number | undefined;
    anchor: string | null | undefined;
    color: string;
  }> = ({ durationMs, anchor, color }) => {
    const ms = durationMs && durationMs > 0 ? durationMs : 1000;
    return (
      <div className="relative w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div
          key={`${anchor ?? 'init'}-${ms}`}
          className={`absolute inset-y-0 left-0 ${color}`}
          style={{
            width: '100%',
            animation: `progress-deplete ${ms}ms linear forwards`,
          }}
        />
      </div>
    );
  };

  // Shared "ya cayeron" strip — ALWAYS rendered (with empty-state placeholder
  // when nothing's happened yet) so the layout doesn't shift the moment the
  // first elimination arrives. Reserves a fixed min-height matching its
  // populated form.
  const RecentEliminatedStrip = (
    <div className="w-full" style={{ minHeight: '5rem' }}>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
        <Skull size={10} /> Últimos eliminados
        {drawState?.eliminatedCount ? ` (${Math.min(10, drawState.eliminatedCount)} de ${drawState.eliminatedCount})` : ''}
      </p>
      {drawState?.recentEliminated && drawState.recentEliminated.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {drawState.recentEliminated.map((e) => (
            <div
              key={`recent-${e.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 w-12"
              title={`#${e.eliminationOrder} · @${e.userUsername} · ticket #${e.number}`}
            >
              <div className="relative">
                {e.userImageUrl ? (
                  <img src={e.userImageUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-red-500/40 grayscale opacity-70" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 ring-1 ring-red-500/40">
                    {e.userUsername?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="absolute -top-1 -right-1 px-1 py-0 rounded-full bg-red-500 text-white text-[8px] font-black tabular-nums leading-tight">
                  {e.eliminationOrder}°
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-500 tabular-nums leading-none">
                #{e.number}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">Aún nadie ha caído.</p>
      )}
    </div>
  );

  // Shared phase header. Subtitle slot reserves a 2-line min-height so
  // copy of different lengths doesn't push the rest of the column up/down.
  const PhaseHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => {
    const total = drawState?.totalTickets ?? 0;
    const eliminated = drawState?.eliminatedCount ?? 0;
    const remaining = drawState?.remainingCount ?? 0;
    const pct = total > 0 ? Math.round((eliminated / total) * 100) : 0;
    return (
      <div className="w-full text-center mb-4">
        <div className="text-yellow-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
          {icon} {title}
        </div>
        <p className="text-zinc-400 text-[11px] mt-1 leading-tight" style={{ minHeight: '2.6rem' }}>
          {subtitle ?? ''}
        </p>
        <div className="mt-3 max-w-md mx-auto">
          <div className="flex items-baseline justify-between text-[10px] font-black uppercase tracking-widest mb-1">
            <span className="text-emerald-300 tabular-nums">{remaining} vivos</span>
            <span className="text-zinc-500 tabular-nums">{eliminated} de {total} eliminados</span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Renders the FULL ticket grid (alive + eliminated) for phases 1 and 2.
  // Critical anti-shift design: every ticket stays in the DOM at its initial
  // grid slot — eliminated ones just get grayscale + ✕ overlay. This means
  // surviving avatars never reflow when a neighbour gets knocked out.
  const renderFullTicketGrid = (size: 'sm' | 'md' = 'sm') => {
    // Sort once by ticket number so the order is stable across re-renders.
    const sorted = [...tickets].sort((a, b) => a.number.localeCompare(b.number));
    const sizeCls = size === 'md' ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-9 h-9 sm:w-10 sm:h-10';
    return (
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 content-start">
        {sorted.map((t) => {
          const isEliminated = !!t.eliminatedAt;
          const popping = popExitIds.has(t.id);
          const blowing = blowingIds.has(t.id);
          const killed = redKilledIds.has(t.id);
          const armed = bombArmedIds.has(t.id);
          const smoking = smokeIds.has(t.id);
          const ringCls = killed || isEliminated
            ? 'ring-red-500/60'
            : armed
            ? 'ring-amber-400'
            : 'ring-zinc-700';
          const fadedCls = (isEliminated || killed) && !popping ? 'grayscale opacity-50' : '';
          // Armed bombs shake (tick-tack), increasing intensity as the
          // fuse approaches zero. We use one 0.6s shake cycle that loops
          // — visually "buzzing" the ticket.
          const shakeCls = armed && !popping ? 'animate-[bomb-tick_0.6s_ease-in-out_infinite]' : '';
          return (
            <div
              key={`grid-${t.id}`}
              className={`relative flex flex-col items-center gap-0.5 ${
                popping ? 'animate-[ticket-explode_2.5s_ease-out_forwards] z-10' : ''
              } ${blowing ? 'animate-[wind-blow_1.2s_ease-out]' : ''} ${shakeCls}`}
              title={`@${t.userUsername} · #${t.number}${isEliminated ? ' · eliminado' : armed ? ' · ¡bomba!' : ''}`}
            >
              {t.userImageUrl ? (
                <img
                  src={t.userImageUrl}
                  alt=""
                  className={`${sizeCls} rounded-full object-cover ring-2 ${ringCls} ${fadedCls} ${armed ? 'shadow-[0_0_10px_rgba(252,211,77,0.6)]' : ''}`}
                />
              ) : (
                <div className={`${sizeCls} rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 ring-2 ${ringCls} ${fadedCls} ${armed ? 'shadow-[0_0_10px_rgba(252,211,77,0.6)]' : ''}`}>
                  {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className={`text-[9px] font-mono font-bold tabular-nums leading-none ${isEliminated ? 'text-zinc-600 line-through' : armed ? 'text-amber-300' : 'text-zinc-400'}`}>
                #{t.number}
              </span>
              {/* Bomb emoji overlay during the fuse */}
              {armed && !popping && (
                <span className="absolute -top-1.5 -right-1.5 text-base pointer-events-none drop-shadow-md">
                  💣
                </span>
              )}
              {popping && (
                <span className="absolute inset-0 flex items-center justify-center text-3xl pointer-events-none drop-shadow-lg">
                  💥
                </span>
              )}
              {smoking && !popping && (
                <span className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none animate-[smoke-puff_1.8s_ease-out_forwards]">
                  💨
                </span>
              )}
              {(killed || (isEliminated && !popping && !smoking)) && (
                <span className="absolute top-0 inset-x-0 flex items-center justify-center text-2xl font-black text-red-500 pointer-events-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">✕</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Phase 1: avatar grid + explosion animation + recent eliminated ─────
  const Phase1View = (
    <div className="w-full space-y-4">
      <PhaseHeader
        icon={<Sparkles size={14} />}
        title="Fase 1 · Eliminación rápida"
        subtitle={`Eliminamos uno al azar cada 5 segundos hasta que queden 30. ${
          drawState?.eliminationsUntilNextPhase != null
            ? `Faltan ${drawState.eliminationsUntilNextPhase} para la fase 2.`
            : ''
        }`}
      />
      {/* Phase 1 timing card — driven by the bomb round. While bombs are
          armed we show the fuse countdown ticking from fuseMs to 0; when
          the round resolves we briefly show a "smoke clearing" message
          before the next round arms. */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <div className={`border rounded-2xl p-3 h-24 flex flex-col gap-1 transition-colors duration-300 ${
          bombArmedIds.size > 0
            ? 'bg-amber-500/10 border-amber-500/50'
            : 'bg-zinc-900/70 border-zinc-800'
        }`}>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
            {bombArmedIds.size > 0
              ? `💣 ${bombArmedIds.size} bombas · ${bombExplodeCount} explotan`
              : smokeIds.size > 0
              ? '💨 humo despejándose…'
              : 'Próxima ronda'}
          </p>
          <div className="flex-1 flex items-center justify-center">
            {bombArmedIds.size > 0 ? (
              <BombFuseCountdown placedAt={bombsPlacedAt} fuseMs={bombFuseMs} tick={tick} />
            ) : (
              <span className="text-2xl font-black text-cyan-300 tabular-nums">
                {smokeIds.size > 0 ? 'pronto…' : '…'}
              </span>
            )}
          </div>
          {bombArmedIds.size > 0 && bombsPlacedAt && (
            <TimedProgressBar
              durationMs={bombFuseMs}
              anchor={bombsPlacedAt}
              color="bg-amber-400"
            />
          )}
        </div>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 h-24 flex flex-col justify-between">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Fase termina aprox en</p>
          <p className="text-3xl font-black text-cyan-300 tabular-nums text-center">
            {formatCountdown(phaseEndsApproxSeconds)}
          </p>
        </div>
      </div>
      {renderFullTicketGrid('sm')}
    </div>
  );

  // ─── Phase 2: Squid-Game wind + lights ────────────────────────────────
  const Phase2View = (
    <div className="w-full space-y-4">
      <PhaseHeader
        icon={<Wind size={14} />}
        title="Fase 2 · Luz Roja, Luz Verde"
        subtitle={`Cada 3s una ráfaga sopla 5 tickets al azar; los movidos durante luz ROJA quedan eliminados. ${
          drawState?.eliminationsUntilNextPhase != null
            ? `Faltan ${drawState.eliminationsUntilNextPhase} para la fase final.`
            : ''
        }`}
      />
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 h-24 flex flex-col gap-1.5">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center justify-center gap-1">
            <Wind size={10} /> Próxima ráfaga
          </p>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl font-black text-cyan-300 tabular-nums">{nextWindSeconds !== null ? `${nextWindSeconds}s` : '—'}</span>
          </div>
          <TimedProgressBar
            durationMs={drawState?.intervals?.phase2WindMs}
            anchor={drawState?.lastWindAt}
            color="bg-cyan-400"
          />
        </div>
        <div
          className={`border rounded-2xl p-3 h-24 flex flex-col gap-1.5 transition-colors duration-500 ${
            drawState?.lightState === 'red'
              ? 'bg-red-500/15 border-red-500/50'
              : 'bg-emerald-500/15 border-emerald-500/40'
          }`}
        >
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
            Luz {drawState?.lightState === 'red' ? 'ROJA' : 'VERDE'}
          </p>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className={`text-2xl ${drawState?.lightState === 'red' ? 'animate-pulse' : ''}`}>
              {drawState?.lightState === 'red' ? '🔴' : '🟢'}
            </span>
            <span
              className={`text-2xl font-black tabular-nums ${
                drawState?.lightState === 'red' ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              {nextLightSeconds !== null ? `${nextLightSeconds}s` : '—'}
            </span>
          </div>
          <TimedProgressBar
            durationMs={drawState?.intervals?.phase2LightMs}
            anchor={drawState?.lastLightChangeAt}
            color={drawState?.lightState === 'red' ? 'bg-red-400' : 'bg-emerald-400'}
          />
        </div>
      </div>
      {renderFullTicketGrid('md')}
    </div>
  );

  // ─── Phase 2 intro: 60s lobby (sobrevivientes de fase 1) ────────────
  const Phase2IntroView = (
    <div className="w-full space-y-5 text-center">
      <PhaseHeader
        icon={<>⏳</>}
        title="Sobrevivientes de la fase 1"
        subtitle="Pausa de 60 segundos antes de que empiece la fase 2: Luz Roja, Luz Verde."
      />
      <div className="bg-gradient-to-r from-cyan-500/10 via-cyan-400/10 to-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 max-w-md mx-auto">
        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">La fase 2 empieza en</p>
        <p className="mt-2 text-6xl font-black text-cyan-300 tabular-nums">
          {phaseIntroSeconds !== null ? `${phaseIntroSeconds}s` : '—'}
        </p>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">
          {drawState?.aliveTickets?.length ?? 0} sobrevivientes
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {drawState?.aliveTickets?.map((t) => (
            <div key={`p2i-${t.id}`} className="flex flex-col items-center gap-1">
              {t.userImageUrl ? (
                <img src={t.userImageUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400/60" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-sm font-black ring-2 ring-cyan-400/60">
                  {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-[10px] font-mono font-bold text-cyan-200 tabular-nums">#{t.number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Phase 3 intro: 60s lobby ────────────────────────────────────────
  const Phase3IntroView = (
    <div className="w-full space-y-5 text-center">
      <PhaseHeader
        icon={<>🐎</>}
        title="Fase final · La carrera de caballos"
        subtitle={`Quedan ${drawState?.remainingCount ?? 0} finalistas. Cuando empiece la carrera cada caballo avanzará 1-3 pasos al azar cada 3s y cada 15s se elimina al de último lugar.`}
      />
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-6 max-w-md mx-auto">
        <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">La carrera empieza en</p>
        <p className="mt-2 text-6xl font-black text-amber-300 tabular-nums">
          {(phaseIntroSeconds ?? phase3IntroSeconds) !== null ? `${phaseIntroSeconds ?? phase3IntroSeconds}s` : '—'}
        </p>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Finalistas</p>
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
    </div>
  );

  // Phase 3 — vertical horse race. Track auto-scales so the trailing ticket
  // always sits at the top and the leader is offset down by their relative
  // step gap.
  const Phase3View = (() => {
    // Only the PHASE 3 finalists belong in the column grid: tickets that
    // were alive when phase 3 started (and may now be eliminated within
    // phase 3). Without this filter we'd render all 99 columns smashed
    // together, including the 89 already eliminated in phases 1 + 2.
    //
    // A ticket belongs to phase 3 iff:
    //   not eliminated, OR eliminated AFTER phase3StartedAt
    const phase3StartMs = drawState?.phase3StartedAt
      ? new Date(drawState.phase3StartedAt).getTime()
      : null;
    const allP3 = [...tickets]
      .filter((t) => {
        if (!t.eliminatedAt) return true;
        if (!phase3StartMs) return false; // can't tell yet — exclude phase 1/2 dead
        return new Date(t.eliminatedAt).getTime() >= phase3StartMs;
      })
      .sort((a, b) => a.number.localeCompare(b.number));
    const aliveSteps = allP3.filter((t) => !t.eliminatedAt).map((t) => t.horseSteps);
    const minSteps = aliveSteps.length > 0 ? Math.min(...aliveSteps) : 0;
    const maxSteps = aliveSteps.length > 0 ? Math.max(...aliveSteps) : 0;
    const range = Math.max(1, maxSteps - minSteps);
    const trackHeight = 240;
    const stepHeight = Math.min(20, trackHeight / range);
    const colWidth = allP3.length > 0 ? `${100 / allP3.length}%` : '10%';
    return (
      <div className="w-full space-y-4">
        <PhaseHeader
          icon={<>🐎</>}
          title="Fase final · Carrera de caballos"
          subtitle={`Cada ~3s todos avanzan 1-3 pasos. Cada ~12s el último cae. ${
            drawState?.eliminationsUntilNextPhase != null
              ? `Faltan ${drawState.eliminationsUntilNextPhase} eliminaciones para el ganador.`
              : ''
          }`}
        />
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 h-24 flex flex-col gap-1.5">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">Próximo avance</p>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-2xl font-black text-cyan-300 tabular-nums">{nextHorseAdvanceSeconds !== null ? `${nextHorseAdvanceSeconds}s` : '—'}</span>
            </div>
            <TimedProgressBar
              durationMs={drawState?.intervals?.phase3AdvanceMs}
              anchor={drawState?.lastHorseAdvanceAt}
              color="bg-cyan-400"
            />
          </div>
          <div className={`border rounded-2xl p-3 h-24 flex flex-col gap-1.5 transition-all duration-500 ${
            drawState?.isFinaleStretch
              ? 'bg-red-500/20 border-red-500/60 shadow-lg shadow-red-500/40'
              : 'bg-zinc-900/70 border-red-500/30'
          }`}>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
              Próxima eliminación
              {drawState?.lastPlace && (
                <span className="ml-1 text-red-400">#{drawState.lastPlace.number}</span>
              )}
            </p>
            <DramaticCountdown seconds={nextHorseEliminationSeconds} />
            <TimedProgressBar
              durationMs={drawState?.intervals?.phase3EliminationMs}
              anchor={drawState?.lastHorseEliminationAt}
              color="bg-red-400"
            />
          </div>
        </div>
        {drawState?.isFinaleStretch && (
          <div className="text-center -mt-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-red-500 text-zinc-950 text-xs font-black uppercase tracking-widest animate-pulse">
              🔥 Recta final 🔥
            </span>
          </div>
        )}

        <div className="relative bg-gradient-to-b from-zinc-900/40 to-zinc-950 border border-zinc-800 rounded-2xl p-3 overflow-hidden">
          <div className="flex justify-around items-start" style={{ minHeight: trackHeight + 100 }}>
            {allP3.map((t) => {
              const isEliminated = !!t.eliminatedAt;
              const offsetTop = isEliminated
                ? (t.horseSteps - minSteps) * stepHeight
                : (t.horseSteps - minSteps) * stepHeight;
              const isLast = drawState?.lastPlace?.id === t.id;
              const popping = popExitIds.has(t.id);
              const ringCls = isEliminated ? 'ring-red-500/50' : isLast ? 'ring-red-500' : 'ring-amber-400/60';
              const dimCls = isEliminated && !popping ? 'grayscale opacity-40' : '';
              const numberCls = isEliminated
                ? 'text-zinc-600 line-through'
                : isLast
                ? 'text-red-400'
                : 'text-amber-200';
              return (
                <div key={`p3-${t.id}`} className={`flex flex-col items-center ${popping ? 'animate-[ticket-explode_2.5s_ease-out_forwards] z-10' : ''}`} style={{ width: colWidth }}>
                  <span className={`text-[10px] font-mono font-bold tabular-nums leading-none mb-0.5 ${numberCls}`}>
                    #{t.number}
                  </span>
                  <span
                    key={`steps-${t.id}-${t.horseSteps}`}
                    className={`text-[9px] font-black tabular-nums leading-none mb-1 ${
                      isEliminated ? 'text-zinc-600' : 'text-cyan-300'
                    } ${!isEliminated ? 'animate-[step-bump_400ms_ease-out]' : ''}`}
                  >
                    {t.horseSteps} pasos
                  </span>
                  {t.userImageUrl ? (
                    <img
                      src={t.userImageUrl}
                      alt=""
                      className={`w-9 h-9 rounded-full object-cover ring-2 transition-all duration-700 ${ringCls} ${dimCls}`}
                      style={{ transform: `translateY(${offsetTop}px)` }}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-200 text-sm font-black ring-2 transition-all duration-700 ${ringCls} ${dimCls}`}
                      style={{ transform: `translateY(${offsetTop}px)` }}
                    >
                      {t.userUsername?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span
                    className={`text-2xl mt-0.5 transition-all duration-700 ${dimCls}`}
                    style={{ transform: `translateY(${offsetTop}px)` }}
                  >
                    {isEliminated ? '💀' : '🐎'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-[10px] text-zinc-500 italic">
          El líder va más abajo · los caídos quedan congelados en su columna
        </p>
      </div>
    );
  })();

  const Center = (
    <div className="relative bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] h-full overflow-hidden">
      {LightFlash}
      {PhaseSplash}
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

      {drawingNow && drawState?.phase === 'phase2_intro' && Phase2IntroView}
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

          {/* Last 5 eliminated — gives the loser context next to the winner. */}
          {drawState?.recentEliminated && drawState.recentEliminated.length > 0 && (
            <div className="pt-4 border-t border-zinc-800/60">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center justify-center gap-1">
                <Skull size={10} /> Últimos eliminados
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {drawState.recentEliminated.slice(0, 5).map((e) => (
                  <div
                    key={`final-recent-${e.id}`}
                    className="flex flex-col items-center gap-0.5"
                    title={`#${e.eliminationOrder}° · @${e.userUsername} · ticket #${e.number}`}
                  >
                    <div className="relative">
                      {e.userImageUrl ? (
                        <img
                          src={e.userImageUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/40 grayscale opacity-70"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 ring-2 ring-red-500/40">
                          {e.userUsername?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 px-1 py-0 rounded-full bg-red-500 text-white text-[8px] font-black tabular-nums leading-tight">
                        {e.eliminationOrder}°
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 tabular-nums leading-none">
                      #{e.number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-5 h-full">
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

      {/* Viewer's own tickets, color-coded by status. Lives here in the
          sidebar so the user always sees their own state alongside the
          raffle stats, regardless of which phase the center column is
          showing. */}
      {logged && myTickets.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
            <Ticket size={11} /> Mis tickets ({myTickets.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
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
                  className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-black tabular-nums ${cls}`}
                  title={label}
                >
                  #{t.number}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    loadTickets(true);
                    loadMyTickets();
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
        @keyframes ticket-explode {
          /* Builds slowly, peaks dramatically, then settles into a frozen
             "dead" state (still visible, greyscale, dim) so the avatar
             never disappears mid-animation. After the keyframe ends the
             eliminated styling kicks in seamlessly. */
          0%   { transform: scale(1); opacity: 1; filter: brightness(1) drop-shadow(0 0 0 rgba(248,113,113,0)); }
          15%  { transform: scale(1.45); opacity: 1; filter: brightness(2) drop-shadow(0 0 14px rgba(248,113,113,0.95)); }
          35%  { transform: scale(1.7) rotate(10deg); opacity: 1; filter: brightness(2.4) drop-shadow(0 0 24px rgba(248,113,113,1)); }
          55%  { transform: scale(1.5) rotate(-12deg); opacity: 0.95; filter: brightness(1.8) drop-shadow(0 0 18px rgba(248,113,113,0.8)); }
          75%  { transform: scale(1.2) rotate(6deg); opacity: 0.8; filter: brightness(1.3); }
          100% { transform: scale(1); opacity: 0.6; filter: grayscale(1) brightness(0.7); }
        }
        @keyframes splash-fade {
          0%   { opacity: 0; transform: scale(0.85); }
          12%  { opacity: 1; transform: scale(1.02); }
          18%  { opacity: 1; transform: scale(1); }
          82%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes flash-fade {
          0%   { opacity: 0.95; }
          40%  { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes progress-deplete {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes step-bump {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes bomb-tick {
          /* Fast jittery shake — cumulative tension while the fuse burns. */
          0%   { transform: translate(0, 0) rotate(0); }
          15%  { transform: translate(-1px, 1px) rotate(-2deg); }
          30%  { transform: translate(2px, -1px) rotate(2deg); }
          45%  { transform: translate(-2px, 0) rotate(-3deg); }
          60%  { transform: translate(1px, 2px) rotate(2deg); }
          75%  { transform: translate(-1px, -1px) rotate(-2deg); }
          100% { transform: translate(0, 0) rotate(0); }
        }
        @keyframes smoke-puff {
          /* Bomb fizzled — white smoke rises and fades. */
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          15%  { transform: translateY(-4px) scale(0.9); opacity: 0.85; }
          50%  { transform: translateY(-14px) scale(1.2); opacity: 0.9; }
          100% { transform: translateY(-30px) scale(1.6); opacity: 0; }
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
          <div className="lg:col-span-3 lg:h-full">{Sidebar}</div>
          <div className="lg:col-span-6 lg:h-full">{Center}</div>
          <div className="lg:col-span-3 lg:h-full">{Chat}</div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Users size={18} className="text-cyan-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Participantes</h2>
            <span className="text-zinc-500 text-sm">({ticketsTotal})</span>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            {/* Table is ALWAYS mounted — no remount on poll. Empty state and
                loader render INSIDE the wrapper, not as siblings of the
                table, so React never has to unmount/remount the rows. */}
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
                  {/* Sort: winner first, then alive (by ticket number), then
                      eliminated with most-recent-out at the top. */}
                  {[...tickets].sort((a, b) => {
                    const aWinner = drawingDone && survivingNumbers.has(a.number);
                    const bWinner = drawingDone && survivingNumbers.has(b.number);
                    if (aWinner !== bWinner) return aWinner ? -1 : 1;
                    const aOut = !!a.eliminatedAt;
                    const bOut = !!b.eliminatedAt;
                    if (aOut !== bOut) return aOut ? 1 : -1;
                    if (aOut && bOut) {
                      // Most recent elimination first (highest order on top).
                      return (b.eliminationOrder ?? 0) - (a.eliminationOrder ?? 0);
                    }
                    // Both alive — by ticket number ascending.
                    return a.number.localeCompare(b.number);
                  }).map((t) => {
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
            {tickets.length === 0 && ticketsLoading && (
              <div className="p-8 flex justify-center border-t border-zinc-800">
                <Loader2 size={20} className="text-zinc-500 animate-spin" />
              </div>
            )}
            {tickets.length === 0 && !ticketsLoading && (
              <p className="p-8 text-center text-zinc-500 text-sm border-t border-zinc-800">
                Sin participantes aún.
              </p>
            )}
          </div>
          {ticketsTotal > 1000 && (
            <p className="mt-3 text-center text-[11px] text-zinc-500 italic">
              Mostrando los primeros 1000 tickets de {ticketsTotal}.
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RaffleDetailPage;
