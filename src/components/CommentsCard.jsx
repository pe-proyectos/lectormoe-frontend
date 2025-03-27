import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Card,
  Typography,
  IconButton,
  Textarea,
  Avatar,
  ListItem,
  List,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";

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

const CommentListItem = ({
  user,
  logged,
  comment: initialCommentData,
  comments,
  setComments,
  getComments,
  setSelectedZoomImage,
  setZoomImageDialogOpen,
}) => {
  const [comment, setComment] = useState(initialCommentData);
  const [isVoting, setIsVoting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userLike = Array.isArray(comment.likes)
    ? comment.likes.find((l) => l.userId === user?.id)?.like === true
    : null;
  const userDislike = Array.isArray(comment.likes)
    ? comment.likes.find((l) => l.userId === user?.id)?.like === false
    : null;

  const handleDelete = async () => {
    try {
      if (user?.id !== comment?.userId && !user?.canDeleteComment) {
        toast.error("No tienes permisos para eliminar este comentario");
        return;
      }
      setComments(comments.filter((c) => c.id !== comment.id));
      await callAPI(`/api/comment/${comment.id}`, {
        method: "DELETE",
      });
      getComments();
      toast.success("Comentario eliminado");
    } catch (error) {
      console.error("Error al eliminar comentario", error);
      toast.error("Error al eliminar el comentario");
    }
  };

  const handleEdit = () => {
    if (user?.id !== comment?.userId) {
      toast.error("No puedes editar este comentario");
      return;
    }
    setEditing(true);
    setEditText(comment.comment);
  };

  const handleSaveEdit = async () => {
    try {
      if (editText.length < 1) {
        toast.error("El comentario no puede estar vacío");
        return;
      }
      if (editText.length > 200) {
        toast.error("El comentario no puede tener más de 200 caracteres");
        return;
      }

      setIsLoading(true);
      const response = await callAPI(`/api/comment/${comment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          comment: editText.trim(),
        }),
      });
      if (response) {
        toast.success("Comentario editado");
        setComment({ ...comment, comment: editText.trim() });
        setComments(
          comments.map((c) =>
            c.id === comment.id ? { ...c, comment: editText.trim() } : c
          )
        );
      } else {
        toast.error("No se puede editar el comentario en este momento");
      }
    } catch (error) {
      console.error("Error al editar comentario", error);
      toast.error("Error al editar el comentario");
    } finally {
      setIsLoading(false);
      setEditing(false);
      setEditText("");
      getComments();
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText("");
  };

  const handleLike = async (isLike) => {
    if (!logged) {
      toast.error("Debes estar logueado para votar");
      return;
    }

    if (comment.userId === user?.id) {
      toast.error("No puedes votar tu propio comentario");
      return;
    }

    if (isVoting) {
      return;
    }

    try {
      setIsVoting(true);
      setComment({
        ...comment,
        likesCount:
          comment.likesCount + (userLike ? (isLike ? -1 : -1) : isLike ? 1 : 0),
        dislikesCount:
          comment.dislikesCount +
          (userDislike ? (isLike ? -1 : -1) : isLike ? 0 : 1),
        likes: (() => {
          const updatedLikes = comment.likes.filter(
            (like) => like.userId !== user?.id
          );
          if (userLike && !isLike) return updatedLikes; // Si el usuario tenía "like" y lo quita
          if (userDislike && isLike) return updatedLikes; // Si el usuario tenía "dislike" y lo cambia a "like"
          updatedLikes.push({ userId: user?.id, like: isLike });
          return updatedLikes;
        })(),
      });
      const response = await callAPI(`/api/comment/${comment.id}/like`, {
        method: "POST",
        body: JSON.stringify({
          like: isLike,
        }),
      });
      setComment(response);
    } catch (error) {
      console.error("Error al votar comentario", error);
      toast.error("Error al votar el comentario");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <ListItem
      key={comment.id}
      className="text-white hover:bg-gray-800 active:bg-gray-800 focus:bg-gray-800"
    >
      <div className="w-full">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 justify-center items-center">
            {comment?.user?.imageUrl && (
              <Avatar
                variant="circular"
                alt={comment.user.username}
                src={comment.user.imageUrl}
                size="xs"
              />
            )}
            {!comment?.user?.imageUrl && (
              <IconButton className="rounded-full bg-gray-700" size="sm">
                <svg
                  className="w-6 h-6 text-gray-300"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                    clipRule="evenodd"
                  />
                </svg>
              </IconButton>
            )}
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs">
                {comment?.user?.username}
              </span>
              <span className="text-gray-400 text-xs">
                {formatDate(comment?.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Typography variant="small" color="gray" className="text-xs">
              {formatDate(comment?.createdAt)}
            </Typography>
            {user?.id === comment?.userId && (
              <button
                onClick={handleEdit}
                className="text-gray-400 hover:text-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {(user?.id === comment?.userId || user?.canDeleteComment) && (
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="ml-[40px] py-2">
          <Typography
            variant="paragraph"
            color="white"
            className="font-normal text-sm"
          >
            {comment?.comment}
          </Typography>
          <div
            className={
              "flex flex-col gap-2 bg-gray-800 p-2 rounded-md " +
              (editing ? "" : "hidden")
            }
          >
            <Textarea
              key={comment.id}
              value={editText}
              onChange={(e) => {
                e.preventDefault();
                setEditText(e.target.value);
              }}
              autoFocus={true}
              maxLength={200}
              label="Editar comentario"
              labelProps={{
                className: "text-gray-400",
              }}
              className="min-h-full text-white bg-gray-900 no-scrollbar"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={isLoading}>
                Guardar
              </Button>
              <Button
                size="sm"
                color="red"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
        {comment.imageUrl && (
          <div
            className="flex w-full ml-[40px] my-2 p-4 cursor-pointer max-h-56 max-w-56 justify-center items-center"
            onClick={() => (
              setSelectedZoomImage(comment.imageUrl),
              setZoomImageDialogOpen(true)
            )}
          >
            <img
              src={comment.imageUrl}
              alt="Comment attachment"
              className={`max-w-full h-auto rounded-lg transition-all duration-200`}
            />
          </div>
        )}
        <div
          className={
            "flex gap-4 ml-[40px] mt-2 " + (isVoting ? "opacity-50" : "")
          }
        >
          <button
            onClick={() => handleLike(true)}
            className={`flex items-center gap-1 ${
              userLike === true
                ? "text-blue-500"
                : "text-gray-400 hover:text-blue-500"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>{comment.likesCount}</span>
          </button>

          <button
            onClick={() => handleLike(false)}
            className={`flex items-center gap-1 ${
              userDislike === true
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
              />
            </svg>
            <span>{comment.dislikesCount}</span>
          </button>
        </div>
      </div>
    </ListItem>
  );
};

export function CommentsCard({ identifier, logged, user }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [zoomImageDialogOpen, setZoomImageDialogOpen] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState(null);

  const getComments = () => {
    callAPI(`/api/comment?identifier=${identifier}`).then((comments) => {
      setComments(comments);
    });
  };

  useEffect(() => {
    getComments();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("La imagen no puede ser mayor a 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const postComment = async () => {
    if (!logged) {
      toast.error("Debes estar logueado para comentar");
      return;
    }
    if (commentText.length < 1) {
      toast.error("El comentario no puede estar vacío");
      return;
    }
    if (commentText.length > 200) {
      toast.error("El comentario no puede tener más de 200 caracteres");
      return;
    }

    setCommentText("");
    clearImage();

    const formData = new FormData();
    formData.append("identifier", identifier);
    if (imageFile) formData.append("image", imageFile);
    formData.append("comment", commentText.trim());
    callAPI("/api/comment", {
      method: "POST",
      body: formData,
    })
      .then(() => {
        getComments();
      })
      .catch((error) => {
        console.error("Error al comentar", error);
        toast.error("Error al comentar");
      });
  };

  return (
    <Card className="h-full w-full bg-gray-900 p-4">
      <div className="flex flex-col gap-2 justify-center items-center">
        <Typography variant="h5" color="white">
          Comentarios
        </Typography>
      </div>
      {/* Comentarios por pagina */}
      <div
        className="h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-800
  [&::-webkit-scrollbar-thumb]:bg-gray-600"
      >
        {comments.length === 0 ? (
          <div className="flex h-full w-full flex-col gap-2 justify-center items-center py-4">
            <Typography
              variant="paragraph"
              color="gray"
              className="text-center"
            >
              Aún no hay comentarios.
            </Typography>
            <Typography
              variant="paragraph"
              color="gray"
              className="text-center"
            >
              ¡Sé el primero en comentar!
            </Typography>
          </div>
        ) : (
          <List className="py-0 my-0">
            {comments.map((comment) => (
              <CommentListItem
                key={comment.id}
                user={user}
                comment={comment}
                logged={logged}
                comments={comments}
                setComments={setComments}
                getComments={getComments}
                setSelectedZoomImage={setSelectedZoomImage}
                setZoomImageDialogOpen={setZoomImageDialogOpen}
              />
            ))}
          </List>
        )}
      </div>
      {/* Caja comentarios */}
      <div
        className={
          "mt-4 flex flex-col border border-gray-700 p-2 m-0 " +
          (logged ? "bg-gray-800" : "bg-gray-900")
        }
      >
        <div className="flex w-full flex-row items-center gap-2">
          <div className="flex w-4 min-w-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={!logged}
            />
            <label
              htmlFor="image-upload"
              className={"cursor-pointer " + (!logged && "opacity-50")}
            >
              <IconButton
                variant="text"
                className="rounded-full text-white"
                type="button"
                disabled={!logged}
                onClick={() => {
                  document.getElementById("image-upload").click();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </IconButton>
            </label>
          </div>
          <div className="flex-grow flex flex-col gap-4 justify-center items-center">
            <Textarea
              rows={1}
              resize={true}
              placeholder={logged ? "Comentar" : "Inicia sesión para comentar"}
              maxLength={200}
              minLength={1}
              className="min-h-full !border-0 focus:border-transparent text-white bg-transparent no-scrollbar"
              disabled={!logged}
              containerProps={{
                className: "grid h-full",
              }}
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  postComment();
                }
              }}
            />
          </div>
          <div>
            <IconButton
              variant="text"
              className="rounded-full text-white"
              onClick={postComment}
              disabled={!logged}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </IconButton>
          </div>
        </div>
        <div className="flex-grow flex flex-col gap-4 justify-center items-center">
          {imagePreview && (
            <div className="relative mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded object-contain"
              />
              <button
                onClick={clearImage}
                className="absolute top-1 right-1 bg-gray-800 rounded-full p-1 hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={zoomImageDialogOpen}
        handler={() => setZoomImageDialogOpen(false)}
        size="xl"
      >
        <DialogHeader className="text-white bg-gray-900">
          Vista previa de imagen
        </DialogHeader>
        <DialogBody className="flex justify-center bg-black">
          <img
            src={selectedZoomImage}
            alt="Vista previa"
            className="max-h-[80vh] max-w-full object-contain"
          />
        </DialogBody>
        <DialogFooter className="bg-gray-900">
          <Button
            variant="text"
            color="white"
            onClick={() => setZoomImageDialogOpen(false)}
            className="mr-1"
          >
            <span>Cerrar</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </Card>
  );
}
