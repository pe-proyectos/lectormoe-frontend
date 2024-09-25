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
  Alert,
} from "@material-tailwind/react";
import StickyBox from "react-sticky-box";
import { callAPI } from "../util/callApi";
import { LazyImage } from "./LazyImage";
import { toast } from "react-toastify";
import { getTranslator } from "../util/translate";
import { formatDate } from "../util/date";
import { pascalCase } from "../util/pascalCase";

export function ProfileView({ organization, member, userSlug, username }) {
  const _ = getTranslator(organization.language);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userChapterHistoryList, setUserChapterHistoryList] = useState([]);
  const [userChapterHistoryTotal, setUserChapterHistoryTotal] = useState([]);
  const [showAllChapterHistoryList, setShowAllChapterHistoryList] =
    useState(false);

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
    callAPI(`/api/user-chapter-history`)
      .then(({ data, total }) => {
        setUserChapterHistoryList(data);
        setUserChapterHistoryTotal(total);
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoadingHistory(false));
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-4">
        <div className="w-full max-w-4xl shadow p-5 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center">
              <img
                className="w-24 h-24 mb-3 rounded-full shadow-lg"
                src={member.imageUrl || "/public/images/profile-user.png"}
                alt={username}
              />
              <h5 className="text-xl font-medium text-white dark:text-white">
                {username}
              </h5>
            </div>

            <div className="flex flex-col justify-center text-center">
              <div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  {pascalCase(member.role)}
                </span>
              </div>
              <p className="mb-4 text-white my-5">
                {member.description || _("no_description")}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">Leer después</h3>
            </div>
          </div>
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">Mis favoritos</h3>
            </div>
          </div>
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-center mb-2">
              <h3 className="text-lg font-bold mb-2">Continuar leyendo</h3>
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
                              {_("seen")} {formatDate(history.lastReadAt)}
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
    </div>
  );
}
