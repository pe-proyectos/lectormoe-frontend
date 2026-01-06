import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, LogIn, Edit2, Trash2, EyeOff, X, Send, Image as ImageIcon } from 'lucide-react';
import { callAPI } from '../../util/callApi';
import { uploadFile } from '../../util/uploadFile';
import { formatDate as formatDateUtil } from '../../util/date';

// Utility functions
const formatDate = (date: string | Date) => {
  if (!date) return '';
  return formatDateUtil(date, 'es');
};

const getSubscriptionDays = (subscriptionDate: string | Date) => {
  if (!subscriptionDate) return 0;
  const startDate = new Date(subscriptionDate);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

interface CommentType {
  id: number;
  userId: number;
  identifier: string;
  parentId: number | null;
  comment: string;
  imageUrl: string | null;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  likes: Array<{ userId: number; like: boolean }>;
  user: {
    id: number;
    username: string;
    imageUrl: string | null;
    subscriptions?: Array<{
      createdAt: string;
      subscriptionPlan: {
        name: string;
      };
    }>;
  };
  replies?: CommentType[];
}

interface User {
  id: number;
  username: string;
  imageUrl: string | null;
  permissions?: {
    canDeleteComment?: boolean;
    canHideComment?: boolean;
  };
}

interface CommentItemProps {
  comment: CommentType;
  user: User | null;
  logged: boolean;
  isReply?: boolean;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onEdit: (commentId: number, text: string) => void;
  onLike: (commentId: number, isLike: boolean) => void;
  onHide: (comment: CommentType) => void;
  onImageClick: (imageUrl: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment: initialComment,
  user,
  logged,
  isReply = false,
  onReply,
  onDelete,
  onEdit,
  onLike,
  onHide,
  onImageClick,
}) => {
  const [comment, setComment] = useState(initialComment);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const userLike = Array.isArray(comment.likes)
    ? comment.likes.find((l) => l.userId === user?.id)?.like === true
    : false;
  const userDislike = Array.isArray(comment.likes)
    ? comment.likes.find((l) => l.userId === user?.id)?.like === false
    : false;

  const handleEdit = () => {
    if (user?.id !== comment?.userId) return;
    setIsEditing(true);
    setEditText(comment.comment);
  };

  const handleSaveEdit = () => {
    if (editText.length < 1 || editText.length > 200) return;
    onEdit(comment.id, editText.trim());
    setIsEditing(false);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleLike = async (isLike: boolean) => {
    if (!logged || comment.userId === user?.id || isVoting) return;
    
    setIsVoting(true);
    
    // Optimistic update
    const updatedComment = {
      ...comment,
      likesCount: comment.likesCount + (userLike ? (isLike ? -1 : -1) : isLike ? 1 : 0),
      dislikesCount: comment.dislikesCount + (userDislike ? (isLike ? -1 : -1) : isLike ? 0 : 1),
      likes: (() => {
        const updatedLikes = comment.likes.filter((like) => like.userId !== user?.id);
        if (userLike && !isLike) return updatedLikes;
        if (userDislike && isLike) return updatedLikes;
        updatedLikes.push({ userId: user?.id, like: isLike });
        return updatedLikes;
      })(),
    };
    setComment(updatedComment);
    
    try {
      await onLike(comment.id, isLike);
    } catch (error) {
      // Revert on error
      setComment(comment);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-6 items-start group min-w-0">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 font-black text-xl shadow-lg overflow-hidden flex-shrink-0">
        {comment?.user?.imageUrl ? (
          <img src={comment.user.imageUrl} alt={comment.user.username} className="w-full h-full object-cover" />
        ) : (
          <span>{comment?.user?.username?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* User Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white font-black text-sm uppercase tracking-tight">
            {comment?.user?.username}
          </span>
          {comment?.user?.subscriptions && comment.user.subscriptions.length > 0 && (
            <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-[9px] font-bold uppercase tracking-widest">
              {comment.user.subscriptions[0].subscriptionPlan.name} • {getSubscriptionDays(comment.user.subscriptions[0].createdAt)} días
            </span>
          )}
          <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            {formatDate(comment?.createdAt)}
          </span>
        </div>

        {/* Comment Box */}
        {!isEditing ? (
          <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl relative">
            <span className="absolute -top-3 right-6 text-zinc-700 font-black italic text-xs">
              #{comment.id}
            </span>
            <p className="text-zinc-300 text-base leading-relaxed break-words overflow-wrap-anywhere">{comment?.comment}</p>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={200}
              className="w-full bg-zinc-950 text-white p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Comment Image */}
        {comment.imageUrl && (
          <div
            className="cursor-pointer max-w-full"
            onClick={() => onImageClick(comment.imageUrl!)}
          >
            <img
              src={comment.imageUrl}
              alt="Comment attachment"
              className="max-w-full h-auto rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pl-2">
          {/* Like/Dislike */}
          <div className="flex items-center gap-4 text-zinc-500">
            <button
              onClick={() => handleLike(true)}
              disabled={!logged || isVoting}
              className={`flex items-center gap-1.5 transition-colors ${
                userLike
                  ? 'text-green-500'
                  : 'hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <ThumbsUp size={16} />
              <span className="text-[10px] font-bold">{comment.likesCount}</span>
            </button>
            <button
              onClick={() => handleLike(false)}
              disabled={!logged || isVoting}
              className={`flex items-center gap-1.5 transition-colors ${
                userDislike
                  ? 'text-red-500'
                  : 'hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <ThumbsDown size={16} />
              <span className="text-[10px] font-bold">{comment.dislikesCount}</span>
            </button>
          </div>

          {/* Reply */}
          {!isReply && logged && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-zinc-500 hover:text-cyan-500 transition-colors"
              title="Responder"
            >
              <MessageCircle size={16} />
            </button>
          )}

          {/* Edit */}
          {user?.id === comment?.userId && (
            <button
              onClick={handleEdit}
              className="text-zinc-500 hover:text-cyan-500 transition-colors"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
          )}

          {/* Delete */}
          {user?.id === comment?.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-zinc-500 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Hide (Admin) */}
          {user?.permissions?.canHideComment && user?.id !== comment?.userId && (
            <button
              onClick={() => onHide(comment)}
              className="text-zinc-500 hover:text-orange-500 transition-colors"
              title="Ocultar"
            >
              <EyeOff size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CommentsSectionProps {
  identifier: string;
  logged: boolean;
  user: User | null;
  onLogin?: () => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  identifier,
  logged,
  user,
  onLogin,
}) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  // Reply states
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<CommentType | null>(null);

  // Image zoom
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Hide dialog (admin)
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [selectedCommentToHide, setSelectedCommentToHide] = useState<CommentType | null>(null);
  const [hideReason, setHideReason] = useState('');
  const [isHidingComment, setIsHidingComment] = useState(false);

  const baseIdentifier = identifier.replace(/_sidebar$|_drawer$|_accordion$/, '');

  const getComments = async () => {
    try {
      setIsLoading(true);
      const response = await callAPI(`/api/comment?identifier=${baseIdentifier}`);
      // callAPI ya extrae el data, response es directamente el array de comentarios
      setComments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error al cargar comentarios', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getComments();
  }, [baseIdentifier]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede ser mayor a 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    const targetComment =
      comments.find((c) => c.id === commentId) ||
      comments.flatMap((c) => c.replies || []).find((r) => r.id === commentId);
    setReplyingToComment(targetComment || null);
    setCommentText('');
    clearImage();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyingToComment(null);
  };

  const postComment = async () => {
    if (!logged) return;
    if (commentText.length < 1) {
      alert('El comentario no puede estar vacío');
      return;
    }
    if (commentText.length > 200) {
      alert('El comentario no puede tener más de 200 caracteres');
      return;
    }

    try {
      setIsPosting(true);
      let imageKey = null;
      if (imageFile) {
        imageKey = await uploadFile(imageFile, undefined, 'comments');
      }

      await callAPI('/api/comment', {
        method: 'POST',
        body: JSON.stringify({
          identifier: baseIdentifier,
          comment: commentText.trim(),
          ...(replyingTo ? { parentId: replyingTo.toString() } : {}),
          ...(imageKey ? { image: imageKey } : {}),
        }),
      });

      setCommentText('');
      clearImage();
      cancelReply();
      getComments();
    } catch (error) {
      console.error('Error al comentar', error);
      alert('Error al comentar');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const permissions = user?.permissions || {};
      if (user?.id !== comments.find((c) => c.id === commentId)?.userId && !permissions.canDeleteComment) {
        alert('No tienes permisos para eliminar este comentario');
        return;
      }

      setComments(comments.filter((c) => c.id !== commentId));
      await callAPI(`/api/comment/${commentId}`, { method: 'DELETE' });
      getComments();
    } catch (error) {
      console.error('Error al eliminar comentario', error);
      alert('Error al eliminar el comentario');
    }
  };

  const handleEditComment = async (commentId: number, text: string) => {
    try {
      await callAPI(`/api/comment/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ comment: text }),
      });
      getComments();
    } catch (error) {
      console.error('Error al editar comentario', error);
      alert('Error al editar el comentario');
    }
  };

  const handleLikeComment = async (commentId: number, isLike: boolean) => {
    try {
      await callAPI(`/api/comment/${commentId}/like`, {
        method: 'POST',
        body: JSON.stringify({ like: isLike }),
      });
      getComments();
    } catch (error) {
      console.error('Error al votar comentario', error);
      alert('Error al votar el comentario');
    }
  };

  const handleHideComment = async () => {
    if (!selectedCommentToHide || isHidingComment) return;

    try {
      setIsHidingComment(true);
      await callAPI(`/api/comment/${selectedCommentToHide.id}/hide`, {
        method: 'POST',
        body: JSON.stringify({ reason: hideReason }),
      });
      getComments();
      setHideDialogOpen(false);
      setHideReason('');
      setSelectedCommentToHide(null);
    } catch (error) {
      console.error('Error al ocultar comentario', error);
      alert('Error al ocultar el comentario');
    } finally {
      setIsHidingComment(false);
    }
  };

  const handleShowHideDialog = (comment: CommentType) => {
    setSelectedCommentToHide(comment);
    setHideDialogOpen(true);
  };

  return (
    <div className="mt-24 pt-16 border-t border-zinc-900 space-y-10 mb-20">
      <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Comentarios</h2>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-base font-medium">Aún no hay comentarios.</p>
          <p className="text-zinc-500 text-sm font-medium mt-2">¡Sé el primero en comentar!</p>
        </div>
      ) : (
        <div className="space-y-8 overflow-x-hidden">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-6 min-w-0">
              <CommentItem
                comment={comment}
                user={user}
                logged={logged}
                onReply={handleReply}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
                onLike={handleLikeComment}
                onHide={handleShowHideDialog}
                onImageClick={setZoomImageUrl}
              />

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 md:ml-20 space-y-6 min-w-0">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      user={user}
                      logged={logged}
                      isReply={true}
                      onReply={handleReply}
                      onDelete={handleDeleteComment}
                      onEdit={handleEditComment}
                      onLike={handleLikeComment}
                      onHide={handleShowHideDialog}
                      onImageClick={setZoomImageUrl}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      {logged ? (
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-[40px] space-y-4">
          {/* Reply Indicator */}
          {replyingTo && replyingToComment && (
            <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
              <span className="text-cyan-400 text-sm font-bold">
                Respondiendo al comentario #{replyingToComment.id} de {replyingToComment.user.username}
              </span>
              <button
                onClick={cancelReply}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-2xl border border-zinc-800"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="comment-image-upload"
            />
            <label
              htmlFor="comment-image-upload"
              className="w-12 h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
            >
              <ImageIcon size={20} className="text-zinc-500" />
            </label>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  postComment();
                }
              }}
              placeholder={replyingTo ? 'Escribir respuesta...' : 'Escribe un comentario...'}
              maxLength={200}
              className="flex-1 bg-zinc-950 text-white p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
            />

            <button
              onClick={postComment}
              disabled={isPosting || commentText.length < 1}
              className="w-12 h-12 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isPosting ? (
                <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={20} className="text-zinc-950" />
              )}
            </button>
          </div>

          <p className="text-zinc-600 text-xs text-right">
            {commentText.length}/200 caracteres
          </p>
        </div>
      ) : (
        <div className="p-10 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-[40px] text-center space-y-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
            <LogIn size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
              Únete a la conversación
            </h3>
            <p className="text-zinc-500 text-sm font-medium">
              Inicia sesión para dejar tus pensamientos sobre este manga.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="bg-white text-zinc-950 px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl active:scale-95"
          >
            Inicia sesión para comentar
          </button>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-zinc-400 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={zoomImageUrl}
              alt="Vista previa"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Hide Comment Dialog (Admin) */}
      {hideDialogOpen && selectedCommentToHide && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full space-y-6">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Ocultar Comentario #{selectedCommentToHide.id}
            </h3>
            <div>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">
                Comentario de: {selectedCommentToHide.user.username}
              </p>
              <p className="text-zinc-300 text-base italic">"{selectedCommentToHide.comment}"</p>
            </div>
            <textarea
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder="Explica por qué ocultas este comentario..."
              className="w-full bg-zinc-950 text-white p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-orange-500 resize-none"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setHideDialogOpen(false)}
                disabled={isHidingComment}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleHideComment}
                disabled={isHidingComment}
                className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                {isHidingComment ? 'Ocultando...' : 'Ocultar Comentario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;

