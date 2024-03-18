import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
} from "@material-tailwind/react";

export function AdminMangaCustomCard({ slug, imageUrl, title, description }) {
    return (
        <Card className="w-96">
            <CardHeader floated={false} color="blue-gray" className="relative h-56">
                <img
                    src={imageUrl || ""}
                    alt="card-image"
                />
            </CardHeader>
            <CardBody>
                <Typography variant="h5" color="blue-gray" className="mb-2">
                    {title || ""}
                </Typography>
                <Typography>
                    {description || ""}
                </Typography>
            </CardBody>
            <CardFooter className="pt-0 w-full flex justify-end">
                <a href={`/admin/mangas/${slug}`} className='mx-1'>
                    <Button variant="text">Ver detalles</Button>
                </a>
                <a href={`/admin/mangas/${slug}/chapters/create`} className='mx-1'>
                    <Button variant="outlined">Publicar capítulo</Button>
                </a>
            </CardFooter>
        </Card>
    );
}
