import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import {
  TrashIcon,
  PencilIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import { getTranslator } from "../../util/translate";

export function AdminMangaCustomCard({ organization, mangaCustom, onClick }) {
  const _ = getTranslator(organization.language);

  return (
    <Card className="w-56">
      <CardHeader floated={false} color="blue-gray" className="relative h-56">
        {mangaCustom.imageUrl ? (
          <img
            src={mangaCustom.imageUrl || ""}
            className="min-h-full object-cover"
            decoding="async"
            loading="lazy"
            alt={mangaCustom.title || _("no_title")}
          />
        ) : (
          <Typography
            variant="h5"
            color="blue-gray"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            {_("no_image")}
          </Typography>
        )}
      </CardHeader>
      <CardBody className="pt-2 pb-0">
        <Typography variant="h5" color="blue-gray" className="mb-2">
          {mangaCustom.title || ""}
        </Typography>
        <Typography>
          {!mangaCustom.shortDescription && _("no_short_description")}
          {mangaCustom.shortDescription &&
          mangaCustom.shortDescription.length > 50
            ? mangaCustom.shortDescription.substring(0, 50) + "..."
            : mangaCustom.shortDescription}
        </Typography>
      </CardBody>
      <CardFooter className="w-full p-0 pt-2 pb-2 flex justify-around mt-auto">
        <div className="flex gap-2 items-center">
          <Tooltip content={_("views")}>
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
              />
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </Tooltip>
          <p>{mangaCustom.views}</p>
        </div>
        <div className="flex items-center">
          <a href={`/admin/mangas/${mangaCustom.slug}`}>
            <Button variant="text" className="px-2" size="sm">
              {_("chapters")}
            </Button>
          </a>
          <Tooltip content={_("edit")}>
            <Button
              variant="text"
              className="px-2 ml-1"
              size="sm"
              onClick={() => onClick(mangaCustom)}
            >
              <PencilIcon strokeWidth={2} className="h-5 w-5" />
            </Button>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
