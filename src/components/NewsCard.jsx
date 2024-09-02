import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Tooltip,
    Avatar,
    Button,
} from "@material-tailwind/react";
import { getTranslator } from "../util/translate";

export function NewsCard({ organization, news, props }) {
    const _ = getTranslator(organization.language);


    const formatDate = (date) => {
        if (!date) return '';
        const dt = new Date(date);
        const diff = new Date() - dt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        if (organization.language === 'en') {
            if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
            if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
            return 'today';
        } else if (organization.language === 'pt') {
            if (months > 0) return `há ${months} mes${months > 1 ? 'es' : ''}`;
            if (weeks > 0) return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
            if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
            if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
            if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
            if (seconds > 0) return `há ${seconds} segundo${seconds > 1 ? 's' : ''}`;
            return 'hoje';
        }
        if (months > 0) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        if (seconds > 0) return `hace ${seconds} segundo${seconds > 1 ? 's' : ''}`;
        return 'hoy';
    }

    return (
        <Card className="w-full bg-gray-900 sm:max-w-[16rem] lg:max-w-[26rem] shadow-sm overflow-hidden" {...props}>
            {news?.imageUrl && (
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 rounded-none"
                >
                    <img
                        src={news?.imageUrl}
                        className='h-40 object-cover w-full'
                        alt={news?.title}
                        decoding="async"
                        loading="lazy"
                    />
                </CardHeader>
            )}
            <CardBody className='px-4 pt-4 pb-1'>
                <Typography variant="h6" color="white">
                    {news?.title}
                </Typography>
                <Typography variant="lead" className="mt-1 font-normal text-xs text-gray-200">
                    {news?.description}
                </Typography>
            </CardBody>
            <CardFooter className="flex items-center justify-between pt-1 pb-4">
                <Typography className="font-normal text-xs">{formatDate(news?.createdAt)} - {new Date(news?.createdAt).toLocaleDateString()}</Typography>
                <Button
                    variant="text"
                    color="white"
                    size="sm"
                    onClick={() => location.href = `/news/${news?.slug}`}
                >
                    Leer más
                </Button>
            </CardFooter>
        </Card>
    );
}