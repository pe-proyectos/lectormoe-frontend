import React, { useEffect, useState } from "react";
import { callAPI } from "../../util/callApi";
import { toast } from "react-toastify";
import { formatDate } from "../../util/date";
import { ImageDropzone } from "../ImageDropzone";
import { uploadFile } from "../../util/uploadFile";

interface UnifiedProfileViewProps {
  user: any;
  language: string;
}

const UnifiedProfileView: React.FC<UnifiedProfileViewProps> = ({ user, language }) => {
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [userChapterHistoryList, setUserChapterHistoryList] = useState<any[]>([]);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [showAllChapterHistoryList, setShowAllChapterHistoryList] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newDescription, setNewDescription] = useState(user?.description || "");
  const [newBirthdate, setBirthdate] = useState(
    user?.birthdate ? new Date(user.birthdate).toISOString().slice(0, 10) : ""
  );
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    refreshUserChapterHistory();
    refreshFavorites();
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

  const refreshUserChapterHistory = async () => {
    setLoadingHistory(true);
    try {
      // Obtener historial de todas las organizaciones (sin organization-domain header)
      const response = await callAPI(`/api/user-chapter-history?limit=30`);
      // callAPI devuelve result.data, que es { data, maxPage, total }
      setUserChapterHistoryList(response?.data || []);
    } catch (error: any) {
      console.error("Error loading history:", error);
      toast.error(error?.message || "Error al cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const refreshFavorites = async () => {
    setLoadingFavorites(true);
    try {
      // Obtener favoritos de todas las organizaciones (sin organization-domain header)
      const response = await callAPI(`/api/favorites?limit=30`);
      // callAPI devuelve result.data, que es { data, maxPage, total }
      setFavoritesList(response?.data || []);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
      toast.error(error?.message || "Error al cargar los favoritos");
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleImageChange = (files: FileList | null) => {
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
      let imageKey = "null";
      if (newImage) {
        imageKey = await uploadFile(newImage);
      }

      const response = await callAPI(`/api/user/${currentUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(newImage ? { image: imageKey } : {}),
          ...(newDescription !== currentUser.description
            ? { description: newDescription }
            : {}),
          ...(newBirthdate !== currentUser.birthdate ? { birthdate: newBirthdate } : {}),
        }),
      });

      if (response.status) {
        setCurrentUser(response.data);
        toast.success("Perfil actualizado exitosamente");
        setEditDialogOpen(false);
        setNewImage(null);
        setNewDescription(response.data.description || "");
        setBirthdate(response.data.birthdate || "");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al actualizar el perfil");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setNewImage(null);
    setNewDescription(currentUser.description || "");
    setBirthdate(currentUser.birthdate || "");
  };

  return (
    <div className="min-h-screen pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <section className="mb-16">
          <div className="g-pen-border bg-white p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="g-pen-border bg-orange-400 p-2 rounded-full halftone-bg">
                  <img
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full cursor-pointer transition-all duration-300 group-hover:scale-105 border-4 border-black"
                    src={
                      currentUser.imageUrl ||
                      "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png"
                    }
                    alt={currentUser.username}
                    onClick={() => setEditDialogOpen(true)}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full w-10 h-10 border-4 border-black flex items-center justify-center cursor-pointer hover:bg-red-700 transition-all halftone-bg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1 mb-4 g-pen-border transform -rotate-1 halftone-bg">
                  <span className="jp-font text-sm font-black">プロフィール</span>
                  <span className="manga-font text-lg">{currentUser?.permissions?.role?.toUpperCase() || "USER"}</span>
                </div>
                
                <h1 className="manga-font text-6xl md:text-7xl font-black leading-none text-black mb-4 drop-shadow-[4px_4px_0px_#000]">
                  {currentUser.username}
                </h1>
                
                <p className="text-lg text-slate-700 border-l-4 border-orange-500 pl-4 mb-6 max-w-2xl mx-auto md:mx-0">
                  {currentUser.description || "Sin descripción"}
                </p>
                
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="impact-btn bg-black text-white px-6 py-3 text-xl manga-font g-pen-border hover:bg-red-600 transition-all"
                >
                  EDITAR PERFIL
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Favoritos */}
          <div className="g-pen-border bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-600 text-white px-4 py-2 g-pen-border transform -rotate-1 halftone-bg">
                <span className="jp-font text-sm font-black">お気に入り</span>
              </div>
              <h2 className="manga-font text-4xl font-black text-black">MIS FAVORITOS</h2>
            </div>
            
            <div className="space-y-4">
              {loadingFavorites ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                  <p className="mt-4 text-slate-600 font-bold">Cargando favoritos...</p>
                </div>
              ) : favoritesList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border-4 border-dashed border-black p-8">
                  <p className="text-slate-600 font-bold text-lg">No tienes favoritos aún</p>
                </div>
              ) : (
                favoritesList.slice(0, 6).map((favorite) => (
                  <a
                    key={favorite.id}
                    href={`/${favorite.mangaCustom.organization.slug}/manga/${favorite.mangaCustom.manga.slug}`}
                    className="block group relative"
                  >
                    <div className="g-pen-border bg-white overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-1 relative z-10">
                      <div className="flex items-center gap-4 p-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              favorite.mangaCustom.imageUrl ||
                              "https://via.placeholder.com/80x120"
                            }
                            alt={favorite.mangaCustom.title}
                            className="w-20 h-28 object-cover border-4 border-black grayscale-[0.3] group-hover:grayscale-0 transition-all"
                          />
                          <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 border-2 border-black rotate-12">
                            ♥
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="manga-font text-xl leading-tight text-black mb-1 line-clamp-2">
                            {favorite.mangaCustom.title}
                          </h3>
                          <p className="text-xs font-black uppercase text-slate-500">
                            {favorite.mangaCustom.organization.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black -z-10 translate-x-2 translate-y-2 opacity-10 group-hover:opacity-20 transition-all"></div>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Continuar Leyendo */}
          <div className="g-pen-border bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500 text-white px-4 py-2 g-pen-border transform rotate-1 halftone-bg">
                <span className="jp-font text-sm font-black">続き</span>
              </div>
              <h2 className="manga-font text-4xl font-black text-black">CONTINUAR LEYENDO</h2>
            </div>
            
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                  <p className="mt-4 text-slate-600 font-bold">Cargando historial...</p>
                </div>
              ) : userChapterHistoryList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border-4 border-dashed border-black p-8">
                  <p className="text-slate-600 font-bold text-lg">No hay historial</p>
                </div>
              ) : (
                <>
                  {(showAllChapterHistoryList
                    ? userChapterHistoryList
                    : userChapterHistoryList.slice(0, 6)
                  ).map((history) => {
                    const orgSlug = history.chapter.mangaCustom.organization.slug;
                    const chapterUrl = `/${orgSlug}/manga/${history.chapter.mangaCustom.manga.slug}/chapters/${history.chapter.number}?page=${history.pageNumber}`;
                    return (
                    <a
                      key={history.id}
                      href={chapterUrl}
                      className="block group relative"
                    >
                      <div className="g-pen-border bg-white overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:rotate-1 relative z-10">
                        <div className="flex items-center gap-4 p-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                history.chapter.imageUrl ||
                                history.chapter.mangaCustom.imageUrl ||
                                "https://via.placeholder.com/80x120"
                              }
                              alt={history.chapter.title}
                              className="w-20 h-28 object-cover border-4 border-black grayscale-[0.3] group-hover:grayscale-0 transition-all"
                            />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 border-2 border-black rotate-12">
                              {history.chapter.number}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="manga-font text-lg leading-tight text-black mb-1 line-clamp-1">
                              {history.chapter.mangaCustom.title}
                            </h3>
                            <p className="font-bold text-sm text-black mb-1 line-clamp-1">
                              {history.chapter.title}
                            </p>
                            <p className="text-xs font-black uppercase text-slate-500 mb-1">
                              Cap. {history.chapter.number} • Pág. {history.pageNumber}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(history.lastReadAt, language)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black -z-10 translate-x-2 translate-y-2 opacity-10 group-hover:opacity-20 transition-all"></div>
                    </a>
                    );
                  })}
                  {userChapterHistoryList.length > 6 && (
                    <button
                      onClick={() =>
                        setShowAllChapterHistoryList(!showAllChapterHistoryList)
                      }
                      className="w-full py-3 bg-black text-white font-black hover:bg-red-600 transition-all g-pen-border manga-font text-lg"
                    >
                      {showAllChapterHistoryList ? "VER MENOS" : "VER MÁS"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {editDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl g-pen-border p-8 max-h-[90vh] overflow-y-auto scrollbar-manga">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1 mb-2 g-pen-border transform -rotate-1 halftone-bg">
                  <span className="jp-font text-sm font-black">編集</span>
                </div>
                <h2 className="manga-font text-4xl font-black uppercase text-black">EDITAR PERFIL</h2>
              </div>
              <button
                onClick={handleCancelEdit}
                className="w-12 h-12 flex items-center justify-center bg-black text-white font-black hover:bg-red-600 transition-all g-pen-border text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase mb-3 text-black">
                  FOTO DE PERFIL
                </label>
                <ImageDropzone
                  value={newImage}
                  label="Subir foto de perfil"
                  alt="Profile picture"
                  onChange={handleImageChange}
                  onDelete={handleImageDelete}
                />
                {currentUser.imageUrl && !newImage && (
                  <div className="mt-4">
                    <p className="text-sm font-black mb-2 text-slate-600">Foto actual:</p>
                    <div className="g-pen-border bg-orange-400 p-2 rounded-full inline-block halftone-bg">
                      <img
                        src={currentUser.imageUrl}
                        alt="Current profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-black"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-3 text-black">
                  FECHA DE NACIMIENTO
                </label>
                <input
                  type="date"
                  className="w-full p-4 border-4 border-black focus:outline-none focus:border-red-600 bg-white font-bold"
                  value={newBirthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-3 text-black">
                  DESCRIPCIÓN
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-4 border-4 border-black focus:outline-none focus:border-red-600 resize-none bg-white font-bold"
                  rows={4}
                  placeholder="Escribe una descripción sobre ti..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-4 bg-white text-black font-black hover:bg-slate-100 transition-all g-pen-border manga-font text-lg"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={updating}
                className="flex-1 py-4 bg-black text-white font-black hover:bg-red-600 transition-all g-pen-border manga-font text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "GUARDANDO..." : "GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedProfileView;

