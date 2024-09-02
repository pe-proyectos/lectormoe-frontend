import React from 'react';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";

export function AdminCoinPackCard({ organization, coinpack, onClick }) {
    const _ = getTranslator(organization.language);

    return (
        <Card className="w-64 mt-6">
            <CardHeader color="blue" className="p-4">
                <Typography variant="h5" color="white">
                    {coinpack.name || _("no_name")}
                </Typography>
            </CardHeader>
            <CardBody>
                <Typography color="black" className="font-bold">
                    {_("description")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {coinpack.description || _("no_description")}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("full_price")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${coinpack.priceWithoutDiscount.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("discount_price")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    ${coinpack.price.toFixed(2)}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("coins")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {coinpack.coins}
                </Typography>
                <Typography color="black" className="font-bold">
                    {_("status")}
                </Typography>
                <Typography color={coinpack.active ? "green" : "red"}>
                    {coinpack.active ? _("active") : _("inactive")}
                </Typography>
                <Button color="blue" className="mt-4" onClick={() => onClick(coinpack)}>
                    {_("edit")}
                </Button>
            </CardBody>
        </Card>
    );
}
