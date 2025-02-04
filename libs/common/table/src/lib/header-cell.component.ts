import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { v7 } from 'uuid';
import { CellState } from './cell.component';
import { SharedColumnState } from './column';
import { SortState, SortValue } from './sort';

export type HeaderCellDef = {
  label: () => string;
};

export type HeaderCellState = Omit<CellState<unknown, string>, 'source'> & {
  sort: SortState;
};

export function createHeaderCell(
  def: HeaderCellDef,
  col: SharedColumnState,
  sort: SortState,
): HeaderCellState {
  return {
    id: v7(),
    value: computed(() => def.label?.() ?? ''),
    column: col,
    sort,
  };
}

@Component({
  selector: 'app-header-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.right]': 'right()',
  },
  imports: [MatIconButton, MatIcon],
  template: `
    <div>
      <span>{{ state().value() }}</span>
      <button
        type="button"
        mat-icon-button
        [disabled]="state().column.disableSort()"
        [class.active]="!!sortState()"
        (click)="state().sort.set(nextSort())"
      >
        <mat-icon>{{ sortIcon() }}</mat-icon>
      </button>
    </div>
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

      div {
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

      &:hover {
        div button {
          opacity: 1;
        }
      }

      &.right {
        justify-content: flex-end;

        div {
          justify-content: flex-start;
          flex-direction: row-reverse;
        }
      }
    }
  `,
})
export class HeaderCellComponent {
  readonly state = input.required<HeaderCellState>();

  readonly right = computed(() => this.state().column.align() === 'right');

  protected readonly sortState = computed(() => {
    const sort = this.state().sort.value();
    if (!sort || sort.id !== this.state().column.name) return null;
    return sort.direction;
  });

  protected readonly sortIcon = computed(() =>
    this.sortState() === 'desc' ? 'arrow_downward' : 'arrow_upward',
  );

  protected readonly nextSort = computed((): SortValue | undefined => {
    const id = this.state().column.name;
    if (this.sortState() === null) return { id, direction: 'asc' };
    if (this.sortState() === 'asc') return { id, direction: 'desc' };
    return undefined;
  });
}
