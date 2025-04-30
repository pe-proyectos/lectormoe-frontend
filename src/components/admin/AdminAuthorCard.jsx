import {
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";
import { getTranslator } from "../../util/translate";

export function AdminAuthorCard({ language, name, imageUrl, shortDescription }) {
    const _ = getTranslator(language);

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
                    {name || _("no_name")}
                </Typography>
                <Typography color="blue-gray" className="mb-2">
                    {shortDescription || _("no_short_description")}
                </Typography>
            </CardBody>
        </Card>
    );
}
