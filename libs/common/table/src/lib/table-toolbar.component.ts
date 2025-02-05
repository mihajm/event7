import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StringFieldComponent, StringState } from '@e7/common/form';
import { TableStateValue } from './table.component';

@Component({
  selector: 'app-table-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StringFieldComponent],
  template: `
    <section>
      <div class="container">
        <div class="search">
          <app-string-field
            iconPrefix="search"
            [state]="globalFilter()"
            subscriptSizing="dynamic"
          />
        </div>
        <div class="menus"></div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      -moz-osx-font-smoothing: grayscale;
      -webkit-font-smoothing: antialiased;
      color: var(--mat-paginator-container-text-color, rgba(0, 0, 0, 0.87));
      background: var(--mat-table-background-color, #fdfbff);
      font-family: var(--mat-paginator-container-text-font, Roboto, sans-serif);
      line-height: var(--mat-paginator-container-text-line-height, 1rem);
      font-size: var(--mat-paginator-container-text-size, 0.75rem);
      font-weight: var(--mat-paginator-container-text-weight, 400);
      letter-spacing: var(--mat-paginator-container-text-tracking, 0.025rem);
      --mat-form-field-container-height: var(
        --mat-paginator-form-field-container-height,
        40px
      );
      --mat-form-field-container-vertical-padding: var(
        --mat-paginator-form-field-container-vertical-padding,
        8px
      );
      padding: 0 0.75rem;

      section,
      div.container,
      div.menus {
        display: flex;
      }

      div.container {
        align-items: center;
        justify-content: space-between;
        padding: var(--mar-table-toolbar-container-padding, 0);
        flex-wrap: wrap;
        width: 100%;
        min-height: var(--mat-paginator-container-size, 56px);

        div.search {
          flex: 1;
          max-width: 40%;

          ::ng-deep mat-form-field {
            width: 100%;
          }
        }
      }

      div.menus {
        gap: 1rem;
      }
    }
  `,
})
export class TableTooblarComponent {
  readonly globalFilter = input.required<StringState<TableStateValue>>();
}
