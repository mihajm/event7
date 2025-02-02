import { Signal, untracked, WritableSignal } from '@angular/core';

export function toWritable<T>(
  source: Signal<T>,
  set: WritableSignal<T>['set'],
  update?: WritableSignal<T>['update'],
): WritableSignal<T> {
  const sig = source as WritableSignal<T>;

  sig.set = set;
  sig.update = update ?? ((fn) => sig.set(fn(untracked(sig))));
  sig.asReadonly = () => source;

  return sig;
}
