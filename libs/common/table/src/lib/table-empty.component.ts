import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectTableLocalization } from './localization';

@Component({
  selector: 'app-table-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<span>{{ msg.noItemsFound }}</span>`,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
      min-height: 150px;
      background-color: var(--mat-autocomplete-background-color, #efedf1);
    }
  `,
})
export class TableEmptyComponent {
  protected readonly msg = injectTableLocalization();
}
