import { EnvironmentProviders } from '@angular/core';
import {
  provideRouter,
  Route,
  withComponentInputBinding,
  withRouterConfig,
} from '@angular/router';
import { LocaleShellComponent } from './locale-shell.component';
import { DEFAULT_LOCALE } from './locale.type';
import {
  DATE_FN_RESOLVERS,
  resolverLocaleRegistration,
} from './resolver-date-fns-locale';
import { resolveSharedTranslation } from './shared';

export function provideLocalizedRouter(
  children: Route[] = [],
): EnvironmentProviders {
  return provideRouter(
    [
      {
        path: ':locale',
        component: LocaleShellComponent,
        resolve: {
          ...DATE_FN_RESOLVERS,
          sharedTranslations: resolveSharedTranslation,
          registration: resolverLocaleRegistration,
        },

        children,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: DEFAULT_LOCALE,
      },
    ],
    withComponentInputBinding(),
    withRouterConfig({
      paramsInheritanceStrategy: 'always',
    }),
  );
}
