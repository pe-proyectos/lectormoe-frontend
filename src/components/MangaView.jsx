import { Typography } from "@material-tailwind/react";
import { useEffect } from "react";
import { callAPI } from "../util/callApi";

export function MangaView({ manga }) {
    useEffect(() => {
        callAPI(`/api/views/manga-custom/${manga.slug}`, {
            includeIp: true,
        }).catch((error) => { });
    }, []);
    return (<></>);
}
