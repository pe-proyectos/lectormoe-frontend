import React from "react";
import "cookie-store";
import { BellIcon, UserIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { callAPI } from "../util/callApi";
import { getOrgPath, getOrgSlugFromPath } from "../util/get-org-path";

export function StickyNavbar({
  organization,
  username,
  userSlug,
  user,
  staticNavbar,
  language,
  organizationSlug,
}) {
  const _ = getTranslator(language);
  
  // Get organization slug from path if not provided
  const orgSlug = organizationSlug || getOrgSlugFromPath();

  const [openNav, setOpenNav] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [openLanguageMenu, setOpenLanguageMenu] = React.useState(false);
  const [openUserMenu, setOpenUserMenu] = React.useState(false);
  const [snowActive, setSnowActive] = React.useState(
    () => localStorage.getItem("snowActive") !== "false"
  );

  const isDecember = new Date().getMonth() === 11;

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false)
    );
  }, []);

  const doLogout = async () => {
    callAPI("/api/auth/logout")
      .then(() => {
        window.location.href = getOrgPath("/logout?redirect=" + window.location.href, orgSlug);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const navOptions = [];

  if (organization.enableSubscriptionSection) {
    navOptions.push({
      name: _("subscription_plans"),
      href: getOrgPath("/subscriptions", orgSlug),
    });
  }

  if (organization.enableMangaSection) {
    navOptions.push({
      name: _("mangas"),
      href: getOrgPath("/search?type=manga", orgSlug),
    });
  }

  if (organization.enableManhuaSection) {
    navOptions.push({
      name: _("manhuas"),
      href: getOrgPath("/search?type=manhua", orgSlug),
    });
  }

  if (organization.enableManhwaSection) {
    navOptions.push({
      name: _("manhwas"),
      href: getOrgPath("/search?type=manhwa", orgSlug),
    });
  }

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {navOptions.map((option) => (
        <a
          href={navOptions.length > 1 ? option.href : getOrgPath("/search", orgSlug)}
          key={option.name}
          className="flex items-center"
        >
          <li className="p-1 font-normal text-white text-sm">
            {option.name}
          </li>
        </a>
      ))}
    </ul>
  );
  return (
    <nav
      id="main-navbar"
      className={
        "top-0 z-10 h-max max-w-full bg-black border-none rounded-none px-4 py-2 lg:px-8 lg:py-4 " +
        (staticNavbar ? "" : "sticky")
      }
    >
      <div className="flex items-center justify-between">
        {organization?.logoUrl && (
          <a href="/">
            <LazyImage
              src={organization?.logoUrl}
              alt={organization?.title}
              decoding="async"
              loading="lazy"
              className="max-h-8 scale-[110%] hover:scale-[105%] transition-transform"
            />
          </a>
        )}
        {!organization?.logoUrl && (
          <a
            href="/"
            className="mr-4 cursor-pointer py-1.5 font-medium text-white"
          >
            {organization?.title || ""}
          </a>
        )}
        <div className="flex items-center gap-4">
          <div className="mr-4 hidden lg:block">{navList}</div>
          <div
            className={
              location.pathname === "/search"
                ? "relative w-full gap-2 md:w-max hidden"
                : "relative w-full gap-2 md:w-max hidden md:flex min-w-[288px]"
            }
          >
            <input
              type="search"
              placeholder={_("search_manga")}
              className="pr-20 bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[288px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  location.href = getOrgPath(`/search?q=${search}`, orgSlug);
                }
              }}
            />
            <button
              className="absolute right-1 top-1 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
              onClick={() => {
                location.href = `/search?q=${search}`;
              }}
            >
              {_("search")}
            </button>
          </div>
          <div className="flex items-center gap-x-1">
            {isDecember && (
              <button
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  setSnowActive(!snowActive);
                  localStorage.setItem("snowActive", String(!snowActive));
                  
                  // window.snow y Snowflakes se cargan dinámicamente
                  // @ts-ignore
                  const win = window;
                  
                  // Inicializar window.snow si no existe pero Snowflakes está disponible
                  // @ts-ignore
                  if (!win.snow && typeof win.Snowflakes !== 'undefined') {
                    // @ts-ignore
                    win.snow = new win.Snowflakes({
                      color: "#e8f4f7"
                    });
                  }
                  
                  // @ts-ignore
                  if (win.snow) {
                    if (snowActive) {
                      // @ts-ignore
                      win.snow.hide();
                    } else {
                      // @ts-ignore
                      win.snow.show();
                    }
                  }
                }}
              >
                <SparklesIcon className="h-4 w-4" />
              </button>
            )}
            <button className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <BellIcon className="h-4 w-4" />
            </button>
            <div className="relative">
              <button 
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setOpenLanguageMenu(!openLanguageMenu)}
                onBlur={() => setTimeout(() => setOpenLanguageMenu(false), 200)}
              >
                <span className="font-normal text-sm">
                  {language?.toUpperCase()}
                </span>
              </button>
              {openLanguageMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-lg shadow-lg z-50">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-t-lg ${language === "en" ? "bg-gray-500 text-white" : "text-white"}`}
                    onClick={() => {
                      cookieStore.set("language", "en").finally(() => {
                        window.location.href = `?lang=en`;
                      });
                    }}
                  >
                    {_("english")}
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-b-lg ${language === "es" ? "bg-gray-500 text-white" : "text-white"}`}
                    onClick={() => {
                      cookieStore.set("language", "es").finally(() => {
                        window.location.href = `?lang=es`;
                      });
                    }}
                  >
                    {_("spanish")}
                  </button>
                </div>
              )}
            </div>
            <div>
              {username ? (
                <div className="relative">
                  <button 
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setOpenUserMenu(!openUserMenu)}
                    onBlur={() => setTimeout(() => setOpenUserMenu(false), 200)}
                  >
                    <UserIcon className="h-4 w-4" />
                  </button>
                  {openUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
                      <div className="px-4 py-2 text-white text-sm border-b border-gray-700 cursor-default">{username}</div>
                      {user?.subscriptions.length > 0 && (
                        <a href={getOrgPath("/subscriptions", orgSlug)} className="block">
                          <div className="px-4 py-2 text-white text-sm border-b border-gray-700 cursor-default">
                            {user.subscriptions[0].subscriptionPlan.name}
                          </div>
                        </a>
                      )}
                      <a href={`/profile/${userSlug}`} className="block">
                        <div className="px-4 py-2 text-white text-sm hover:bg-gray-700 cursor-pointer">
                          {_("my_profile")}
                        </div>
                      </a>
                      {user?.permissions?.find(
                        (permission) => permission.organizationId === organization?.id
                      )?.canSeeAdminPanel === true && (
                        <a href={getOrgPath("/admin/mangas", orgSlug)} className="block">
                          <div className="px-4 py-2 text-white text-sm hover:bg-gray-700 cursor-pointer">
                            {_("admin")}
                          </div>
                        </a>
                      )}
                      <div onClick={doLogout} className="cursor-pointer">
                        <div className="px-4 py-2 text-white text-sm hover:bg-gray-700 rounded-b-lg">
                          {_("logout")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <a href={getOrgPath(`/login?redirect=${location.pathname}`, orgSlug)} className="hidden lg:inline-block mx-1">
                    <button className="px-4 py-2 text-white text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                      {_("login")}
                    </button>
                  </a>
                  <a href={getOrgPath(`/register?redirect=${location.pathname}`, orgSlug)} className="hidden lg:inline-block mx-1">
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                      {_("register")}
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>
          <button
            className="ml-auto h-6 w-6 text-white hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      {openNav && (
        <div className="lg:hidden">
        {navList}
        <div className="flex items-center gap-x-1 pb-4 justify-center">
          <div
            className={
              location.pathname === "/search"
                ? "relative w-full gap-2 md:w-max hidden"
                : "relative w-full gap-2 md:w-max min-w-[288px]"
            }
          >
            <input
              type="search"
              placeholder={_("search_manga")}
              className="pr-20 bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="absolute right-1 top-1 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
              onClick={() => {
                location.href = getOrgPath(`/search?q=${search}`, orgSlug);
              }}
            >
              {_("search")}
            </button>
          </div>
        </div>
        {!username && (
          <div className="flex items-center justify-center gap-x-1">
            <a href={getOrgPath("/login", orgSlug)} className="w-full">
              <button className="w-full px-4 py-2 text-white text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                {_("login")}
              </button>
            </a>
            <a href={getOrgPath("/register", orgSlug)} className="w-full">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                {_("register")}
              </button>
            </a>
          </div>
        )}
        </div>
      )}
    </nav>
  );
}
