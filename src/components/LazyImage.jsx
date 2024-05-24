import React, { useState, useEffect, useCallback } from 'react';

window.LazyImageQueue = window.LazyImageQueue || [];
window.isLoading = window.isLoading || false;

const processQueue = () => {
  if (!window.isLoading && window.LazyImageQueue.length > 0) {
    window.isLoading = true;
    const image = window.LazyImageQueue.shift();
    if (image && image.load) {
      image.load().then(() => {
        window.isLoading = false;
        processQueue();
      }).catch((error) => {
        console.error("Error loading image:", error);
        window.isLoading = false;
        processQueue();
      });
    } else {
      console.error("Error: Image load function is undefined.");
      window.isLoading = false;
      processQueue();
    }
  }
};

const addToQueue = (image) => {
  if (image && typeof image.load === 'function') {
    window.LazyImageQueue.push(image);
    processQueue();
  } else {
    console.error("Invalid image object or load function missing.");
  }
};

export const LazyImage = ({ src, alt, ...rest }) => {
  const [imageSrc, setImageSrc] = useState("");

  const loadImage = useCallback(async () => {
    try {
      const cache = await caches.open('image-cache');
      const cachedResponse = await cache.match(src, {
        ignoreVary: true,
        ignoreMethod: true,
        ignoreSearch: true,
      });
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const imageObjectURL = URL.createObjectURL(blob);
        setImageSrc(imageObjectURL);
      } else {
        const response = await fetch(src);
        cache.put(src, response.clone());
        const blob = await response.blob();
        const imageObjectURL = URL.createObjectURL(blob);
        setImageSrc(imageObjectURL);
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      setImageSrc(src);
    }
  }, [src, alt]);

  useEffect(() => {
    const image = { load: loadImage };
    addToQueue(image);
  }, [loadImage]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      {...rest}
    />
  );
};
