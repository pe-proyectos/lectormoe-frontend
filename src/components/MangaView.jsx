import { useEffect, useState } from "react";
import {
    Typography,
    Tooltip,
    Chip,
    Button,
    Accordion,
    AccordionHeader,
    AccordionBody,
} from "@material-tailwind/react";
import StickyBox from "react-sticky-box";
import { callAPI } from "../util/callApi";

export function MangaView({ manga, organization, logged }) {
    const [chapterGroups, setChapterGroups] = useState({});
    const [selectedChapterGroup, setSelectedChapterGroup] = useState('');
    const [openCommentsAccordion, setOpenCommentsAccordion] = useState(true);
    useEffect(() => {
        callAPI(`/api/views/manga-custom/${manga.slug}`, {
            includeIp: true,
        }).catch((error) => { });
    }, []);

    const listFormatter = new Intl.ListFormat('es', {
        style: 'long',
        type: 'conjunction',
    });

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
        if (months > 0) return `Publicado hace ${months} Mes${months > 1 ? 'es' : ''}`;
        if (weeks > 0) return `Publicado hace ${weeks} Semana${weeks > 1 ? 's' : ''}`;
        if (days > 0) return `Publicado hace ${days} Día${days > 1 ? 's' : ''}`;
        return 'Publicado hoy';
    }

    useEffect(() => {
        // Disqus
        if (organization?.enableDisqusIntegration) {
            window.disqus_config = function () {
                this.page.url = `https://${organization?.domain}/manga/${manga.slug}`;
                this.page.identifier = manga.slug;
                this.page.title = manga.title;
            };
            const script = document.createElement('script');
            script.src = organization?.disqusEmbedUrl || 'https://lat-manga.disqus.com/embed.js';
            script.setAttribute('data-timestamp', Date.now().toString());
            script.setAttribute('data-title', Date.now().toString());
            (document.head || document.body).appendChild(script);
        }
        // Chapters Navigation
        const highestChapterNumber = manga?.chapters?.reduce((prev, current) => (prev.number > current.number) ? prev : current, 0)?.number;
        if (!highestChapterNumber) return;
        const highestChapterNumberCeiled = Math.ceil(highestChapterNumber / 10) * 10;
        const groups = {};
        let lastLabel = '';
        for (let i = 10; i <= highestChapterNumberCeiled; i += 10) {
            const chapters = manga?.chapters.filter(chapter => chapter.number >= i - 9 && chapter.number <= i);
            if (chapters.length === 0) continue;
            const label = `${i - 9}-${i}`;
            groups[label] = {
                label,
                from: i - 9,
                to: i,
                chapters,
            };
            lastLabel = label;
        }
        setChapterGroups(groups);
        setSelectedChapterGroup(lastLabel);

    }, []);

    return (
        <div>
            <div className='relative w-full h-[24rem] group overflow-hidden bg-black shadow-lg'>
                <img src={manga?.bannerUrl || manga?.imageUrl} className='absolute top-1/2 -translate-y-1/2 w-full min-w-full min-h-full object-cover transition-transform duration-500 group-hover:scale-[101%]' />
            </div>
            <div className='2xl:max-w-[1320px] 2xl:mx-auto transition-all duration-500'>
                <div className="flex flex-wrap md:flex-nowrap gap-2 mx-4">
                    <div className="w-[18rem] min-w-[18rem] mx-auto">
                        <StickyBox offsetTop={150} offsetBottom={150}>
                            <div className="relative w-[18rem] min-w-[18rem] h-[26rem] group -translate-y-64 md:-translate-y-16 -mb-64 md:-mb-16 overflow-hidden rounded-md">
                                {/* <img src={manga?.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 filter brightness-50" /> */}
                                <img src={manga?.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 blur-sm filter brightness-75 transition-transform duration-500 group-hover:scale-[110%]" />
                                <img src={manga?.imageUrl} className="absolute inset-0 w-full h-full object-contain max-w-full max-h-full m-auto transition-transform duration-500 group-hover:scale-[104%]" />
                            </div>
                            <div className="w-full mt-6 mb-6">
                                <Button
                                    variant="filled"
                                    className="flex items-center gap-3 mx-auto text-gray-900 bg-yellow-500"
                                    color="yellow"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                    </svg>
                                    {/*
                                Filled:
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                </svg>
                                */}
                                    Añadir a Favoritos
                                </Button>
                            </div>
                            <div className="flex justify-between items-center my-4">
                                <span className="text-xl font-bold">
                                    Estado:
                                </span>
                                {manga?.status === 'ongoing' && (
                                    <div className="w-fit uppercase text-xl font-bold bg-green-400 py-1 px-6 text-center rounded-lg shadow-sm">
                                        En emisión
                                    </div>
                                )}
                                {manga?.status === 'hiatus' && (
                                    <div className="w-fit uppercase text-xl font-bold bg-orange-500 py-1 px-6 text-center rounded-lg shadow-sm mx-auto">
                                        HIATUS
                                    </div>
                                )}
                                {manga?.status === 'finished' && (
                                    <div className="w-fit uppercase text-xl font-bold bg-red-400 py-1 px-6 text-center rounded-lg shadow-sm mx-auto">
                                        FINALIZADO
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap justify-between items-center my-4">
                                <span className="text-xl font-bold">
                                    Demografía:
                                </span>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {!manga?.demography && (
                                        <span className="text-sm font-semibold px-2 text-center">
                                            Sin demografía
                                        </span>
                                    )}
                                    {manga?.demography && (
                                        <a key={manga?.demography.slug} href={`/mangas?genres=${manga?.demography.slug}`} className="text-sm font-semibold px-2 text-center">
                                            {manga?.demography.name}
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-between items-center my-4">
                                <span className="text-xl font-bold">
                                    Géneros:
                                </span>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {manga?.genres?.length === 0 && (
                                        <span className="text-sm font-semibold px-2 text-center">
                                            Sin géneros
                                        </span>
                                    )}
                                    {manga?.genres?.map(genre => (
                                        <a key={genre.slug} href={`/mangas?genres=${genre.slug}`} className="text-sm font-semibold px-2 text-center">{genre.name}</a>
                                    ))}
                                </div>
                            </div>
                            {/* <div className="flex flex-nowrap justify-between items-center my-2">
                            <span className="text-xl font-bold">
                                Mangas Similares:
                            </span>
                            <div className="flex flex-wrap gap-2 items-center">
                                {manga?.similarMangas?.map(similar => (
                                    <a key={similar.id} href={`/manga/${similar.slug}`} className="text-sm font-semibold px-2 text-center">{similar.title}</a>
                                ))}
                            </div>
                        </div> */}
                        </StickyBox>
                    </div>
                    <div className="flex flex-col w-full py-4 md:mx-4">
                        <span className="text-6xl font-extrabold">
                            {manga?.title}
                        </span>
                        <p className="md:mx-2 md:my-1">
                            Por {listFormatter.format(manga?.authors.map(author => author.name))}
                        </p>
                        <p className="md:mx-2 md:my-4">
                            {manga?.description || manga?.shortDescription || 'Sin descripción'}
                        </p>
                        {/* Chapters */}
                        <span className="text-4xl mb-2 font-extrabold">
                            Capitulos
                            <span className="text-xs ml-2 mb-1 text-gray-600">
                                ({manga?.chapters.length} Capitulos disponibles)
                            </span>
                        </span>
                        <div className="flex w-full items-start gap-1">
                            <div className="flex flex-col w-full gap-1">
                                {chapterGroups[selectedChapterGroup]?.chapters.sort((a, b) => b.number - a.number).map((chapter) => (
                                    <a
                                        key={chapter.number}
                                        href={`/manga/${manga.slug}/chapters/${chapter.number}`}
                                        className="p-2 bg-white bg-opacity-10 hover:bg-opacity-15 w-full rounded-xl group"
                                    >
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center">
                                            <div className="w-32 h-20 relative">
                                                <img src={chapter?.imageUrl || manga?.imageUrl} className="w-full h-full object-cover rounded-lg grayscale group-hover:grayscale-0" />
                                            </div>
                                            <div className="flex flex-wrap grow items-center justify-between">
                                                <div className="">
                                                    <p className="flex flex-wrap items-center gap-x-2">
                                                        <span className="text-xs lg:text-lg text-gray-400">Capitulo {chapter.number}</span>
                                                        <span className="text-[0.7rem] font-extralight text-gray-500">{formatDate(chapter.createdAt)}</span>
                                                    </p>
                                                    <p className="text-xl lg:text-2xl">
                                                        {chapter.title}
                                                    </p>
                                                </div>
                                                <div>
                                                    {/* <span className="text-gray-500 mr-4">Leido</span> */}
                                                    <span className="text-xs lg:text-base text-gray-100 lg:mr-4">Leer</span>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                            <StickyBox offsetTop={100} offsetBottom={100}>
                                <div className="grid grid-cols-1 w-28 gap-1 items-center">
                                    {Object.values(chapterGroups).sort((a, b) => b.from - a.from).map(group => (
                                        <div
                                            key={group.label}
                                            className={
                                                "flex w-24 h-8 mx-auto bg-opacity-80 text-sm rounded-lg items-center justify-center cursor-pointer" +
                                                (
                                                    group.label === selectedChapterGroup
                                                        ? " bg-white text-black "
                                                        : " bg-gray-800 hover:bg-gray-700 text-white "
                                                )
                                            }
                                            onClick={() => setSelectedChapterGroup(group.label)}
                                        >
                                            <p>{group.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </StickyBox>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full px-1 sm:px-4 md:px-8">
                {/* Disqus Comments */}
                {organization?.enableDisqusIntegration && (
                    <div className='w-full md:my-4 text-center'>
                        <div className='max-w-[97vw] m-0 2xl:max-w-[95vw] mx-auto shadow-sm my-4 rounded-md'>
                            <Accordion open={openCommentsAccordion}>
                                <AccordionHeader
                                    onClick={() => setOpenCommentsAccordion(oldValue => !oldValue)}
                                >
                                    <h3 className='text-xl font-bold text-gray-300'>
                                        {openCommentsAccordion ? 'Ocultar' : 'Mostrar'} comentarios
                                    </h3>
                                </AccordionHeader>
                                <AccordionBody className="bg-gray-900 my-2 p-4 rounded-md">
                                    <div id="disqus_thread" />
                                </AccordionBody>
                            </Accordion>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
