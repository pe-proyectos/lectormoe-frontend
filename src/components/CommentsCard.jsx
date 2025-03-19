import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Button,
  ButtonGroup,
  Card,
  Typography,
  Accordion,
  AccordionHeader,
  AccordionBody,
  IconButton,
  Textarea,
  Avatar,
  ListItemPrefix,
  ListItem,
  List,
} from "@material-tailwind/react";
import { callAPI } from "../util/callApi";

export function CommentsCard({
  manga,
  chapter,
  chapterData,
  chapterNumber,
  currentPage,
  settings,
  logged,
}) {
  const readTypes = {
    PAGINATED: "paginated",
    CASCADE: "cascade",
  };

  const [comments, setComments] = useState([]);
  const [pagesWithComments, setPagesWithComments] = useState([]);
  const [opennedPageAccordions, setOpennedPageAccordions] = useState([]);
  const [comment, setComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);

  const isPageWithCommentsOpen = (page) => {
    if (opennedPageAccordions.includes(page)) {
      return true;
    }
    if (settings.readType === readTypes.PAGINATED) {
      return page == currentPage;
    }
    return page <= currentPage && page >= currentPage - 3;
  };

  const getComments = () => {
    callAPI(
      `/api/comment?identifier=${manga.slug}_${chapterNumber}&mangaCustomId=${manga.id}&chapterId=${chapter.id}`
    ).then((comments) => {
      console.log("comments", comments);
      setComments(comments);
      setPagesWithComments(
        [...new Set(comments.map((comment) => comment.pageNumber))].sort(
          (a, b) => a - b
        )
      );
    });
  };

  useEffect(() => {
    getComments();
  }, []);

  useEffect(() => {
    setCommentPage(currentPage);
  }, [currentPage]);

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
        comment: comment.trim(),
        mangaCustomId: manga.id,
        chapterId: chapter.id,
        pageNumber:
          commentPage + (settings.readType === readTypes.CASCADE ? 1 : 0),
        identifier: `${manga.slug}_${chapterNumber}`,
      }),
    }).then(() => {
      getComments();
    });
  };

  return (
    <Card className="h-full w-full bg-gray-200 p-4">
      <div className="flex flex-col gap-2 justify-center items-center">
        <Typography variant="h5" color="blue-gray">
          Comentarios
        </Typography>
        <ButtonGroup variant="text" size="sm">
          <Button
            size="sm"
            onClick={() => {
              setOpennedPageAccordions(
                chapterData.pages.map((page) => page.number)
              );
            }}
          >
            Abrir todos
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setOpennedPageAccordions([]);
            }}
          >
            Cerrar todos
          </Button>
        </ButtonGroup>
      </div>
      {/* Comentarios por pagina */}
      <div
        className="h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:w-1
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        {pagesWithComments.map((page) => (
          <Accordion
            key={page}
            open={isPageWithCommentsOpen(page)}
            onClick={() => {
              if (opennedPageAccordions.includes(page)) {
                setOpennedPageAccordions(
                  opennedPageAccordions.filter((p) => p !== page)
                );
              } else {
                setOpennedPageAccordions([...opennedPageAccordions, page]);
              }
            }}
          >
            <AccordionHeader className="p-0">
              <div className="flex w-full justify-between items-center">
                <div className="flex items-center gap-2">
                  <svg
                    className={
                      "w-4 h-4 text-gray-800 dark:text-white transition-all duration-300 transform " +
                      (isPageWithCommentsOpen(page) ? "rotate-90" : "")
                    }
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m9 5 7 7-7 7"
                    />
                  </svg>
                  <Typography
                    className={
                      page === currentPage
                        ? "text-gray-800 text-sm m-0"
                        : "text-gray-500 text-sm m-0"
                    }
                  >
                    Pagina {page}
                  </Typography>
                </div>
                <span className="text-gray-800 font-thin text-xs m-0">
                  {(() => {
                    const commentsCount = comments.filter(
                      (comment) => comment.pageNumber === page
                    ).length;
                    if (commentsCount === 0) return "";
                    if (commentsCount === 1) return "1 comentario";
                    return `${commentsCount} comentarios`;
                  })()}
                </span>
              </div>
            </AccordionHeader>
            <AccordionBody className="p-0">
              <List className="py-0 my-0">
                {comments
                  .filter((comment) => comment.pageNumber === page)
                  .sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                  )
                  .map((comment) => (
                    <ListItem key={comment.id}>
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
                          <IconButton className="rounded-full" size="sm">
                            <svg
                              className="w-6 h-6 text-gray-400"
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
                        <Typography
                          variant="small"
                          color="gray"
                          className="text-xs"
                        >
                          {comment.user.username}
                        </Typography>
                        <Typography
                          variant="paragraph"
                          color="black"
                          className="font-normal text-sm"
                        >
                          {comment.comment}
                        </Typography>
                      </div>
                    </ListItem>
                  ))}
              </List>
            </AccordionBody>
          </Accordion>
        ))}
      </div>
      {/* Caja comentarios */}
      <div
        className={
          "mt-4 flex w-full flex-row items-center gap-2 rounded-[99px] border border-gray-900/10 p-2 " +
          (logged ? "bg-white" : "bg-gray-200")
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
          className="min-h-full !border-0 focus:border-transparent"
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
            className="rounded-full"
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
