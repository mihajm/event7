import { CellDef } from './cell';
import { HeaderCellDef } from './header-cell';

export type ColumnDef<T, U> = {
  name: string;
  cell: CellDef<T, U>;
  header: HeaderCellDef;
};

export function createColumnHelper<T>() {
  const display = <U>(
    name: string,
    fn: (val: T) => U,
    label?: () => string,
  ): ColumnDef<T, U> => {
    return {
      name,
      cell: {
        value: fn,
      },
      header: {
        label: label ?? (() => name),
      },
    };
  };

  return {
    display,
  };
}
