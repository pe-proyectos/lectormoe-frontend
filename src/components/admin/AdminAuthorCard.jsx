import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
} from "@material-tailwind/react";

export function AdminAuthorCard({ name, imageUrl, shortDescription, description }) {
    return (
        <Card className="w-56">
            <CardHeader floated={false} color="blue-gray" className="relative h-56">
                <img
                    src={imageUrl}
                    className='min-h-full object-cover'
                    decoding="async"
                    loading="lazy"
                    alt={name}
                />
            </CardHeader>
            <CardBody>
                <Typography variant="h5" color="blue-gray" className="mb-2">
                    {name || "Sin nombre"}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {shortDescription || "Sin descripción corta"}
                </Typography>
            </CardBody>
        </Card>
    );
}
