import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Autocomplete from "./ui/Autocomplete";
import { callAPI } from "../../util/callApi";
import { AdminCreateAuthorDialog } from "./AdminCreateAuthorDialog";
import { getTranslator } from "../../util/translate";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";

const WRITING_CODES = ['novel', 'light-novel', 'book', 'short-story'];

export function AdminMangaProfileDialog({ language, open, setOpen, contentKind = 'manga' }) {
  const _ = getTranslator(language);
  const isWriting = contentKind === 'writing';
  const labelOneLower = isWriting ? 'novela' : 'manga';

  // dialog
  const [loading, setLoading] = useState(true);
  const [isCreateAuthorDialogOpen, setIsCreateAuthorDialogOpen] =
    useState(false);
  // lists
  const [bookTypes, setBookTypes] = useState([]);
  const [demographies, setDemographies] = useState([]);
  const [authors, setAuthors] = useState([]);
  // form
  const [demography, setDemography] = useState(null);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [title, setTitle] = useState("");
  const [bookType, setBookType] = useState(null);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    refreshAuthors();
    setLoading(true);
    callAPI(`/api/demography`)
      .then((result) => setDemographies(result))
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    callAPI(`/api/book_type`)
      .then((result) => {
        // Filter book types so the create-profile dialog inside the writings
        // grid only offers writing types and vice-versa.
        const filtered = isWriting
          ? result.filter((bt) => WRITING_CODES.includes(bt.code))
          : result.filter((bt) => !WRITING_CODES.includes(bt.code));
        setBookTypes(filtered);
      })
      .catch((error) => toast.error(error?.message));
  }, [isWriting]);

  useEffect(() => {
    if (!isCreateAuthorDialogOpen) refreshAuthors();
  }, [isCreateAuthorDialogOpen]);

  const refreshAuthors = () => {
    return callAPI(`/api/author`)
      .then((result) => setAuthors(result))
      .catch((error) => toast.error(error?.message));
  };

  const handleSubmit = async () => {
    if (!title) {
      return toast.error(_("title_mandatory"));
    }
    if (selectedAuthors.length < 1 || selectedAuthors.length > 4) {
      return toast.error(_("author_mandatory_min_1_max_4"));
    }
    if (!demography) {
      return toast.error(_("demography_mandatory"));
    }
    if (!bookType) {
      return toast.error(_("book_type_mandatory"));
    }
    setLoading(true);
    callAPI("/api/manga", {
      method: "POST",
      body: JSON.stringify({
        title,
        authorIds: selectedAuthors.map((author) => author.id),
        bookTypeId: bookType.id,
        demographyId: demography.id,
        shortDescription,
        description,
      }),
    })
      .then(() => {
        toast.success(_("manga_profile_created"));
        setTitle("");
        setDemography(null);
        setBookType(null);
        setSelectedAuthors([]);
        setShortDescription("");
        setDescription("");
        setOpen(false);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Crear perfil de ${labelOneLower}`}
        size="md"
      >
        <div className="flex flex-col gap-6">
          {/* Authors Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {selectedAuthors.length > 1 ? _("authors") : _("author")} (
              {selectedAuthors.length}/4)
            </label>
            <div className="flex">
              <div className="grow">
                <Autocomplete
                  multiple
                  options={authors}
                  isOptionEqualToValue={(option, value) =>
                    option.slug === value.slug
                  }
                  getOptionLabel={(option) => option.name}
                  label={
                    selectedAuthors.length > 1 ? _("authors") : _("author")
                  }
                  placeholder={
                    selectedAuthors.length > 1
                      ? _("authors") + "..."
                      : _("author") + "..."
                  }
                  value={selectedAuthors}
                  getOptionDisabled={() =>
                    selectedAuthors.length >= 4
                  }
                  onChange={(_event, newValue) => setSelectedAuthors(newValue)}
                />
              </div>
              <div className="flex-none">
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-full ml-2"
                  onClick={() => setIsCreateAuthorDialogOpen(true)}
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
                <AdminCreateAuthorDialog
                  language={language}
                  open={isCreateAuthorDialogOpen}
                  setOpen={setIsCreateAuthorDialogOpen}
                />
              </div>
            </div>
          </div>

          {/* Demography Section */}
          <div className="flex flex-col gap-2">
            <Autocomplete
              options={demographies}
              getOptionLabel={(option) => `${option.name} (${option.description})`}
              label={_("demography")}
              value={demography}
              onChange={(_event, newValue) => setDemography(newValue)}
            />
          </div>

          {/* Book Type Section */}
          <div className="flex flex-col gap-2">
            <Autocomplete
              options={bookTypes}
              getOptionLabel={(option) => option.name}
              label={_("book_type")}
              value={bookType}
              onChange={(_event, newValue) => setBookType(newValue)}
            />
          </div>

          {/* Title Input */}
          <Input
            label={_("manga_title")}
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Short Description Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {_("short_description")} (
              {shortDescription.length.toString().padStart(3, "0")}/300{" "}
              {_("characters")}) ({_("optional")})
            </label>
            <Textarea
              label={_("short_description_less_than_300")}
              maxLength={300}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          {/* Synopsis Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {_("synopsis")} ({_("optional")})
            </label>
            <Textarea
              label={_("manga_synopsis")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {_("cancel") || "Cancelar"}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>
              {_("save_manga_profile")}
            </Button>
          </div>
        </div>
      </Modal>
      <ToastContainer theme="dark" />
    </>
  );
}
