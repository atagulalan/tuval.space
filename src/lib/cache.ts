/**
 * Simple cache invalidation system similar to RTK Query tags
 * Allows invalidating cache entries by tags
 */

type CacheTag = string;
type CacheKey = string;

interface CacheEntry<T> {
  data: T;
  tags: Set<CacheTag>;
  timestamp: number;
}

class CacheStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<CacheKey, CacheEntry<any>>();
  private tagIndex = new Map<CacheTag, Set<CacheKey>>();

  /**
   * Store data with associated tags
   */
  set<T>(key: CacheKey, data: T, tags: CacheTag[] = []): void {
    // Remove old entry from tag index
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      oldEntry.tags.forEach((tag) => {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      data,
      tags: new Set(tags),
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);

    // Update tag index
    tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  /**
   * Get data by key
   */
  get<T>(key: CacheKey): T | undefined {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : undefined;
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateTags(tags: CacheTag[]): void {
    const keysToInvalidate = new Set<CacheKey>();

    tags.forEach((tag) => {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach((key) => keysToInvalidate.add(key));
      }
    });

    keysToInvalidate.forEach((key) => {
      const entry = this.cache.get(key);
      if (entry) {
        // Remove from tag index
        entry.tags.forEach((tag) => {
          const tagKeys = this.tagIndex.get(tag);
          if (tagKeys) {
            tagKeys.delete(key);
            if (tagKeys.size === 0) {
              this.tagIndex.delete(tag);
            }
          }
        });
        // Remove from cache
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidate cache entry by key
   */
  invalidate(key: CacheKey): void {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      entry.tags.forEach((tag) => {
        const tagKeys = this.tagIndex.get(tag);
        if (tagKeys) {
          tagKeys.delete(key);
          if (tagKeys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
      // Remove from cache
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }
}

// Singleton cache store
export const cacheStore = new CacheStore();

// Cache tags
export const CACHE_TAGS = {
  USER_PROFILE: (uid: string) => `user-profile:${uid}`,
  USER_BOARDS: (uid: string) => `user-boards:${uid}`,
  BOARD: (boardId: string) => `board:${boardId}`,
  BOARD_BY_NAME: (name: string) => `board-by-name:${name}`,
  ALL_BOARDS: 'all-boards',
} as const;

/**
 * Invalidate user profile cache
 */
export const invalidateUserProfile = (uid: string): void => {
  cacheStore.invalidateTags([
    CACHE_TAGS.USER_PROFILE(uid),
    CACHE_TAGS.USER_BOARDS(uid),
  ]);
};

/**
 * Invalidate board cache
 */
export const invalidateBoard = (boardId: string): void => {
  cacheStore.invalidateTags([CACHE_TAGS.BOARD(boardId)]);
};

/**
 * Invalidate all boards cache
 */
export const invalidateAllBoards = (): void => {
  cacheStore.invalidateTags([CACHE_TAGS.ALL_BOARDS]);
};
