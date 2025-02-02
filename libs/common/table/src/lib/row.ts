/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, Signal } from '@angular/core';
import { v7 } from 'uuid';
import { CellState, createCell } from './cell';
import { ColumnDef } from './column';
import { createHeaderCell } from './header-cell';

export type RowState<T> = {
  id: string;
  source?: Signal<T>;
  columns: Signal<CellState<any>[]>;
};

export function createRowState<T>(
  defs: ColumnDef<T, any>[],
  source: Signal<T>,
): RowState<T> {
  return {
    id: v7(),
    source,
    columns: computed(() => defs.map((def) => createCell(def.cell, source))),
  };
}

export function createHeaderRowState<T>(
  defs: ColumnDef<T, any>[],
): RowState<T> {
  return {
    id: v7(),
    columns: computed(() => defs.map((def) => createHeaderCell(def.header))),
  };
}
