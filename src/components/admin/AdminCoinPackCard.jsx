import React from 'react';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";

export function AdminCoinPackCard({ coinpack, onClick }) {
    return (
        <Card className="w-64 mt-6">
            <CardHeader color="blue" className="p-4">
                <Typography variant="h5" color="white">
                    {coinpack.name || "Sin nombre"}
                </Typography>
            </CardHeader>
            <CardBody>
                <Typography color="black" className="font-bold">
                    Descripción
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {coinpack.description || "Sin descripción"}
                </Typography>
                <Typography color="black" className="font-bold">
                    Precio sin descuento
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${coinpack.priceWithoutDiscount.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    Precio con descuento
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${coinpack.price.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    Monedas
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {coinpack.coins}
                </Typography>
                <Typography color="black" className="font-bold">
                    Estado
                </Typography>
                <Typography color={coinpack.active ? "green" : "red"}>
                    {coinpack.active ? "Activo" : "Inactivo"}
                </Typography>
                <Button color="blue" className="mt-4" onClick={() => onClick(coinpack)}>
                    Editar
                </Button>
            </CardBody>
        </Card>
    );
}
