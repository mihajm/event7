/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  Signal,
} from '@angular/core';
import { ColumnDef } from './column';
import { createHeaderRowState, createRowState, RowState } from './row';

export type TableOptions<T> = {
  columns: ColumnDef<T, any>[];
};

export type TableState<T> = {
  header: {
    row: RowState<T>;
  };
  body: {
    rows: Signal<RowState<T>[]>;
  };
};

export function createTableState<T>(
  options: TableOptions<T>,
  source: () => T[],
): TableState<T> {
  const ds = computed(() => source());
  const length = computed(() => ds()?.length ?? 0);

  const rows = computed(() =>
    Array.from({ length: length() }).map((_, i) => {
      const state = computed(() => ds()?.[i]);
      return createRowState(options.columns, state);
    }),
  );

  return {
    header: {
      row: createHeaderRowState(options.columns),
    },
    body: {
      rows,
    },
  };
}

@Component({
  selector: 'app-table',
  imports: [],
  template: `
    <table>
      <thead>
        <tr>
          @for (col of state().header.row.columns(); track col.id) {
            <th>{{ col.value() }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of state().body.rows(); track row.id) {
          <tr>
            @for (col of row.columns(); track col.id) {
              <td>{{ col.value() }}</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T> {
  readonly state = input.required<TableState<T>>();
}
