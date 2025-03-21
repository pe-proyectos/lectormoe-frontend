import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Card,
  Typography,
  IconButton,
  Textarea,
  Avatar,
  ListItemPrefix,
  ListItem,
  List,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";

export function CommentsCard({ identifier, logged }) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const getComments = () => {
    callAPI(`/api/comment?identifier=${identifier}`).then((comments) => {
      setComments(comments);
    });
  };

  useEffect(() => {
    getComments();
  }, []);

  const postComment = () => {
    if (!logged) {
      toast.error("Debes estar logueado para comentar");
      return;
    }
    if (comment.length < 1) {
      toast.error("El comentario no puede estar vacío");
      return;
    }
    if (comment.length > 200) {
      toast.error("El comentario no puede tener más de 200 caracteres");
      return;
    }
    setComment("");
    callAPI("/api/comment", {
      method: "POST",
      body: JSON.stringify({
        identifier,
        comment: comment.trim(),
        imageUrl: null,
      }),
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
        <List className="py-0 my-0">
          {comments
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
            .map((comment) => (
              <ListItem
                key={comment.id}
                className="text-white hover:bg-gray-800"
              >
                <ListItemPrefix>
                  {comment.user.imageUrl && (
                    <Avatar
                      variant="circular"
                      alt={comment.user.username}
                      src={comment.user.imageUrl}
                      size="xs"
                    />
                  )}
                  {!comment.user.imageUrl && (
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
                </ListItemPrefix>
                <div>
                  <Typography variant="small" color="gray" className="text-xs">
                    {comment.user.username}
                  </Typography>
                  <Typography
                    variant="paragraph"
                    color="white"
                    className="font-normal text-sm"
                  >
                    {comment.comment}
                  </Typography>
                </div>
              </ListItem>
            ))}
        </List>
      </div>
      {/* Caja comentarios */}
      <div
        className={
          "mt-4 flex w-full flex-row items-center gap-2 rounded-[99px] border border-gray-700 p-2 " +
          (logged ? "bg-gray-800" : "bg-gray-900")
        }
      >
        <div className="flex w-4 min-w-4">
          {/* <Select size="md" className="w-4 min-w-4" selected={() => commentPage.toString()} onChange={(e) => setCommentPage(parseInt(e || "1"))}>
                      {chapterData.pages
                        .filter((page) => page.number <= currentPage)
                        .map((page) => (
                          <Option key={page.number} value={page.number.toString()}>
                            #{page.number}
                          </Option>
                        ))}
                    </Select> */}
        </div>
        <Textarea
          rows={1}
          resize={true}
          placeholder={logged ? "Comentar" : "Inicia sesión para comentar"}
          maxLength={200}
          minLength={1}
          className="min-h-full !border-0 focus:border-transparent text-white bg-transparent"
          disabled={!logged}
          containerProps={{
            className: "grid h-full",
          }}
          labelProps={{
            className: "before:content-none after:content-none",
          }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              postComment();
            }
          }}
        />
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
    </Card>
  );
}
