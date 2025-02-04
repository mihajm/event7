import { BehaviorSubject, map, skip } from 'rxjs';
import { v7 } from 'uuid';

type CacheEntry<T> = {
  value: T;
  created: number;
  stale: number;
  useCount: number;
  expiresAt: number;
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

const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR = 1000 * 60 * 60;

type CleanupType = LRUCleanupType | OldsetCleanupType;

export class Cache<T> {
  private readonly internal$ = new BehaviorSubject(
    new Map<string, CacheEntry<T>>(),
  );

  constructor(
    private readonly ttl: number = ONE_DAY,
    private readonly staleTime: number = ONE_HOUR,
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
      if (id === destroyId) {
        clearInterval(cleanupInterval);
        this.internal$.complete();
      }
    });

    registry.register(this, destroyId);
  }

  private getCacheEntrie(key: string) {
    return this.internal$.value.get(key);
  }

  private getEntryAndStale(key: string) {
    const found = this.getCacheEntrie(key);
    if (!found || found.expiresAt <= Date.now()) return null;

    return {
      entry: found,
      isStale: found.stale < Date.now(),
    };
  }

  get(key: string) {
    const found = this.getEntryAndStale(key);
    if (!found) return null;
    found.entry.useCount++;

    return { value: found.entry.value, isStale: found.isStale };
  }

  store(key: string, value: T) {
    const entry = this.getCacheEntrie(key);
    if (entry) {
      clearTimeout(entry.timeout);
    }

    const prevCount = entry?.useCount ?? 0;

    this.internal$.value.set(key, {
      value,
      created: entry?.created ?? Date.now(),
      useCount: prevCount + 1,
      stale: Date.now() + this.staleTime,
      expiresAt: Date.now() + this.ttl,
      timeout: setTimeout(() => this.invalidate(key), this.ttl),
    });

    this.internal$.next(this.internal$.value);

    this.cleanup();
  }

  invalidate(key: string) {
    const entry = this.getCacheEntrie(key);
    if (entry) {
      clearTimeout(entry.timeout);
      this.internal$.value.delete(key);
      this.internal$.next(this.internal$.value);
    }
  }

  changes$(key: string) {
    return this.internal$.pipe(
      skip(1),
      map(() => {
        const found = this.getEntryAndStale(key);
        if (!found) return null;
        return {
          value: found.entry.value,
          isStale: found.isStale,
        };
      }),
    );
  }

  private cleanup() {
    if (this.internal$.value.size <= this.cleanupOpt.maxSize) return;

    const sorted = Array.from(this.internal$.value.entries()).toSorted(
      (a, b) => {
        if (this.cleanupOpt.type === 'lru') {
          return a[1].useCount - b[1].useCount; // least used first
        } else {
          return a[1].created - b[1].created; // oldest first
        }
      },
    );

    const keepCount = Math.floor(this.cleanupOpt.maxSize / 2);

    const removed = sorted.slice(0, sorted.length - keepCount);
    const keep = sorted.slice(removed.length, sorted.length);

    removed.forEach(([, e]) => {
      clearTimeout(e.timeout);
    });

    this.internal$.next(new Map(keep));
  }
}
