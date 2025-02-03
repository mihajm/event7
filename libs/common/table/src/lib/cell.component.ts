import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  Signal,
  TemplateRef,
} from '@angular/core';
import { v7 } from 'uuid';
import { SharedColumnState } from './column';

export type CellDef<T, U> = {
  value: (row: T) => U;
  equal?: (a: U, b: U) => boolean;
};

export type CellState<T, U> = {
  id: string;
  value: Signal<U>;
  column: SharedColumnState;
  source: Signal<T>;
};

export function createCell<T, U>(
  def: CellDef<T, U>,
  source: Signal<T>,
  col: SharedColumnState,
): CellState<T, U> {
  return {
    id: v7(),
    value: computed(() => def.value(source()), {
      equal: def.equal,
    }),
    column: col,
    source,
  };
}

@Component({
  selector: 'app-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.right]': 'right()',
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
