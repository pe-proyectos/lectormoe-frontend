import {
  Card,
  CardHeader,
  CardBody,
  Typography,
} from "@material-tailwind/react";
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
    return subscriptionPlansData.filter(
      (plan) =>
        plan.canReadUnreleased ||
        manga?.subscriptionPlans?.find((v) => v.id === plan.id)
    );
  };

  return (
    <Card className="w-full max-w-[48rem] flex-row">
      <CardHeader
        shadow={false}
        floated={false}
        className="m-0 w-2/5 shrink-0 rounded-r-none"
      >
        <img
          src={chapter?.imageUrl || manga.imageUrl}
          alt="card-image"
          className="h-full w-full object-cover"
        />
      </CardHeader>
      <CardBody>
        <div className="flex flex-col h-full">
          <Typography variant="h6" color="gray" className="mb-4 uppercase">
            {manga.title} #{chapter.number}
          </Typography>
          <Typography variant="h4" color="blue-gray" className="mb-2">
            {chapter.title}
          </Typography>
          <Typography color="gray" className="mb-8 font-normal">
            {manga.description}
          </Typography>
          <hr className="my-auto" />
          <div className="my-auto">
            {manga?.requireLogin && !logged && (
              <Typography
                variant="lead"
                className="font-bold text-black text-center"
              >
                {_("login_to_read_published_chapter")}
              </Typography>
            )}
            {getValidMangaSubscriptionPlans().length > 0 && logged && (
              <>
                <Typography
                  variant="lead"
                  className="font-bold text-black text-center"
                >
                  {_(
                    "subscribe_now_to_one_of_these_plans_to_read_chapter_early"
                  )}
                </Typography>

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
      </CardBody>
    </Card>
  );
}
