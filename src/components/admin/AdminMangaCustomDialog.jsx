import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  Textarea,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Input,
  Checkbox,
  Select,
  Option,
} from "@material-tailwind/react";
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
      let imageKey = coverImageFile instanceof File ? null : (coverImageFile || "null");
      let bannerKey = bannerImageFile instanceof File ? null : (bannerImageFile || "null");

      if (coverImageFile instanceof File) {
        imageKey = await uploadFile(coverImageFile);
      }
      if (bannerImageFile instanceof File) {
        bannerKey = await uploadFile(bannerImageFile);
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

  return (
    <Dialog
      size="md"
      open={open}
      handler={() => setOpen((previousState) => !previousState)}
      className="max-h-[95vh]"
    >
      <DialogHeader>
        <Typography variant="h4" color="blue-gray">
          {mangaCustom?.title || _("create_manga")}
        </Typography>
      </DialogHeader>
      <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
        {!mangaCustom && (
          <>
            <Typography className="-mb-2" variant="h6" color="gray">
              {_("manga_profile")}
            </Typography>
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
                <Button
                  variant="text"
                  className="flex items-center gap-3 h-full ml-2"
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
                </Button>
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
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("title")}
        </Typography>
        <Input
          size="lg"
          label={_("manga_title")}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!mangaProfile}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("short_description")} (
          {shortDescription.length.toString().padStart(3, "0")}/300{" "}
          {_("characters")}) ({_("optional")})
        </Typography>
        <Textarea
          size="md"
          label={_("short_description_less_than_300")}
          maxLength={300}
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          disabled={!mangaProfile}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("synopsis")} ({_("optional")})
        </Typography>
        <Textarea
          size="lg"
          label={_("manga_synopsis")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!mangaProfile}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("genres")}
        </Typography>
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
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("subscription_plans")}
        </Typography>
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
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("manga_status")}
        </Typography>
        <div>
          <Select
            label={_("status")}
            value={status}
            onChange={(val) => setStatus(val)}
          >
            <Option value="ongoing" selected={status === "ongoing"}>
              {_("ongoing")}
            </Option>
            <Option value="hiatus" selected={status === "hiatus"}>
              {_("hiatus")}
            </Option>
            <Option value="finished" selected={status === "finished"}>
              {_("finished")}
            </Option>
          </Select>
        </div>
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("release_date")} ({_("optional")})
        </Typography>
        <DialogDatePicker
          organization={organization}
          language={language}
          value={releasedDate}
          onChange={setReleasedDate}
          disabled={!mangaProfile}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("next_chapter_date")} ({_("optional")})
        </Typography>
        <DialogDatePicker
          organization={organization}
          language={language}
          value={nextChapterDate}
          onChange={setNextChapterDate}
          disabled={!mangaProfile}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("Manga con simul release")}
        </Typography>
        <Checkbox
          label={_("SimulRelease")}
          checked={isSimulRelease}
          onChange={(e) => setIsSimulRelease(e.target.checked)}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("Manga +18")}
        </Typography>
        <Checkbox
          label={_("NSFW")}
          checked={isNSFW}
          onChange={(e) => setIsNSFW(e.target.checked)}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("require_login")} ({_("optional")})
        </Typography>
        <Checkbox
          label={_("require_login")}
          checked={requireLogin}
          onChange={(e) => setRequireLogin(e.target.checked)}
        />
        <Typography className="" variant="small" color="gray">
          {_("require_login_description")}
        </Typography>
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("manga_cover")} ({_("optional")})
        </Typography>
        <ImageDropzone
          value={coverImageFile}
          label={_("drop_manga_cover")}
          alt={_("cover_image")}
          onChange={(files) => (files[0] ? setCoverImageFile(files[0]) : null)}
          onDelete={(file) => setCoverImageFile(null)}
        />
        <Typography className="-mb-2" variant="h6" color="gray">
          {_("manga_banner")} ({_("optional")})
        </Typography>
        <ImageDropzone
          value={bannerImageFile}
          label={_("drop_manga_banner")}
          alt={_("manga_banner")}
          onChange={(files) => (files[0] ? setBannerImageFile(files[0]) : null)}
          onDelete={(file) => setBannerImageFile(null)}
        />
      </DialogBody>
      <DialogFooter className="space-x-2">
        <Button variant="outlined" onClick={handleSubmit} loading={loading}>
          {_("save_manga")}
        </Button>
      </DialogFooter>
      <ToastContainer theme="dark" />
    </Dialog>
  );
}
