/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Cache } from '@e7/common/cache';

@Injectable({
  providedIn: 'root',
})
export class ResourceCache {
  private readonly internal = new Cache<any>();

  private getCache<T>() {
    return this.internal as Cache<T>;
  }

  get<T>(key: string) {
    return this.getCache<T>().get(key);
  }

  store<T>(key: string, value: T, staleTime: number, ttl: number) {
    return this.getCache<T>().storeWithInvalidation(key, value, staleTime, ttl);
  }

  invalidate(key: string) {
    return this.internal.invalidate(key);
  }

  changes$<T>(key: string) {
    return this.getCache<T>().changes$(key);
  }
}
