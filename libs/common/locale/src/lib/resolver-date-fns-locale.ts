import { registerLocaleData } from '@angular/common';
import { inject, InjectionToken, Provider } from '@angular/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ResolveFn,
} from '@angular/router';
import type { Locale } from 'date-fns/locale';
import { isSupportedLocale } from './inject-supported-locale';
import { DEFAULT_LOCALE, type SupportedLocale } from './locale.type';

const DATE_FNS_LOCALES: Record<
  SupportedLocale,
  (() => Promise<Locale>) | undefined
> = {
  'en-US': () => import('date-fns/locale/en-US').then((m) => m.enUS),
  'sl-SI': () => import('date-fns/locale/sl').then((m) => m.sl),
};

export async function resolveDateFnsLocale(
  route: ActivatedRouteSnapshot,
): Promise<Locale | void> {
  const activatedLocale = route.paramMap.get('locale');
  const supportedLocale = isSupportedLocale(activatedLocale)
    ? activatedLocale
    : DEFAULT_LOCALE;

  const fn = DATE_FNS_LOCALES[supportedLocale];

  return fn ? fn() : undefined;
}

const LOCALE_DATA: Record<
  SupportedLocale,
  undefined | (() => Promise<unknown>)
> = {
  'en-US': undefined,
  'sl-SI': () => import('@angular/common/locales/sl').then((m) => m.default),
};

export async function resolverLocaleRegistration(
  route: ActivatedRouteSnapshot,
) {
  const activatedLocale = route.paramMap.get('locale');
  const supportedLocale = isSupportedLocale(activatedLocale)
    ? activatedLocale
    : DEFAULT_LOCALE;

  const fn = LOCALE_DATA[supportedLocale];

  if (fn) registerLocaleData(await fn(), supportedLocale);
}

const resolverKey = 'DATE_FN_LOCALE';

export const DATE_FN_RESOLVERS: Record<string, ResolveFn<Locale | void>> = {
  [resolverKey]: resolveDateFnsLocale,
};

const token = new InjectionToken<Locale>('EVENT7_DATE_FNS_LOCALE');

export function provideDateFnsLocale(): Provider[] {
  return [
    {
      provide: token,
      useFactory: (route: ActivatedRoute) => {
        const data = route.snapshot.data;

        if (!data || !data[resolverKey]) return;

        return data[resolverKey] as Locale;
      },
      deps: [ActivatedRoute],
    },
    {
      provide: MAT_DATE_LOCALE,
      useFactory: (locale: Locale) => {
        return locale;
      },
      deps: [token],
    },
    provideDateFnsAdapter(),
  ];
}

export function injectDateFnsLocale() {
  return inject(token, { optional: true }) ?? undefined;
}
