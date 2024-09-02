import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Chip,
    Tooltip,
} from "@material-tailwind/react";
import { LazyImage } from "./LazyImage";
import { getTranslator } from "../util/translate";

export function MangaCard({ organization, manga }) {
    const _ = getTranslator(organization.language);

    if (!manga) {
        return (
            <Card
                shadow={false}
                className="relative grid h-[26rem] max-h-[26rem] w-[16rem] bg-gray-300 shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center animate-pulse"
            >
                <div className="font-semibold"></div>
            </Card>
        )
    }
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
        <Card
            shadow={false}
            className="relative grid h-[26rem] max-h-[26rem] w-[16rem] shadow-sm hover:shadow-md hover:shadow-black/5 transition-shadow duration-75 max-w-full group items-end justify-center overflow-hidden text-center"
        >
            <CardHeader
                floated={false}
                shadow={false}
                color="transparent"
                className="absolute inset-0 m-0 h-full w-full rounded-none bg-black"
            >
                <LazyImage
                    src={manga.imageUrl}
                    alt={manga.title}
                    decoding="async"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300 group-hover:filter group-hover:brightness-90 select-none"
                />
                {/* if lastChapterAt was released in the last 3 days show a chip */}
                <div className="absolute top-2 right-2">
                    {manga?.lastChapterAt && new Date(manga.lastChapterAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                        <Tooltip content={
                            new Date(manga.lastChapterAt) > new Date().setHours(0, 0, 0, 0)
                                ? (manga?.lastChapters?.[0]?.number ? `${_("the_chapter")} ${manga?.lastChapters?.[0]?.number} ${_("was_released_today")}` : _("most_recent_chapter_was_released_today"))
                                : (manga?.lastChapters?.[0]?.number ? `${_("the_chapter")} ${manga?.lastChapters?.[0]?.number} ${_("was_released_at")} ${new Date(manga.lastChapterAt).toLocaleDateString()}` : `${_("most_recent_chapter_was_released_at")} ${new Date(manga.lastChapterAt).toLocaleDateString()}`)
                        }>
                            <Chip
                                variant="outlined"
                                value={_("new_chapter")}
                                className="backdrop-blur-sm bg-green-600 bg-opacity-60 text-white cursor-pointer"
                                onClick={() => location.href = manga?.lastChapters?.[0] ? `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}` : `/manga/${manga.slug}`}
                            />
                        </Tooltip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="relative py-14 px-6 md:px-12">
                <figcaption className="absolute bottom-4 left-1/2 flex flex-col w-[12rem] -translate-x-1/2
        justify-between rounded-xl border border-white border-opacity-25 bg-white/70 py-1 px-2 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm"
                >
                    <div>
                        <Typography
                            as='a'
                            href={`/manga/${manga.slug}`}
                            color="blue-gray"
                            className="font-semibold hover:underline cursor-pointer"
                        >
                            {manga.title}
                        </Typography>
                    </div>
                    <div className='flex flex-wrap gap-2 justify-center'>
                        {manga?.lastChapters?.[0] && (
                            <div>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`}
                                    color="gray"
                                    className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer"
                                >
                                    {_("chapter")} {manga?.lastChapters?.[0]?.number}
                                </Typography>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}`}
                                    color="gray"
                                    className="font-normal text-blue-gray-800 text-xs hover:underline cursor-pointer"
                                >
                                    {formatDate(manga?.lastChapters?.[0]?.releasedAt)}
                                </Typography>
                            </div>
                        )}
                        {manga?.lastChapters?.[1] && (
                            <div>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`}
                                    color="gray"
                                    className="font-normal text-xs hover:underline cursor-pointer"
                                >
                                    {_("chapter")} {manga?.lastChapters?.[1]?.number}
                                </Typography>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapters?.[1]?.number}`}
                                    color="gray"
                                    className="font-normal text-xs hover:underline cursor-pointer"
                                >
                                    {formatDate(manga?.lastChapters?.[1]?.releasedAt)}
                                </Typography>
                            </div>
                        )}
                    </div>
                </figcaption>
            </CardBody>
        </Card>
    );
}