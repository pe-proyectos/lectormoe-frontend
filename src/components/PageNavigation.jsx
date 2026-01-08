import {
    ArrowLeftIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { getTranslator } from "../util/translate";

export function PageNavigation({ language, page, setPage, maxPage, loading, data }) {
    const _ = getTranslator(language);

    return (
        <div className="flex items-center gap-8">
            <button
                className="p-2 border border-white rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading || data.length === 0}
            >
                <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
            </button>
            <p className="text-white font-normal">
                {_("page")} <strong className="text-gray-400">{page}</strong> {_("of")}{" "}
                <strong className="text-gray-400">{maxPage}</strong>
            </p>
            <button
                className="p-2 border border-white rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(prev => Math.min(prev + 1, 10))}
                disabled={page >= maxPage || loading || data.length === 0}
            >
                <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
            </button>
        </div>
    );
}
