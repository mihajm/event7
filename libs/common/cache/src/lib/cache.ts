import { v7 } from 'uuid';

type CacheEntry<T> = {
  value: T;
  created: number;
  stale: number;
  useCount: number;
  timeout: ReturnType<typeof setTimeout>;
};

type LRUCleanupType = {
  type: 'lru';
  checkInterval: number;
  maxSize: number;
};

type OldsetCleanupType = {
  type: 'oldest';
  checkInterval: number;
  maxSize: number;
};

type CleanupType = LRUCleanupType | OldsetCleanupType;

export class Cache<T> {
  private internal = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttl: number,
    private readonly staleTime: number,
    private readonly cleanupOpt: CleanupType = {
      type: 'lru',
      maxSize: 1000,
      checkInterval: 1000 * 60 * 60, // 1 hour
    },
  ) {
    if (this.cleanupOpt.maxSize <= 0)
      throw new Error('maxSize must be greater than 0');

    const cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupOpt.checkInterval);

    const destroyId = v7();

    const registry = new FinalizationRegistry((id: string) => {
      if (id === destroyId) clearInterval(cleanupInterval);
    });

    registry.register(this, destroyId);
  }

  private getCacheEntrie(key: string) {
    return this.internal.get(key);
  }

  get(key: string) {
    const found = this.getCacheEntrie(key);
    if (!found) return null;

    found.useCount++;

    return {
      value: found.value,
      isStale: found.stale < Date.now(),
    };
  }

  store(key: string, value: T) {
    const entry = this.getCacheEntrie(key);
    if (entry) {
      clearTimeout(entry.timeout);
    }

    const prevCount = entry?.useCount ?? 0;

    this.internal.set(key, {
      value,
      created: entry?.created ?? Date.now(),
      useCount: prevCount + 1,
      stale: Date.now() + this.staleTime,
      timeout: setTimeout(() => this.invalidate(key), this.ttl),
    });

    this.cleanup();
  }

  invalidate(key: string) {
    const entry = this.getCacheEntrie(key);
    if (entry) {
      clearTimeout(entry.timeout);
      this.internal.delete(key);
    }
  }

  private cleanup() {
    if (this.internal.size <= this.cleanupOpt.maxSize) return;

    const sorted = Array.from(this.internal.entries()).toSorted((a, b) => {
      if (this.cleanupOpt.type === 'lru') {
        return a[1].useCount - b[1].useCount; // least used first
      } else {
        return a[1].created - b[1].created; // oldest first
      }
    });

    const keepCount = Math.floor(this.cleanupOpt.maxSize / 2);

    const keep = sorted.slice(keepCount);
    const removed = sorted.slice(0, -keepCount);

    removed.forEach(([, e]) => {
      clearTimeout(e.timeout);
    });

    this.internal = new Map(keep);
  }
}
