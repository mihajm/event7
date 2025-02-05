import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  LOCALE_ID,
} from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { routeParam } from '@e7/common/router';
import { isSupportedLocale } from './inject-supported-locale';
import { DEFAULT_LOCALE } from './locale.type';
import {
  injectDateFnsLocale,
  provideDateFnsLocale,
} from './resolver-date-fns-locale';

@Component({
  selector: 'app-locale-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  providers: [
    {
      provide: LOCALE_ID,
      useFactory: (route: ActivatedRoute) => {
        const locale = route.snapshot.paramMap.get('locale');
        return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
      },
      deps: [ActivatedRoute],
    },
    ...provideDateFnsLocale(),
  ],
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class LocaleShellComponent {
  constructor() {
    injectDateFnsLocale();
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
