import { useState, useEffect } from 'react';
import { cacheImage, getCachedImage } from '@/lib/image-cache';

/**
 * Hook to load and cache images
 * Returns cached data URL if available, otherwise loads and caches the image
 * Returns null if image fails to load (to show fallback avatar)
 */
export const useCachedImage = (url: string | null | undefined): string | null => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!url) {
      setCachedUrl(null);
      setHasError(false);
      return;
    }

    // Reset error state when URL changes
    setHasError(false);

    // Check cache first
    const cached = getCachedImage(url);
    if (cached) {
      setCachedUrl(cached);
      return;
    }

    // Load and cache image
    cacheImage(url)
      .then((dataUrl) => {
        // Only set if dataUrl is different from original URL (meaning it was successfully cached)
        // If cacheImage returns the original URL, it means caching failed
        if (dataUrl && dataUrl !== url) {
          setCachedUrl(dataUrl);
        } else {
          // Caching failed, but we can try to use original URL
          // However, if it's the same as input, it might fail, so we'll let onError handle it
          setCachedUrl(url);
        }
      })
      .catch((error) => {
        console.warn('Failed to cache image:', error);
        // Return null to show fallback avatar
        setCachedUrl(null);
        setHasError(true);
      });
  }, [url]);

  // Return null if there was an error, otherwise return cached URL or original URL
  if (hasError) {
    return null;
  }
  
  return cachedUrl || url || null;
};

