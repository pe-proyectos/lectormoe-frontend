import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { getOrgPath, getOrgSlugFromPath } from "../util/get-org-path";

export function FeaturedMangaCard({ organization, language, manga, organizationSlug, ...props }) {
  const _ = getTranslator(language);
  const orgSlug = organizationSlug || getOrgSlugFromPath();
  const shouldBlur = manga?.isNSFW === true || organization?.isNSFW === true;
  
  // El slug puede estar en manga.slug, manga.mangaSlug, o manga.manga.slug
  const mangaSlug = manga?.manga?.slug || manga?.slug || manga?.mangaSlug;

  if (!manga) {
    return (
      <div {...props}>
        <a href={mangaSlug ? getOrgPath(`/manga/${mangaSlug}`, orgSlug) : "#"}>
          <div className="relative w-full h-full bg-gray-900 group overflow-hidden rounded-md shadow-md hover:scale-[101%] transition-transform duration-300"></div>
        </a>
      </div>
    );
  }
  return (
    <div {...props}>
      <a href={manga?.slug ? getOrgPath(`/manga/${manga?.slug}`, orgSlug) : "#"}>
        <div className="relative w-full h-full group overflow-hidden rounded-md shadow-md hover:scale-[101%] transition-transform duration-300">
          {manga?.bannerUrl ? (
            <LazyImage
              src={manga?.bannerUrl}
              alt={manga?.title}
              decoding="async"
              loading="lazy"
              className={`absolute inset-0 w-full min-h-full min-w-full max-h-full mx-auto object-cover duration-300 group-hover:scale-[102%] transition-transform ${shouldBlur ? 'blur-xl scale-110' : ''}`}
            />
          ) : (
            <LazyImage
              src={manga?.imageUrl}
              alt={manga?.title}
              decoding="async"
              loading="lazy"
              className={`absolute inset-0 w-full mx-auto object-cover duration-300 top-1/2 -translate-y-1/2 group-hover:scale-[102%] transition-transform ${shouldBlur ? 'blur-xl scale-110' : ''}`}
            />
          )}
          {/* NSFW Badge */}
          {shouldBlur && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-red-500/90 text-white px-6 py-3 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg">
                +18
              </div>
            </div>
          )}
          <div className="to-bg-black-10 absolute bottom-0 h-2/4 lg:h-3/4 w-full bg-gradient-to-t from-black/90 via-black/60 lg:via-black/80 blur-sm" />
          <div className="absolute top-4 right-4 justify-end">
            {/* if lastChapterAt was released in the last 3 days show a chip */}
            <div className="flex flex-wrap gap-2">
              {manga?.lastChapterAt &&
                new Date(manga.lastChapterAt) >
                  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                  <div className="relative group/tooltip">
                    <a
                      href={manga?.lastChapters?.[0]
                        ? getOrgPath(`/manga/${mangaSlug}/chapters/${manga?.lastChapters?.[0]?.number}`, orgSlug)
                        : getOrgPath(`/manga/${mangaSlug}`, orgSlug)}
                      className="backdrop-blur-sm bg-green-600 bg-opacity-60 text-white cursor-pointer px-2 py-1 rounded border border-white/20 text-xs inline-block"
                    >
                      {_("new_chapter")}
                    </a>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {new Date(manga.lastChapterAt).getTime() >
                      new Date().setHours(0, 0, 0, 0)
                        ? `${_("chapter")} ${
                            manga?.lastChapters?.[0]?.number || _("latest")
                          } ${_("was_released_today")}`
                        : `${_("chapter")} ${
                            manga?.lastChapters?.[0]?.number || _("latest")
                          } ${_("was_released_on")} ${new Date(
                            manga.lastChapterAt
                          ).toLocaleDateString()}`}
                    </div>
                  </div>
                )}
              <span className="backdrop-blur-sm bg-blue-600 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                {`${manga?.views || 0} ${
                  manga?.views === 1 ? _("reader") : _("total_views")
                }`}
              </span>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-4xl">
              {manga?.title || ""}
            </h3>
            <p className="text-white font-normal text-sm hidden lg:block">
              {manga?.shortDescription || ""}
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}
