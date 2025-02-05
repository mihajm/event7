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
  align?: () => 'left' | 'right';
  disableSort?: () => boolean;
  header?: Partial<HeaderCellDef>;
};

export type SharedColumnState = {
  disableSort: Signal<boolean>;
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
        ...opt.header,
        label: opt.header?.label ?? (() => name),
      } as HeaderCellDef,
      type: 'accessor',
      shared: {
        disableSort: computed(() => opt?.disableSort?.() ?? false),
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
        ...opt.header,
        label: opt.header?.label ?? (() => name),
      } as HeaderCellDef,
      type: 'display',
      shared: {
        disableSort: computed(() => opt?.disableSort?.() ?? false),
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
