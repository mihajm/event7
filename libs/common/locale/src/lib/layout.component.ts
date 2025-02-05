import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolbarComponent } from './toolbar.component';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolbarComponent],
  template: `
    <app-toolbar />
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
      width: 100%;
    }
  `,
})
export class LayoutComponent {}
