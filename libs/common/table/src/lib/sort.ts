import { Signal } from '@angular/core';
import { DerivedSignal } from '@e7/common/reactivity';
import { TableStateValue } from './table.component';

export type SortValue = {
  id: string;
  direction: 'asc' | 'desc';
};

export type SortState = {
  value: Signal<SortValue | null>;
  set: (value: SortValue | null) => void;
};

export function createSortState(
  value: DerivedSignal<TableStateValue, SortValue | null>,
): SortState {
  return {
    value,
    set: value.set,
  };
}
