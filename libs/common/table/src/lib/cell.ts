import { computed, Signal } from '@angular/core';
import { v7 } from 'uuid';

export type CellDef<T, U> = {
  value: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
};

export type CellState<U> = {
  id: string;
  value: Signal<U>;
};

export function createCell<T, U>(
  def: CellDef<T, U>,
  source: Signal<T>,
): CellState<U> {
  return {
    id: v7(),
    value: computed(() => def.value(source()), {
      equal: def.equal,
    }),
  };
}
