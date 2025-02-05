/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Signal,
} from '@angular/core';
import { v7 } from 'uuid';
import { CellState, createCell } from './cell.component';
import { ColumnDef } from './column';
import {
  ColumnFiltersState,
  ColumnFiltersValue,
  HeaderCellState,
  injectCreateHeaderCell,
} from './header-cell.component';
import { SortState } from './sort';

export type RowState<T> = {
  id: string;
  source: Signal<T>;
  columns: Signal<CellState<T, any>[]>;
};

export type HeaderRowState = {
  id: string;
  columns: Signal<HeaderCellState[]>;
};

export function createRowState<T>(
  defs: ColumnDef<T, any>[],
  source: Signal<T>,
): RowState<T> {
  return {
    id: v7(),
    source,
    columns: computed(() =>
      defs.map((def) => createCell(def.cell, source, def.shared)),
    ),
  };
}

export function injectCreateHeaderRowState() {
  const createCell = injectCreateHeaderCell();

  return <T>(
    defs: ColumnDef<T, any>[],
    sort: SortState,
    columnFilters: ColumnFiltersState,
    onColumnFiltersChange?: (filters: ColumnFiltersValue) => void,
  ): HeaderRowState => {
    return {
      id: v7(),
      columns: computed(() =>
        defs.map((def) =>
          createCell(
            def.header,
            def.shared,
            sort,
            columnFilters,
            onColumnFiltersChange,
          ),
        ),
      ),
    };
  };
}

@Component({
  selector: 'app-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: flex;
      text-decoration: none;
      background: inherit;
      font-family: var(
        --mat-table-row-item-label-text-font,
        Roboto,
        sans-serif
      );
      line-height: var(--mat-table-row-item-label-text-line-height, 1.25rem);
      font-size: var(--mat-table-row-item-label-text-size, 14px);
      font-weight: var(--mat-table-row-item-label-text-weight, 400);
      height: var(--mat-table-row-item-container-height, 52px);
      min-height: var(--mat-table-row-item-container-height, 56px);
      color: var(--mat-table-row-item-label-text-color, rgba(0, 0, 0, 0.87));

      &.odd {
        background-color: var(
          --app-table-odd-row-background-color,
          var(--mat-autocomplete-background-color, #efedf1)
        );
      }
    }
  `,
})
export class RowComponent {}
