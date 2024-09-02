import { Breadcrumbs } from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";

export function AdminMangasBreadcrumb({ organization }) {
    const _ = getTranslator(organization.language);

    return (
        <Breadcrumbs>
            <a href="/admin/mangas" className="opacity-60">
                {_("mangas")}
            </a>
            <a href="/admin/mangas/profile/create">
                {_("create_profile")}
            </a>
        </Breadcrumbs>
    );
}
