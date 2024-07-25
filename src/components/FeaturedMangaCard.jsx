import {
    Typography,
    Tooltip,
    Chip,
} from "@material-tailwind/react";
import { LazyImage } from "./LazyImage";

export function FeaturedMangaCard({ manga, ...props }) {
    if (!manga) {
        return (
            <div {...props}>
                <a href={manga?.slug ? `/manga/${manga?.slug}` : '#'}>
                    <div
                        className="relative w-full h-full bg-gray-900 group overflow-hidden rounded-md shadow-md hover:scale-[101%] transition-transform duration-300"
                    >
                    </div>
                </a>
            </div>
        );
    }
    return (
        <div {...props}>
            <a href={manga?.slug ? `/manga/${manga?.slug}` : '#'}>
                <div className='relative w-full h-full group overflow-hidden rounded-md shadow-md hover:scale-[101%] transition-transform duration-300'>
                    {manga?.bannerUrl
                        ? (
                            <LazyImage
                                src={manga?.bannerUrl}
                                alt={manga?.title}
                                decoding="async"
                                loading="lazy"
                                className='absolute inset-0 w-full min-h-full min-w-full max-h-full mx-auto object-cover duration-300 group-hover:scale-[102%] transition-transform'
                            />
                        )
                        : (
                            <LazyImage
                                src={manga?.imageUrl}
                                alt={manga?.title}
                                decoding="async"
                                loading="lazy"
                                className='absolute inset-0 w-full mx-auto object-cover duration-300 top-1/2 -translate-y-1/2 group-hover:scale-[102%] transition-transform'
                            />
                        )}
                    <div className="to-bg-black-10 absolute bottom-0 h-2/4 lg:h-3/4 w-full bg-gradient-to-t from-black/90 via-black/60 lg:via-black/80 blur-sm" />
                    <div className="absolute top-4 right-4 justify-end">
                        {/* if lastChapterAt was released in the last 3 days show a chip */}
                        <div className="flex flex-wrap gap-2">
                            {manga?.lastChapterAt && new Date(manga.lastChapterAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                                <Tooltip content={
                                    new Date(manga.lastChapterAt) > new Date().setHours(0, 0, 0, 0)
                                        ? `El capítulo ${manga?.lastChapters?.[0]?.number || "mas reciente"} fue lanzado hoy`
                                        : `El capítulo ${manga?.lastChapters?.[0]?.number || "mas reciente"} fue lanzado el ${new Date(manga.lastChapterAt).toLocaleDateString()}`
                                }>
                                    <Chip
                                        variant="outlined"
                                        value="Nuevo Capítulo"
                                        className="backdrop-blur-sm bg-green-600 bg-opacity-60 text-white cursor-pointer"
                                        onClick={() => location.href = manga?.lastChapters?.[0] ? `/manga/${manga.slug}/chapters/${manga?.lastChapters?.[0]?.number}` : `/manga/${manga.slug}`}
                                    />
                                </Tooltip>
                            )}
                            <Chip
                                variant="filled"
                                value={
                                    `${manga?.views || 0} Lector${manga?.views === 1 ? '' : 'es'}`
                                }
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                        <Typography
                            color="white"
                            className="font-semibold text-4xl"
                        >
                            {manga?.title || ""}
                        </Typography>
                        <Typography
                            color="white"
                            className="font-normal text-sm hidden lg:block"
                        >
                            {manga?.shortDescription || ""}
                        </Typography>
                    </div>
                </div>
            </a>
        </div>
    );
}