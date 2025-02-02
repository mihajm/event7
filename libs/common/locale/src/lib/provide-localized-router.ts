import { EnvironmentProviders, LOCALE_ID } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ActivatedRoute, provideRouter, Route } from '@angular/router';
import { isSupportedLocale } from './inject-supported-locale';
import { LocaleShellComponent } from './locale-shell.component';
import { DEFAULT_LOCALE } from './locale.type';
import { resolveSharedTranslation } from './shared';

export function provideLocalizedRouter(
  children: Route[] = [],
): EnvironmentProviders {
  return provideRouter([
    {
      path: ':locale',
      component: LocaleShellComponent,
      resolve: {
        sharedTranslations: resolveSharedTranslation,
      },
      providers: [
        {
          provide: LOCALE_ID,
          useFactory: (route: ActivatedRoute) => {
            console.log('hre');
            const locale = route.snapshot.paramMap.get('locale');
            return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
          },
          deps: [ActivatedRoute],
        },
        {
          provide: MAT_DATE_LOCALE,
          useFactory: (locale: string) => locale,
          deps: [LOCALE_ID],
        },
      ],
      children,
    },
    {
      path: '',
      pathMatch: 'full',
      redirectTo: DEFAULT_LOCALE,
    },
  ]);
}
