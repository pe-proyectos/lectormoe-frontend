import { useEffect, useState } from "react";
import {
  Typography,
  Tooltip,
  Chip,
  Button,
  ButtonGroup,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import StickyBox from "react-sticky-box";
import { callAPI } from "../util/callApi";
import { LazyImage } from "./LazyImage";
import { toast } from "react-toastify";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";

export function MangaView({ manga, organization, logged }) {
  const _ = getTranslator(organization.language);

  const [chapterGroups, setChapterGroups] = useState({});
  const [selectedChapterGroup, setSelectedChapterGroup] = useState("");
  const [openCommentsAccordion, setOpenCommentsAccordion] = useState(true);
  const [userChapterHistoryList, setUserChapterHistoryList] = useState([]);

  const firstChapter = manga?.chapters?.sort(
    (a, b) => a.number - b.number
  )?.[0];
  const lastChapter = manga?.chapters?.sort((a, b) => b.number - a.number)?.[0];

  useEffect(() => {
    callAPI(`/api/views/manga-custom/${manga.slug}`, {
      includeIp: true,
    }).catch((error) => {});
    if (logged) {
      callAPI(
        `/api/user-chapter-history?limit=1000&include_finished=true&manga_slug=${manga.slug}`
      )
        .then(({ data }) => {
          setUserChapterHistoryList(data);
        })
        .catch((error) => toast.error(error?.message));
    }
  }, []);

  useEffect(() => {
    callAPI("/api/analytics", {
      method: "POST",
      includeIp: true,
      body: JSON.stringify({
        event: "view_manga_profile",
        path: window.location.pathname,
        userAgent: window.navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        payload: {},
      }),
    }).catch((err) => console.error(err));
  }, []);

  const listFormatter = new Intl.ListFormat("es", {
    style: "long",
    type: "conjunction",
  });

  const getChapterHistory = (chapterNumber) => {
    if (!logged) return null;
    return userChapterHistoryList.find(
      (c) => c?.chapter?.number == chapterNumber
    );
  };

  const getChapterLabel = (chapterNumber) => {
    const history = getChapterHistory(chapterNumber);
    if (!history) {
      return _("read");
    }

    if (!history.finishedAt) {
      return _("keep_reading");
    }

    return _("already_read");
  };

  useEffect(() => {
    // Disqus
    if (organization?.enableDisqusIntegration) {
      window.disqus_config = function () {
        this.page.url = `https://${organization?.domain}/manga/${manga.slug}`;
        this.page.identifier = manga.slug;
        this.page.title = manga.title;
      };
      const script = document.createElement("script");
      script.src =
        organization?.disqusEmbedUrl || "https://lat-manga.disqus.com/embed.js";
      script.setAttribute("data-timestamp", Date.now().toString());
      script.setAttribute("data-title", Date.now().toString());
      (document.head || document.body).appendChild(script);
    }
    // Chapters Navigation
    const highestChapterNumber = manga?.chapters?.reduce(
      (prev, current) => (prev.number > current.number ? prev : current),
      0
    )?.number;
    if (!highestChapterNumber && highestChapterNumber !== 0) return;
    const highestChapterNumberCeiled =
      Math.ceil(highestChapterNumber / 10) * 10;
    const groups = {};
    let lastLabel = "";
    for (let i = 10; i <= highestChapterNumberCeiled; i += 10) {
      const chapters = manga?.chapters
        .filter((chapter) => chapter.number >= i - 9 && chapter.number <= i)
        .map((chapter) => {
          chapter.isReady =
            new Date(chapter.releasedAt).getTime() < new Date().getTime();
          return chapter;
        });
      if (chapters.length === 0) continue;
      const label = `${i - 9}-${i}`;
      groups[label] = {
        label,
        from: i - 9,
        to: i,
        chapters,
      };
      lastLabel = label;
    }
    const chapterNumberZero = manga?.chapters.find(
      (chapter) => chapter.number === 0
    );
    if (chapterNumberZero) {
      const chapterZero = {
        ...chapterNumberZero,
        isReady:
          new Date(chapterNumberZero.releasedAt).getTime() <
          new Date().getTime(),
      };
      if (groups[Object.keys(groups)[0]]) {
        groups[Object.keys(groups)[0]]?.chapters.push(chapterZero);
      } else {
        groups[0] = {
          label: `0`,
          from: 0,
          to: 0,
          chapters: [chapterZero],
        };
        lastLabel = `0`;
      }
    }
    setChapterGroups(groups);
    setSelectedChapterGroup(lastLabel);
  }, []);

  return (
    <div>
      <div className="relative w-full h-[24rem] group overflow-hidden bg-black shadow-lg">
        <LazyImage
          src={manga?.bannerUrl || manga?.imageUrl}
          decoding="async"
          loading="lazy"
          className="absolute top-1/2 -translate-y-1/2 w-full min-w-full min-h-full object-cover transition-transform duration-500 group-hover:scale-[101%]"
        />
      </div>
      <div className="2xl:max-w-[1320px] 2xl:mx-auto transition-all duration-500">
        <div className="flex flex-wrap md:flex-nowrap gap-2 mx-4">
          <div className="w-[18rem] min-w-[18rem] mx-auto">
            <StickyBox offsetTop={150} offsetBottom={150}>
              <div className="relative w-[18rem] min-w-[18rem] h-[26rem] group -translate-y-64 md:-translate-y-16 -mb-64 md:-mb-16 overflow-hidden rounded-md">
                {/* <LazyImage src={manga?.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 filter brightness-50" /> */}
                <LazyImage
                  src={manga?.imageUrl}
                  decoding="async"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 blur-sm filter brightness-75 transition-transform duration-500 group-hover:scale-[110%]"
                />
                <LazyImage
                  src={manga?.imageUrl}
                  decoding="async"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-contain max-w-full max-h-full m-auto transition-transform duration-500 group-hover:scale-[104%]"
                />
              </div>
              <div className="w-full mt-6 mb-6">
                <Button
                  variant="filled"
                  className="flex items-center gap-3 mx-auto text-gray-900 bg-yellow-500"
                  color="yellow"
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
                      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                    />
                  </svg>
                  {/*
                                Filled:
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                </svg>
                                */}
                  {_("add_to_favorites")}Añadir a Favoritos
                </Button>
              </div>
              <div className="flex justify-between items-center my-4">
                <span className="text-xl font-bold">{_("status")}:</span>
                {manga?.status === "ongoing" && (
                  <div className="w-fit uppercase text-xl font-bold bg-green-400 py-1 px-6 text-center rounded-lg shadow-sm">
                    {_("ongoing")}
                  </div>
                )}
                {manga?.status === "hiatus" && (
                  <div className="w-fit uppercase text-xl font-bold bg-orange-500 py-1 px-6 text-center rounded-lg shadow-sm mx-auto">
                    {_("hiatus").toUpperCase()}
                  </div>
                )}
                {manga?.status === "finished" && (
                  <div className="w-fit uppercase text-xl font-bold bg-red-400 py-1 px-6 text-center rounded-lg shadow-sm mx-auto">
                    {_("finished").toUpperCase()}
                  </div>
                )}
              </div>
              {manga?.nextChapterAt &&
                new Date() < new Date(manga?.nextChapterAt) && (
                  <div className="flex flex-wrap justify-between items-center my-4">
                    <span className="text-xl font-bold">
                      {_("next_chapter")}:
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Tooltip
                        content={new Date(
                          manga?.nextChapterAt
                        ).toLocaleString()}
                      >
                        <p>
                          {formatDate(
                            manga?.nextChapterAt,
                            organization.language
                          )}
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                )}
              <div className="flex flex-wrap justify-between items-center my-4">
                <span className="text-xl font-bold">{_("demography")}:</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {!manga?.demography && (
                    <span className="text-sm font-semibold px-2 text-center">
                      {_("no_demography")}
                    </span>
                  )}
                  {manga?.demography && (
                    <a
                      key={manga?.demography.slug}
                      href={`/search?genres=${manga?.demography.slug}`}
                      className="text-sm font-semibold px-2 text-center"
                    >
                      {manga?.demography.name}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-center my-4">
                <span className="text-xl font-bold">{_("genres")}:</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {manga?.genres?.length === 0 && (
                    <span className="text-sm font-semibold px-2 text-center">
                      {_("no_genres")}
                    </span>
                  )}
                  {manga?.genres?.map((genre) => (
                    <a
                      key={genre.slug}
                      href={`/search?genres=${genre.slug}`}
                      className="text-sm font-semibold px-2 text-center"
                    >
                      {genre.name}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center items-center my-4">
                <ButtonGroup color="white" variant="outlined">
                  {firstChapter && (
                    <Button
                      className="text-[0.6rem]"
                      onClick={() =>
                        (location.href = `/manga/${manga.slug}/chapters/${firstChapter?.number}`)
                      }
                    >
                      {_("go_to_first_chapter")}
                    </Button>
                  )}
                  {lastChapter && (
                    <Button
                      className="text-[0.6rem]"
                      onClick={() =>
                        (location.href = `/manga/${manga.slug}/chapters/${lastChapter?.number}`)
                      }
                    >
                      {_("go_to_last_chapter")}
                    </Button>
                  )}
                </ButtonGroup>
              </div>
              {/* <div className="flex flex-nowrap justify-between items-center my-2">
                            <span className="text-xl font-bold">
                                Mangas Similares:
                            </span>
                            <div className="flex flex-wrap gap-2 items-center">
                                {manga?.similarMangas?.map(similar => (
                                    <a key={similar.id} href={`/manga/${similar.slug}`} className="text-sm font-semibold px-2 text-center">{similar.title}</a>
                                ))}
                            </div>
                        </div> */}
            </StickyBox>
          </div>
          <div className="flex flex-col w-full py-4 md:mx-4">
            <span className="text-6xl font-extrabold">{manga?.title}</span>
            <p className="md:mx-2 md:my-1">
              {_("by")}{" "}
              {listFormatter.format(
                manga?.authors.map((author) => author.name)
              )}
            </p>
            <p className="md:mx-2 md:my-4">
              {manga?.description ||
                manga?.shortDescription ||
                _("no_description")}
            </p>
            {/* Chapters */}
            <span className="text-4xl mb-2 font-extrabold">
              {_("chapters")}
              <span className="text-xs ml-2 mb-1 text-gray-600">
                {logged
                  ? `${manga?.chapters.length} ${_("published")} (${
                      userChapterHistoryList.filter((v) => v?.finishedAt).length
                    } ${_("past_read")})`
                  : `${manga?.chapters.length} ${_("published")}`}
              </span>
            </span>
            <div className="flex w-full items-start gap-1">
              <div className="flex flex-col w-full gap-1">
                {chapterGroups[selectedChapterGroup]?.chapters
                  .sort((a, b) => b.number - a.number)
                  .map((chapter) => (
                    <a
                      key={chapter.number}
                      href={
                        chapter.isReady
                          ? logged
                            ? getChapterHistory(chapter.number)
                              ? getChapterHistory(chapter.number)?.finishedAt
                                ? `/manga/${manga.slug}/chapters/${chapter.number}`
                                : `/manga/${manga.slug}/chapters/${
                                    chapter.number
                                  }?page=${
                                    getChapterHistory(chapter.number)
                                      ?.pageNumber
                                  }`
                              : `/manga/${manga.slug}/chapters/${chapter.number}`
                            : `/manga/${manga.slug}/chapters/${chapter.number}`
                          : "#!not_ready"
                      }
                      className={
                        "p-2 w-full rounded-xl group" +
                        " " +
                        (chapter.isReady
                          ? logged
                            ? getChapterHistory(chapter.number)
                              ? getChapterHistory(chapter.number)?.finishedAt
                                ? "bg-black bg-opacity-40 hover:bg-opacity-15"
                                : "bg-orange-600 bg-opacity-10 hover:bg-opacity-15"
                              : new Date(chapter.releasedAt) >
                                new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                              ? "bg-green-400 bg-opacity-10 hover:bg-opacity-15"
                              : "bg-white bg-opacity-10 hover:bg-opacity-15"
                            : new Date(chapter.releasedAt) >
                              new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                            ? "bg-green-400 bg-opacity-10 hover:bg-opacity-15"
                            : "bg-white bg-opacity-10 hover:bg-opacity-15"
                          : "bg-gray-600 bg-opacity-50 cursor-not-allowed")
                      }
                    >
                      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center">
                        <div className="w-32 h-20 relative">
                          <LazyImage
                            src={chapter?.imageUrl || manga?.imageUrl}
                            decoding="async"
                            loading="lazy"
                            className="w-full h-full object-cover rounded-lg grayscale group-hover:grayscale-0"
                          />
                        </div>
                        <div className="flex flex-wrap grow items-center justify-between">
                          <div className="">
                            <p className="flex flex-wrap items-center gap-x-2">
                              <span className="text-xs lg:text-lg text-gray-400">
                                {_("chapter")} {chapter.number}
                              </span>
                              <span className="text-[0.7rem] font-extralight text-gray-500">
                                {_("available")}{" "}
                                {formatDate(
                                  chapter.releasedAt,
                                  organization.language
                                )}
                              </span>
                            </p>
                            <p className="text-xl lg:text-2xl">
                              {chapter.title}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs lg:text-base text-gray-100 lg:mr-4">
                              {getChapterLabel(chapter.number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
              </div>
              <StickyBox offsetTop={100} offsetBottom={100}>
                <div className="grid grid-cols-1 w-28 gap-1 items-center">
                  {Object.values(chapterGroups)
                    .sort((a, b) => b.from - a.from)
                    .map((group) => (
                      <div
                        key={group.label}
                        className={
                          "flex w-24 h-8 mx-auto bg-opacity-80 text-sm rounded-lg items-center justify-center cursor-pointer" +
                          (group.label === selectedChapterGroup
                            ? " bg-white text-black "
                            : " bg-gray-800 hover:bg-gray-700 text-white ")
                        }
                        onClick={() => setSelectedChapterGroup(group.label)}
                      >
                        <p>{group.label}</p>
                      </div>
                    ))}
                </div>
              </StickyBox>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="w-full px-1 sm:px-4 md:px-8"> */}
      <div className="2xl:max-w-[1320px] 2xl:mx-auto px-1 sm:px-4 transition-all duration-500">
        {/* Disqus Comments */}
        {organization?.enableDisqusIntegration && (
          <div className="w-full md:my-4 text-center">
            <div className="max-w-[97vw] m-0 2xl:max-w-[95vw] mx-auto shadow-sm my-4 rounded-md">
              <Accordion open={openCommentsAccordion}>
                <AccordionHeader
                  onClick={() =>
                    setOpenCommentsAccordion((oldValue) => !oldValue)
                  }
                >
                  <h3 className="text-xl font-bold text-gray-300">
                    {openCommentsAccordion ? _("hide") : _("show")}{" "}
                    {_("comments")}
                  </h3>
                </AccordionHeader>
                <AccordionBody className="bg-gray-900 my-2 p-4 rounded-md">
                  <div id="disqus_thread" />
                </AccordionBody>
              </Accordion>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
