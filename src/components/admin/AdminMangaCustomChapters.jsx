import "cookie-store";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import JSZip from "jszip";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { callAPI } from "../../util/callApi";
import { AdminChaptersTable } from "./AdminChaptersTable";
import { AdminChapterDialog } from "./AdminChapterDialog";
import { getTranslator } from "../../util/translate";

export function AdminMangaCustomChapters({
  language,
  initialMangaCustom,
  organizationSlug,
}) {
  const _ = getTranslator(language);

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(null);
  const [mangaCustom, setMangaCustom] = useState(initialMangaCustom);
  const [isAdminChapterDialogOpen, setIsAdminChapterDialogOpen] =
    useState(false);

  useEffect(() => {
    if (!isAdminChapterDialogOpen) {
      setChapter(null);
      refreshMangaCustom();
    }
  }, [isAdminChapterDialogOpen]);

  useEffect(() => {
    if (chapter) setIsAdminChapterDialogOpen(true);
  }, [chapter]);

  const refreshMangaCustom = () => {
    setLoading(true);
    callAPI(`/api/manga-custom/${mangaCustom.slug}`)
      .then((result) => setMangaCustom(result))
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };
  const downloadChapterPages = async (chapter) => {
    toast.info(`Descargando capitulo ${chapter.number} ...`);
    try {
      const chapterPages = await callAPI(
        `/api/manga-custom/${mangaCustom.slug}/chapter/${chapter.number}/pages`
      );
      const zip = new JSZip();
      const folder = zip.folder(`Chapter ${chapter.number}`);
      const pagePromises = chapterPages.map((page) => {
        return fetch(page.imageUrl).then((response) => response.blob());
      });
      const blobs = await Promise.all(pagePromises);
      blobs.forEach((blob, index) => {
        folder.file(`Page ${chapterPages[index].number}.jpg`, blob, {
          type: "blob",
        });
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Chapter ${chapter.number}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Descarga iniciada");
    } catch (error) {
      console.error(error);
      toast.error(error?.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-4 my-2">
          <img
            src={mangaCustom.imageUrl}
            decoding="async"
            loading="lazy"
            className="w-56 max-h-96 object-cover rounded-xl"
            alt={_("cover")}
          />
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              {mangaCustom.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {mangaCustom.description ||
                mangaCustom.shortDescription ||
                _("no_description")}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {_("chapters")}
          </h3>
          <Button
            variant="primary"
            onClick={() => setIsAdminChapterDialogOpen(true)}
          >
            {_("publish_chapter")}
          </Button>
        </div>
        <AdminChapterDialog
          language={language}
          open={isAdminChapterDialogOpen}
          setOpen={setIsAdminChapterDialogOpen}
          mangaCustom={mangaCustom}
          chapter={chapter}
        />
        <AdminChaptersTable
          language={language}
          mangaCustom={mangaCustom}
          onChapterClick={(chapter) => setChapter(chapter)}
          onChapterDownload={(chapter) => downloadChapterPages(chapter)}
          onChapterDelete={() => refreshMangaCustom()}
        />
      </Card>
    </div>
  );
}
