import React from "react";
import {
  Navbar,
  Collapse,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  Input,
  MenuItem,
} from "@material-tailwind/react";
import { BellIcon, UserIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";
import { callAPI } from "../util/callApi";

export function StickyNavbar({
  organization,
  username,
  userSlug,
  user,
  staticNavbar,
  language,
}) {
  const _ = getTranslator(language);

  const [openNav, setOpenNav] = React.useState(false);
  const [search, setSearch] = React.useState("");
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
        window.location.href = "/logout?redirect=" + window.location.href;
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const navOptions = [];

  if (organization.enableSubscriptionSection) {
    navOptions.push({
      name: _("subscription_plans"),
      href: "/subscriptions",
    });
  }

  if (organization.enableMangaSection) {
    navOptions.push({
      name: _("mangas"),
      href: "/search?type=manga",
    });
  }

  if (organization.enableManhuaSection) {
    navOptions.push({
      name: _("manhuas"),
      href: "/search?type=manhua",
    });
  }

  if (organization.enableManhwaSection) {
    navOptions.push({
      name: _("manhwas"),
      href: "/search?type=manhwa",
    });
  }

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {navOptions.map((option) => (
        <a
          href={navOptions.length > 1 ? option.href : "/search"}
          key={option.name}
          className="flex items-center"
        >
          <Typography
            as="li"
            variant="small"
            color="white"
            className="p-1 font-normal"
          >
            {option.name}
          </Typography>
        </a>
      ))}
    </ul>
  );
  return (
    <Navbar
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
          <Typography
            as="a"
            href="/"
            className="mr-4 cursor-pointer py-1.5 font-medium"
          >
            {organization?.title || ""}
          </Typography>
        )}
        <div className="flex items-center gap-4">
          <div className="mr-4 hidden lg:block">{navList}</div>
          <div
            className={
              location.pathname === "/search"
                ? "relative w-full gap-2 md:w-max hidden"
                : "relative w-full gap-2 md:w-max hidden md:flex"
            }
          >
            <Input
              type="search"
              color="white"
              label={_("search_manga")}
              className="pr-20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  location.href = `/search?q=${search}`;
                }
              }}
              containerProps={{
                className: "min-w-[288px]",
              }}
            />
            <Button
              size="sm"
              variant="gradient"
              className="!absolute right-1 top-1 rounded"
              onClick={() => {
                location.href = `/search?q=${search}`;
              }}
            >
              {_("search")}
            </Button>
          </div>
          <div className="flex items-center gap-x-1">
            {isDecember && (
              <IconButton
                variant="text"
                color="white"
                onClick={() => {
                  setSnowActive(!snowActive);
                  localStorage.setItem("snowActive", !snowActive);
                  if (snowActive) {
                    window.snow.hide();
                  } else {
                    window.snow.show();
                  }
                }}
              >
                <SparklesIcon className="h-4 w-4" /> {/* Added SnowflakeIcon */}
              </IconButton>
            )}
            <IconButton variant="text" color="white">
              <BellIcon className="h-4 w-4" />
            </IconButton>
            <Menu>
              <MenuHandler>
                <IconButton variant="text" color="white">
                  <Typography variant="small" className="font-normal">
                    {language?.toUpperCase()}
                  </Typography>
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem
                  className={language === "en" ? "bg-gray-500 text-white" : ""}
                  onClick={() => {
                    cookieStore.set("language", "en").finally(() => {
                      window.location.href = `?lang=en`;
                    });
                  }}
                >
                  {_("english")}
                </MenuItem>
                <MenuItem
                  className={language === "es" ? "bg-gray-500 text-white" : ""}
                  onClick={() => {
                    cookieStore.set("language", "es").finally(() => {
                      window.location.href = `?lang=es`;
                    });
                  }}
                >
                  {_("spanish")}
                </MenuItem>
              </MenuList>
            </Menu>
            <div>
              {username ? (
                <Menu>
                  <MenuHandler>
                    <IconButton variant="text" color="white">
                      <UserIcon className="h-4 w-4" />
                    </IconButton>
                  </MenuHandler>
                  <MenuList>
                    <MenuItem disabled>{username}</MenuItem>
                    {user?.subscriptions.length > 0 && (
                      <a href="/subscriptions">
                        <MenuItem disabled>
                          {user.subscriptions[0].subscriptionPlan.name}
                        </MenuItem>
                      </a>
                    )}
                    {
                      <a href={`/profile/${userSlug}`}>
                        <MenuItem>{_("my_profile")}</MenuItem>
                      </a>
                    }
                    {user?.canSeeAdminPanel === true && (
                      <a href="/admin/mangas">
                        <MenuItem>{_("admin")}</MenuItem>
                      </a>
                    )}
                    <div onClick={doLogout}>
                      <MenuItem>{_("logout")}</MenuItem>
                    </div>
                  </MenuList>
                </Menu>
              ) : (
                <>
                  <a href={`/login?redirect=${location.pathname}`}>
                    <Button
                      variant="text"
                      color="white"
                      size="sm"
                      className="hidden lg:inline-block mx-1"
                    >
                      <span>{_("login")}</span>
                    </Button>
                  </a>
                  <a href={`/register?redirect=${location.pathname}`}>
                    <Button
                      variant="gradient"
                      size="sm"
                      className="hidden lg:inline-block mx-1"
                    >
                      <span>{_("register")}</span>
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
          <IconButton
            variant="text"
            className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
            ripple={false}
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
          </IconButton>
        </div>
      </div>
      <Collapse open={openNav}>
        {navList}
        <div className="flex items-center gap-x-1 pb-4 justify-center">
          <div
            className={
              location.pathname === "/search"
                ? "relative w-full gap-2 md:w-max hidden"
                : "relative w-full gap-2 md:w-max"
            }
          >
            <Input
              type="search"
              color="white"
              label={_("search_manga")}
              className="pr-20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerProps={{
                className: "min-w-[288px]",
              }}
            />
            <Button
              size="sm"
              variant="gradient"
              className="!absolute right-1 top-1 rounded"
              onClick={() => {
                location.href = `/search?q=${search}`;
              }}
            >
              {_("search")}
            </Button>
          </div>
        </div>
        {!username && (
          <div className="flex items-center justify-center gap-x-1">
            <a href="/login">
              <Button fullWidth variant="text" color="white" size="sm">
                <span>{_("login")}</span>
              </Button>
            </a>
            <a href="/register">
              <Button fullWidth variant="gradient" size="sm" className="">
                <span>{_("register")}</span>
              </Button>
            </a>
          </div>
        )}
      </Collapse>
    </Navbar>
  );
}
