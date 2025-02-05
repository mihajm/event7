import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  Signal,
  untracked,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  createDateState,
  createNumberState,
  createSelectState,
  createStringState,
  FieldComponent,
  FieldState,
  formGroup,
  FormGroupSignal,
  SelectState,
} from '@e7/common/form';
import { injectSharedT, SharedTranslator } from '@e7/common/locale';
import { entries } from '@e7/common/object';
import { derived, DerivedSignal } from '@e7/common/reactivity';
import { v7 } from 'uuid';
import { CellState } from './cell.component';
import { SharedColumnState } from './column';
import { SortState, SortValue } from './sort';
import { TableStateValue } from './table.component';

const GENERIC_FILTER_MATCHERS = ['eq', 'neq'] as const;
const STRING_FILTER_MATCHERS = [
  ...GENERIC_FILTER_MATCHERS,
  'ilike',
  'nilike',
] as const;
const NUMBER_FILTER_MATCHERS = [
  ...GENERIC_FILTER_MATCHERS,
  'gt',
  'lt',
  'gte',
  'lte',
] as const;

const DATE_FILTER_MATCHERS = [
  'eqd',
  'neqd',
  ...NUMBER_FILTER_MATCHERS,
] as const;

type StringFilterMatcher = (typeof STRING_FILTER_MATCHERS)[number];

type NumberFilterMatcher = (typeof NUMBER_FILTER_MATCHERS)[number];
type DateFilterMatcher = (typeof DATE_FILTER_MATCHERS)[number];

type StringFilterValue = {
  value: string | null;
  valueType: 'string';
  matcher: StringFilterMatcher;
};

type NumberFilterValue = {
  value: number | null;
  valueType: 'number';
  matcher: NumberFilterMatcher;
};

type DateFilterValue = {
  value: Date | null;
  valueType: 'date';
  matcher: DateFilterMatcher;
};

type FilterValue = StringFilterValue | NumberFilterValue | DateFilterValue;

const matchers = {
  string: STRING_FILTER_MATCHERS,
  number: NUMBER_FILTER_MATCHERS,
  date: DATE_FILTER_MATCHERS,
} satisfies Record<FilterValue['valueType'], readonly FilterValue['matcher'][]>;

export type ColumnFiltersValue = Record<string, FilterValue>;

export type ColumnFiltersState = DerivedSignal<
  TableStateValue,
  ColumnFiltersValue
>;

export type HeaderCellDef<TFilter extends FilterValue = FilterValue> = {
  label: () => string;
  filter?: Omit<TFilter, 'value'> & {
    options?: {
      values: () => TFilter['value'][];
      display?: (v: TFilter['value'] | null) => string;
    };
  };
  disableHide?: () => boolean;
};

type ColumnFilterStateChildren<T extends FilterValue> = {
  matcher: SelectState<T['matcher'], T>;
  value: FieldState<T['value'], T>;
};

type ColumnFilterState<T extends FilterValue = FilterValue> = FormGroupSignal<
  T,
  ColumnFilterStateChildren<T>
>;

export type HeaderCellState = Omit<CellState<unknown, string>, 'source'> & {
  sort: SortState;
  filter: ColumnFilterState;
  hideColumn: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveToStart: () => void;
  moveToEnd: () => void;
};

function createMatcherTranslator(t: SharedTranslator) {
  const translations = {
    eq: t('shared.table.filter.eq'),
    neq: t('shared.table.filter.neq'),
    ilike: t('shared.table.filter.ilike'),
    nilike: t('shared.table.filter.nilike'),
    gt: t('shared.table.filter.gt'),
    lt: t('shared.table.filter.lt'),
    gte: t('shared.table.filter.gte'),
    lte: t('shared.table.filter.lte'),
    eqd: t('shared.table.filter.eqd'),
    neqd: t('shared.table.filter.neqd'),
  } satisfies Record<FilterValue['matcher'], string | undefined>;

  return (value: FilterValue['matcher']): string => {
    return translations[value] ?? value;
  };
}

export function toServerFilters(
  filters?: ColumnFiltersValue,
): Record<string, string | number | Date | string[] | number[] | Date[]> {
  if (!filters) return {};

  const parsed: Record<
    string,
    string | number | Date | string[] | number[] | Date[]
  > = {};

  for (const [name, value] of entries(filters)) {
    if (
      !name ||
      value.value === undefined ||
      value.value === null ||
      value.value === ''
    )
      continue;
    const key = `${name}.${value.matcher}`;
    if (value.valueType === 'date') {
      const dateVal =
        typeof value.value === 'string' ? new Date(value.value) : value.value;

      parsed[key] = dateVal.toISOString();
    } else {
      parsed[key] = value.value;
    }
  }

  return parsed;
}

function injectCreateHeaderFilter() {
  const locale = inject(LOCALE_ID);
  const t = injectSharedT();
  const matcherTranslator = createMatcherTranslator(t);

  return (
    label: Signal<string>,
    columnFiltersState: ColumnFiltersState,
    name: string,
    filter?: FilterValue,
    options?: {
      values: () => FilterValue['value'][];
      display?: (v: FilterValue['value'] | null) => string;
    },
  ): ColumnFilterState => {
    const initialState = filter ?? {
      valueType: 'string',
      matcher: 'eq',
      value: null,
    };

    type ThisFilter = typeof initialState;

    const baseState = derived(columnFiltersState, {
      from: (v) => v[name] ?? initialState,
      onChange: (next) => {
        columnFiltersState.update((cur) => ({ ...cur, [name]: next }));
      },
    }) as unknown as DerivedSignal<ColumnFiltersState, ThisFilter>;

    const matcher = createSelectState(
      derived(baseState, {
        from: (v) => v.matcher,
        onChange: (next) => {
          baseState.update((cur) => ({ ...cur, matcher: next }) as ThisFilter);
        },
      }),
      t,
      {
        options: () =>
          (matchers[initialState.valueType] ??
            GENERIC_FILTER_MATCHERS ??
            []) as unknown as ThisFilter['matcher'][],
        display: () => (v) => (v ? matcherTranslator(v) : ''),
      },
    );

    const createValueState = (): FieldState<
      ThisFilter['value'],
      ThisFilter
    > => {
      const valueDerivation =
        filter?.valueType === 'date'
          ? derived(baseState, {
              from: (v) => {
                if (typeof v.value === 'string') return new Date(v.value);
                return v.value;
              },
              onChange: (next) =>
                baseState.update(
                  (cur) => ({ ...cur, value: next }) as ThisFilter,
                ),
            })
          : derived(baseState, {
              from: (v) => v.value,
              onChange: (next) =>
                baseState.update(
                  (cur) => ({ ...cur, value: next }) as ThisFilter,
                ),
            });

      if (options)
        return createSelectState(valueDerivation, t, {
          options: () => options.values() ?? [],
          display: () => options.display as (v: ThisFilter['value']) => string,
          label,
        });

      switch (initialState.valueType) {
        case 'string':
          return createStringState(
            valueDerivation as DerivedSignal<FilterValue, string>,
            t,
            {
              label,
              disable: () => !filter,
            },
          );
        case 'number':
          return createNumberState(
            valueDerivation as DerivedSignal<FilterValue, number>,
            t,
            {
              label,
            },
          );
        case 'date':
          return createDateState(
            valueDerivation as DerivedSignal<FilterValue, Date>,
            locale,
            t,
            {
              label,
            },
          );
        default:
          return createStringState(
            valueDerivation as DerivedSignal<FilterValue, string>,
            t,
            {
              label,
              disable: () => true,
            },
          );
      }
    };

    const children = {
      matcher,
      value: createValueState(),
    };

    return formGroup<ThisFilter, ColumnFilterStateChildren<ThisFilter>>(
      baseState,
      children,
    );
  };
}

export function injectCreateHeaderCell() {
  const factory = injectCreateHeaderFilter();
  return (
    def: HeaderCellDef,
    col: SharedColumnState,
    sort: SortState,
    columnFiltersState: ColumnFiltersState,
    columnVisibilityState: DerivedSignal<
      TableStateValue,
      Record<string, boolean | undefined>
    >,
    columnOrderState: DerivedSignal<TableStateValue, string[]>,
  ): HeaderCellState => {
    const disableHide = computed(() => def.disableHide?.() ?? false);
    const label = computed(() => def.label() ?? '');
    return {
      id: v7(),
      value: label,
      column: col,
      sort,
      filter: factory(
        label,
        columnFiltersState,
        col.name,
        { ...def.filter, value: null } as FilterValue,
        def.filter?.options,
      ),
      disableHide,
      isFirst: computed(() => columnOrderState().at(0) === col.name),
      isLast: computed(() => columnOrderState().at(-1) === col.name),
      show: computed(() => columnVisibilityState()[col.name] ?? false),
      hideColumn: () => {
        if (untracked(disableHide)) return;
        columnVisibilityState.update((cur) => ({ ...cur, [col.name]: false }));
      },
      toggleVisibility: () => {
        if (untracked(disableHide)) return;
        columnVisibilityState.update((cur) => ({
          ...cur,
          [col.name]: !cur[col.name],
        }));
      },
      moveLeft: () => {
        columnOrderState.update((cur) => {
          const idx = cur.indexOf(col.name);
          if (idx === -1 || idx === 0) return cur;
          const next = [...cur];
          moveItemInArray(next, idx, idx - 1);
          return next;
        });
      },
      moveRight: () => {
        columnOrderState.update((cur) => {
          const idx = cur.indexOf(col.name);
          if (idx === -1 || idx === cur.length - 1) return cur;
          const next = [...cur];
          moveItemInArray(next, idx, idx + 1);
          return next;
        });
      },
      moveToStart: () => {
        columnOrderState.update((cur) => {
          const idx = cur.indexOf(col.name);
          if (idx === -1 || idx === 0) return cur;
          const next = [...cur];
          next.splice(idx, 1);
          next.unshift(col.name);
          return next;
        });
      },
      moveToEnd: () => {
        columnOrderState.update((cur) => {
          const idx = cur.indexOf(col.name);
          if (idx === -1 || idx === cur.length - 1) return cur;
          const next = [...cur];
          next.splice(idx, 1);
          next.push(col.name);
          return next;
        });
      },
    };
  };
}

@Component({
  selector: 'app-header-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.right]': 'right()',
  },
  imports: [MatIconButton, MatIcon, FieldComponent, MatMenuModule],
  template: `
    <div class="container">
      <app-field
        [state]="state().filter.children.value"
        subscriptSizing="dynamic"
        [align]="state().column.align()"
      />
      <div class="actions">
        <button
          type="button"
          mat-icon-button
          [disabled]="state().column.disableSort()"
          [class.active]="!!sortState()"
          (click)="state().sort.set(nextSort())"
        >
          <mat-icon>{{ sortIcon() }}</mat-icon>
        </button>
        <button type="button" mat-icon-button [matMenuTriggerFor]="cellMenu">
          <mat-icon>more_vert</mat-icon>
        </button>
      </div>
    </div>

    <mat-menu #cellMenu>
      <button type="button" mat-menu-item [matMenuTriggerFor]="matcherMenu">
        {{ matcher }}
      </button>
      <button type="button" mat-menu-item [matMenuTriggerFor]="orderMenu">
        {{ order }}
      </button>
      <button
        type="button"
        mat-menu-item
        (click)="state().hideColumn()"
        [disabled]="state().disableHide()"
      >
        {{ hideColumn }}
      </button>
    </mat-menu>

    <mat-menu #orderMenu>
      <button type="button" mat-menu-item (click)="state().moveToStart()">
        {{ moveToStart }}
      </button>
      <button type="button" mat-menu-item (click)="state().moveLeft()">
        {{ moveLeft }}
      </button>
      <button type="button" mat-menu-item (click)="state().moveRight()">
        {{ moveRight }}
      </button>
      <button type="button" mat-menu-item (click)="state().moveToEnd()">
        {{ moveToEnd }}
      </button>
    </mat-menu>

    <mat-menu #matcherMenu>
      @for (
        matcher of state().filter.children.matcher.options();
        track matcher.id
      ) {
        @let active = matcher.value === state().filter.children.matcher.value();
        <button
          type="button"
          mat-menu-item
          [disabled]="matcher.disabled()"
          [class.active]="active"
          (click)="state().filter.children.matcher.value.set(matcher.value)"
        >
          <span>{{ matcher.label() }}</span>

          @if (active) {
            <mat-icon>check</mat-icon>
          } @else {
            <mat-icon />
          }
        </button>
      }
    </mat-menu>
  `,
  styles: `
    :host {
      display: contents;
      text-align: inherit;

      background: inherit;
      border-bottom-color: var(
        --mat-table-row-item-outline-color,
        rgba(0, 0, 0, 0.12)
      );
      border-bottom-width: var(--mat-table-row-item-outline-width, 1px);
      border-bottom-style: solid;
      letter-spacing: var(--mat-table-row-item-label-text-tracking, 0.01625em);
      line-height: inherit;
      box-sizing: border-box;
      text-align: left;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex: 1;
      min-width: 200px;

      div.container {
        text-align: inherit;

        ::ng-deep app-field {
          text-align: inherit;
          mat-form-field,
          input,
          label,
          app-string-field,
          app-date-field,
          app-number-field,
          app-select-field {
            text-align: inherit;
          }
        }

        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 1ch;

        button {
          transition: opacity 0.2s;
          scale: 0.6;
          opacity: 0;

          &.active {
            opacity: 1;
          }
        }

        span {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
      }

      div.actions {
        display: flex;
        align-items: center;
      }

      &:hover {
        div.container button {
          opacity: 1;
        }
      }

      &.right {
        justify-content: flex-end;

        div.container {
          justify-content: flex-end;
          flex-direction: row-reverse;

          div.actions {
            flex-direction: row-reverse;
          }
        }
      }
    }

    button[mat-menu-item].active {
      color: var(--mat-sys-primary, #005cbb);

      mat-icon {
        color: var(--mat-sys-primary, #005cbb);
      }
    }
  `,
})
export class HeaderCellComponent {
  private readonly t = injectSharedT();
  readonly state = input.required<HeaderCellState>();

  protected readonly matcher = this.t('shared.table.filter.matcher');
  protected readonly hideColumn = this.t('shared.table.visibility.hideColumn');
  protected readonly order = this.t('shared.table.order.order');
  protected readonly moveLeft = this.t('shared.table.order.moveLeft');
  protected readonly moveRight = this.t('shared.table.order.moveRight');
  protected readonly moveToStart = this.t('shared.table.order.moveToStart');
  protected readonly moveToEnd = this.t('shared.table.order.moveToEnd');

  readonly right = computed(() => this.state().column.align() === 'right');

  protected readonly sortState = computed(() => {
    const sort = this.state().sort.value();
    if (!sort || sort.id !== this.state().column.name) return null;
    return sort.direction;
  });

  protected readonly sortIcon = computed(() =>
    this.sortState() === 'desc' ? 'arrow_downward' : 'arrow_upward',
  );

  protected readonly nextSort = computed((): SortValue | null => {
    const id = this.state().column.name;
    if (this.sortState() === null) return { id, direction: 'asc' };
    if (this.sortState() === 'asc') return { id, direction: 'desc' };
    return null;
  });
}
