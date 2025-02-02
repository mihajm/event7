import {
  computed,
  DestroyRef,
  inject,
  ResourceLoaderParams,
  ResourceRef,
  Signal,
} from '@angular/core';
import {
  rxResource,
  RxResourceOptions,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import { catchError, interval, of, tap } from 'rxjs';

export type DefinedExtendedResourceOptions<T, R> = RxResourceOptions<T, R> & {
  onMutate?: (value: NoInfer<R>) => void;
  onError?: (error: unknown) => void;
  onSuccess?: (value: NoInfer<Exclude<T, undefined | null>>) => void;
  fallback: NoInfer<T>;
  keepPrevious?: boolean;
  refresh?: number;
};

export type UndefinedExtendedResourceOptions<T, R> = Omit<
  DefinedExtendedResourceOptions<T, R>,
  'fallback'
>;

export type UndefinedExtendedResourceRef<T> = Omit<
  ResourceRef<T>,
  'value' | 'set' | 'update'
> & {
  value: Signal<T | null>;
  set: (value: T | null | undefined) => void;
};

export type DefinedExtendedResourceRef<T> = Omit<
  ResourceRef<T>,
  'value' | 'set' | 'update'
> & {
  value: Signal<T>;
  set: (value: T | null | undefined) => void;
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

export function extendedResource<T, R>(
  opt: UndefinedExtendedResourceOptions<T, R>,
): UndefinedExtendedResourceRef<T>;

export function extendedResource<T, R>(
  opt: DefinedExtendedResourceOptions<T, R>,
): DefinedExtendedResourceRef<T>;

export function extendedResource<T, R>(
  opt:
    | DefinedExtendedResourceOptions<T, R>
    | UndefinedExtendedResourceOptions<T, R>,
): UndefinedExtendedResourceRef<T> | DefinedExtendedResourceRef<T> {
  const fallback =
    (opt as Partial<DefinedExtendedResourceOptions<T, R>>).fallback ?? null;

  const loader = (params: ResourceLoaderParams<R>) => {
    opt.onMutate?.(params.request);
    return opt.loader(params).pipe(
      tap((value) => {
        if (value === undefined || value === null) return;
        opt.onSuccess?.(value as Exclude<T, undefined | null>);
      }),
      catchError((err) => {
        opt.onError?.(err);
        return of(fallback as T);
      }),
    );
  };

  const res = rxResource({
    ...opt,
    loader,
  });

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

  return {
    ...res,
    value,
    destroy: () => {
      sub?.unsubscribe();
      destroyResource();
    },
    reload: () => {
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
    },
    set: (value: T | null | undefined) => res.set(value ?? undefined),
  } as DefinedExtendedResourceRef<T>;
}
