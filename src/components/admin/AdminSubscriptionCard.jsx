import React from 'react';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";

export function AdminSubscriptionCard({ subscription, onClick }) {
    return (
        <Card className="w-64 mt-6">
            <CardHeader color="blue" className="p-4">
                <Typography variant="h5" color="white">
                    {subscription.title || "Sin título"}
                </Typography>
            </CardHeader>
            <CardBody>
                <Typography color="black" className="font-bold">
                    Descripción
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscription.description || "Sin descripción"}
                </Typography>
                <Typography color="black" className="font-bold">
                    Beneficios
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscription.benefits || "Sin beneficios"}
                </Typography>
                <Typography color="black" className="font-bold">
                    Precio mensual
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${subscription.monthlyPrice.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    Precio anual
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${subscription.yearlyPrice.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    Horas de anticipación
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {subscription.readAnticipationHours} horas
                </Typography>
                <Typography color="black" className="font-bold">
                    Estado
                </Typography>
                <Typography color={subscription.active ? "green" : "red"}>
                    {subscription.active ? "Activo" : "Inactivo"}
                </Typography>
                <Button color="blue" className="mt-4" onClick={() => onClick(subscription)}>
                    Editar
                </Button>
            </CardBody>
        </Card>
    );
}
