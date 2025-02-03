import { computed, ResourceLoaderParams, untracked } from '@angular/core';
import { mutable } from '@e7/common/reactivity';
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
  'loader' | 'request' | 'onError'
> & {
  onError?: (error: unknown, last: boolean, ctx: TCTX) => void;
  loader: (params: InferedRequestLoaderParams<R>) => Observable<T>;
};

type DefinedMutationResourceOptions<T, R, TCTX = void> = Omit<
  DefinedExtendedResourceOptions<T, R | null, TCTX>,
  'loader' | 'request' | 'onError'
> & {
  onError?: (error: unknown, last: boolean, ctx: TCTX) => void;
  loader: (params: InferedRequestLoaderParams<R>) => Observable<T>;
};

type UndefinedMutationResourceRef<T, R> = UndefinedExtendedResourceRef<T> & {
  next: (request: R) => void;
};

type DefinedMutationResourceRef<T, R> = DefinedExtendedResourceRef<T> & {
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
  const queue = mutable<R[]>([]);

  const next = computed(() => queue().at(0) ?? null);

  const resource = extendedResource({
    ...opt,
    request: next,
    onSettled: (v, ctx) => {
      opt.onSettled?.(v, ctx);
      queue.mutate((q) => {
        q.shift();
        return q;
      });
    },
    onError: (e, ctx) => {
      opt.onError?.(e, untracked(queue).length === 1, ctx);
    },
  });

  return {
    ...resource,
    next: (r) => {
      queue.mutate((q) => {
        q.push(r);
        return q;
      });
    },
  };
}
