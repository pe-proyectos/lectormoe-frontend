import { useMemo } from "react";
import { toast } from "react-toastify";
import {
  ButtonGroup,
  Button,
  Typography,
} from "@material-tailwind/react";
import {
  MRT_TableContainer,
  useMaterialReactTable,
} from "material-react-table";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";

export function AdminChaptersTable({
  language,
  mangaCustom,
  onChapterClick,
  onChapterDownload,
  onChapterDelete,
}) {
  const _ = getTranslator(language);

  const columns = useMemo(
    () => [
      {
        accessorKey: "imageUrl",
        header: _("thumbnail"),
        size: 50,
        Cell: ({ row }) =>
          row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={
                row.original.title || row.original.number || _("no_thumbnail")
              }
              decoding="async"
              loading="lazy"
              className="max-w-24 max-h-36 mx-auto"
            />
          ) : (
            <Typography variant="h6" color="blue-gray" className="-mb-3">
              {_("no_thumbnail")}
            </Typography>
          ),
      },
      {
        accessorKey: "number",
        header: _("number"),
        size: 50,
        Cell: ({ row }) => (
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            {row.original.number}
          </Typography>
        ),
      },
      {
        accessorKey: "title",
        header: _("title"),
        Cell: ({ row }) => (
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            {row.original.title}
          </Typography>
        ),
      },
      {
        accessorKey: "views",
        header: _("views"),
        size: 50,
        Cell: ({ row }) => (
          <Typography variant="h6" color="blue-gray" className="-mb-3">
            {row.original.views}
          </Typography>
        ),
      },
      {
        accessorKey: "releasedAt",
        header: _("release_date"),
        size: 50,
        Cell: ({ row }) => (
          <span>
            {row.original.subscribersOnly
              ? _("subscribers_only")
              : new Date(row.original.releasedAt).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "id",
        header: _("actions"),
        Cell: ({ row }) => (
          <ButtonGroup variant="text">
            <Button variant="text" onClick={() => onChapterClick(row.original)}>
              {_("edit")}
            </Button>
            <Button
              variant="text"
              onClick={() => onChapterDownload(row.original)}
            >
              {_("download")}
            </Button>
            <Button
              variant="text"
              className="hover:text-red-600"
              onClick={() => deleteChapter(row.original)}
            >
              {_("delete")}
            </Button>
          </ButtonGroup>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: mangaCustom.chapters,
    enableRowOrdering: false,
    enableColumnActions: false,
    enablePagination: false,
  });

  const deleteChapter = async (chapter) => {
    callAPI(`/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}`, {
      method: "DELETE",
    })
      .then((response) => {
        toast.success(_("chapter_deleted"));
        onChapterDelete();
      })
      .catch((error) => {
        toast.error(error?.message);
      });
  };

  return (
    <div className="max-w-full">
      <MRT_TableContainer table={table} />
    </div>
  );
}
