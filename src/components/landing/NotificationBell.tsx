import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, Loader2, CheckCheck, MessageSquare, BookPlus, User, AlertCircle } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface NotificationItem {
  id: number;
  type: string;
  source: string;
  readAt: string | null;
  createdAt: string;
  mangaCustomId: number | null;
  jointId: number | null;
  chapterId: number | null;
  commentId?: number | null;
  parentCommentId?: number | null;
  subscriptionId?: number | null;
  organizationId?: number | null;
  mangaCustom?: {
    id: number;
    title: string;
    imageUrl: string | null;
    isNSFW: boolean;
    manga?: { slug: string };
    organization?: { slug: string; name: string; isNSFW: boolean };
  } | null;
  joint?: {
    id: number;
    slug: string;
    title: string;
    imageUrl: string | null;
  } | null;
  chapter?: {
    id: number;
    number: number;
    title: string;
  } | null;
  comment?: {
    id: number;
    comment: string;
    identifier: string;
    user?: { username: string };
  } | null;
  parentComment?: {
    id: number;
    comment: string;
    identifier: string;
  } | null;
  subscription?: {
    id: number;
    subscriptionPlan?: { name: string };
  } | null;
  organization?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

interface NotificationBellProps {
  logged: boolean;
  // When true, renders the mobile-friendly variant (full-width panel under navbar).
  variant?: 'desktop' | 'mobile';
}

const POLL_MS = 60_000;

const formatRelative = (iso: string): string => {
  try {
    const created = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - created);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'hace unos segundos';
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `hace ${day}d`;
    const week = Math.floor(day / 7);
    if (week < 5) return `hace ${week}sem`;
    const month = Math.floor(day / 30);
    if (month < 12) return `hace ${month}mes`;
    const year = Math.floor(day / 365);
    return `hace ${year}a`;
  } catch {
    return '';
  }
};

// Comment identifier format: `mangaSlug` or `mangaSlug_chapterNumber`. Mirrors
// sendCommentReplyNotification's parser on the backend so links match.
const buildCommentThreadUrl = (n: NotificationItem): string | null => {
  if (!n.comment || !n.organization) return null;
  const identifier = n.comment.identifier;
  const lastUnderscore = identifier.lastIndexOf('_');
  const orgSlug = n.organization.slug;
  if (lastUnderscore > 0 && /^\d+$/.test(identifier.slice(lastUnderscore + 1))) {
    const mangaSlug = identifier.slice(0, lastUnderscore);
    const chapterNumber = identifier.slice(lastUnderscore + 1);
    return `/${orgSlug}/manga/${mangaSlug}/chapters/${chapterNumber}`;
  }
  return `/${orgSlug}/manga/${identifier}`;
};

const buildItemUrl = (n: NotificationItem): string | null => {
  switch (n.type) {
    case 'new_chapter': {
      const chapterNumber = n.chapter?.number;
      if (chapterNumber === undefined || chapterNumber === null) return null;
      if (n.joint) return `/joint/manga/${n.joint.slug}/chapters/${chapterNumber}`;
      if (n.mangaCustom?.organization?.slug && n.mangaCustom?.manga?.slug) {
        const isNsfwPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/red');
        const prefix = isNsfwPath ? '/red' : '';
        return `${prefix}/${n.mangaCustom.organization.slug}/manga/${n.mangaCustom.manga.slug}/chapters/${chapterNumber}`;
      }
      return null;
    }
    case 'comment_reply':
      return buildCommentThreadUrl(n);
    case 'new_manga':
      if (!n.mangaCustom?.manga?.slug) return null;
      return `/${n.organization?.slug || n.mangaCustom.organization?.slug}/manga/${n.mangaCustom.manga.slug}`;
    case 'new_subscriber':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/subscription-plans`;
    case 'failed_payment':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/finance`;
    default:
      return null;
  }
};

const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}...` : s);

const formatItem = (n: NotificationItem): { title: string; subtitle: string } => {
  const rel = formatRelative(n.createdAt);
  switch (n.type) {
    case 'comment_reply': {
      const replier = n.comment?.user?.username || 'Alguien';
      const original = n.parentComment?.comment ? truncate(n.parentComment.comment, 40) : '';
      return {
        title: `${replier} respondió a tu comentario`,
        subtitle: original ? `${original} · ${rel}` : rel,
      };
    }
    case 'new_manga': {
      const mangaTitle = n.mangaCustom?.title || 'Nuevo manga';
      const orgName = n.organization?.name || n.mangaCustom?.organization?.name || '';
      return {
        title: `Nuevo manga: ${mangaTitle}`,
        subtitle: orgName ? `${orgName} · ${rel}` : rel,
      };
    }
    case 'new_subscriber': {
      const orgName = n.organization?.name || '';
      const planName = n.subscription?.subscriptionPlan?.name || 'Plan';
      return {
        title: `Nuevo suscriptor en ${orgName}`,
        subtitle: `${planName} · ${rel}`,
      };
    }
    case 'failed_payment': {
      const orgName = n.organization?.name || '';
      const subId = n.subscription?.id ?? n.subscriptionId ?? '';
      return {
        title: `Pago fallido en ${orgName}`,
        subtitle: `Suscripción #${subId} · ${rel}`,
      };
    }
    case 'new_chapter':
    default: {
      const title = n.joint?.title || n.mangaCustom?.title || 'Manga';
      const chapterLabel = n.chapter?.number !== undefined ? `Capítulo ${n.chapter.number}` : 'Nuevo capítulo';
      return { title, subtitle: `${chapterLabel} · ${rel}` };
    }
  }
};

const ThumbIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 14 }) => {
  switch (type) {
    case 'comment_reply':
      return <MessageSquare size={size} className="text-cyan-400" />;
    case 'new_manga':
      return <BookPlus size={size} className="text-cyan-400" />;
    case 'new_subscriber':
      return <User size={size} className="text-cyan-400" />;
    case 'failed_payment':
      return <AlertCircle size={size} className="text-red-400" />;
    default:
      return <Bell size={size} className="text-zinc-600" />;
  }
};

const NotificationBell: React.FC<NotificationBellProps> = ({ logged, variant = 'desktop' }) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!logged) return;
    try {
      const data = await callAPI('/api/notifications/unread-count');
      if (typeof data?.count === 'number') setUnread(data.count);
    } catch {
      // Silent: bell badge is best-effort
    }
  }, [logged]);

  const fetchList = useCallback(async () => {
    if (!logged) return;
    setLoading(true);
    try {
      const data = await callAPI('/api/notifications?limit=15&unreadOnly=0');
      if (Array.isArray(data?.items)) {
        setItems(data.items);
      }
      if (typeof data?.unreadTotal === 'number') {
        setUnread(data.unreadTotal);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [logged]);

  useEffect(() => {
    if (!logged) return;
    fetchUnreadCount();
    const id = window.setInterval(fetchUnreadCount, POLL_MS);
    return () => window.clearInterval(id);
  }, [logged, fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };

  const handleItemClick = async (n: NotificationItem) => {
    const url = buildItemUrl(n);
    if (!n.readAt) {
      // Optimistic update so the bell badge feels instant.
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p)));
      setUnread((u) => Math.max(0, u - 1));
      try {
        await callAPI(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
      } catch {
        // Best-effort — server will reconcile on next poll
      }
    }
    if (url) window.location.href = url;
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((p) => (p.readAt ? p : { ...p, readAt: new Date().toISOString() })));
    setUnread(0);
    try {
      await callAPI('/api/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Refetch to recover state if the call failed
      fetchList();
    }
  };

  if (!logged) return null;

  const badgeText = unread > 9 ? '9+' : String(unread);
  const isMobile = variant === 'mobile';

  return (
    <div className={`relative ${isMobile ? 'inline-flex' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notificaciones"
        className={`relative flex items-center justify-center rounded-full transition-all ${
          isMobile
            ? 'w-8 h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
            : 'w-9 h-9 bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800'
        }`}
      >
        <Bell size={isMobile ? 16 : 18} className="text-zinc-200" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/40">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`${
            isMobile
              ? 'fixed left-2 right-2 top-16 max-h-[80vh]'
              : 'absolute right-0 top-full mt-3 w-[380px] max-h-[70vh]'
          } bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-cyan-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Notificaciones</span>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[10px] font-bold text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="text-cyan-400 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center mb-3">
                  <Bell size={20} className="text-zinc-600" />
                </div>
                <p className="text-xs font-bold text-zinc-400">No tienes notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/70">
                {items.map((n) => {
                  const cover = n.joint?.imageUrl || n.mangaCustom?.imageUrl || null;
                  const { title, subtitle } = formatItem(n);
                  const isUnread = !n.readAt;
                  const showCover = cover && (n.type === 'new_chapter' || n.type === 'new_manga');
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                          isUnread ? 'bg-cyan-500/[0.03] hover:bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
                          {showCover ? (
                            <img src={cover!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ThumbIcon type={n.type} size={16} />
                            </div>
                          )}
                          {isUnread && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow shadow-cyan-400/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold truncate ${isUnread ? 'text-white' : 'text-zinc-400'}`}>
                            {title}
                          </p>
                          <p className={`text-xs mt-0.5 truncate ${isUnread ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {subtitle}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-800 px-4 py-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unread === 0}
              className="text-[10px] font-bold text-zinc-500 hover:text-cyan-400 disabled:hover:text-zinc-500 disabled:opacity-50 transition-colors"
            >
              Marcar todas como leídas
            </button>
            <a
              href={typeof window !== 'undefined' && window.location.pathname.startsWith('/red') ? '/red/notifications' : '/notifications'}
              className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest transition-colors"
            >
              Ver todas
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
