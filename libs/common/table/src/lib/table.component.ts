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
  WritableSignal,
} from '@angular/core';
import { createStringState, StringState } from '@e7/common/form';
import { injectSharedT } from '@e7/common/locale';
import { entries } from '@e7/common/object';
import { derived, DerivedSignal } from '@e7/common/reactivity';
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
import { createSortState, SortState, SortValue } from './sort';
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

export type TableStateValue = {
  sort?: SortValue;
  columnFilters?: ColumnFiltersValue;
  pagination?: PaginationValue;
  globalFilter?: string;
  columnVisibility?: Record<string, boolean | undefined>;
  columnOrder?: string[];
  pin?: string;
};

export type TableOptions<T> = {
  columns: ColumnDef<T, any>[];
  initial?: TableStateValue;
  pagination?: PaginationOptions;
};

export type TableState<T> = {
  header: {
    row: HeaderRowState;
    globalFilter: StringState<TableStateValue>;
    hasFilters: Signal<boolean>;
    clearFilters: () => void;
  };
  body: {
    rows: Signal<RowState<T>[]>;
  };
  columnVisibility: DerivedSignal<
    TableStateValue,
    Record<string, boolean | undefined>
  >;
  columnOrder: DerivedSignal<TableStateValue, string[]>;
  columnFilters: ColumnFiltersState;
  sort: SortState;
  pagination: PaginationState;
  pin: DerivedSignal<TableStateValue, string | null>;
};

export function injectCreateTableState() {
  const paginationFactory = injectCreatePaginationState();
  const headerFactory = injectCreateHeaderRowState();
  const t = injectSharedT();
  return <T>(
    state: WritableSignal<TableStateValue>,
    options: TableOptions<T>,
    source: () => T[],
  ): TableState<T> => {
    const ds = computed(() => source());
    const length = computed(() => ds()?.length ?? 0);

    const { fallbackVisibility, fallbackOrder } = options.columns.reduce(
      (acc, c) => {
        acc.fallbackVisibility[c.name] = true;
        acc.fallbackOrder.push(c.name);
        return acc;
      },
      {
        fallbackVisibility: {} as Record<string, boolean | undefined>,
        fallbackOrder: [] as string[],
      },
    );

    const columnVisibility = derived(state, {
      from: (v) => v.columnVisibility ?? fallbackVisibility,
      onChange: (next) =>
        state.update((cur) => ({ ...cur, columnVisibility: next })),
    });

    const columnOrder = derived(state, {
      from: (v) => v.columnOrder ?? fallbackOrder,
      onChange: (next) =>
        state.update((cur) => ({ ...cur, columnOrder: next })),
    });

    const sort = createSortState(
      derived(state, {
        from: (v) => v.sort ?? null,
        onChange: (v) =>
          state.update((cur) => ({ ...cur, sort: v ?? undefined })),
        equal: (a, b) => a?.id === b?.id && a?.direction === b?.direction,
      }),
    );

    const pin = derived(state, {
      from: (v) => v.pin ?? null,
      onChange: (next) =>
        state.update((cur) => ({ ...cur, pin: next ?? undefined })),
    });

    const rows = computed(() =>
      Array.from({ length: length() }).map((_, i) => {
        const state = computed(() => ds()?.[i]);
        return createRowState(
          options.columns,
          state,
          columnOrder,
          columnVisibility,
          pin,
        );
      }),
    );

    const columnFilterState = derived(state, {
      from: (v) => v.columnFilters ?? {},
      onChange: (next) =>
        state.update((cur) => ({ ...cur, columnFilters: next })),
    });

    const globalFilter = createStringState(
      derived(state, {
        from: (v) => v.globalFilter ?? null,
        onChange: (next) =>
          state.update((cur) => ({ ...cur, globalFilter: next ?? undefined })),
      }),
      t,
      {
        label: () => t('shared.search'),
      },
    );

    const hasColumnFilter = computed(() => {
      const stateEntries = entries(columnFilterState());
      if (!stateEntries.length) return false;

      return (
        stateEntries.filter(
          ([, v]) =>
            v.value !== null && v.value !== undefined && v.value !== '',
        ).length > 0
      );
    });

    const hasFilters = computed(
      () => !!globalFilter.value() || hasColumnFilter(),
    );

    const clearFilters = () => {
      globalFilter.value.set(null);
      columnFilterState.set({});
    };

    return {
      header: {
        row: headerFactory(
          options.columns,
          sort,
          columnFilterState,
          columnOrder,
          columnVisibility,
          pin,
        ),
        globalFilter,
        hasFilters,
        clearFilters,
      },
      body: {
        rows,
      },
      sort,
      pin,
      columnVisibility,
      columnFilters: columnFilterState,
      pagination: paginationFactory(
        derived(state, {
          from: (v) => v.pagination ?? { page: 0, size: 10 },
          onChange: (next) =>
            state.update((cur) => ({ ...cur, pagination: next })),
        }),
        length,
        options.pagination,
      ),

      columnOrder,
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
      <app-table-toolbar [state]="state().header" />
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
