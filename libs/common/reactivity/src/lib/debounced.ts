import { Signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

export function debounced<T>(value: Signal<T>, dt = 300): Signal<T> {
  return toSignal(toObservable(value).pipe(debounceTime(dt)), {
    initialValue: untracked(value),
  });
}
