import { computed } from '@angular/core';
import { v7 } from 'uuid';
import { CellState } from './cell';

export type HeaderCellDef = {
  label: () => string;
};

export function createHeaderCell(def: HeaderCellDef): CellState<string> {
  return {
    id: v7(),
    value: computed(() => def.label?.() ?? ''),
  };
}
