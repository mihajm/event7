/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  Signal,
  TemplateRef,
} from '@angular/core';
import { mutable } from '@e7/common/reactivity';
import { CellState } from './cell.component';
import { ColumnDef } from './column';
import {
  ColumnFiltersState,
  ColumnFiltersValue,
} from './header-cell.component';
import {
  createRowState,
  HeaderRowState,
  injectCreateHeaderRowState,
  RowState,
} from './row.component';
import { createSortState, SortOptions, SortState, SortValue } from './sort';
import { TableBodyComponent } from './table-body.component';
import { TableHeadComponent } from './table-head.component';
import {
  injectCreatePaginationState,
  PaginationOptions,
  PaginationState,
  PaginationValue,
  TablePaginatorComponent,
} from './table-paginator.component';
import { TableTooblarComponent } from './table-toolbar.component';

function toCellMap<
  T extends { id: Signal<string>; template: TemplateRef<unknown> },
>(cells: readonly T[]): Record<string, T['template']> {
  return cells.reduce(
    (acc, c) => {
      acc[c.id()] = c.template;
      return acc;
    },
    {} as Record<string, T['template']>,
  );
}

export type TableValue = {
  sort?: SortValue;
  columnFilters?: ColumnFiltersValue;
  pagination?: PaginationValue;
};

export type TableOptions<T> = {
  columns: ColumnDef<T, any>[];
  initial?: TableValue;
  pagination?: PaginationOptions;
  sort?: SortOptions;
  columnFilters?: {
    onColumnFiltersChange?: (filters: ColumnFiltersValue) => void;
  };
};

export type TableState<T> = {
  header: {
    row: HeaderRowState;
  };
  body: {
    rows: Signal<RowState<T>[]>;
  };
  columnFilters: ColumnFiltersState;
  sort: SortState;
  pagination: PaginationState;
};

export function injectCreateTableState() {
  const paginationFactory = injectCreatePaginationState();
  const headerFactory = injectCreateHeaderRowState();
  return <T>(
    initial: TableValue | undefined,
    options: TableOptions<T>,
    source: () => T[],
  ): TableState<T> => {
    const ds = computed(() => source());
    const length = computed(() => ds()?.length ?? 0);

    const sort = createSortState(initial?.sort, options.sort);

    const rows = computed(() =>
      Array.from({ length: length() }).map((_, i) => {
        const state = computed(() => ds()?.[i]);
        return createRowState(options.columns, state);
      }),
    );

    const columnFilterState = mutable(initial?.columnFilters ?? {});

    return {
      header: {
        row: headerFactory(
          options.columns,
          sort,
          columnFilterState,
          options.columnFilters?.onColumnFiltersChange,
        ),
      },
      body: {
        rows,
      },
      sort,
      columnFilters: columnFilterState,
      pagination: paginationFactory(
        initial?.pagination,
        length,
        options.pagination,
      ),
    };
  };
}

@Directive({
  selector: '[appCell]',
})
export class CellDirective {
  readonly id = input.required<string>({ alias: 'appCell' });
  readonly template = inject(TemplateRef);

  static ngTemplateGuard_marCell<T, U>(
    _: CellDirective,
    state: unknown,
  ): state is {
    $implicit: CellState<T, U>;
  } {
    return true;
  }
}

@Component({
  selector: 'app-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableTooblarComponent,
    TablePaginatorComponent,
    TableHeadComponent,
    TableBodyComponent,
  ],
  template: `
    <header>
      <app-table-toolbar />
    </header>
    <div class="table-container">
      <div class="table">
        <app-table-head [state]="state().header" />
        <app-table-body [state]="state().body" [cellMap]="cellMap()" />
      </div>
    </div>
    <footer>
      <app-table-paginator [state]="state().pagination" />
    </footer>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
      width: 100%;
      height: 100%;
      overflow: hidden;

      header {
        padding-top: var(--app-table-header-padding-top, 3px);
        padding-bottom: var(--app-table-header-padding-bottom, 8px);
        padding-left: var(--app-table-header-padding-left, 0);
        padding-right: var(--app-table-header-padding-right, 0);
      }

      div.table-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;

        div.table {
          display: flex;
          flex-direction: column;
          background: var(--mat-table-background-color, #fdfbff);
          table-layout: auto;
          white-space: normal;
          min-width: 100%;
          border: 0;
          border-spacing: 0;
          border-collapse: collapse;
          width: fit-content;
        }

        &:has(app-table-empty) {
          background: var(--mat-autocomplete-background-color, #efedf1);
        }
      }
    }
  `,
})
export class TableComponent<T> {
  readonly state = input.required<TableState<T>>();

  private readonly cells = contentChildren(CellDirective, {
    descendants: true,
  });

  protected readonly cellMap = computed(() => toCellMap(this.cells()));
}
