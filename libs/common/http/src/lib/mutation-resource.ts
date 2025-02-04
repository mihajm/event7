import {
  ResourceLoaderParams,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { derived, mutable } from '@e7/common/reactivity';
import { Observable } from 'rxjs';
import {
  DefinedExtendedResourceOptions,
  DefinedExtendedResourceRef,
  extendedResource,
  UndefinedExtendedResourceOptions,
  UndefinedExtendedResourceRef,
} from './extended-resource';

export type InferedRequestLoaderParams<T> = Omit<
  ResourceLoaderParams<T>,
  'request'
> & {
  request: T | null;
};

type UndefinedMutationResourceOptions<T, R, TCTX = void> = Omit<
  UndefinedExtendedResourceOptions<T, R | null, TCTX>,
  'loader' | 'request' | 'cache'
> & {
  next?: WritableSignal<NonNullable<NoInfer<R> | null>>;
  loader: (params: InferedRequestLoaderParams<R>) => Observable<T>;
};

type DefinedMutationResourceOptions<T, R, TCTX = void> = Omit<
  DefinedExtendedResourceOptions<T, R | null, TCTX>,
  'loader' | 'request' | 'cache'
> & {
  next?: WritableSignal<NonNullable<NoInfer<R> | null>>;
  loader: (params: InferedRequestLoaderParams<R>) => Observable<T>;
};

type UndefinedMutationResourceRef<T, R> = Omit<
  UndefinedExtendedResourceRef<T, R>,
  'prefetch'
> & {
  next: (request: R) => void;
};

type DefinedMutationResourceRef<T, R> = Omit<
  DefinedExtendedResourceRef<T, R>,
  'prefetch'
> & {
  next: (request: R) => void;
};

export function mutationResource<T, R, TCTX = void>(
  opt: UndefinedMutationResourceOptions<T, R, TCTX>,
): UndefinedMutationResourceRef<T, R>;

export function mutationResource<T, R, TCTX = void>(
  opt: DefinedMutationResourceOptions<T, R, TCTX>,
): DefinedMutationResourceRef<T, R>;

export function mutationResource<T, R, TCTX = void>(
  opt:
    | DefinedMutationResourceOptions<T, R, TCTX>
    | UndefinedMutationResourceOptions<T, R, TCTX>,
): UndefinedMutationResourceRef<T, R> | DefinedMutationResourceRef<T, R> {
  const next = opt.next ?? signal<R | null>(null);

  const resource = extendedResource({
    ...opt,
    request: next,
  });

  return {
    ...resource,
    next: (r) => {
      next.set(r);
    },
  };
}

type UndefinedQueuedMutationResourceOptions<T, R, TCTX = void> = Omit<
  UndefinedMutationResourceOptions<T, R, TCTX>,
  'onError' | 'next'
> & {
  onError?: (error: unknown, ctx: TCTX, isLast: boolean) => void;
};

type DefinedQueuedMutationResourceOptions<T, R, TCTX = void> = Omit<
  DefinedMutationResourceOptions<T, R, TCTX>,
  'onError' | 'next'
> & {
  onError?: (error: unknown, ctx: TCTX, isLast: boolean) => void;
};

export function queuedMutationResource<T, R, TCTX = void>(
  opt: UndefinedQueuedMutationResourceOptions<T, R, TCTX>,
): UndefinedMutationResourceRef<T, R>;

export function queuedMutationResource<T, R, TCTX = void>(
  opt: DefinedQueuedMutationResourceOptions<T, R, TCTX>,
): DefinedMutationResourceRef<T, R>;

export function queuedMutationResource<T, R, TCTX = void>(
  opt:
    | DefinedQueuedMutationResourceOptions<T, R, TCTX>
    | UndefinedQueuedMutationResourceOptions<T, R, TCTX>,
): UndefinedMutationResourceRef<T, R> | DefinedMutationResourceRef<T, R> {
  const queue = mutable<R[]>([]);

  const next = derived<R[], NonNullable<NoInfer<R>> | null>(queue, {
    from: (q) => q.at(0) ?? null,
    onChange: (r) => {
      if (!r) return;
      queue.update((q) => {
        q.push(r);
        return q;
      });
    },
  });

  return mutationResource<T, R, TCTX>({
    ...opt,
    next: next as WritableSignal<NonNullable<NoInfer<R> | null>>,
    onSettled: (v, ctx) => {
      opt.onSettled?.(v, ctx);
      queue.update((q) => {
        q.shift();
        return q;
      });
    },
    onError: (e, ctx) => {
      opt.onError?.(e, ctx, untracked(queue).length === 1);
    },
  });
}
