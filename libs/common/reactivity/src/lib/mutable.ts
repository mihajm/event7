import {
  computed,
  CreateSignalOptions,
  signal,
  ValueEqualityFn,
  WritableSignal,
} from '@angular/core';

const { is } = Object;

export type MutableSignal<T> = WritableSignal<T> & {
  mutate: WritableSignal<T>['update'];
  equal: ValueEqualityFn<T | undefined>;
};

export function mutable<T>(): MutableSignal<T | undefined>;
export function mutable<T>(initial: T): MutableSignal<T>;

export function mutable<T>(
  initial?: T,
  opt?: CreateSignalOptions<T>,
): MutableSignal<T> {
  const baseEquals = opt?.equal ?? is;

  let trigger = false;

  const equal: ValueEqualityFn<T | undefined> = (a, b) => {
    if (trigger) return false;
    if (a == undefined && b == undefined) return true;
    if (a == undefined || b == undefined) return false;
    return baseEquals(a, b);
  };

  const sig = signal<T | undefined>(initial, {
    ...opt,
    equal,
  }) as MutableSignal<T>;

  sig.mutate = (val) => {
    trigger = true;
    sig.update(val);
    trigger = false;
  };

  sig.equal = equal;

  return sig;
}

export function stableMutable<T>(
  source: MutableSignal<T>,
  identity: (value: T) => string | number,
): MutableSignal<T> {
  const stable = computed(
    () => {
      const value = source();

      return {
        value,
        identity: identity(value),
      };
    },
    {
      equal: (a, b) => a.identity === b.identity,
    },
  );

  const out = computed(() => stable().value, {
    equal: () => false,
  }) as MutableSignal<T>;

  out.set = source.set;
  out.update = source.update;
  out.mutate = source.mutate;
  out.equal = source.equal;
  out.asReadonly = source.asReadonly;

  return out;
}
