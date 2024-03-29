import React, { useState, useRef } from 'react';

export function MangaCardsScroller({ children }) {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [maxScrollPosition, setMaxScrollPosition] = useState(0);
    const scrollContainerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setScrollPosition(scrollLeft);
        const maxScroll = scrollWidth - clientWidth;
        setMaxScrollPosition(maxScroll);
    };

    const handleMouseDown = (e) => {
        isDraggingRef.current = true;
        startXRef.current = e.pageX;
        scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseUp = (e) => {
        if (isDraggingRef.current) {
            const endX = e.pageX;
            const distance = Math.abs(endX - startXRef.current);
            if (distance > 5) {
                e.preventDefault();
            }
            isDraggingRef.current = false;
        } else {
            console.log('Regular click');
        }
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - startXRef.current) * 1;
        scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseLeave = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
        }
    };

    return (
        <div
            className='relative h-[28rem] overflow-x-scroll overflow-y-hidden no-scrollbar select-none'
            onScrollCapture={handleScroll}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
        >
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
