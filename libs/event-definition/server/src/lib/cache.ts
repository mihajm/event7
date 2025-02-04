type CacheEntry<T> = {
  value: T;
  stale: number;
  timeout: ReturnType<typeof setTimeout>;
};

export class Cache<T> {
  private readonly internal = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttl: number,
    private readonly staleTime: number,
  ) {}

  private getCacheEntrie(key: string) {
    return this.internal.get(key);
  }

  get(key: string) {
    const found = this.getCacheEntrie(key);
    if (!found || found.stale < Date.now()) return null;
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

    this.internal.set(key, {
      value,
      stale: Date.now() + this.staleTime,
      timeout: setTimeout(() => this.internal.delete(key), this.ttl),
    });
  }

  invalidate(key: string) {
    const entry = this.getCacheEntrie(key);
    if (entry) {
      clearTimeout(entry.timeout);
      this.internal.delete(key);
    }
  }
}
