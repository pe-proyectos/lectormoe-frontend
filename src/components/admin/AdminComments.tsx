import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MessageCircle, Eye, EyeOff, Trash2, RotateCcw, ThumbsUp, ThumbsDown, X, ArrowUpDown } from 'lucide-react';
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
  imageUrl?: string;
  subscriptions?: any[];
}

interface Comment {
  id: number;
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

const CommentCard = ({ comment, onHide, onDelete, onRestore, currentUser }: any) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showImage, setShowImage] = useState(false);

  const isReply = comment.parentId !== null;
  const hasReplies = comment.replies && comment.replies.length > 0;

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

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <ThumbsUp size={14} />
            {comment.likesCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown size={14} />
            {comment.dislikesCount || 0}
          </span>
          <span>ID: {comment.identifier}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {!comment.deletedAt && !comment.hiddenAt && (
          <>
            <Button variant="secondary" size="sm" onClick={() => onHide(comment)}>
              <EyeOff size={14} /> Ocultar
            </Button>
            {currentUser && comment.userId === currentUser.id && (
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

  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [identifierFilter, setIdentifierFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    refreshComments();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [comments, searchTerm, statusFilter, identifierFilter, sortBy, sortOrder]);

  const refreshComments = () => {
    setLoading(true);
    callAPI(`/api/comment/admin`)
      .then((data) => {
        setComments(data);
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
      await callAPI(`/api/comment/${selectedComment.id}/hide`, {
        method: 'POST',
        body: JSON.stringify({ reason: hideReason }),
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
      await callAPI(`/api/comment/${commentId}`, {
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
      await callAPI(`/api/comment/${commentId}/restore`, {
        method: 'POST',
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
            <p className="text-sm text-zinc-400 mt-1">Administra todos los comentarios de la plataforma</p>
          </div>
          <Button variant="secondary" onClick={refreshComments} disabled={loading}>
            {loading ? <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={18} />}
            Actualizar
          </Button>
        </div>
      </Card>

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
              currentUser={user}
            />
          ))}
        </div>
      )}

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
    </div>
  );
};

export default AdminComments;

