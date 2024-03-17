import { Card, Typography } from "@material-tailwind/react";

const TABLE_HEAD = ["Miniatura", "Número", "Título", "Fecha de creación", "Última actualización", "Acciones"];

export function AdminChaptersTable({ mangaSlug, chapters }) {
    return (
        <Card className="h-full w-full overflow-scroll">
            <table className="w-full min-w-max table-auto text-left">
                <thead>
                    <tr>
                        {TABLE_HEAD.map((head) => (
                            <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-normal leading-none opacity-70"
                                >
                                    {head}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {chapters.map((chapter, index) => (
                        <tr key={chapter.number} className="even:bg-blue-gray-50/50">
                            <td className="p-4">
                            <figure className="self-center">
                                    <img
                                        src={chapter.imageUrl}
                                        alt={chapter.title || chapter.number}
                                        className="min-w-32 max-w-32 min-h-20 max-h-20 object-cover"
                                        draggable="false"
                                    />
                                </figure>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {chapter.number}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {chapter.title}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {new Date(chapter.createdAt).toLocaleDateString()}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {new Date(chapter.updatedAt).toLocaleDateString()}
                                </Typography>
                            </td>
                            <td className="p-4">
                                <Typography as="a" href={`/admin/mangas/${mangaSlug}/chapters/${chapter.number}`} variant="small" color="blue-gray" className="font-medium inline-block mr-1">
                                    Editar
                                </Typography>
                                <Typography as="a" href={`/admin/mangas/${mangaSlug}/chapters/${chapter.number}/pages`} variant="small" color="blue-gray" className="font-medium inline-block ml-1">
                                    Modificar páginas
                                </Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
