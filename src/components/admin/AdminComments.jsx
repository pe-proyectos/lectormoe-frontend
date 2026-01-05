import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  Alert,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Typography,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Textarea,
  Input,
  Select,
  Option,
  Chip,
  Avatar,
  Badge,
} from "@material-tailwind/react";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";

const formatDate = (date) => {
  if (!date) return "";
  const dt = new Date(date);
  const diff = Math.floor((new Date().getTime() - dt.getTime()) / 1000);
  const times = [
    { unit: "mes", value: Math.floor(diff / (30 * 24 * 60 * 60)) },
    { unit: "semana", value: Math.floor(diff / (7 * 24 * 60 * 60)) },
    { unit: "día", value: Math.floor(diff / (24 * 60 * 60)) },
    { unit: "hora", value: Math.floor(diff / (60 * 60)) },
    { unit: "minuto", value: Math.floor(diff / 60) },
    { unit: "segundo", value: diff },
  ];
  const time = times.find((t) => t.value > 0);
  return time
    ? `hace ${time.value} ${time.unit}${time.value > 1 ? "s" : ""}`
    : "hoy";
};

const getSubscriptionDays = (subscriptionDate) => {
  if (!subscriptionDate) return 0;
  const startDate = new Date(subscriptionDate);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const CommentCard = ({ comment, onHide, onDelete, onRestore, currentUser }) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showImage, setShowImage] = useState(false);

  const isReply = comment.parentId !== null;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div
      className={`border rounded-lg p-4 mb-4 ${
        isReply ? "ml-8 bg-gray-50" : "bg-white"
      }`}
    >
      {/* Header del comentario */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {comment.user?.imageUrl ? (
            <Avatar
              src={comment.user.imageUrl}
              alt={comment.user.username}
              size="sm"
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
                     <div>
             <Typography variant="small" className="font-semibold">
               {comment.user?.username}
             </Typography>
                           {comment.user?.subscriptions && comment.user.subscriptions.length > 0 && (
                <Typography variant="small" color="blue" className="font-medium">
                  {comment.user.subscriptions[0].subscriptionPlan.name} • {getSubscriptionDays(comment.user.subscriptions[0].createdAt)} días
                </Typography>
              )}
             <Typography variant="small" color="gray">
               #{comment.id} • {formatDate(comment.createdAt)}
             </Typography>
             {isReply && (
               <Typography variant="small" color="blue">
                 Respuesta al comentario #{comment.parentId}
               </Typography>
             )}
           </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            value={
              comment.deletedAt
                ? "Eliminado"
                : comment.hiddenAt
                ? "Oculto"
                : "Activo"
            }
            color={
              comment.deletedAt ? "red" : comment.hiddenAt ? "orange" : "green"
            }
            size="sm"
          />
          {hasReplies && (
            <Badge content={comment.replies.length} color="blue">
              <Button
                variant="text"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? "Ocultar" : "Mostrar"} respuestas
              </Button>
            </Badge>
          )}
        </div>
      </div>

      {/* Contenido del comentario */}
      <div className="mb-3">
        <Typography variant="paragraph" className="mb-2">
          {comment.comment}
        </Typography>

        {/* Imagen del comentario */}
        {comment.imageUrl && (
          <div className="mb-3">
            <img
              src={comment.imageUrl}
              alt="Imagen del comentario"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowImage(true)}
            />
          </div>
        )}

        {/* Razón de ocultamiento */}
        {comment.hiddenReason && (
          <Alert color="orange" className="mt-2">
            <Typography variant="small">
              <strong>Razón de ocultamiento:</strong> {comment.hiddenReason}
            </Typography>
            {comment.hiddenByUser && (
              <Typography variant="small" className="mt-1">
                <strong>Ocultado por:</strong> {comment.hiddenByUser.username}
              </Typography>
            )}
          </Alert>
        )}

        {/* Información adicional */}
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>Identifier: {comment.identifier}</span>
          <span>Likes: {comment.likesCount || 0}</span>
          <span>Dislikes: {comment.dislikesCount || 0}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {!comment.deletedAt && !comment.hiddenAt && (
          <>
            {/* Solo admins pueden ocultar comentarios */}
            <Button
              variant="outlined"
              color="orange"
              size="sm"
              onClick={() => onHide(comment)}
            >
              Ocultar
            </Button>
            {/* Solo el autor del comentario puede eliminarlo */}
            {currentUser && comment.userId === currentUser.id && (
              <Button
                variant="outlined"
                color="red"
                size="sm"
                onClick={() => onDelete(comment.id)}
              >
                Eliminar
              </Button>
            )}
          </>
        )}
        {comment.hiddenAt && !comment.deletedAt && (
          <Button
            variant="outlined"
            color="green"
            size="sm"
            onClick={() => onRestore(comment.id)}
          >
            Restaurar
          </Button>
        )}
      </div>

      {/* Respuestas */}
      {hasReplies && showReplies && (
        <div className="mt-4 border-t pt-4">
          <Typography variant="h6" className="mb-3">
            Respuestas ({comment.replies.length})
          </Typography>
                     {comment.replies.map((reply) => (
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

      {/* Dialog para ver imagen */}
      <Dialog open={showImage} handler={() => setShowImage(false)} size="xl">
        <DialogHeader>Imagen del comentario #{comment.id}</DialogHeader>
        <DialogBody className="flex justify-center">
          <img
            src={comment.imageUrl}
            alt="Imagen del comentario"
            className="max-h-[70vh] max-w-full object-contain"
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setShowImage(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export function AdminComments({ language, user, organizationSlug, organization }) {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [hideReason, setHideReason] = useState("");

     // Filtros y ordenamiento
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [identifierFilter, setIdentifierFilter] = useState("");
   const [sortBy, setSortBy] = useState("date");
   const [sortOrder, setSortOrder] = useState("desc");
   const [showIdentifierDropdown, setShowIdentifierDropdown] = useState(false);

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
      .catch((error) =>
        toast.error(error?.message || _("error_loading_comments"))
      )
      .finally(() => setLoading(false));
  };

     const applyFiltersAndSort = () => {
     let filtered = [...comments];

           // Filtrar por término de búsqueda primero
      if (searchTerm) {
        // Buscar comentarios principales que coincidan directamente
        const matchingMainComments = comments.filter(
          (comment) =>
            !comment.parentId && (
              comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
              comment.user?.username
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              comment.identifier.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

                 // Buscar respuestas que coincidan en los comentarios principales
         const matchingReplies = [];
         const parentIds = new Set();
         
         comments.forEach(comment => {
           if (!comment.parentId && comment.replies) {
             comment.replies.forEach(reply => {
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

                 // Buscar los comentarios padres y filtrar sus respuestas para mostrar solo las que coinciden
         const parentComments = comments.filter(comment => 
           !comment.parentId && parentIds.has(comment.id)
         ).map(parentComment => ({
           ...parentComment,
           replies: parentComment.replies.filter(reply => 
             reply.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
             reply.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
             reply.identifier.toLowerCase().includes(searchTerm.toLowerCase())
           )
         }));

        // Combinar comentarios principales que coinciden directamente + comentarios padres de respuestas que coinciden
        const allMatchingMainComments = [...matchingMainComments, ...parentComments];
        
        // Eliminar duplicados por ID
        filtered = allMatchingMainComments.filter((comment, index, self) => 
          index === self.findIndex(c => c.id === comment.id)
        );
      } else {
        // Si no hay término de búsqueda, filtrar solo comentarios principales
        filtered = filtered.filter((comment) => !comment.parentId);
      }

     // Filtrar por estado
     if (statusFilter !== "all") {
       filtered = filtered.filter((comment) => {
         switch (statusFilter) {
           case "active":
             return !comment.deletedAt && !comment.hiddenAt;
           case "hidden":
             return comment.hiddenAt && !comment.deletedAt;
           case "deleted":
             return comment.deletedAt;
           default:
             return true;
         }
       });
     }

     // Filtrar por identifier
     if (identifierFilter) {
       filtered = filtered.filter((comment) =>
         comment.identifier
           .toLowerCase()
           .includes(identifierFilter.toLowerCase())
       );
     }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "user":
          aValue = a.user?.username || "";
          bValue = b.user?.username || "";
          break;
        case "likes":
          aValue = a.likesCount || 0;
          bValue = b.likesCount || 0;
          break;
        case "identifier":
          aValue = a.identifier || "";
          bValue = b.identifier || "";
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
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
        method: "POST",
        body: JSON.stringify({ reason: hideReason }),
      });
      toast.success(_("comment_hidden_successfully"));
      refreshComments();
      setHideDialogOpen(false);
      setHideReason("");
      setSelectedComment(null);
    } catch (error) {
      toast.error(error?.message || _("error_hiding_comment"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(_("confirm_delete_comment"))) return;

    try {
      await callAPI(`/api/comment/${commentId}`, {
        method: "DELETE",
      });
      toast.success(_("comment_deleted_successfully"));
      refreshComments();
    } catch (error) {
      toast.error(error?.message || _("error_deleting_comment"));
    }
  };

  const handleRestoreComment = async (commentId) => {
    try {
      await callAPI(`/api/comment/${commentId}/restore`, {
        method: "POST",
      });
      toast.success("Comentario restaurado exitosamente");
      refreshComments();
    } catch (error) {
      toast.error(error?.message || "Error al restaurar el comentario");
    }
  };

  const handleHide = (comment) => {
    setSelectedComment(comment);
    setHideDialogOpen(true);
  };

  const handleDelete = (commentId) => {
    handleDeleteComment(commentId);
  };

  const handleRestore = (commentId) => {
    handleRestoreComment(commentId);
  };

  // Obtener identificadores únicos para el filtro
  const uniqueIdentifiers = [
    ...new Set(comments.map((c) => c.identifier)),
  ].sort();

  return (
    <div className="w-full my-4">
      <Card>
                 <CardHeader 
           floated={false} 
           shadow={false} 
           className="rounded-none"
           style={{ overflow: 'visible' }}
         >
          <div className="flex items-center justify-between gap-8 mb-4">
            <div>
              <Typography variant="h5" color="blue-gray">
                Gestión de Comentarios
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Administra todos los comentarios de la plataforma
              </Typography>
            </div>
            <Button
              variant="outlined"
              color="blue"
              onClick={refreshComments}
              disabled={loading}
            >
                             {loading ? <Spinner /> : "Actualizar"}
            </Button>
          </div>

          {/* Filtros y búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              label="Buscar comentarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />

                         <Select
               label="Estado"
               value={statusFilter}
               onChange={(value) => setStatusFilter(value)}
               style={{ position: 'relative' }}
             >
              <Option value="all">Todos</Option>
              <Option value="active">Activos</Option>
              <Option value="hidden">Ocultos</Option>
              <Option value="deleted">Eliminados</Option>
            </Select>

                                      <div className="relative">
               <Input
                 label="Identifier"
                 value={identifierFilter}
                 onChange={(e) => setIdentifierFilter(e.target.value)}
                 placeholder="Buscar identifier..."
                 onFocus={() => setShowIdentifierDropdown(true)}
                 onBlur={() => setTimeout(() => setShowIdentifierDropdown(false), 200)}
               />
               {showIdentifierDropdown && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                   <div 
                     className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b"
                     onClick={() => {
                       setIdentifierFilter("");
                       setShowIdentifierDropdown(false);
                     }}
                   >
                     Todos
                   </div>
                   {uniqueIdentifiers
                     .filter(identifier => 
                       identifier.toLowerCase().includes(identifierFilter.toLowerCase())
                     )
                     .map((identifier) => (
                       <div 
                         key={identifier}
                         className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                         onClick={() => {
                           setIdentifierFilter(identifier);
                           setShowIdentifierDropdown(false);
                         }}
                       >
                         {identifier}
                       </div>
                     ))}
                 </div>
               )}
             </div>

            <div className="flex gap-2">
                             <Select
                 label="Ordenar por"
                 value={sortBy}
                 onChange={(value) => setSortBy(value)}
                 style={{ position: 'relative' }}
               >
                <Option value="date">Fecha</Option>
                <Option value="user">Usuario</Option>
                <Option value="likes">Likes</Option>
                <Option value="identifier">Identifier</Option>
              </Select>
              <IconButton
                variant="outlined"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </IconButton>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex gap-4 mb-4">
            <Chip value={`Total: ${comments.length}`} color="blue" />
            <Chip
              value={`Activos: ${
                comments.filter((c) => !c.deletedAt && !c.hiddenAt).length
              }`}
              color="green"
            />
            <Chip
              value={`Ocultos: ${
                comments.filter((c) => c.hiddenAt && !c.deletedAt).length
              }`}
              color="orange"
            />
            <Chip
              value={`Eliminados: ${
                comments.filter((c) => c.deletedAt).length
              }`}
              color="red"
            />
            <Chip
              value={`Con imágenes: ${
                comments.filter((c) => c.imageUrl).length
              }`}
              color="purple"
            />
            <Chip
              value={`Con respuestas: ${
                comments.filter((c) => c.replies && c.replies.length > 0).length
              }`}
              color="indigo"
            />
          </div>
        </CardHeader>

        <CardBody className="px-0">
          {loading ? (
                         <div className="flex justify-center p-8">
               <Spinner />
             </div>
          ) : filteredComments.length === 0 ? (
            <Alert className="mx-4">
              {searchTerm || statusFilter !== "all" || identifierFilter
                ? "No se encontraron comentarios con los filtros aplicados"
                : "No se encontraron comentarios"}
            </Alert>
          ) : (
            <div className="px-4">
              <Typography variant="small" color="gray" className="mb-4">
                Mostrando {filteredComments.length} de {comments.length}{" "}
                comentarios
              </Typography>

              {/* Lista de comentarios */}
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* Dialog para ocultar comentario */}
      <Dialog open={hideDialogOpen} handler={() => setHideDialogOpen(false)}>
        <DialogHeader>Ocultar Comentario #{selectedComment?.id}</DialogHeader>
        <DialogBody>
          <div className="mb-4">
            <Typography variant="small" color="gray">
              Comentario de: {selectedComment?.user?.username}
            </Typography>
            <Typography variant="paragraph" className="mt-2">
              "{selectedComment?.comment}"
            </Typography>
          </div>
          <Textarea
            label="Razón para ocultar"
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Explica por qué ocultas este comentario..."
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setHideDialogOpen(false)}
            className="mr-1"
          >
            Cancelar
          </Button>
          <Button variant="gradient" color="orange" onClick={handleHideComment}>
            Ocultar Comentario
          </Button>
        </DialogFooter>
      </Dialog>

      <ToastContainer theme="dark" />
    </div>
  );
}
