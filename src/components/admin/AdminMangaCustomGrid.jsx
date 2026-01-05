import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Alert,
  Spinner,
  Typography,
  IconButton,
  Button,
  Input,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { AdminMangaCustomCard } from "./AdminMangaCustomCard";
import { AdminMangaCustomDialog } from "./AdminMangaCustomDialog";
import { callAPI } from "../../util/callApi";
import { getTranslator } from "../../util/translate";
import { getOrgPath, getOrgSlugFromPath } from "../../util/get-org-path";

export function AdminMangaCustomGrid({ organization, language, organizationSlug }) {
  const _ = getTranslator(language);
  
  // Get organization slug from path if not provided
  const orgSlug = organizationSlug || getOrgSlugFromPath();

  const [loading, setLoading] = useState(true);
  const [mangaList, setMangaList] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [selectedManga, setSelectedManga] = useState(null);
  const [isCreateMangaCustomDialogOpen, setIsCreateMangaCustomDialogOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    refreshMangaProfile();
    refreshSubscriptionPlans();
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    if (!isCreateMangaCustomDialogOpen) refreshMangaProfile();
  }, [isCreateMangaCustomDialogOpen]);

    const refreshMangaProfile = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      order: "latest",
      limit: "20",
    });
    
    if (debouncedSearchTerm.trim()) {
      query.append("search", debouncedSearchTerm.trim());
    }
    
    callAPI(`/api/manga-custom?${query}`)
      .then((result) => {
        // callAPI ya extrae el data, pero puede devolver { data, maxPage, total }
        if (result && Array.isArray(result.data)) {
          setMangaList(result.data);
          setMaxPage(result.maxPage || 1);
        } else if (Array.isArray(result)) {
          setMangaList(result);
          setMaxPage(1);
        }
      })
      .catch((error) => toast.error(error?.message))
      .finally(() => setLoading(false));
  }, [page, debouncedSearchTerm]);

  const refreshSubscriptionPlans = () => {
    return callAPI(`/api/subscription-plan`)
      .then((result) => {
        // callAPI ya extrae el data
        if (result && Array.isArray(result.data)) {
          setSubscriptionPlans(result.data);
        } else if (Array.isArray(result)) {
          setSubscriptionPlans(result);
        }
      })
      .catch((error) =>
        toast.error(error?.message || _("error_loading_subscription_plans"))
      );
  };

  const handleCardClick = (mangaCustom) => {
    setSelectedManga(mangaCustom);
    setIsCreateMangaCustomDialogOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm); // Force immediate search on submit
  };

  return (
    <div className="w-full my-4">
      <AdminMangaCustomDialog
        organization={organization}
        language={language}
        open={isCreateMangaCustomDialogOpen}
        setOpen={setIsCreateMangaCustomDialogOpen}
        mangaCustom={selectedManga}
        setMangaCustom={setSelectedManga}
        subscriptionPlans={subscriptionPlans}
      />
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between sm:m-4">
        <Button
          variant="outlined"
          className="flex items-center gap-3 h-full"
          onClick={() => setIsCreateMangaCustomDialogOpen(true)}
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
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          {_("add_manga")}
        </Button>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Input
            type="text"
            placeholder={_("search_mangas")}
            value={searchTerm}
            onChange={handleSearchChange}
            className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
            labelProps={{
              className: "hidden",
            }}
            containerProps={{ className: "min-w-[100px]" }}
            crossOrigin={undefined}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
      {!loading && mangaList.length > 0 && (
        <div className="w-full flex flex-wrap items-center justify-around gap-2 sm:gap-4 select-none my-4">
          <div className="flex items-center gap-8">
            <IconButton
              size="sm"
              variant="outlined"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
            <Typography color="gray" className="font-normal">
              {_("page")} <strong className="text-gray-900">{page}</strong>{" "}
              {_("of")} <strong className="text-gray-900">{maxPage}</strong>
            </Typography>
            <IconButton
              size="sm"
              variant="outlined"
              onClick={() => setPage((prev) => Math.min(prev + 1, 10))}
              disabled={page === maxPage}
            >
              <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      )}
      <div className="max-w-lg">
        {loading && <Spinner className="m-4 w-full" />}
        {!loading && mangaList.length === 0 && (
          <Alert>
            {_("no_mangas_available")},{" "}
            <a
              href={getOrgPath("/admin/mangas/create", orgSlug)}
              className="hover:text-light-blue-200"
            >
              {_("create_one")}
            </a>{" "}
            {_("to_start")}.
          </Alert>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {mangaList.map((mangaCustom) => (
          <AdminMangaCustomCard
            language={language}
            key={mangaCustom.id}
            mangaCustom={mangaCustom}
            onClick={() => handleCardClick(mangaCustom)}
            organizationSlug={orgSlug}
          />
        ))}
      </div>
    </div>
  );
}
