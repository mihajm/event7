import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { routeParam } from '@e7/common/router';
import { isSupportedLocale } from './inject-supported-locale';
import { DEFAULT_LOCALE } from './locale.type';

@Component({
  selector: 'app-locale-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class LocaleShellComponent {
  constructor() {
    const localeParam = routeParam('locale');
    const router = inject(Router);
    effect(() => {
      const locale = localeParam();
      if (isSupportedLocale(locale)) return;
      router.navigateByUrl(
        router.url.replace(`/${locale}`, `/${DEFAULT_LOCALE}`),
      );
    });
  }
}
