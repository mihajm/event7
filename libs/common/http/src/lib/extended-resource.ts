import {
  computed,
  DestroyRef,
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
import { hash } from '@e7/common/cache';
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
    hash?: (request: Exclude<NoInfer<R>, undefined>) => string;
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
  'value' | 'set' | 'update' | 'reload'
> & {
  value: Signal<T | null>;
  set: (value: T | null | undefined) => void;
  prefetch: (request: NoInfer<R>) => Promise<void>;
  reload: (invalidate?: boolean) => void;
};

export type DefinedExtendedResourceRef<T, R> = Omit<
  ResourceRef<T>,
  'value' | 'set' | 'update' | 'reload'
> & {
  value: Signal<T>;
  set: (value: T | null | undefined) => void;
  prefetch: (request: NoInfer<R>) => Promise<void>;
  reload: (invalidate?: boolean) => void;
};

function keepPrevious<T>(
  value: Signal<T | undefined>,
  keep = false,
): Signal<T | undefined> {
  if (!keep) return value;

  let prev: T | undefined;

  return computed(() => {
    const val = value();
    if (val !== undefined) prev = val;
    if (!val) return prev;
    return val;
  });
}

type ResourceCacheRef<T, R> = {
  get: (key: string) => { value: T; isStale: boolean } | null;
  store: (key: string, value: T) => void;
  invalidate: (key: string) => void;
  toString: (request: R) => string;
};

const isDefined = <R>(value: R): value is Exclude<R, undefined> =>
  value !== undefined;

function injectCache<T, R>(
  opt: UndefinedExtendedResourceOptions<T, R>['cache'],
): ResourceCacheRef<T, R> {
  if (!opt) {
    return {
      get: () => null,
      store: () => {
        // noop
      },
      invalidate: () => {
        // noop
      },
      toString: () => {
        return '';
      },
    };
  }

  const cache = inject(ResourceCache);

  const hashRequest = (request: Exclude<R, undefined>): string => {
    if (opt.hash) return opt.hash(request);
    return hash(request);
  };

  const ttl = opt?.ttl ?? FIVE_MINUTES;
  const staleTime = opt?.staleTime ?? 0;

  return {
    get: (key: string) => {
      if (!key) return null;
      return cache.get<T>(key);
    },
    store: (key: string, value: T) => {
      if (!key || !value) return;
      cache.store<T>(key, value, staleTime, ttl);
    },
    toString: (request: R) => {
      if (!isDefined(request)) return opt.prefix ? opt.prefix : '';

      return opt.prefix
        ? `${opt.prefix}:${hashRequest(request)}`
        : hashRequest(request);
    },
    invalidate: (key: string) => {
      if (!key) return;
      cache.invalidate(key);
    },
  };
}

const FIVE_MINUTES = 1000 * 60 * 5;

function hasSlowConnection() {
  if (
    'connection' in window.navigator &&
    typeof window.navigator.connection === 'object' &&
    !!window.navigator.connection &&
    'effectiveType' in window.navigator.connection &&
    typeof window.navigator.connection.effectiveType === 'string'
  )
    return window.navigator.connection.effectiveType.endsWith('2g');

  return false;
}

const IS_SLOW_CONNECTION = hasSlowConnection();

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

  const onSuccess = (
    value: Exclude<T, undefined | null>,
    ctx: TCTX,
    params: ResourceLoaderParams<{ source: R; key: string }>,
    isCached = false,
    isPrefetch = false,
  ) => {
    if (!isPrefetch) opt.onSuccess?.(value, ctx);

    if (!isCached && params.previous.status !== ResourceStatus.Local)
      cache.store(params.request.key, value);
  };

  const request = computed(() => opt.request?.() as R);

  const key = computed(() => cache.toString(request()));

  const loader = (
    params: ResourceLoaderParams<{ key: string; source: R }>,
    isPrefetch = false,
  ) => {
    ctx = opt.onMutate?.(params.request.source) as TCTX;

    const found = cache.get(params.request.key);

    if (
      found &&
      found.isStale &&
      params.previous.status !== ResourceStatus.Local
    ) {
      res.set(found.value);
    }

    const loader$ =
      found && !found.isStale
        ? of(found.value)
        : opt.loader({
            ...params,
            request: params.request
              .source as ResourceLoaderParams<R>['request'],
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

  const destroyRef = inject(DestroyRef);
  const destroyResource = res.destroy;

  const keep = keepPrevious(res.value, opt.keepPrevious);

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

  const reload = (invalidate = false) => {
    if (invalidate) cache.invalidate(untracked(key));
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
      destroyResource();
    },
    reload,
    set: (value: T | null | undefined) => res.set(value ?? undefined),
    prefetch: async (request: NoInfer<R>) => {
      if (request === undefined || !opt.cache || IS_SLOW_CONNECTION) return;

      const key = cache.toString(request);

      if (cache.get(key)) return;

      const req = {
        source: request,
        key,
      };

      const found = await firstValueFrom(
        loader(
          {
            request: req,
            previous: {
              status: untracked(res.status),
            },
            abortSignal: new AbortController().signal,
          },
          true,
        ),
      );

      if (found === undefined || found === null) return;
      cache.store(key, found);
    },
  } as DefinedExtendedResourceRef<T, R>;
}
