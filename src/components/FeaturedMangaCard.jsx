import {
    Typography,
    Tooltip,
    Chip,
} from "@material-tailwind/react";

export function FeaturedMangaCard({ manga, ...props }) {
    return (
        <div {...props}>
            <a href={manga?.slug ? `/manga/${manga?.slug}` : '#'}>
                <div className='relative w-full h-full group overflow-hidden rounded-md shadow-md'>
                    <img src={manga?.imageUrl} className='absolute inset-0 -translate-y-1/2 w-full blur-sm' />
                    <img src={manga?.imageUrl} className='absolute inset-0 h-full mx-auto object-cover' />
                    <div className="to-bg-black-10 absolute bottom-0 h-2/4 lg:h-3/4 w-full bg-gradient-to-t from-black/90 via-black/60 lg:via-black/80" />
                    <div className="absolute top-4 right-4 justify-end">
                        {/* if lastChapterAt was released in the last 3 days show a chip */}
                        <div className="flex flex-wrap gap-2">
                            {manga?.lastChapterAt && new Date(manga.lastChapterAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                                <a href={manga?.lastChapterNumbers?.[0] ? `/manga/${manga.slug}/chapters/${manga?.lastChapterNumbers?.[0]}` : `/manga/${manga.slug}`}>
                                    <Tooltip content={
                                        new Date(manga.lastChapterAt) > new Date().setHours(0, 0, 0, 0)
                                            ? `El capítulo ${manga?.lastChapterNumbers?.[0] || "mas reciente"} fue lanzado hoy`
                                            : `El capítulo ${manga?.lastChapterNumbers?.[0] || "mas reciente"} fue lanzado el ${new Date(manga.lastChapterAt).toLocaleDateString()}`
                                    }>
                                        <Chip variant="outlined" value="Nuevo Capítulo" className="backdrop-blur-sm bg-green-600 bg-opacity-60 text-white" />
                                    </Tooltip>
                                </a>
                            )}
                            <Chip
                                variant="filled"
                                value={
                                    `${manga?.views || 0} Vista${manga?.views === 1 ? '' : 's'}`
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