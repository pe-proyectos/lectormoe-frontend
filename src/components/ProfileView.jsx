import { useEffect, useState } from "react";
import { Typography, Button, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { callAPI } from "../util/callApi";
import { toast } from "react-toastify";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";
import { pascalCase } from "../util/pascalCase";
import { ImageDropzone } from "./ImageDropzone";

export function ProfileView({ language, user, username }) {
  const _ = getTranslator(language);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userChapterHistoryList, setUserChapterHistoryList] = useState([]);
  const [userChapterHistoryTotal, setUserChapterHistoryTotal] = useState([]);
  const [showAllChapterHistoryList, setShowAllChapterHistoryList] =
    useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [newDescription, setNewDescription] = useState(user.description || "");
  
  const [newBirthdate, setBirthdate] = useState(user?.birthdate? new Date(user?.birthdate).toISOString().slice(0,10) : "");

  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    refreshUserChapterHistory();
    callAPI("/api/analytics", {
      method: "POST",
      includeIp: true,
      body: JSON.stringify({
        event: "view_my_profile",
        path: window.location.pathname,
        userAgent: window.navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        payload: {},
      }),
    }).catch((err) => console.error(err));
  }, []);

  const refreshUserChapterHistory = () => {
    setLoadingHistory(true);
    callAPI(`/api/user-chapter-history?limit=30`)
      .then(({ data, total }) => {
        setUserChapterHistoryList(data);
        setUserChapterHistoryTotal(total);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoadingHistory(false));
  };

  const handleImageChange = (files) => {
    if (files && files.length > 0) {
      setNewImage(files[0]);
    }
  };

  const handleImageDelete = () => {
    setNewImage(null);
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      if (newImage) {
        formData.append('image', newImage);
      }
      if (newDescription !== currentUser.description) {
        formData.append('description', newDescription);
      }
      if (newBirthdate !== currentUser.birthdate) {
        formData.append('birthdate', newBirthdate);
      }

      const response = await callAPI(`/api/user/${currentUser.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.status) {
        setCurrentUser(response.data);
        toast.success(_("profile_updated_successfully") || "Perfil actualizado exitosamente");
        setEditDialogOpen(false);
        setNewImage(null);
        setNewDescription(response.data.description || "");
        setBirthdate(response.data.birthdate || "");
      }
    } catch (error) {
      toast.error(error?.message || _("error_updating_profile") || "Error al actualizar el perfil");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setNewImage(null);
    setNewDescription(currentUser.description || "");
    setBirthdate(currentUser.data.birthdate || "");
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-4">
        <div className="w-full max-w-4xl shadow p-5 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <img
                  className="w-24 h-24 mb-3 rounded-full shadow-lg cursor-pointer transition-opacity duration-200 group-hover:opacity-80"
                  src={
                    currentUser.imageUrl ||
                    "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png"
                  }
                  alt={username}
                  onClick={() => setEditDialogOpen(true)}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h5 className="text-xl font-medium text-white dark:text-white">
                {username}
              </h5>
              <Button
                size="sm"
                color="blue"
                className="mt-2"
                onClick={() => setEditDialogOpen(true)}
              >
                {_("edit_profile") || "Editar Perfil"}
              </Button>
            </div>

            <div className="flex flex-col justify-center text-center">
              <div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  {pascalCase(
                    currentUser?.subscriptions.length > 0
                      ? currentUser.subscriptions[0].subscriptionPlan.name
                      : currentUser.role || "user"
                  )}
                </span>
              </div>
              <p className="mb-4 text-white my-5">
                {currentUser.description || _("no_description")}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">{_("read_later")}</h3>
            </div>
          </div>
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">{_("my_favorites")}</h3>
            </div>
          </div>
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">
                {_("continue_reading")}
              </h3>
            </div>
            <div className=" rounded-lg p-4">
              <div className="flex flex-wrap gap-4 justify-center mb-4">
                {!loadingHistory && userChapterHistoryList.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center w-full h-full">
                    <Typography color="gray" className="font-light text-xl">
                      {_("no_history")}
                    </Typography>
                  </div>
                )}
                {(showAllChapterHistoryList
                  ? userChapterHistoryList
                  : userChapterHistoryList.slice(0, 6)
                ).map((history) => (
                  <a
                    key={history.id}
                    className="w-full"
                    href={`/manga/${history.chapter.mangaCustom.manga.slug}/chapters/${history.chapter.number}?page=${history.pageNumber}`}
                  >
                    <div
                      variant="ghost"
                      className="w-full p-2  rounded-sm border-l-4 border-white bg-white hover:bg-opacity-10 bg-opacity-5"
                    >
                      <div className="flex w-full items-center">
                        <img
                          src={
                            history.chapter.imageUrl ||
                            history.chapter.mangaCustom.imageUrl
                          }
                          alt=""
                          className="mr-4 w-32 h-32 rounded-lg object-contain"
                        />
                        <div className="flex flex-col h-full">
                          <p className="font-light text-xs uppercase">
                            {history.chapter.mangaCustom.title}
                          </p>
                          <p className="font-medium text-xl">
                            {history.chapter.title}
                          </p>
                          <p className="text-xs">
                            {_("chapter")} {history.chapter.number}, {_("page")}{" "}
                            {history.pageNumber}
                          </p>
                          <div className="grow justify-items-end">
                            <p className="text-xs mt-auto">
                              {_("seen")}{" "}
                              {formatDate(history.lastReadAt, language)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {userChapterHistoryList.length > 6 && (
                  <Button
                    color="gray"
                    onClick={() =>
                      setShowAllChapterHistoryList(!showAllChapterHistoryList)
                    }
                  >
                    {showAllChapterHistoryList ? _("see_less") : _("see_more")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} handler={() => setEditDialogOpen(false)} size="md">

        <DialogHeader>
          <Typography variant="h5">
            {_("edit_profile") || "Editar Perfil"}
          </Typography>
        </DialogHeader>


        <DialogBody className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">


            <div>
              <Typography variant="h6" className="mb-3">
                {_("profile_picture") || "Foto de Perfil"}
              </Typography>
              <ImageDropzone
                value={newImage}
                label={_("upload_profile_picture") || "Subir foto de perfil"}
                alt="Profile picture"
                onChange={handleImageChange}
                onDelete={handleImageDelete}
              />
              {currentUser.imageUrl && !newImage && (
                <div className="mt-4">
                  <Typography variant="small" color="gray" className="mb-2">
                    {_("current_profile_picture") || "Foto de perfil actual:"}
                  </Typography>
                  <img
                    src={currentUser.imageUrl}
                    alt="Current profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>

              <Typography variant="h6" className="mb-3">
                {_("birthdate") || "Fecha de Nacimiento"}
              </Typography>

              <input 
              type="date" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              value={newBirthdate} 
              onChange={(e) => setBirthdate(e.target.value)}>
              </input>

            </div>


            <div>
              <Typography variant="h6" className="mb-3">
                {_("description") || "Descripción"}
              </Typography>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder={_("write_description") || "Escribe una descripción sobre ti..."}
              />
            </div>


          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleCancelEdit}
            className="mr-1"
          >
            <span>{_("cancel") || "Cancelar"}</span>
          </Button>
          <Button
            color="blue"
            onClick={handleSaveProfile}
            disabled={updating}
          >
            {updating ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {_("saving") || "Guardando..."}
              </div>
            ) : (
              <span>{_("save") || "Guardar"}</span>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
