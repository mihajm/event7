import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeDirective } from '@e7/common/theme';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-typography',
  },
  hostDirectives: [ThemeDirective],
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class AppComponent {}
