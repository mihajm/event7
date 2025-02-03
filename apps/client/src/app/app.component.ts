import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from '@e7/common/layout';
import { ThemeDirective } from '@e7/common/theme';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-typography',
  },
  hostDirectives: [ThemeDirective],
  imports: [LayoutComponent, RouterOutlet],
  template: `
    <app-layout>
      <router-outlet />
    </app-layout>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class AppComponent {}
