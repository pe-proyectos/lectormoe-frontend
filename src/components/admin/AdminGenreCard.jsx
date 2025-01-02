import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
} from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";

export function AdminGenreCard({ organization, genre, handleEdit, handleDelete }) {
    const _ = getTranslator(organization.language);

    return (
        <Card className="w-56">
            <CardBody>
                <Typography variant="h5" color="blue-gray" className="mb-2">
                    {genre.name}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {genre.description || _("no_description")}
                </Typography>
                <Typography color="gray" variant="small" className="mb-2">
                    {genre._count.mangasCustom} {_("mangas")}
                </Typography>
            </CardBody>
            <CardFooter className="pt-0">
                <div className="flex justify-between gap-2">
                    <Button variant="outlined" size="sm" color="blue" onClick={() => handleEdit(genre)}>Editar</Button>
                    <Button variant="outlined" size="sm" color="red" onClick={() => handleDelete(genre)}>Eliminar</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
