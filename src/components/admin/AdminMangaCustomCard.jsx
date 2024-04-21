import React from 'react';
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

export function AdminMangaCustomCard({ mangaCustom, onClick }) {
    return (
        <Card className="w-56">
            <CardHeader floated={false} color="blue-gray" className="relative h-56">
                {mangaCustom.imageUrl
                    ? (
                        <img
                            src={mangaCustom.imageUrl || ""}
                            className='min-h-full object-cover'
                            decoding="async"
                            loading="lazy"
                            alt={mangaCustom.title || "Sin título"}
                        />
                    )
                    : (
                        <Typography variant="h5" color="blue-gray" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            Sin imagen
                        </Typography>
                    )
                }
            </CardHeader>
            <CardBody className='pt-2 pb-0'>
                <Typography variant="h5" color="blue-gray" className="mb-2">
                    {mangaCustom.title || ""}
                </Typography>
                <Typography>
                    {!mangaCustom.shortDescription && "Sin descripción corta"}
                    {mangaCustom.shortDescription &&
                        mangaCustom.shortDescription.length > 50
                        ? mangaCustom.shortDescription.substring(0, 50) + "..."
                        : mangaCustom.shortDescription
                    }
                </Typography>
            </CardBody>
            <CardFooter className="w-full p-0 pt-2 pb-2 flex justify-around mt-auto">
                <div>
                </div>
                <div>
                    <a href={`/admin/mangas/${mangaCustom.slug}`}>
                        <Button variant="text" className="px-2" size="sm">
                            Capítulos
                        </Button>
                    </a>
                    <Tooltip content="Editar">
                        <Button variant="text" className="px-2 ml-1" size="sm" onClick={() => onClick(mangaCustom)}>
                            <PencilIcon strokeWidth={2} className="h-5 w-5" />
                        </Button>
                    </Tooltip>
                </div>
            </CardFooter>
        </Card>
    );
}
