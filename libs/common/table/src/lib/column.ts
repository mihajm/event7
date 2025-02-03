import { computed, Signal } from '@angular/core';
import { CellDef } from './cell.component';
import { HeaderCellDef } from './header-cell.component';

export type ColumnDef<T, U> = {
  name: string;
  cell: CellDef<T, U>;
  header: HeaderCellDef;
  type: 'display' | 'accessor';
  shared: SharedColumnState;
};

type ColumnOptions = {
  label?: () => string;
  align?: () => 'left' | 'right';
};

export type SharedColumnState = {
  align: Signal<'left' | 'right'>;
  name: string;
};

export function createColumnHelper<T>() {
  const accessor = <U>(
    name: string,
    fn: (val: T) => U,
    opt: ColumnOptions,
  ): ColumnDef<T, U> => {
    return {
      name,
      cell: {
        value: fn,
      },
      header: {
        label: opt.label ?? (() => name),
      },
      type: 'accessor',
      shared: {
        align: computed(opt.align ?? (() => 'left')),
        name,
      },
    };
  };

  const display = (name: string, opt: ColumnOptions): ColumnDef<T, string> => {
    return {
      name,
      cell: {
        value: () => '',
      },
      header: {
        label: opt.label ?? (() => name),
      },
      type: 'display',
      shared: {
        align: computed(opt.align ?? (() => 'left')),
        name,
      },
    };
  };

  return {
    accessor,
    display,
  };
}
