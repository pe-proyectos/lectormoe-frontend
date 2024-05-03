import React, { useState, useRef, useEffect } from 'react';

export function LazyImage({ src, alt, ...rest }) {
    const lowQualitySrc = src + "/preview";
    const highQualitySrc = src;
    const [imageSrc, setImageSrc] = useState(lowQualitySrc);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef();

    useEffect(() => {
        let observer;
        let didCancel = false;
        let timeout;

        if (imageRef.current && highQualitySrc) {
            if (IntersectionObserver) {
                observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (!didCancel && (entry.intersectionRatio > 0 || entry.isIntersecting)) {
                                setImageSrc(highQualitySrc);
                                clearTimeout(timeout);
                                if (observer && observer.unobserve && imageRef && imageRef.current) {
                                    observer.unobserve(imageRef.current);
                                }
                            }
                        });
                    },
                    {
                        threshold: 0.01,
                        rootMargin: '75%'
                    }
                );
                observer.observe(imageRef.current);
            } else {
                // Fallback for browsers without IntersectionObserver support
                setImageSrc(highQualitySrc);
            }
        }

        // Set timeout to switch to high-quality image if low-quality image fails to load
        timeout = setTimeout(() => {
            setImageSrc(highQualitySrc);
        }, 2000);

        return () => {
            didCancel = true;
            clearTimeout(timeout);
            if (observer && observer.unobserve && imageRef && imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, [highQualitySrc]);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    return (
        <img
            src={imageSrc}
            ref={imageRef}
            alt={alt}
            onLoad={handleImageLoad}
            {...rest}
        />
    );
};

export default LazyImage;
