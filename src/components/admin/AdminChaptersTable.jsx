import { toast } from "react-toastify";
import { Edit, Download, Trash2 } from "lucide-react";
import Button from "./ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/Table";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";
import { useDialog } from "../ui/useDialog";

export function AdminChaptersTable({
  language,
  mangaCustom,
  onChapterClick,
  onChapterDownload,
  onChapterDelete,
}) {
  const _ = getTranslator(language);
  const dlg = useDialog();

  const deleteChapter = async (chapter) => {
    if (!(await dlg.confirm(_("confirm_delete_chapter") || `¿Estás seguro de eliminar el capítulo ${chapter.number}?`))) {
      return;
    }
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

  const sortedChapters = [...(mangaCustom.chapters || [])].sort((a, b) => {
    // Ordenar por número de capítulo descendente
    return (b.number || 0) - (a.number || 0);
  });

  return (
    <div className="overflow-x-auto">
      <dlg.DialogHost />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">{_("thumbnail")}</TableHead>
            <TableHead className="w-24">{_("number")}</TableHead>
            <TableHead>{_("title")}</TableHead>
            <TableHead className="w-24">{_("views")}</TableHead>
            <TableHead className="w-48">{_("release_date")}</TableHead>
            <TableHead className="w-48">{_("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedChapters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                {_("no_chapters") || "No hay capítulos"}
              </TableCell>
            </TableRow>
          ) : (
            sortedChapters.map((chapter) => (
              <TableRow key={chapter.id}>
                <TableCell>
                  {chapter.imageUrl ? (
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.title || chapter.number || _("no_thumbnail")}
                      decoding="async"
                      loading="lazy"
                      className="max-w-24 max-h-36 object-cover rounded-lg mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-36 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs text-center px-2">
                      {_("no_thumbnail")}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-bold text-white">{chapter.number}</span>
                </TableCell>
                <TableCell>
                  <span className="text-white">{chapter.title || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">{chapter.views || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-400">
                    {new Date(chapter.releasedAt).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChapterClick(chapter)}
                    >
                      <Edit size={16} />
                      {_("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChapterDownload(chapter)}
                    >
                      <Download size={16} />
                      {_("download")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChapter(chapter)}
                      className="hover:text-red-500"
                    >
                      <Trash2 size={16} />
                      {_("delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
