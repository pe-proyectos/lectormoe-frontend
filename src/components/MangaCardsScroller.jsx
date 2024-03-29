import { useState } from 'react';

export function MangaCardsScroller({ children }) {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [maxScrollPosition, setMaxScrollPosition] = useState(0);
    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setScrollPosition(scrollLeft);
        const maxScroll = scrollWidth - clientWidth;
        setMaxScrollPosition(maxScroll);
    };
    return (
        <div className='relative h-[28rem] overflow-x-scroll overflow-y-hidden no-scrollbar' onScrollCapture={handleScroll}>
            <div className="absolute top-1/2 -translate-y-1/2 flex gap-4 col-span-3 justify-around">
                {children}
            </div>
            <div className="sticky bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-sm">
                <div
                    className="h-1 w-[20%] shadow-md rounded-sm bg-gradient-to-r from-red-800 to-purple-900"
                    style={{
                        marginLeft: `${(scrollPosition / maxScrollPosition) * 80}%`,
                    }}
                />
            </div>
        </div>
    );
}
