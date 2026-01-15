import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { getOrgPath, getOrgSlugFromPath } from "../util/get-org-path";
import { formatDate as formatDateUtil } from "../util/date";

export function MangaCard({ organization, language, manga, user, organizationSlug }) {
  const _ = getTranslator(language);
  
  // Get organization slug from path if not provided
  const orgSlug = organizationSlug || getOrgSlugFromPath();
  
  // El slug puede estar en mangaSlug (objetos transformados) o manga.mangaSlug (mangaCustom directo)
  const mangaSlug = manga?.manga?.slug || manga?.slug || manga?.mangaSlug;

  if (!manga) {
    return (
      <div className="relative grid h-[26rem] max-h-[26rem] w-[16rem] bg-gray-300 shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center animate-pulse rounded-lg">
        <div className="font-semibold"></div>
      </div>
    );
  }

  function isAdult(birthdate) {
    if (!birthdate) return false;
    const today = new Date();
    const dateBirthdate = new Date(birthdate);

    let age = today.getFullYear() - dateBirthdate.getFullYear();

    const agemonth = today.getMonth() - dateBirthdate.getMonth();
    const ageday = today.getDate() - dateBirthdate.getDate();

    if (agemonth < 0 || (agemonth === 0 && ageday < 0)) {
      age--;
    }
    return age >= 18;
  }

  const HandleNSFWClick = (e, href) => {
    e.preventDefault();
    if (!user?.slug) {
      location.href = getOrgPath(`/register?redirect=${location.pathname}`, orgSlug);
      return;
    }

    if (!user?.birthdate || !isAdult(user?.birthdate)) {
      location.href = getOrgPath(`/profile/${user.slug}`, orgSlug);
      return;
    }

    location.href = href;
  }

  const formatDate = (date) => {
    if (!date) return "";
    return formatDateUtil(date, organization.language || 'es');
  };

  // Check if user can read a specific chapter
  const userHasAccessToChapter = (chapter) => {
    if (!chapter) return true;

    if (!user) {
      // Si el manga requiere login, no tiene acceso
      if (manga?.requireLogin) return false;
      
      // Verificar si el capítulo fue lanzado y si requiere planes específicos
      const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();
      if (isChapterReleased) {
        const hasCanReadReleasedPlans = (manga?.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
        return !hasCanReadReleasedPlans; // Si no hay planes específicos, todos pueden leer
      } else {
        return false; // Capítulo no lanzado, usuarios no logueados no pueden leer
      }
    }

    // Check user permissions (staff)
    const permissions = user.permissions?.find(
      (permission) => permission.organizationId === organization?.id
    ) || {};
    if (permissions.canReadUnreleased === true) return true;
    if (permissions.canEditChapter === true) return true;
    if (permissions.canEditPage === true) return true;

    const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();

    if (isChapterReleased) {
      // Capítulo ya fue lanzado
      const hasCanReadReleasedPlans = (manga?.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
      if (hasCanReadReleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadReleased pueden leer
        for (const subscription of user?.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organization?.id
          ) {
            const hasPlan = manga?.subscriptionPlansCanReadReleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadReleased está vacío → Todos pueden leer
        return true;
      }
    } else {
      // Capítulo NO ha sido lanzado
      const hasCanReadUnreleasedPlans = (manga?.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;
      if (hasCanReadUnreleasedPlans) {
        // Solo usuarios con planes en subscriptionPlansCanReadUnreleased pueden leer
        for (const subscription of user?.subscriptions || []) {
          if (
            subscription.active === true &&
            subscription?.subscriptionPlan?.organizationId === organization?.id
          ) {
            const hasPlan = manga?.subscriptionPlansCanReadUnreleased?.find(
              (plan) => plan.id === subscription?.subscriptionPlan?.id
            );
            if (hasPlan) return true;
          }
        }
        return false;
      } else {
        // subscriptionPlansCanReadUnreleased está vacío → Nadie puede leer antes de la fecha
        return false;
      }
    }
  };

  // Get access message for a chapter
  const getChapterAccessMessage = (chapter) => {
    if (!chapter) return null;
    
    const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();
    
    if (isChapterReleased) {
      const hasCanReadReleasedPlans = (manga?.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
      if (hasCanReadReleasedPlans && manga?.subscriptionPlansCanReadReleased) {
        const planNames = manga.subscriptionPlansCanReadReleased.map(p => p.name).join(", ");
        return `Requiere: ${planNames}`;
      }
      return null; // Todos pueden leer
    } else {
      const hasCanReadUnreleasedPlans = (manga?.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;
      if (hasCanReadUnreleasedPlans && manga?.subscriptionPlansCanReadUnreleased) {
        const planNames = manga.subscriptionPlansCanReadUnreleased.map(p => p.name).join(", ");
        return `Requiere: ${planNames}`;
      }
      return "Aún no publicado";
    }
  };

  const shouldBlur = manga.isNSFW === true && (!user?.birthdate || !isAdult(user?.birthdate));
  return (
    <div className="relative grid h-[26rem] max-h-[26rem] w-[16rem] shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center rounded-lg">
      <div className="absolute inset-0 m-0 h-full w-full rounded-lg bg-black">
        <LazyImage
          src={manga.imageUrl}
          alt={manga.title}
          decoding="async"
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover 
                     hover:scale-105 transition-transform duration-300 
                     group-hover:filter group-hover:brightness-90 select-none
                     ${shouldBlur ? "blur-md" : ""}`}
        />

        {/* if lastChapterAt was released in the last 3 days show a chip */}
        {!shouldBlur && (
          <div className="absolute top-2 right-2">
            <div className="flex flex-wrap gap-2">
              {manga?.lastChapterAt &&
                new Date(manga.lastChapterAt) >
                new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                  <div className="relative group/tooltip">
                    {(() => {
                      // El API devuelve 'chapters' (no 'lastChapters'), así que usamos 'chapters' con fallback a 'lastChapters' para compatibilidad
                      const lastChapters = manga?.chapters || manga?.lastChapters || [];
                      const href = lastChapters?.[0]
                        ? getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[0]?.number}`, orgSlug)
                        : getOrgPath(`/manga/${mangaSlug}`, orgSlug);
                      const finalHref = manga.isNSFW === true 
                        ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug))
                        : href;
                      
                      return (
                        <a
                          href={finalHref}
                          className="backdrop-blur-sm bg-green-600 bg-opacity-60 text-white cursor-pointer px-2 py-1 rounded border border-white/20 text-xs inline-block"
                          onClick={(e) => {
                            if (manga.isNSFW === true) {
                              e.preventDefault();
                              HandleNSFWClick(e, href);
                            }
                          }}
                        >
                          {_("new_chapter")}
                        </a>
                      );
                    })()}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {(() => {
                        // El API devuelve 'chapters' (no 'lastChapters'), así que usamos 'chapters' con fallback a 'lastChapters' para compatibilidad
                        const lastChapters = manga?.chapters || manga?.lastChapters || [];
                        const lastChapter = lastChapters[0];
                        return new Date(manga.lastChapterAt).getTime() >
                          new Date().setHours(0, 0, 0, 0)
                          ? lastChapter?.number
                            ? `${_("the_chapter")} ${lastChapter.number} ${_("was_released_today")}`
                            : _("most_recent_chapter_was_released_today")
                          : lastChapter?.number
                            ? `${_("the_chapter")} ${lastChapter.number} ${_("was_released_at")} ${new Date(
                                manga.lastChapterAt
                              ).toLocaleDateString()}`
                            : `${_("most_recent_chapter_was_released_at")} ${new Date(
                                manga.lastChapterAt
                              ).toLocaleDateString()}`;
                      })()}
                    </div>
                  </div>
                )}
              {manga?.isSimulRelease && (
                <div className="relative group/tooltip">
                  <span className="backdrop-blur-sm bg-gradient-to-r bg-red-500 bg-opacity-80 text-white px-2 py-1 rounded border border-white/20 text-xs">
                    {_("simulrelease")}
                  </span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {_("simulrelease_tooltip")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="relative py-14 px-6 md:px-12">
        <figcaption
          className="absolute bottom-4 left-1/2 flex flex-col w-[12rem] -translate-x-1/2
        justify-between rounded-xl border border-white border-opacity-25 bg-white/70 py-1 px-2 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm"
        >
          <div>
            <div className="relative group/tooltip">
              <a
                href={manga.isNSFW === true ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug)) : getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
                className="font-semibold hover:underline cursor-pointer text-blue-gray-800"
                onClick={(e) => {
                  if (manga.isNSFW === true) {
                    e.preventDefault();
                    HandleNSFWClick(e, getOrgPath(`/manga/${mangaSlug}`, orgSlug));
                  }
                }}
              >
                {manga.title.length > 40
                  ? manga.title.slice(0, 40 - 3) + "..."
                  : manga.title}
              </a>
              {manga.title.length > 40 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {manga.title}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {(() => {
              // El API devuelve 'chapters' (no 'lastChapters'), así que usamos 'chapters' con fallback a 'lastChapters' para compatibilidad
              const lastChapters = manga?.chapters || manga?.lastChapters || [];
              return (
                <>
                  {lastChapters[0] && (
                    <div>
                      <a
                        href={manga.isNSFW === true ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug)) : getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[0]?.number}`, orgSlug)}
                        className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer block"
                      >
                        {_("chapter")} {lastChapters[0]?.number}
                      </a>
                      <a
                        href={manga.isNSFW === true ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug)) : getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[0]?.number}`, orgSlug)}
                        className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer block"
                        onClick={(e) => {
                          if (manga.isNSFW === true) {
                            e.preventDefault();
                            HandleNSFWClick(e, getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[0]?.number}`, orgSlug));
                          }
                        }}
                      >
                        {(() => {
                          const hasAccess = userHasAccessToChapter(lastChapters[0]);
                          if (!hasAccess) {
                            const accessMsg = getChapterAccessMessage(lastChapters[0]);
                            return accessMsg || _("only_for_subscribers");
                          }
                          return formatDate(lastChapters[0]?.releasedAt);
                        })()}
                      </a>
                    </div>
                  )}
                  {lastChapters[1] && (
                    <div>
                      <a
                        href={manga.isNSFW === true ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug)) : getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[1]?.number}`, orgSlug)}
                        className="font-normal text-xs hover:underline cursor-pointer block"
                        onClick={(e) => {
                          if (manga.isNSFW === true) {
                            e.preventDefault();
                            HandleNSFWClick(e, getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[1]?.number}`, orgSlug));
                          }
                        }}
                      >
                        {_("chapter")} {lastChapters[1]?.number}
                      </a>
                      <a
                        href={manga.isNSFW === true ? (user?.slug ? getOrgPath(`/profile/${user.slug}`, orgSlug) : getOrgPath("/register", orgSlug)) : getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[1]?.number}`, orgSlug)}
                        className="font-normal text-xs hover:underline cursor-pointer block"
                        onClick={(e) => {
                          if (manga.isNSFW === true) {
                            HandleNSFWClick(e, getOrgPath(`/manga/${mangaSlug}/chapters/${lastChapters[1]?.number}`, orgSlug));
                          }
                        }}
                      >
                        {(() => {
                          const hasAccess = userHasAccessToChapter(lastChapters[1]);
                          if (!hasAccess) {
                            const accessMsg = getChapterAccessMessage(lastChapters[1]);
                            return accessMsg || _("only_for_subscribers");
                          }
                          return formatDate(lastChapters[1]?.releasedAt);
                        })()}
                      </a>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </figcaption>
      </div>
    </div>
  );
}
