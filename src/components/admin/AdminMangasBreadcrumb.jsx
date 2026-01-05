import { Breadcrumbs } from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";
import { getOrgPath, getOrgSlugFromPath } from "../../util/get-org-path";

export function AdminMangasBreadcrumb({ language, organizationSlug }) {
  const _ = getTranslator(language);
  
  // Get organization slug from path if not provided
  const orgSlug = organizationSlug || getOrgSlugFromPath();

  return (
    <Breadcrumbs>
      <a href={getOrgPath("/admin/mangas", orgSlug)} className="opacity-60">
        {_("mangas")}
      </a>
      <a href={getOrgPath("/admin/mangas/profile/create", orgSlug)}>{_("create_profile")}</a>
    </Breadcrumbs>
  );
}
