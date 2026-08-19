import React, { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, CheckCheck, Loader2, MessageSquare, BookPlus, User, AlertCircle, Mail, ListChecks } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
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
  listId?: number | null;
  details?: string | null;
  customList?: {
    slug: string;
    name: string;
    user?: { slug: string };
  } | null;
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
    isNSFW?: boolean;
  } | null;
}

interface NotificationsPageProps {
  user?: any;
  logged?: boolean;
  nsfwMode?: boolean;
}

type FilterKey = 'all' | 'unread';

const PAGE_SIZE = 20;

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

// Comment identifier formats:
//   {mangaSlug}                          → scan top-level
//   {mangaSlug}_{chapterNumber}          → scan chapter
//   joint_{jointSlug}                    → joint top-level
//   joint_{jointSlug}_{chapterNumber}    → joint chapter
// El prefijo /red debe salir del contenido de la notificación (si el manga/org
// es +18), NO del modo actual de la página. Antes usaba nsfwMode y, al abrir un
// comentario de un manga +18 estando en modo normal (o viceversa), la URL
// quedaba mal y salía una pantalla negra.
const notifIsNsfw = (n: NotificationItem): boolean =>
  !!(n.mangaCustom?.isNSFW || n.mangaCustom?.organization?.isNSFW || n.organization?.isNSFW);

const buildCommentThreadUrl = (n: NotificationItem, nsfwMode: boolean): string | null => {
  if (!n.comment) return null;
  const identifier = n.comment.identifier;
  const commentId = n.comment.id;
  const tail = `?commentId=${commentId}#comment-${commentId}`;

  if (identifier.startsWith('joint_')) {
    let jointSlug = identifier.slice('joint_'.length);
    const lu = jointSlug.lastIndexOf('_');
    let chapterNumber: string | null = null;
    // \d+(\.\d+)? y no \d+: los capítulos decimales (10.5) rompían el link
    if (lu > 0 && /^\d+(\.\d+)?$/.test(jointSlug.slice(lu + 1))) {
      chapterNumber = jointSlug.slice(lu + 1);
      jointSlug = jointSlug.slice(0, lu);
    }
    return chapterNumber
      ? `/joint/manga/${jointSlug}/chapters/${chapterNumber}${tail}`
      : `/joint/manga/${jointSlug}${tail}`;
  }

  if (!n.organization) return null;
  const orgSlug = n.organization.slug;
  const prefix = notifIsNsfw(n) ? '/red' : '';
  const lastUnderscore = identifier.lastIndexOf('_');
  if (lastUnderscore > 0 && /^\d+(\.\d+)?$/.test(identifier.slice(lastUnderscore + 1))) {
    const mangaSlug = identifier.slice(0, lastUnderscore);
    const chapterNumber = identifier.slice(lastUnderscore + 1);
    return `${prefix}/${orgSlug}/manga/${mangaSlug}/chapters/${chapterNumber}${tail}`;
  }
  return `${prefix}/${orgSlug}/manga/${identifier}${tail}`;
};

const buildItemUrl = (n: NotificationItem, nsfwMode: boolean): string | null => {
  switch (n.type) {
    case 'new_chapter': {
      const chapterNumber = n.chapter?.number;
      if (chapterNumber === undefined || chapterNumber === null) return null;
      if (n.joint) return `/joint/manga/${n.joint.slug}/chapters/${chapterNumber}`;
      if (n.mangaCustom?.organization?.slug && n.mangaCustom?.manga?.slug) {
        const prefix = notifIsNsfw(n) ? '/red' : '';
        return `${prefix}/${n.mangaCustom.organization.slug}/manga/${n.mangaCustom.manga.slug}/chapters/${chapterNumber}`;
      }
      return null;
    }
    case 'comment_reply':
    case 'comment_on_owned_content':
      return buildCommentThreadUrl(n, nsfwMode);
    case 'new_manga': {
      if (!n.mangaCustom?.manga?.slug) return null;
      const prefix = notifIsNsfw(n) ? '/red' : '';
      return `${prefix}/${n.organization?.slug || n.mangaCustom.organization?.slug}/manga/${n.mangaCustom.manga.slug}`;
    }
    case 'new_subscriber':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/subscription-plans`;
    case 'failed_payment':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/finance`;
    case 'scan_message_reply':
      return '/mensajes';
    case 'scan_message':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/messages`;
    case 'content_removed':
      if (!n.organization?.slug) return null;
      return `/${n.organization.slug}/admin/mangas`;
    case 'list_updated':
      if (n.customList?.user?.slug && n.customList?.slug)
        return `/list/${n.customList.user.slug}/${n.customList.slug}`;
      return '/listas';
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
    case 'comment_on_owned_content': {
      const author = n.comment?.user?.username;
      const body = n.comment?.comment ? truncate(n.comment.comment, 60) : '';
      return {
        title: author ? `Nuevo comentario de ${author}` : 'Nuevo comentario',
        subtitle: body ? `${body} · ${rel}` : rel,
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
    case 'scan_message_reply': {
      const orgName = n.organization?.name || 'El scan';
      return {
        title: `${orgName} respondió tu mensaje`,
        subtitle: `Toca para ver la conversación · ${rel}`,
      };
    }
    case 'scan_message': {
      const orgName = n.organization?.name || 'tu scan';
      return {
        title: `Nuevo mensaje para ${orgName}`,
        subtitle: `Toca para verlo en tu panel · ${rel}`,
      };
    }
    case 'content_removed': {
      const mangaTitle = n.mangaCustom?.title || 'Una obra de tu scan';
      const reason = (n as any).details ? truncate((n as any).details, 80) : '';
      return {
        title: `Obra retirada: ${mangaTitle}`,
        subtitle: reason ? `Razón: ${reason} · ${rel}` : rel,
      };
    }
    case 'list_updated': {
      const listName = n.customList?.name || n.details || 'una lista';
      const work = n.mangaCustom?.title || n.joint?.title;
      return {
        title: `Nueva obra en "${truncate(listName, 40)}"`,
        subtitle: work ? `${work} · ${rel}` : `Toca para ver la lista · ${rel}`,
      };
    }
    case 'new_chapter':
    default: {
      const title = n.joint?.title || n.mangaCustom?.title || 'Manga';
      const chapterLabel = n.chapter?.number !== undefined ? `Capítulo ${n.chapter.number}` : 'Nuevo capítulo';
      const subPart = n.joint ? 'Joint' : (n.mangaCustom?.organization?.name || '');
      return {
        title,
        subtitle: subPart ? `${chapterLabel} · ${subPart} · ${rel}` : `${chapterLabel} · ${rel}`,
      };
    }
  }
};

const ThumbIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 16 }) => {
  switch (type) {
    case 'comment_reply':
    case 'comment_on_owned_content':
      return <MessageSquare size={size} className="text-cyan-400" />;
    case 'new_manga':
      return <BookPlus size={size} className="text-cyan-400" />;
    case 'new_subscriber':
      return <User size={size} className="text-cyan-400" />;
    case 'failed_payment':
      return <AlertCircle size={size} className="text-red-400" />;
    case 'scan_message_reply':
      return <Mail size={size} className="text-cyan-400" />;
    case 'content_removed':
      return <AlertCircle size={size} className="text-red-400" />;
    case 'list_updated':
      return <ListChecks size={size} className="text-cyan-400" />;
    default:
      return <Bell size={size} className="text-zinc-600" />;
  }
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user, logged, nsfwMode }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('all');

  const fetchItems = useCallback(async (targetPage: number, targetFilter: FilterKey) => {
    setLoading(true);
    try {
      const unreadOnly = targetFilter === 'unread' ? '1' : '0';
      const data = await callAPI(
        `/api/notifications?page=${targetPage}&limit=${PAGE_SIZE}&unreadOnly=${unreadOnly}`,
      );
      setItems(Array.isArray(data?.items) ? data.items : []);
      setMaxPage(typeof data?.maxPage === 'number' ? data.maxPage : 1);
      setTotal(typeof data?.total === 'number' ? data.total : 0);
      if (typeof data?.unreadTotal === 'number') setUnread(data.unreadTotal);
    } catch {
      setItems([]);
      setMaxPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(page, filter);
  }, [fetchItems, page, filter]);

  // Marca como leída sin bloquear la navegación del anchor: keepalive deja
  // que el PATCH sobreviva al cambio de página.
  const markRead = (n: NotificationItem) => {
    if (n.readAt) return;
    setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p)));
    setUnread((u) => Math.max(0, u - 1));
    callAPI(`/api/notifications/${n.id}/read`, { method: 'PATCH', keepalive: true } as any).catch(() => {});
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((p) => (p.readAt ? p : { ...p, readAt: new Date().toISOString() })));
    setUnread(0);
    try {
      await callAPI('/api/notifications/read-all', { method: 'PATCH' });
      // If we were filtering by unread, the list emptied — refetch.
      if (filter === 'unread') fetchItems(1, filter);
    } catch {
      fetchItems(page, filter);
    }
  };

  const changeFilter = (next: FilterKey) => {
    if (next === filter) return;
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar
        activeView="notifications"
        onOpenLogin={() => {}}
        onOpenRegister={() => {}}
        onGoHome={() => { window.location.href = '/'; }}
        onGoExplore={() => { window.location.href = '/search'; }}
        onGoSearch={() => { window.location.href = '/search'; }}
        user={user}
        logged={logged}
        nsfwMode={nsfwMode}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 md:px-8 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Bell size={18} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Notificaciones</h1>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">
          {total} {total === 1 ? 'notificación' : 'notificaciones'} · {unread} sin leer
        </p>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              type="button"
              onClick={() => changeFilter('all')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors ${
                filter === 'all' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => changeFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors ${
                filter === 'unread' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              No leídas
            </button>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unread === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck size={14} /> Marcar todas como leídas
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="text-cyan-400 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-800/60 flex items-center justify-center mb-4">
                <Bell size={22} className="text-zinc-600" />
              </div>
              <p className="text-sm font-bold text-zinc-300">No tienes notificaciones</p>
              <p className="text-xs text-zinc-500 mt-1">
                Cuando publiquen un capítulo de una manga en tus favoritos lo verás aquí.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/70">
              {items.map((n) => {
                const cover = n.joint?.imageUrl || n.mangaCustom?.imageUrl || null;
                const { title, subtitle } = formatItem(n);
                const isUnread = !n.readAt;
                const showCover = cover && (n.type === 'new_chapter' || n.type === 'new_manga');
                const itemUrl = buildItemUrl(n, !!nsfwMode);
                const RowTag = (itemUrl ? 'a' : 'button') as any;
                return (
                  <li key={n.id}>
                    <RowTag
                      {...(itemUrl ? { href: itemUrl } : { type: 'button' })}
                      onClick={() => markRead(n)}
                      className={`w-full flex items-start gap-4 px-4 md:px-5 py-4 text-left transition-colors ${
                        isUnread ? 'bg-cyan-500/[0.04] hover:bg-cyan-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
                        {showCover ? (
                          <img src={cover!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ThumbIcon type={n.type} size={18} />
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
                        <p className={`text-xs mt-0.5 ${isUnread ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {subtitle}
                        </p>
                        <p className="text-[10px] mt-1 font-bold uppercase tracking-widest text-zinc-600">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </RowTag>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {maxPage > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Página {page} de {maxPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
