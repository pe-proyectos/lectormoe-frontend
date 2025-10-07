import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Tooltip,
} from "@material-tailwind/react";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";

export function MangaCard({ organization, language, manga, user}) {
  const _ = getTranslator(language);

  if (!manga) {
    return (
      <Card
        shadow={false}
        className="relative grid h-[26rem] max-h-[26rem] w-[16rem] bg-gray-300 shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center animate-pulse"
      >
        <div className="font-semibold"></div>
      </Card>
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

    if (!user.birthdate || !isAdult(user.birthdate)) {
      location.href = `/profile/${user.slug}`;
      return;
    }

    location.href = href;
  }

  const formatDate = (date) => {
    if (!date) return "";
    const dt = new Date(date);
    const diff = new Date().getTime() - dt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    if (organization.language === "en") {
      if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
      if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
      if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
      return "today";
    } else if (organization.language === "pt") {
      if (months > 0) return `há ${months} mes${months > 1 ? "es" : ""}`;
      if (weeks > 0) return `há ${weeks} semana${weeks > 1 ? "s" : ""}`;
      if (days > 0) return `há ${days} dia${days > 1 ? "s" : ""}`;
      if (hours > 0) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
      if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
      if (seconds > 0) return `há ${seconds} segundo${seconds > 1 ? "s" : ""}`;
      return "hoje";
    }
    if (months > 0) return `hace ${months} mes${months > 1 ? "es" : ""}`;
    if (weeks > 0) return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    if (seconds > 0) return `hace ${seconds} segundo${seconds > 1 ? "s" : ""}`;
    return "hoy";
  };

  const shouldBlur = manga.isNSFW === true && (!user?.birthdate || !isAdult(user.birthdate));
  return (
    <Card
      shadow={false}
      className="relative grid h-[26rem] max-h-[26rem] w-[16rem] shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center"
    >
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="absolute inset-0 m-0 h-full w-full rounded-none bg-black"
      >
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
                  <Tooltip
                    content={
                      new Date(manga.lastChapterAt).getTime() >
                        new Date().setHours(0, 0, 0, 0)
                        ? manga?.lastChapters?.[0]?.number
                          ? `${_("the_chapter")} ${manga?.lastChapters?.[0]?.number
                          } ${_("was_released_today")}`
                          : _("most_recent_chapter_was_released_today")
                        : manga?.lastChapters?.[0]?.number
                          ? `${_("the_chapter")} ${manga?.lastChapters?.[0]?.number
                          } ${_("was_released_at")} ${new Date(
                            manga.lastChapterAt
                          ).toLocaleDateString()}`
                          : `${_("most_recent_chapter_was_released_at")} ${new Date(
                            manga.lastChapterAt
                          ).toLocaleDateString()}`
                    }
                  >
                    <Chip
                      variant="outlined"
                      value={_("new_chapter")}
                      //@ts-ignore
                      onClick={(e) => {
                        const href = manga?.lastChapters?.[0]
                          ? `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`
                          : `/manga/${manga.slug}`;

                        if (manga.isNSFW === true) {
                          HandleNSFWClick(e, href);
                        } else {
                          location.href = href;
                        }
                      }}
                    />
                  </Tooltip>
                )}
              {manga?.isSimulRelease && (
                <Tooltip content={_("simulrelease_tooltip")}>
                  <Chip
                    variant="outlined"
                    value={_("simulrelease")}
                    className="backdrop-blur-sm bg-gradient-to-r bg-red-500 bg-opacity-80 text-white"
                  />
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardBody className="relative py-14 px-6 md:px-12">
        <figcaption
          className="absolute bottom-4 left-1/2 flex flex-col w-[12rem] -translate-x-1/2
        justify-between rounded-xl border border-white border-opacity-25 bg-white/70 py-1 px-2 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm"
        >
          <div>
            <Tooltip content={manga.title}>
              <Typography
                as="a"
                href={manga.isNSFW === true ? `/profile/${user.slug}` : `/manga/${manga.slug}`}
                color="blue-gray"
                className="font-semibold hover:underline cursor-pointer"
                onClick={(e) => {
                  if (manga.isNSFW === true) {
                    HandleNSFWClick(e, `/manga/${manga.slug}`);
                  }
                }}
              >
                {manga.title.length > 40
                  ? manga.title.slice(0, 40 - 3) + "..."
                  : manga.title}
              </Typography>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {manga?.lastChapters?.[0] && (
              <div>
                <Typography
                  as="a"
                  href={manga.isNSFW === true ? "/profile" : `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`}
                  color="gray"
                  className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer"
                >
                  {_("chapter")} {manga?.lastChapters?.[0]?.number}
                </Typography>
                <Typography
                  as="a"
                  href={manga.isNSFW === true ? "/profile" : `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`}
                  color="gray"
                  className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer"
                  onClick={(e) => {
                    if (manga.isNSFW === true) {
                      HandleNSFWClick(e, `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`);
                    }
                  }}
                >
                  {manga?.lastChapters?.[0]?.subscribersOnly
                    ? _("only_for_subscribers")
                    : formatDate(manga?.lastChapters?.[0]?.releasedAt)}
                </Typography>
              </div>
            )}
            {manga?.lastChapters?.[1] && (
              <div>
                <Typography
                  as="a"
                  href={manga.isNSFW === true ? "/profile" : `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`}
                  color="gray"
                  className="font-normal text-xs hover:underline cursor-pointer"
                  onClick={(e) => {
                    if (manga.isNSFW === true) {
                      HandleNSFWClick(e, `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`);
                    }
                  }}
                >
                  {_("chapter")} {manga?.lastChapters?.[1]?.number}
                </Typography>
                <Typography
                  as="a"
                  href={manga.isNSFW === true ? "/profile" : `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`}
                  color="gray"
                  className="font-normal text-xs hover:underline cursor-pointer"
                  onClick={(e) => {
                    if (manga.isNSFW === true) {
                      HandleNSFWClick(e, `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`);
                    }
                  }}
                >
                  {manga?.lastChapters?.[1]?.subscribersOnly
                    ? _("only_for_subscribers")
                    : formatDate(manga?.lastChapters?.[1]?.releasedAt)}
                </Typography>
              </div>
            )}
          </div>
        </figcaption>
      </CardBody>
    </Card>
  );
}
