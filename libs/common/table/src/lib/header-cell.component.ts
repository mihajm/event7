import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { v7 } from 'uuid';
import { CellState } from './cell.component';
import { SharedColumnState } from './column';

export type HeaderCellDef = {
  label: () => string;
};

export function createHeaderCell(
  def: HeaderCellDef,
  col: SharedColumnState,
): Omit<CellState<unknown, string>, 'source'> {
  return {
    id: v7(),
    value: computed(() => def.label?.() ?? ''),
    column: col,
  };
}

@Component({
  selector: 'app-header-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.right]': 'right()',
  },
  template: `<span>{{ state().value() }}</span>`,
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
export class HeaderCellComponent {
  readonly state = input.required<Omit<CellState<unknown, string>, 'source'>>();

  readonly right = computed(() => this.state().column.align() === 'right');
}
