import {
    Typography,
    IconButton,
} from "@material-tailwind/react";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { getTranslator } from "../util/translate";

export function PageNavigation({ organization, page, setPage, maxPage, loading, data }) {
    const _ = getTranslator(organization.language);

    return (
        <div className="flex items-center gap-8">
            <IconButton
                size="sm"
                variant="outlined"
                color='white'
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading || data.length === 0}
            >
                <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
            <Typography color="white" className="font-normal">
                {_("page")} <strong className="text-gray-400">{page}</strong> {_("of")}{" "}
                <strong className="text-gray-400">{maxPage}</strong>
            </Typography>
            <IconButton
                size="sm"
                variant="outlined"
                color='white'
                onClick={() => setPage(prev => Math.min(prev + 1, 10))}
                disabled={page >= maxPage || loading || data.length === 0}
            >
                <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
            </IconButton>
        </div>
    );
}
