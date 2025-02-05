import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  Signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { DerivedSignal } from '@e7/common/reactivity';
import { v7 } from 'uuid';
import { SharedColumnState } from './column';
import { TableStateValue } from './table.component';

export type CellDef<T, U> = {
  value: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
  disableHide?: () => boolean;
};

export type CellState<T, U> = {
  id: string;
  value: Signal<U>;
  column: SharedColumnState;
  source: Signal<T>;
  show: Signal<boolean>;
  isFirst: Signal<boolean>;
  isLast: Signal<boolean>;
  toggleVisibility: () => void;
  disableHide: Signal<boolean>;
  pinned: Signal<boolean>;
};

export function createCell<T, U>(
  def: CellDef<T, U>,
  source: Signal<T>,
  col: SharedColumnState,
  columnVisibilityState: DerivedSignal<
    TableStateValue,
    Record<string, boolean | undefined>
  >,
  columnOrderState: DerivedSignal<TableStateValue, string[]>,
  pinState: DerivedSignal<TableStateValue, string | null>,
): CellState<T, U> {
  const disableHide = computed(() => def.disableHide?.() ?? false);
  return {
    id: v7(),
    value: computed(() => def.value(source()), {
      equal: def.equal,
    }),
    column: col,
    source,
    isFirst: computed(() => columnOrderState().at(0) === col.name),
    isLast: computed(() => columnOrderState().at(-1) === col.name),
    show: computed(() => columnVisibilityState()[col.name] ?? false),
    disableHide,
    pinned: computed(() => pinState() === col.name),
    toggleVisibility: () => {
      if (untracked(disableHide)) return;
      columnVisibilityState.update((cur) => ({
        ...cur,
        [col.name]: !cur[col.name],
      }));
    },
  };
}

@Component({
  selector: 'app-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.right]': 'right()',
    '[class.pin]': 'state().pinned()',
  },
  imports: [NgTemplateOutlet],
  template: `
    <ng-container
      *ngTemplateOutlet="
        template() ?? defaultCell;
        context: { $implicit: state() }
      "
    />

    <ng-template #defaultCell let-s>
      <span>{{ s.value() }}</span>
    </ng-template>
  `,
  styles: `
    :host {
      padding: 0 16px;
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

      &.pin {
        z-index: 100;
        position: sticky;
        right: 0;
        width: fit-content;
        border-left-width: var(--mat-table-row-item-outline-width, 1px);
        border-left-style: solid;
        border-left-color: var(
          --mat-table-row-item-outline-color,
          rgba(0, 0, 0, 0.12)
        );
      }

      span {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      &.right {
        justify-content: flex-end;
      }
    }
  `,
})
export class CellComponent<T, U> {
  readonly state = input.required<CellState<T, U>>();
  readonly template = input.required<TemplateRef<unknown> | null>();
  readonly right = computed(() => this.state().column.align() === 'right');
}
