import { signal, Signal } from '@angular/core';

export type SortValue = {
  id: string;
  direction: 'asc' | 'desc';
};

export type SortOptions = {
  onSortChange?: (v?: SortValue) => void;
};

export type SortState = {
  value: Signal<SortValue | undefined>;
  set: (value?: SortValue) => void;
};

export function createSortState(prev?: SortValue, opt?: SortOptions) {
  const value = signal(prev, {
    equal: (a, b) => a?.id === b?.id && a?.direction === b?.direction,
  });

  return {
    value,
    set: (next?: SortValue) => {
      opt?.onSortChange?.(next);
      value.set(next);
    },
  };
}
