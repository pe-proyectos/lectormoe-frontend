import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Ticket, Trophy, Clock, Users, Send, Plus, Minus, AlertTriangle, Loader2,
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { callAPI } from '../../util/callApi';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface Winner { ticketNumber: string; userSlug: string; userUsername: string; userImageUrl: string | null }

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
  drawType: 'countdown' | 'max-tickets';
  drawAt: string | null;
  status: string;
  cancelReason: string | null;
  revealStartedAt: string | null;
  revealOrder: number[] | null;
  revealDigits: string | null;
  sold: number;
  available: number;
  userTicketCount: number;
  winner: Winner | null;
  createdAt: string;
}

interface Comment {
  id: number;
  userId: number;
  userSlug: string;
  userUsername: string;
  userImageUrl: string | null;
  isTicketHolder: boolean;
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
  createdAt: string;
}

interface Props {
  raffle: Raffle;
  user: any;
  logged: boolean;
  nsfwMode?: boolean;
  paypalClientId: string;
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
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// 5-digit reveal animation. Digits start as `_`. The slot at revealOrder[i]
// flips at revealStartedAt + i*5s, locally computed so all clients land in sync.
const RevealAnimation: React.FC<{
  startedAt: string;
  order: number[];
  digits: string;
  done: boolean;
}> = ({ startedAt, order, digits, done }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [done]);

  const start = new Date(startedAt).getTime();
  const elapsed = Math.max(0, now - start);
  const slots = ['_', '_', '_', '_', '_'];
  for (let i = 0; i < 5; i++) {
    const slotIdx = order[i];
    const revealAt = i * 5000;
    if (done || elapsed >= revealAt + 5000) {
      slots[slotIdx] = digits[slotIdx];
    } else if (elapsed >= revealAt) {
      // mid-spin: pick a fast cycling digit
      slots[slotIdx] = String(Math.floor(Math.random() * 10));
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {slots.map((d, i) => {
        const revealed = d !== '_' && (done || elapsed >= (order.indexOf(i) * 5000) + 5000);
        return (
          <div
            key={i}
            className={`relative w-14 h-20 md:w-20 md:h-28 rounded-2xl border-2 flex items-center justify-center text-3xl md:text-5xl font-black tabular-nums transition-all ${
              revealed
                ? 'bg-yellow-400 text-zinc-950 border-yellow-300 shadow-lg shadow-yellow-500/40 scale-110'
                : d === '_'
                ? 'bg-zinc-900 text-zinc-700 border-zinc-800'
                : 'bg-zinc-800 text-yellow-200 border-yellow-500/40 animate-pulse'
            }`}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
};

const linkifyMentions = (text: string) => {
  // @username → cyan link to /profile/{username}. No autocomplete.
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

  const countdown = useCountdown(raffle.drawType === 'countdown' ? raffle.drawAt : null);
  const isFree = raffle.ticketPrice === 0;
  const drawingDone = raffle.status === 'completed';
  const drawingNow = raffle.status === 'drawing';

  // Hard-cap how many we let the user try to buy in one go.
  const maxBuy = Math.max(0, Math.min(
    raffle.maxTicketsPerUser - raffle.userTicketCount,
    raffle.available,
  ));

  // ─── Initial loads ──────────────────────────────────────────────────────────
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

  useEffect(() => { loadTickets(1); loadComments(); /* eslint-disable-next-line */ }, [raffle.slug]);

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

    const handleEvent = (e: any) => {
      if (e.type === 'snapshot') {
        setRaffle((r) => ({
          ...r,
          status: e.raffle.status,
          sold: e.raffle.sold,
          available: e.raffle.available,
          revealStartedAt: e.raffle.revealStartedAt,
          revealOrder: e.raffle.revealOrder,
          revealDigits: e.raffle.revealDigits,
          winner: e.raffle.winner,
          userTicketCount: e.raffle.viewerTicketsCount ?? r.userTicketCount,
        }));
      } else if (e.type === 'ticket_purchased') {
        setRaffle((r) => ({ ...r, sold: e.sold, available: e.available }));
        loadTickets(ticketsPage);
      } else if (e.type === 'comment') {
        setComments((prev) => [...prev, e.comment]);
      } else if (e.type === 'draw_started') {
        setRaffle((r) => ({
          ...r,
          status: 'drawing',
          revealStartedAt: e.revealStartedAt,
          revealOrder: e.revealOrder,
          revealDigits: e.revealDigits,
        }));
      } else if (e.type === 'draw_completed') {
        setRaffle((r) => ({ ...r, status: 'completed', winner: e.winner }));
      } else if (e.type === 'cancelled') {
        setRaffle((r) => ({ ...r, status: 'cancelled', cancelReason: e.reason }));
      }
    };

    connect();
    return () => { stopped = true; es?.close(); };
    // eslint-disable-next-line
  }, [raffle.slug]);

  // Track whether the user was at the bottom of the chat before re-render so
  // we don't yank them up when a new comment arrives.
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

  // ─── Comment posting ────────────────────────────────────────────────────────
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
      // SSE delivers the broadcast; clear local draft.
      setCommentDraft('');
    } catch (err: any) {
      // surface inline lightly
      console.error(err);
    } finally {
      setCommentBusy(false);
    }
  };

  // ─── Free purchase ──────────────────────────────────────────────────────────
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

  // ─── Center column: countdown / reveal / winner ─────────────────────────────
  const Center = (
    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px]">
      {raffle.status === 'active' && raffle.drawType === 'countdown' && (
        <>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> Próximo sorteo
          </div>
          <div className="text-5xl md:text-6xl font-black text-white tabular-nums tracking-tighter">
            {countdown ?? '—'}
          </div>
          {raffle.drawAt && (
            <p className="text-zinc-500 text-xs mt-3">
              {new Date(raffle.drawAt).toLocaleString('es-ES')}
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
        </>
      )}
      {drawingNow && raffle.revealStartedAt && raffle.revealOrder && raffle.revealDigits && (
        <>
          <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-4 animate-pulse flex items-center gap-2">
            <Sparkles size={14} className="animate-pulse" /> Sorteando ganador
          </div>
          <RevealAnimation
            startedAt={raffle.revealStartedAt}
            order={raffle.revealOrder}
            digits={raffle.revealDigits}
            done={false}
          />
        </>
      )}
      {drawingDone && raffle.winner && (
        <>
          <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={14} /> Ganador
          </div>
          <div className="flex flex-col items-center gap-3">
            {raffle.winner.userImageUrl ? (
              <img src={raffle.winner.userImageUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-yellow-400 shadow-2xl shadow-yellow-500/40" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-zinc-950 text-2xl font-black ring-4 ring-yellow-300">
                {raffle.winner.userUsername?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <a href={`/profile/${raffle.winner.userSlug}`} className="text-xl font-black text-white hover:text-yellow-400 transition-colors">
              {raffle.winner.userUsername}
            </a>
            <div className="text-3xl font-black text-yellow-400 tabular-nums">#{raffle.winner.ticketNumber}</div>
          </div>
        </>
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

  // ─── Left sidebar with purchase ─────────────────────────────────────────────
  const purchaseDisabled = raffle.status !== 'active' || maxBuy <= 0;

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
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Máx. por usuario</p>
          <p className="text-white font-black text-base tabular-nums">{raffle.maxTicketsPerUser}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Tienes</p>
          <p className="text-white font-black text-base tabular-nums">{raffle.userTicketCount}</p>
        </div>
      </div>

      {raffle.status === 'active' && (
        <>
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comentario opcional</label>
            <input
              value={buyComment}
              onChange={(e) => setBuyComment(e.target.value.slice(0, 500))}
              placeholder="Mensaje al comprar el ticket"
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"
            />
          </div>

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

          {!purchaseDisabled && isFree && (
            <button
              onClick={buyFree}
              disabled={buyBusy}
              className="w-full bg-emerald-500 text-zinc-950 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buyBusy ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
              Obtener {buyCount > 1 ? `${buyCount} tickets` : 'mi ticket'}
            </button>
          )}

          {!purchaseDisabled && !isFree && logged && paypalClientId && (
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

          {!purchaseDisabled && !isFree && !logged && (
            <a
              href="/login"
              className="block text-center w-full bg-yellow-400 text-zinc-950 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-yellow-300"
            >
              Inicia sesión para comprar
            </a>
          )}
        </>
      )}
    </div>
  );

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

      {/* Banner */}
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
          <div className="lg:col-span-6">{Center}</div>
          <div className="lg:col-span-3">{Chat}</div>
        </div>

        {/* Tickets list */}
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
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Ticket</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Usuario</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Comentario</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-800 hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3 font-black text-yellow-400 tabular-nums">#{t.number}</td>
                        <td className="px-4 py-3">
                          <a href={`/profile/${t.userSlug}`} className="flex items-center gap-2 hover:text-cyan-400">
                            {t.userImageUrl ? (
                              <img src={t.userImageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
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
                    ))}
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
