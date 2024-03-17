import { Breadcrumbs } from "@material-tailwind/react";

export function AdminMangasBreadcrumb() {
    return (
        <Breadcrumbs>
            <a href="/admin/mangas" className="opacity-60">
                Mangas
            </a>
            <a href="/admin/mangas/profile/create">
                Crear perfil
            </a>
        </Breadcrumbs>
    );
}
