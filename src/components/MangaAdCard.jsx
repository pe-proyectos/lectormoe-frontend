import { getTranslator } from "../util/translate";

export function MangaAdCard({
  language,
  logged,
  subscriptionPlansData,
  manga,
  chapterNumber,
}) {
  const chapter = manga
    ? manga?.chapters?.find((chapter) => chapter.number === chapterNumber)
    : null;

  const _ = getTranslator(language);

  const getValidMangaSubscriptionPlans = () => {
    if (!manga || !chapter) return [];
    
    const isChapterReleased = new Date(chapter.releasedAt).getTime() < new Date().getTime();
    
    if (isChapterReleased) {
      // Capítulo ya fue lanzado
      const hasCanReadReleasedPlans = (manga?.subscriptionPlansCanReadReleased?.length ?? 0) > 0;
      if (hasCanReadReleasedPlans) {
        return subscriptionPlansData.filter((plan) => 
          manga?.subscriptionPlansCanReadReleased?.find((v) => v.id === plan.id)
        );
      }
      // Si está vacío, no mostrar planes (todos pueden leer)
      return [];
    } else {
      // Capítulo NO ha sido lanzado
      const hasCanReadUnreleasedPlans = (manga?.subscriptionPlansCanReadUnreleased?.length ?? 0) > 0;
      if (hasCanReadUnreleasedPlans) {
        return subscriptionPlansData.filter((plan) => 
          manga?.subscriptionPlansCanReadUnreleased?.find((v) => v.id === plan.id)
        );
      }
      // Si está vacío, no mostrar planes (nadie puede leer)
      return [];
    }
  };

  return (
    <div className="w-full max-w-[48rem] flex-row flex bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="m-0 w-2/5 shrink-0 rounded-r-none">
        <img
          src={chapter?.imageUrl || manga.imageUrl}
          alt="card-image"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-6 flex-1">
        <div className="flex flex-col h-full">
          <h6 className="text-lg text-gray-600 mb-4 uppercase">
            {manga.title} #{chapter.number}
          </h6>
          <h4 className="text-2xl text-blue-gray-800 mb-2">
            {chapter.title}
          </h4>
          <p className="text-gray-600 mb-8 font-normal">
            {manga.description}
          </p>
          <hr className="my-auto" />
          <div className="my-auto">
            {manga?.requireLogin && !logged && (
              <p className="text-xl font-bold text-black text-center">
                {_("login_to_read_published_chapter")}
              </p>
            )}
            {getValidMangaSubscriptionPlans().length > 0 && logged && (
              <>
                <p className="text-xl font-bold text-black text-center">
                  {_(
                    "subscribe_now_to_one_of_these_plans_to_read_chapter_early"
                  )}
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {getValidMangaSubscriptionPlans().map((plan) => (
                    <div
                      key={plan.id}
                      className="text-sm font-extralight text-black bg-gray-500 bg-opacity-50 rounded-lg px-2 py-1"
                    >
                      {plan.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <hr className="my-auto" />
        </div>
      </div>
    </div>
  );
}
