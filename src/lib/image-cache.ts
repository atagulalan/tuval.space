/**
 * Image cache service for profile photos and other images
 * Prevents 429 errors by caching images in memory and localStorage
 */

interface CachedImage {
  dataUrl: string;
  timestamp: number;
  url: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MEMORY_CACHE = new Map<string, CachedImage>();
const STORAGE_KEY_PREFIX = 'img_cache_';

/**
 * Convert image URL to base64 data URL
 */
const imageToDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Get storage key for image URL
 */
const getStorageKey = (url: string): string => {
  // Use btoa to create a base64-like key from URL
  // Limit length to avoid localStorage key length issues
  try {
    const encoded = btoa(url).replace(/[+/=]/g, '').substring(0, 50);
    return `${STORAGE_KEY_PREFIX}${encoded}`;
  } catch {
    // Fallback: use simple hash if btoa fails
    const hash = url.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code;
    }, 0);
    return `${STORAGE_KEY_PREFIX}${Math.abs(hash)}`;
  }
};

/**
 * Get cached image from memory or localStorage
 */
export const getCachedImage = (url: string): string | null => {
  // Check memory cache first
  const memoryEntry = MEMORY_CACHE.get(url);
  if (memoryEntry) {
    const age = Date.now() - memoryEntry.timestamp;
    if (age < CACHE_TTL) {
      return memoryEntry.dataUrl;
    } else {
      // Expired, remove from memory
      MEMORY_CACHE.delete(url);
    }
  }

  // Check localStorage
  try {
    const storageKey = getStorageKey(url);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const cached: CachedImage = JSON.parse(stored);
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL && cached.url === url) {
        // Valid cache, move to memory for faster access
        MEMORY_CACHE.set(url, cached);
        return cached.dataUrl;
      } else {
        // Expired, remove from storage
        localStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.warn('Error reading image cache from localStorage:', error);
  }

  return null;
};

/**
 * Cache image URL as data URL
 * Returns data URL if successful, throws error if image fails to load
 */
export const cacheImage = async (url: string): Promise<string> => {
  // Check if already cached
  const cached = getCachedImage(url);
  if (cached) {
    return cached;
  }

  try {
    // Convert to data URL
    const dataUrl = await imageToDataUrl(url);
    
    const cachedImage: CachedImage = {
      dataUrl,
      timestamp: Date.now(),
      url,
    };

    // Store in memory
    MEMORY_CACHE.set(url, cachedImage);

    // Store in localStorage
    try {
      const storageKey = getStorageKey(url);
      localStorage.setItem(storageKey, JSON.stringify(cachedImage));
    } catch (error) {
      // localStorage might be full, just use memory cache
      console.warn('Could not store image in localStorage:', error);
    }

    return dataUrl;
  } catch (error) {
    console.warn('Failed to cache image:', error);
    // Throw error so hook can handle it and show fallback
    throw error;
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  
  // Clear expired memory cache
  for (const [url, entry] of MEMORY_CACHE.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      MEMORY_CACHE.delete(url);
    }
  }

  // Clear expired localStorage cache
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const cached: CachedImage = JSON.parse(stored);
            if (now - cached.timestamp >= CACHE_TTL) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Error clearing expired cache:', error);
  }
};

/**
 * Clear all image cache
 */
export const clearImageCache = (): void => {
  MEMORY_CACHE.clear();
  
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Error clearing image cache:', error);
  }
};

// Clean up expired cache on load
if (typeof window !== 'undefined') {
  clearExpiredCache();
  // Clean up expired cache every hour
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}

