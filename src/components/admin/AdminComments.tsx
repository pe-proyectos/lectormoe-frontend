import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MessageCircle, EyeOff, Trash2, RotateCcw, ThumbsUp, ThumbsDown, ArrowUpDown, Reply, Send, ShieldBan, ShieldOff, ShieldCheck } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Modal from './ui/Modal';
import { callAPI } from '../../util/callApi';
import { getTranslator } from '../../util/translate';
import { formatDate as formatDateUtil } from '../../util/date';

interface User {
  id: number;
  username: string;
  /** Handle en La Charca: con él se silencia a la cuenta. */
  slug?: string;
  imageUrl?: string;
  subscriptions?: any[];
}

interface Comment {
  id: number;
  /** Post de La Charca al que pertenece, para poder abrir la conversación. */
  charcaPostId?: number | null;
  comment: string;
  identifier: string;
  imageUrl?: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  parentId: number | null;
  userId: number;
  user: User;
  deletedAt?: string;
  hiddenAt?: string;
  hiddenReason?: string;
  hiddenByUser?: User;
  replies?: Comment[];
}

interface Ban {
  id: number;
  userId: number;
  type: 'TEMPORARY' | 'PERMANENT' | 'RESTRICTED';
  reason?: string;
  expiresAt?: string;
  createdAt: string;
  user: { id: number; username: string; imageUrl?: string };
  bannedByUser: { id: number; username: string };
}

interface AdminCommentsProps {
  language: string;
  user: User;
  organizationSlug: string;
  organization: any;
}

const formatDate = (date: string) => {
  if (!date) return '';
  return formatDateUtil(date, 'es');
};

const getSubscriptionDays = (subscriptionDate: string) => {
  if (!subscriptionDate) return 0;
  const startDate = new Date(subscriptionDate);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const CommentCard = ({ comment, onHide, onDelete, onRestore, onLike, onReply, onBan, currentUser }: any) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const isReply = comment.parentId !== null;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isOwnComment = currentUser && comment.userId === currentUser.id;

  const submitReply = async () => {
    const text = replyText.trim();
    if (!text || replySending) return;
    setReplySending(true);
    try {
      await onReply(comment, text);
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setReplySending(false);
    }
  };

  const vote = async (like: boolean) => {
    if (likeBusy || isOwnComment) return;
    setLikeBusy(true);
    try {
      await onLike(comment.id, like);
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <Card className={`${isReply ? 'ml-8 border-l-4 border-l-cyan-500/30' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {comment.user?.imageUrl ? (
            <img
              src={comment.user.imageUrl}
              alt={comment.user.username}
              className="w-10 h-10 rounded-full border-2 border-zinc-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div>
            <p className="font-bold text-white">{comment.user?.username}</p>
            {comment.user?.subscriptions && comment.user.subscriptions.length > 0 && (
              <p className="text-sm text-cyan-500">
                {comment.user.subscriptions[0].subscriptionPlan.name} • {getSubscriptionDays(comment.user.subscriptions[0].createdAt)} días
              </p>
            )}
            <p className="text-xs text-zinc-500">
              #{comment.id} • {formatDate(comment.createdAt)}
            </p>
            {isReply && (
              <p className="text-xs text-cyan-500">
                Respuesta al comentario #{comment.parentId}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={comment.deletedAt ? 'danger' : comment.hiddenAt ? 'warning' : 'success'}
          >
            {comment.deletedAt ? 'Eliminado' : comment.hiddenAt ? 'Oculto' : 'Activo'}
          </Badge>
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="px-3 py-1 bg-cyan-500/10 text-cyan-500 rounded-lg text-xs font-bold hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
            >
              <MessageCircle size={12} />
              {comment.replies.length} {showReplies ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-zinc-300 mb-3 whitespace-pre-wrap">{comment.comment}</p>

        {/* Image */}
        {comment.imageUrl && (
          <div className="mb-3">
            <img
              src={comment.imageUrl}
              alt="Imagen del comentario"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-zinc-700"
              onClick={() => setShowImage(true)}
            />
          </div>
        )}

        {/* Hidden Reason */}
        {comment.hiddenReason && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-3">
            <p className="text-sm text-orange-400">
              <strong>Razón de ocultamiento:</strong> {comment.hiddenReason}
            </p>
            {comment.hiddenByUser && (
              <p className="text-sm text-orange-400 mt-1">
                <strong>Ocultado por:</strong> {comment.hiddenByUser.username}
              </p>
            )}
          </div>
        )}

        {/* Stats / votes — clickable when not self-authored */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <button
            type="button"
            onClick={() => vote(true)}
            disabled={isOwnComment || likeBusy || !!comment.deletedAt}
            title={isOwnComment ? 'No puedes votar tu propio comentario' : 'Me gusta'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-500"
          >
            <ThumbsUp size={14} />
            {comment.likesCount || 0}
          </button>
          <button
            type="button"
            onClick={() => vote(false)}
            disabled={isOwnComment || likeBusy || !!comment.deletedAt}
            title={isOwnComment ? 'No puedes votar tu propio comentario' : 'No me gusta'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-500"
          >
            <ThumbsDown size={14} />
            {comment.dislikesCount || 0}
          </button>
          <span className="ml-2">ID: {comment.identifier}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {!comment.deletedAt && !comment.hiddenAt && (
          <>
            <Button variant="primary" size="sm" onClick={() => setReplyOpen((v) => !v)}>
              <Reply size={14} /> Responder
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onHide(comment)}>
              <EyeOff size={14} /> Ocultar
            </Button>
            {!isOwnComment && onBan && (
              <Button variant="danger" size="sm" onClick={() => onBan(comment)}>
                <ShieldBan size={14} /> Sancionar
              </Button>
            )}
            {isOwnComment && (
              <Button variant="danger" size="sm" onClick={() => onDelete(comment.id)}>
                <Trash2 size={14} /> Eliminar
              </Button>
            )}
          </>
        )}
        {comment.hiddenAt && !comment.deletedAt && (
          <Button variant="primary" size="sm" onClick={() => onRestore(comment.id)}>
            <RotateCcw size={14} /> Restaurar
          </Button>
        )}
      </div>

      {/* Inline reply composer */}
      {replyOpen && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700 space-y-2">
          <Textarea
            label={`Responder a ${comment.user?.username || 'este comentario'}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={3}
          />
          <p className="text-[11px] text-zinc-500">
            {replyText.trim().length}/200 caracteres
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyOpen(false);
                setReplyText('');
              }}
              disabled={replySending}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitReply}
              disabled={replySending || !replyText.trim() || replyText.trim().length > 200}
            >
              <Send size={14} /> {replySending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {hasReplies && showReplies && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            Respuestas ({comment.replies.length})
          </p>
          {comment.replies.map((reply: Comment) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onHide={onHide}
              onDelete={onDelete}
              onRestore={onRestore}
              onLike={onLike}
              onReply={onReply}
              onBan={onBan}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* Image Modal */}
      {showImage && (
        <Modal isOpen={showImage} onClose={() => setShowImage(false)} title={`Imagen del comentario #${comment.id}`}>
          <div className="flex justify-center">
            <img
              src={comment.imageUrl}
              alt="Imagen del comentario"
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </Modal>
      )}
    </Card>
  );
};

const AdminComments: React.FC<AdminCommentsProps> = ({ language, user, organizationSlug, organization }) => {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [hideReason, setHideReason] = useState('');

  // Ban states
  const [bans, setBans] = useState<Ban[]>([]);
  const [bansLoading, setBansLoading] = useState(true);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<{ id: number; username: string; slug?: string } | null>(null);
  const [banType, setBanType] = useState<'TEMPORARY' | 'PERMANENT' | 'RESTRICTED'>('PERMANENT');
  const [banReason, setBanReason] = useState('');
  const [banDeleteComments, setBanDeleteComments] = useState(false);
  const [banOnlyLast24h, setBanOnlyLast24h] = useState(false);
  const [banExpiresAt, setBanExpiresAt] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'bans'>('comments');

  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [identifierFilter, setIdentifierFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    refreshComments();
    refreshBans();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [comments, searchTerm, statusFilter, identifierFilter, sortBy, sortOrder]);

  // Los comentarios viven en La Charca (hilos.rest). Los traemos de allí y los
  // adaptamos a la forma que este panel ya conoce, para no reescribirlo entero.
  const refreshComments = () => {
    setLoading(true);
    callAPI(`/api/hilos/moderation/comments?limit=100&status=all`)
      .then((data: any) => {
        const items = data?.items || [];
        setComments(items.map((c: any) => ({
          id: c.id,
          comment: c.content,
          identifier: c.post?.wall?.displayName || c.post?.title || c.post?.externalRef || '',
          likesCount: c.likesCount || 0,
          dislikesCount: 0,
          createdAt: c.createdAt,
          parentId: c.parentCommentId ?? null,
          userId: 0,
          user: {
            id: 0,
            username: c.author?.displayName || c.author?.handle || 'Alguien',
            slug: c.author?.handle || '',
            imageUrl: c.author?.avatarUrl || null,
          },
          hiddenAt: c.hidden ? c.createdAt : undefined,
          deletedAt: c.deleted ? c.createdAt : undefined,
          charcaPostId: c.post?.id ?? null,
        })));
      })
      .catch((error) => toast.error(error?.message || 'Error al cargar comentarios'))
      .finally(() => setLoading(false));
  };

  const applyFiltersAndSort = () => {
    let filtered = [...comments];

    // Filtrar por búsqueda
    if (searchTerm) {
      const matchingMainComments = comments.filter(
        (comment) =>
          !comment.parentId &&
          (comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comment.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comment.identifier.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const matchingReplies: any[] = [];
      const parentIds = new Set<number>();

      comments.forEach((comment) => {
        if (!comment.parentId && comment.replies) {
          comment.replies.forEach((reply) => {
            if (
              reply.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
              reply.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              reply.identifier.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              matchingReplies.push(reply);
              parentIds.add(comment.id);
            }
          });
        }
      });

      const parentComments = comments
        .filter((comment) => !comment.parentId && parentIds.has(comment.id))
        .map((parentComment) => ({
          ...parentComment,
          replies: parentComment.replies?.filter(
            (reply) =>
              reply.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
              reply.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              reply.identifier.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }));

      const allMatchingMainComments = [...matchingMainComments, ...parentComments];

      filtered = allMatchingMainComments.filter(
        (comment, index, self) => index === self.findIndex((c) => c.id === comment.id)
      );
    } else {
      filtered = filtered.filter((comment) => !comment.parentId);
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((comment) => {
        switch (statusFilter) {
          case 'active':
            return !comment.deletedAt && !comment.hiddenAt;
          case 'hidden':
            return comment.hiddenAt && !comment.deletedAt;
          case 'deleted':
            return comment.deletedAt;
          default:
            return true;
        }
      });
    }

    // Filtrar por identifier
    if (identifierFilter) {
      filtered = filtered.filter((comment) =>
        comment.identifier.toLowerCase().includes(identifierFilter.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'user':
          aValue = a.user?.username || '';
          bValue = b.user?.username || '';
          break;
        case 'likes':
          aValue = a.likesCount || 0;
          bValue = b.likesCount || 0;
          break;
        case 'identifier':
          aValue = a.identifier || '';
          bValue = b.identifier || '';
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredComments(filtered);
  };

  const handleHideComment = async () => {
    if (!selectedComment) return;

    try {
      await callAPI(`/api/hilos/comments/${selectedComment.id}/hide`, {
        method: 'POST',
        body: JSON.stringify({ hidden: true, reason: hideReason }),
      });
      toast.success('Comentario ocultado exitosamente');
      refreshComments();
      setHideDialogOpen(false);
      setHideReason('');
      setSelectedComment(null);
    } catch (error: any) {
      toast.error(error?.message || 'Error al ocultar comentario');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      await callAPI(`/api/hilos/comments/${commentId}`, {
        method: 'DELETE',
      });
      toast.success('Comentario eliminado exitosamente');
      refreshComments();
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar comentario');
    }
  };

  const handleRestoreComment = async (commentId: number) => {
    try {
      await callAPI(`/api/hilos/comments/${commentId}/hide`, {
        method: 'POST',
        body: JSON.stringify({ hidden: false }),
      });
      toast.success('Comentario restaurado exitosamente');
      refreshComments();
    } catch (error: any) {
      toast.error(error?.message || 'Error al restaurar el comentario');
    }
  };

  const handleHide = (comment: Comment) => {
    setSelectedComment(comment);
    setHideDialogOpen(true);
  };

  const handleDelete = (commentId: number) => {
    handleDeleteComment(commentId);
  };

  const handleRestore = (commentId: number) => {
    handleRestoreComment(commentId);
  };

  const handleLike = async (commentId: number, like: boolean) => {
    try {
      await callAPI(`/api/comment/${commentId}/like`, {
        method: 'POST',
        body: JSON.stringify({ like }),
      });
      refreshComments();
    } catch (error: any) {
      toast.error(error?.message || 'Error al votar comentario');
    }
  };

  const refreshBans = () => {
    setBansLoading(true);
    callAPI('/api/comment/bans')
      .then((data) => setBans(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setBansLoading(false));
  };

  const handleOpenBanDialog = (comment: Comment) => {
    setBanTargetUser({ id: comment.userId, username: comment.user.username, slug: comment.user.slug });
    setBanType('PERMANENT');
    setBanReason('');
    setBanDeleteComments(false);
    setBanOnlyLast24h(false);
    setBanExpiresAt('');
    setBanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!banTargetUser || isBanning) return;
    try {
      setIsBanning(true);
      await callAPI(`/api/hilos/pages/${encodeURIComponent(banTargetUser?.slug || '')}/mute`, {
        method: 'POST',
        body: JSON.stringify({
          userId: banTargetUser.id,
          type: banType,
          reason: banReason || undefined,
          expiresAt: banType === 'TEMPORARY' && banExpiresAt ? banExpiresAt : undefined,
          deleteComments: banDeleteComments,
          onlyLast24h: banOnlyLast24h,
        }),
      });
      toast.success(`Sanción aplicada a ${banTargetUser.username}`);
      setBanDialogOpen(false);
      refreshBans();
      refreshComments();
    } catch (error: any) {
      toast.error(error?.message || 'Error al aplicar sanción');
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async (banId: number) => {
    if (!window.confirm('¿Revocar esta sanción?')) return;
    try {
      await callAPI(`/api/comment/unban/${banId}`, { method: 'POST' });
      toast.success('Sanción revocada');
      refreshBans();
    } catch (error: any) {
      toast.error(error?.message || 'Error al revocar sanción');
    }
  };

  // La respuesta la publica la page del scan en el hilo de La Charca.
  const handleReply = async (parentComment: Comment, text: string) => {
    if (!parentComment.charcaPostId) {
      toast.error('No encontramos la conversación de este comentario');
      return;
    }
    try {
      await callAPI(`/api/hilos/posts/${parentComment.charcaPostId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: text, parentCommentId: parentComment.id }),
      });
      toast.success('Respuesta enviada');
      refreshComments();
    } catch (error: any) {
      toast.error(error?.message || 'Error al responder');
      throw error;
    }
  };

  const uniqueIdentifiers = [...new Set(comments.map((c) => c.identifier))].sort();

  const stats = {
    total: comments.length,
    active: comments.filter((c) => !c.deletedAt && !c.hiddenAt).length,
    hidden: comments.filter((c) => c.hiddenAt && !c.deletedAt).length,
    deleted: comments.filter((c) => c.deletedAt).length,
    withImages: comments.filter((c) => c.imageUrl).length,
    withReplies: comments.filter((c) => c.replies && c.replies.length > 0).length,
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestión de Comentarios</h1>
            <p className="text-sm text-zinc-400 mt-1">Administra todos los comentarios y sanciones de la plataforma</p>
          </div>
          <Button variant="secondary" onClick={() => { refreshComments(); refreshBans(); }} disabled={loading}>
            {loading ? <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={18} />}
            Actualizar
          </Button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'comments' ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <MessageCircle size={14} className="inline mr-2" />
            Comentarios
          </button>
          <button
            onClick={() => setActiveTab('bans')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'bans' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            <ShieldBan size={14} />
            Sanciones {bans.length > 0 && <span className="bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded text-xs">{bans.length}</span>}
          </button>
        </div>
      </Card>

      {/* Bans Tab */}
      {activeTab === 'bans' && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <ShieldBan size={20} className="text-red-400" />
              Sanciones activas ({bans.length})
            </h2>
            {bansLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
              </div>
            ) : bans.length === 0 ? (
              <div className="text-center p-8">
                <ShieldCheck size={40} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-zinc-500">No hay sanciones activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bans.map((ban) => (
                  <div key={ban.id} className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        ban.type === 'PERMANENT' ? 'bg-red-500' :
                        ban.type === 'TEMPORARY' ? 'bg-orange-400' : 'bg-yellow-400'
                      }`} />
                      <div>
                        <p className="font-bold text-white text-sm">{ban.user.username}</p>
                        <p className="text-xs text-zinc-500">
                          {ban.type === 'PERMANENT' ? 'Ban permanente' :
                           ban.type === 'TEMPORARY' ? `Ban temporal hasta ${ban.expiresAt ? new Date(ban.expiresAt).toLocaleString('es') : '?'}` :
                           'Restringido'}
                          {' · '}por {ban.bannedByUser.username}
                          {' · '}{formatDate(ban.createdAt)}
                        </p>
                        {ban.reason && <p className="text-xs text-zinc-400 mt-0.5">Motivo: {ban.reason}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnban(ban.id)}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-green-600/30 hover:text-green-400 text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ShieldOff size={12} /> Revocar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && <>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Total</p>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Activos</p>
          <p className="text-2xl font-black text-green-500">{stats.active}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Ocultos</p>
          <p className="text-2xl font-black text-orange-500">{stats.hidden}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Eliminados</p>
          <p className="text-2xl font-black text-red-500">{stats.deleted}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Con Imágenes</p>
          <p className="text-2xl font-black text-purple-500">{stats.withImages}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400">Con Respuestas</p>
          <p className="text-2xl font-black text-cyan-500">{stats.withReplies}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Buscar comentarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'hidden', label: 'Ocultos' },
              { value: 'deleted', label: 'Eliminados' },
            ]}
          />

          <Select
            label="Identifier"
            value={identifierFilter}
            onChange={(e) => setIdentifierFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos' },
              ...uniqueIdentifiers.map((id) => ({ value: id, label: id })),
            ]}
          />

          <div className="flex gap-2">
            <Select
              label="Ordenar por"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'date', label: 'Fecha' },
                { value: 'user', label: 'Usuario' },
                { value: 'likes', label: 'Likes' },
                { value: 'identifier', label: 'Identifier' },
              ]}
            />
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              <ArrowUpDown size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {filteredComments.length > 0 && (
          <p className="text-sm text-zinc-500 mt-4">
            Mostrando {filteredComments.length} de {comments.length} comentarios
          </p>
        )}
      </Card>

      {/* Comments List */}
      {loading ? (
        <Card>
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </Card>
      ) : filteredComments.length === 0 ? (
        <Card>
          <div className="text-center p-12">
            <MessageCircle size={48} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500">
              {searchTerm || statusFilter !== 'all' || identifierFilter
                ? 'No se encontraron comentarios con los filtros aplicados'
                : 'No se encontraron comentarios'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onHide={handleHide}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onLike={handleLike}
              onReply={handleReply}
              onBan={handleOpenBanDialog}
              currentUser={user}
            />
          ))}
        </div>
      )}

      </> }

      {/* Hide Comment Modal */}
      {hideDialogOpen && (
        <Modal
          isOpen={hideDialogOpen}
          onClose={() => {
            setHideDialogOpen(false);
            setHideReason('');
            setSelectedComment(null);
          }}
          title={`Ocultar Comentario #${selectedComment?.id}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
              <p className="text-sm text-zinc-400">Comentario de: {selectedComment?.user?.username}</p>
              <p className="text-zinc-300 mt-2">"{selectedComment?.comment}"</p>
            </div>

            <Textarea
              label="Razón para ocultar"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder="Explica por qué ocultas este comentario..."
              rows={4}
            />

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setHideDialogOpen(false);
                  setHideReason('');
                  setSelectedComment(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleHideComment}>
                <EyeOff size={16} />
                Ocultar Comentario
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Ban User Modal */}
      {banDialogOpen && banTargetUser && (
        <Modal
          isOpen={banDialogOpen}
          onClose={() => setBanDialogOpen(false)}
          title={`Sancionar a ${banTargetUser.username}`}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Tipo de sanción</p>
              {[
                { value: 'PERMANENT', label: 'Banear usuario', desc: 'Bloqueo permanente de comentarios', color: 'red' },
                { value: 'TEMPORARY', label: 'Banear temporalmente', desc: 'Bloqueo por tiempo determinado', color: 'orange' },
                { value: 'RESTRICTED', label: 'Restringir usuario', desc: 'Restricción suave de comentarios', color: 'yellow' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  banType === opt.value ? 'border-red-500/50 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-600'
                }`}>
                  <input
                    type="radio"
                    name="adminBanType"
                    value={opt.value}
                    checked={banType === opt.value}
                    onChange={() => setBanType(opt.value as any)}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <p className="text-white text-sm font-bold">{opt.label}</p>
                    <p className="text-zinc-500 text-xs">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {banType === 'TEMPORARY' && (
              <div>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Expira el</p>
                <input
                  type="datetime-local"
                  value={banExpiresAt}
                  onChange={e => setBanExpiresAt(e.target.value)}
                  className="w-full bg-zinc-900 text-white p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banDeleteComments}
                  onChange={e => setBanDeleteComments(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-white text-sm font-bold">Eliminar comentarios del usuario</span>
              </label>
              {banDeleteComments && (
                <label className="flex items-center gap-3 ml-7 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={banOnlyLast24h}
                    onChange={e => setBanOnlyLast24h(e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-zinc-400 text-sm">Solo las últimas 24 horas</span>
                </label>
              )}
            </div>

            <Textarea
              label="Motivo (opcional)"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Motivo de la sanción..."
              rows={3}
            />

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBanDialogOpen(false)} disabled={isBanning}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleBanUser}
                disabled={isBanning || (banType === 'TEMPORARY' && !banExpiresAt)}
              >
                <ShieldBan size={16} />
                {isBanning ? 'Aplicando...' : 'Aplicar Sanción'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminComments;

