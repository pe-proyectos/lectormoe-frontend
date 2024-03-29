import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Chip,
    Tooltip,
} from "@material-tailwind/react";

export function MangaCard({ manga }) {
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
                <img
                    src={manga.imageUrl}
                    alt={manga.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* if lastChapterAt was released in the last 3 days show a chip */}
                {manga?.lastChapterAt && new Date(manga.lastChapterAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                    <div className="absolute top-2 right-2">
                        <a href={manga?.lastChapterNumbers?.[0] ? `/manga/${manga.slug}/chapters/${manga?.lastChapterNumbers?.[0]}` : `/manga/${manga.slug}`}>
                            <Tooltip content={
                                new Date(manga.lastChapterAt) > new Date().setHours(0, 0, 0, 0)
                                    ? `El capítulo ${manga?.lastChapterNumbers?.[0] || "mas reciente"} fue lanzado hoy`
                                    : `El capítulo ${manga?.lastChapterNumbers?.[0] || "mas reciente"} fue lanzado el ${new Date(manga.lastChapterAt).toLocaleDateString()}`
                            }>
                                <Chip color="green" value="Nuevo Capítulo" />
                            </Tooltip>
                        </a>
                    </div>
                )}
            </CardHeader>
            <CardBody className="relative py-14 px-6 md:px-12">
                <figcaption className="absolute bottom-8 left-1/2 flex flex-col w-[12rem] -translate-x-1/2
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
                        {manga?.lastChapterNumbers?.[0] && (
                            <div>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapterNumbers?.[0]}`}
                                    color="gray"
                                    className="font-normal text-xs hover:underline cursor-pointer"
                                >
                                    Cápitulo {manga?.lastChapterNumbers?.[0]}
                                </Typography>
                            </div>
                        )}
                        {manga?.lastChapterNumbers?.[1] && (
                            <div>
                                <Typography
                                    as='a'
                                    href={`/manga/${manga.slug}/chapters/${manga?.lastChapterNumbers?.[0]}`}
                                    color="gray"
                                    className="font-normal text-xs hover:underline cursor-pointer"
                                >
                                    Cápitulo {manga?.lastChapterNumbers?.[1]}
                                </Typography>
                            </div>
                        )}
                    </div>
                </figcaption>
            </CardBody>
        </Card>
    );
}