import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
} from '@angular/core';
import { CellComponent } from './cell.component';
import { RowComponent } from './row.component';
import { TableEmptyComponent } from './table-empty.component';
import { TableState } from './table.component';

@Component({
  selector: 'app-table-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RowComponent, CellComponent, TableEmptyComponent],
  template: `
    @for (row of state().rows(); track row.id; let odd = $odd) {
      <app-row [class.odd]="odd">
        @for (col of row.visibleColumns(); track col.id) {
          <app-cell
            [state]="col"
            [template]="cellMap()[col.column.name] ?? null"
          />
        }
      </app-row>
    } @empty {
      <app-table-empty />
    }
  `,
  styles: `
    :host {
      display: contents;

      background: inherit;
      -moz-osx-font-smoothing: grayscale;
      -webkit-font-smoothing: antialiased;
      font-family: var(
        --mat-table-row-item-label-text-font,
        Roboto,
        sans-serif
      );
      font-size: var(--mat-table-row-item-label-text-size, 14px);
      line-height: var(--mat-table-row-item-label-text-line-height, 1.25rem);
      font-size: var(--mat-table-row-item-label-text-size, 14px);
      font-weight: var(--mat-table-row-item-label-text-weight, 400);
    }
  `,
})
export class TableBodyComponent<T> {
  readonly state = input.required<TableState<T>['body']>();
  readonly cellMap =
    input.required<Record<string, TemplateRef<unknown> | undefined>>();
}
