import {
  computed,
  CreateSignalOptions,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { toWritable } from './to-writable';

export type DerivedSignalOptions<TParent, TDerivation> =
  CreateSignalOptions<TDerivation> & {
    from: (parent: TParent) => TDerivation;
    onChange: (value: TDerivation) => void;
  };

export type DerivedSignal<TParent, TDerivation> =
  WritableSignal<TDerivation> & {
    from: DerivedSignalOptions<TParent, TDerivation>['from'];
  };

export function derived<TParent, TDerivation>(
  parent: Signal<TParent>,
  opt: DerivedSignalOptions<TParent, TDerivation>,
): DerivedSignal<TParent, TDerivation> {
  const writable = toWritable(
    computed(() => opt.from(parent()), {
      ...opt,
    }),
    opt.onChange,
  ) as DerivedSignal<TParent, TDerivation>;

  writable.from = opt.from;
  return writable;
}

export function toFakeDerivation<TParent, TDerivation>(
  initial: TDerivation,
): DerivedSignal<TParent, TDerivation> {
  const sig = signal(initial) as DerivedSignal<TParent, TDerivation>;
  sig.from = () => initial;

  return sig;
}
