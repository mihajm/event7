import {
  computed,
  DestroyRef,
  effect,
  EffectRef,
  inject,
  ResourceLoaderParams,
  ResourceRef,
  ResourceStatus,
  Signal,
  untracked,
} from '@angular/core';
import {
  rxResource,
  RxResourceOptions,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import {
  catchError,
  firstValueFrom,
  fromEvent,
  interval,
  of,
  takeUntil,
  tap,
} from 'rxjs';
import { ResourceCache } from './resource-cache';

export type DefinedExtendedResourceOptions<
  T,
  R,
  TCTX = void,
> = RxResourceOptions<T, R> & {
  onMutate?: (value: NoInfer<R>) => TCTX;
  onError?: (error: unknown, ctx: TCTX) => void;
  onSuccess?: (value: NoInfer<Exclude<T, undefined | null>>, ctx: TCTX) => void;
  onSettled?: (value: NoInfer<T> | null | undefined, ctx: TCTX) => void;
  fallback: NoInfer<T>;
  keepPrevious?: boolean;
  refresh?: number;
  cache?: {
    prefix?: string;
    toString?: (request: Exclude<NoInfer<R>, undefined>) => string;
    noSync?: boolean;
    staleTime?: number;
    ttl?: number;
  };
};

export type UndefinedExtendedResourceOptions<T, R, TCTX = void> = Omit<
  DefinedExtendedResourceOptions<T, R, TCTX>,
  'fallback'
>;

export type UndefinedExtendedResourceRef<T, R> = Omit<
  ResourceRef<T>,
  'value' | 'set' | 'update'
> & {
  value: Signal<T | null>;
  set: (value: T | null | undefined) => void;
  prefetch: (request: NoInfer<R>) => Promise<void>;
};

export type DefinedExtendedResourceRef<T, R> = Omit<
  ResourceRef<T>,
  'value' | 'set' | 'update'
> & {
  value: Signal<T>;
  set: (value: T | null | undefined) => void;
  prefetch: (request: NoInfer<R>) => Promise<void>;
};

function keepPrevious<T>(
  value: Signal<T | undefined>,
  loading: Signal<boolean>,
  keep = false,
): Signal<T | undefined> {
  if (!keep) return value;

  let prev: T | undefined;

  return computed(() => {
    const val = value();
    if (val !== undefined) prev = val;
    if (loading() && !val) return prev;
    return val;
  });
}

type ResourceCacheRef<T, R> = {
  get: (key: string) => { value: T; isStale: boolean } | null;
  store: (key: string, value: T, staleTime: number, ttl: number) => void;
  toString: (request: R) => string;
};

function injectCache<T, R>(
  opt: UndefinedExtendedResourceOptions<T, R>['cache'],
): ResourceCacheRef<T, R> {
  if (!opt) {
    return {
      get: () => null,
      store: () => {
        // noop
      },
      toString: () => {
        return '';
      },
    };
  }

  const cache = inject(ResourceCache);

  const toString = opt.toString ?? JSON.stringify;

  return {
    get: (key: string) => {
      if (!key) return null;
      return cache.get<T>(key);
    },
    store: (key: string, value: T, staleTime: number, ttl: number) => {
      if (!key || !value) return;
      cache.store<T>(key, value, staleTime, ttl);
    },
    toString: (request: R) => {
      if (request === undefined) return opt.prefix ? opt.prefix : '';
      return opt.prefix
        ? `${opt.prefix}:${toString(request)}`
        : toString(request);
    },
  };
}

const FIVE_MINUTES = 1000 * 60 * 5;

export function extendedResource<T, R, TCTX = void>(
  opt: UndefinedExtendedResourceOptions<T, R, TCTX>,
): UndefinedExtendedResourceRef<T, R>;

export function extendedResource<T, R, TCTX = void>(
  opt: DefinedExtendedResourceOptions<T, R, TCTX>,
): DefinedExtendedResourceRef<T, R>;

export function extendedResource<T, R, TCTX = void>(
  opt:
    | DefinedExtendedResourceOptions<T, R, TCTX>
    | UndefinedExtendedResourceOptions<T, R, TCTX>,
): UndefinedExtendedResourceRef<T, R> | DefinedExtendedResourceRef<T, R> {
  const fallback =
    (opt as Partial<DefinedExtendedResourceOptions<T, R>>).fallback ?? null;

  let ctx: TCTX = undefined as TCTX;

  const cache = injectCache<T, R>(opt.cache);

  const ttl = opt.cache?.ttl ?? FIVE_MINUTES;
  const staleTime = opt.cache?.staleTime ?? 0;

  const onSuccess = (
    value: Exclude<T, undefined | null>,
    ctx: TCTX,
    params: ResourceLoaderParams<{ source: R; key: string }>,
    isCached = false,
    isPrefetch = false,
  ) => {
    if (!isPrefetch) opt.onSuccess?.(value, ctx);

    if (!isCached && params.previous.status !== ResourceStatus.Local)
      cache.store(params.request.key, value, staleTime, ttl);
  };

  const request = computed(() => opt.request?.() as R);

  const key = computed(() => cache.toString(request()));

  let lastReloadTimeout: null | ReturnType<typeof setTimeout> = null;
  const loader = (
    params: ResourceLoaderParams<{ key: string; source: R }>,
    isPrefetch = false,
  ) => {
    ctx = opt.onMutate?.(params.request.source) as TCTX;

    const found =
      params.previous.status === ResourceStatus.Reloading
        ? null
        : cache.get(params.request.key);

    const isStale = found?.isStale ?? false;

    const loader$ = found
      ? of(found.value)
      : opt.loader({
          ...params,
          request: params.request.source as ResourceLoaderParams<R>['request'],
        });

    return loader$.pipe(
      tap((value) => {
        if (value === undefined || value === null) return;
        onSuccess(
          value as Exclude<T, undefined | null>,
          ctx,
          params,
          !!found,
          isPrefetch,
        );
      }),
      catchError((err) => {
        if (!isPrefetch) opt.onError?.(err, ctx);
        return of(fallback as T);
      }),
      tap((v) => {
        if (!isPrefetch) opt.onSettled?.(v, ctx);
      }),
      tap(() => {
        if (lastReloadTimeout) clearTimeout(lastReloadTimeout);
        if (isStale) {
          lastReloadTimeout = setTimeout(() => {
            reload();
          });
        }
      }),
      takeUntil(fromEvent(params.abortSignal, 'abort')),
    );
  };

  const res = rxResource({
    ...opt,
    request: () => {
      return {
        key: key(),
        source: request(),
      };
    },
    loader,
  });

  let syncEffectRef: null | EffectRef = null;

  if (opt.cache && !opt.cache.noSync) {
    syncEffectRef = effect(() => {
      const k = key();
      if (!k || res.isLoading()) return;
      const found = cache.get(k);
      if (!found || found === untracked(res.value) || found.isStale) return;
      res.set(found.value);
    });
  }

  const destroyRef = inject(DestroyRef);
  const destroyResource = res.destroy;

  const keep = keepPrevious(res.value, res.isLoading, opt.keepPrevious);

  const value: Signal<T> = computed(
    () => {
      const kept = keep();
      if (kept === undefined || kept === null) return fallback as T;
      return kept as T;
    },
    {
      equal: (a: T | null, b: T | null) => {
        if (a === null && b === null) return true;
        if (a === null || b === null) return false;
        if (!opt.equal) return a === b;
        return opt.equal(a, b);
      },
    },
  );

  let sub =
    opt.refresh === undefined
      ? null
      : interval(opt.refresh)
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe(() => res.reload());

  const reload = () => {
    const hasReloaded = res.reload();
    if (!hasReloaded) return false;

    sub?.unsubscribe();

    sub =
      opt.refresh === undefined
        ? null
        : interval(opt.refresh)
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe(() => res.reload());

    return hasReloaded;
  };

  return {
    ...res,
    value,
    destroy: () => {
      sub?.unsubscribe();
      syncEffectRef?.destroy();
      destroyResource();
    },
    reload,
    set: (value: T | null | undefined) => res.set(value ?? undefined),
    prefetch: async (request: NoInfer<R>) => {
      if (request === undefined) return;

      const key = cache.toString(request);
      const req = {
        source: request,
        key,
      };

      const found = await firstValueFrom(
        loader(
          {
            request: req,
            previous: {
              status: ResourceStatus.Idle,
            },
            abortSignal: new AbortController().signal,
          },
          true,
        ),
      );

      if (found === undefined || found === null) return;
      cache.store(key, found, staleTime, ttl);
    },
  } as DefinedExtendedResourceRef<T, R>;
}
