import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import { DialogDatePicker } from "../DialogDatePicker";
import { ImageDropzone } from "../ImageDropzone";
import { AdminMangaProfileDialog } from "./AdminMangaProfileDialog";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";
import { uploadFile } from "../../util/uploadFile";

export function AdminMangaCustomDialog({
  organization,
  language,
  open,
  setOpen,
  mangaCustom,
  setMangaCustom,
  subscriptionPlans,
}) {
  const _ = getTranslator(language);

  // dialog
  const [loading, setLoading] = useState(true);
  const [isCreateMangaProfileDialogOpen, setIsCreateMangaProfileDialogOpen] =
    useState(false);
  // lists
  const [mangas, setMangas] = useState([]);
  const [genres, setGenres] = useState([]);
  // form
  const [mangaProfile, setMangaProfile] = useState(null);
  const [status, setStatus] = useState("ongoing");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedSubscriptionPlans, setSelectedSubscriptionPlans] = useState(
    []
  );
  const [releasedDate, setReleasedDate] = useState(null);
  const [nextChapterDate, setNextChapterDate] = useState(null);
  const [nextChapterAtMessage, setNextChapterAtMessage] = useState("");
  const [requireLogin, setRequireLogin] = useState(false);
  const [isSimulRelease, setIsSimulRelease] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);

  useEffect(() => {
    if (!mangaCustom) return;
    setMangaProfile(mangas.find((manga) => manga.id === mangaCustom.mangaId));
    setStatus(mangaCustom?.status || "ongoing");
    setTitle(mangaCustom?.title || "");
    setShortDescription(mangaCustom?.shortDescription || "");
    setDescription(mangaCustom?.description || "");
    setReleasedDate(mangaCustom?.releasedAt || null);
    setNextChapterDate(mangaCustom?.nextChapterAt || null);
    setNextChapterAtMessage(mangaCustom?.nextChapterAtMessage || "");
    setRequireLogin(mangaCustom?.requireLogin || false);
    setIsSimulRelease(mangaCustom?.isSimulRelease || false);
    setIsNSFW(mangaCustom?.isNSFW || false);
    setCoverImageFile(mangaCustom?.imageUrl || null);
    setBannerImageFile(mangaCustom?.bannerUrl || null);
    setSelectedGenres(mangaCustom?.genres || []);
    setSelectedSubscriptionPlans(mangaCustom?.subscriptionPlans || []);
  }, [mangaCustom]);

  useEffect(() => {
    if (!open) {
      setMangaProfile(null);
      setMangaCustom(null);
      setStatus("ongoing");
      setTitle("");
      setShortDescription("");
      setDescription("");
      setReleasedDate(null);
      setNextChapterDate(null);
      setNextChapterAtMessage("");
      setRequireLogin(false);
      setIsSimulRelease(false);
      setIsNSFW(false);
      setCoverImageFile(null);
      setBannerImageFile(null);
      setSelectedGenres([]);
      setSelectedSubscriptionPlans([]);
    }
  }, [open]);

  useEffect(() => {
    refreshMangaProfile();
    refreshGenres();
  }, []);

  useEffect(() => {
    if (!isCreateMangaProfileDialogOpen) refreshMangaProfile();
  }, [isCreateMangaProfileDialogOpen]);

  const refreshMangaProfile = () => {
    setLoading(true);
    callAPI(`/api/manga/autocomplete`)
      .then((result) => setMangas(result))
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  const refreshGenres = () => {
    return callAPI(`/api/genre`)
      .then((result) => setGenres(result))
      .catch((error) => toast.error(error?.message));
  };

  useEffect(() => {
    if (!mangaProfile) return;
    if (mangaCustom) return;
    setLoading(true);
    callAPI(`/api/manga/${mangaProfile.slug}`)
      .then((result) => {
        if (mangaCustom) return;
        setStatus(result.status);
        setTitle(result.title);
        setShortDescription(result.shortDescription);
        setDescription(result.description);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  }, [mangaProfile]);

  const handleSubmit = async (event) => {
    if (!mangaProfile) {
      return toast.error(_("manga_profile_mandatory"));
    }
    if (!title) {
      return toast.error(_("title_mandatory"));
    }
    setLoading(true);
    try {
      // Upload files to R2 using presigned URLs
      let imageKey = coverImageFile;
      let bannerKey = bannerImageFile;

      // Contar cuántos archivos nuevos hay que subir
      const filesToUpload = [
        coverImageFile instanceof File,
        bannerImageFile instanceof File
      ].filter(Boolean).length;

      let toastId = null;
      let uploadedCount = 0;

      if (filesToUpload > 0) {
        toastId = toast.loading(`Subiendo archivos ${uploadedCount + 1}/${filesToUpload}`, {
          position: "bottom-right"
        });
      }

      try {
        if (coverImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, { 
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: "bottom-right"
          });
          imageKey = await uploadFile(coverImageFile, undefined, 'mangas');
        }
        
        if (bannerImageFile instanceof File) {
          uploadedCount++;
          toast.update(toastId, { 
            render: `Subiendo archivos ${uploadedCount}/${filesToUpload}`,
            position: "bottom-right"
          });
          bannerKey = await uploadFile(bannerImageFile, undefined, 'mangas');
        }

        if (toastId) {
          toast.dismiss(toastId);
          toast.success(`${filesToUpload} ${filesToUpload === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`, {
            position: "bottom-right"
          });
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
          toast.error("Error al subir archivos", {
            position: "bottom-right"
          });
        }
        throw error;
      }

      const response = await callAPI(
        mangaCustom
          ? `/api/manga-custom/${mangaCustom.slug}`
          : `/api/manga-custom`,
        {
          method: mangaCustom ? "PATCH" : "POST",
          body: JSON.stringify({
            ...(mangaCustom ? { mangaCustomId: mangaCustom.id } : { mangaId: mangaProfile.id }),
            status,
            title,
            shortDescription,
            description,
            releasedAt: releasedDate,
            nextChapterAt: nextChapterDate,
            nextChapterAtMessage,
            requireLogin,
            isSimulRelease,
            isNSFW,
            genreIds: selectedGenres.map((genre) => genre.id),
            subscriptionPlanIds: selectedSubscriptionPlans.map((plan) => plan.id),
            image: imageKey,
            banner: bannerKey,
          }),
        }
      );
      toast.success(_("manga_created"));
      setMangaProfile(null);
      setMangaCustom(null);
      setStatus("ongoing");
      setTitle("");
      setShortDescription("");
      setDescription("");
      setReleasedDate(null);
      setNextChapterDate(null);
      setNextChapterAtMessage("");
      setRequireLogin(false);
      setIsSimulRelease(false);
      setIsNSFW(false);
      setCoverImageFile(null);
      setBannerImageFile(null);
      setSelectedGenres([]);
      setSelectedSubscriptionPlans([]);
      setOpen(false);
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mangaCustom?.title || _("create_manga")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto flex flex-col gap-4">
        {!mangaCustom && (
          <>
            <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              {_("manga_profile")}
            </label>
            <div className="flex">
              <div className="grow">
                <Autocomplete
                  disablePortal
                  options={mangas}
                  isOptionEqualToValue={(option, value) =>
                    option.slug === value.slug
                  }
                  getOptionLabel={(option) => option.title}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                      {...props}
                    >
                      <img
                        loading="lazy"
                        width="20"
                        decoding="async"
                        srcSet={option.imageUrl || ""}
                        src={option.imageUrl || ""}
                        alt=""
                      />
                      {option.title}
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={_("choose_manga_profile")}
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: "new-password",
                      }}
                    />
                  )}
                  value={mangaProfile}
                  onChange={(event, newValue) => setMangaProfile(newValue)}
                />
              </div>
              <div className="flex-none">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-full ml-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  onClick={() => setIsCreateMangaProfileDialogOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>
                <AdminMangaProfileDialog
                  organization={organization}
                  language={language}
                  mangaProfile={mangaProfile}
                  open={isCreateMangaProfileDialogOpen}
                  setOpen={setIsCreateMangaProfileDialogOpen}
                />
              </div>
            </div>
          </>
        )}
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("title")}
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={_("manga_title")}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("short_description")} (
          {shortDescription.length.toString().padStart(3, "0")}/300{" "}
          {_("characters")}) ({_("optional")})
        </label>
        <textarea
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px]"
          placeholder={_("short_description_less_than_300")}
          maxLength={300}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("synopsis")} ({_("optional")})
        </label>
        <textarea
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[120px]"
          placeholder={_("manga_synopsis")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("genres")}
        </label>
        <div className="flex">
          <div className="grow">
            <Autocomplete
              multiple
              disablePortal
              options={genres}
              isOptionEqualToValue={(option, value) =>
                option.slug === value.slug
              }
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label={_("genres")}
                  placeholder={_("genres") + "..."}
                />
              )}
              value={selectedGenres}
              getOptionDisabled={(options) =>
                selectedGenres.length >= 4 ? true : false
              }
              onChange={(event, newValue) => setSelectedGenres(newValue)}
            />
          </div>
        </div>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("subscription_plans")}
        </label>
        <div className="flex">
          <div className="grow">
            <Autocomplete
              multiple
              disablePortal
              options={subscriptionPlans}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label={_("subscription_plans")}
                  placeholder={_("subscription_plans") + "..."}
                />
              )}
              value={selectedSubscriptionPlans}
              onChange={(event, newValue) =>
                setSelectedSubscriptionPlans(newValue)
              }
            />
          </div>
        </div>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("manga_status")}
        </label>
        <select
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ongoing">{_("ongoing")}</option>
          <option value="hiatus">{_("hiatus")}</option>
          <option value="finished">{_("finished")}</option>
        </select>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("release_date")} ({_("optional")})
        </label>
        <DialogDatePicker
          organization={organization}
          language={language}
          value={releasedDate}
          onChange={setReleasedDate}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("next_chapter_date")} ({_("optional")})
        </label>
        <DialogDatePicker
          organization={organization}
          language={language}
          value={nextChapterDate}
          onChange={setNextChapterDate}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("next_chapter_message")} ({_("optional")})
        </label>
        <textarea
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px]"
          placeholder={_("next_chapter_message")}
          value={nextChapterAtMessage}
          onChange={(e) => setNextChapterAtMessage(e.target.value)}
          disabled={!mangaProfile}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("Manga con simul release")}
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            checked={isSimulRelease}
            onChange={(e) => setIsSimulRelease(e.target.checked)}
          />
          <span className="text-white">{_("SimulRelease")}</span>
        </label>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("Manga +18")}
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            checked={isNSFW}
            onChange={(e) => setIsNSFW(e.target.checked)}
          />
          <span className="text-white">{_("NSFW")}</span>
        </label>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("require_login")} ({_("optional")})
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            checked={requireLogin}
            onChange={(e) => setRequireLogin(e.target.checked)}
          />
          <span className="text-white">{_("require_login")}</span>
        </label>
        <p className="text-xs text-zinc-500">
          {_("require_login_description")}
        </p>
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("manga_cover")} ({_("optional")})
        </label>
        <ImageDropzone
          value={coverImageFile}
          label={_("drop_manga_cover")}
          alt={_("cover_image")}
          onChange={(files) => (files[0] ? setCoverImageFile(files[0]) : null)}
          onDelete={(file) => setCoverImageFile(null)}
        />
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {_("manga_banner")} ({_("optional")})
        </label>
        <ImageDropzone
          value={bannerImageFile}
          label={_("drop_manga_banner")}
          alt={_("manga_banner")}
          onChange={(files) => (files[0] ? setBannerImageFile(files[0]) : null)}
          onDelete={(file) => setBannerImageFile(null)}
        />
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {_("save_manga")}
          </button>
        </div>
      </div>
      <ToastContainer theme="dark" />
    </div>
  );
}
