import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeaderCellComponent } from './header-cell.component';
import { RowComponent } from './row.component';
import { TableState } from './table.component';

@Component({
  selector: 'app-table-head',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RowComponent, HeaderCellComponent],
  template: `
    <app-row>
      @for (col of state().row.visibleColumns(); track col.id) {
        <app-header-cell [state]="col" />
      }
    </app-row>
  `,
  styles: `
    :host {
      z-index: 500;
      padding-top: 10px;
      position: sticky;
      top: 0;

      display: flex;
      flex-direction: column;

      background: inherit;

      --mdc-outlined-text-field-label-text-font: var(
        --mat-table-header-headline-font,
        Roboto,
        sans-serif
      );
      --mdc-outlined-text-field-label-text-color: var(
        --mat-table-header-headline-color,
        rgba(0, 0, 0, 0.87)
      );
      --mdc-outlined-text-field-disabled-label-text-color: var(
        --mat-table-header-headline-color,
        rgba(0, 0, 0, 0.87)
      );
      --mdc-outlined-text-field-disabled-outline-color: transparent;
      --mdc-outlined-text-field-label-text-weight: var(
        --mat-table-header-headline-weight,
        500
      );
      --mdc-outlined-text-field-outline-width: 0;
      --mdc-outlined-text-field-focus-outline-width: 0;
    }
  `,
})
export class TableHeadComponent<T> {
  readonly state = input.required<TableState<T>['header']>();
}
