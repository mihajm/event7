import { inject, InjectionToken, Provider } from '@angular/core';
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
  'en-US': undefined,
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

const resolverKey = 'DATE_FN_LOCALE';

export const DATE_FN_RESOLVERS: Record<string, ResolveFn<Locale | void>> = {
  [resolverKey]: resolveDateFnsLocale,
};

const token = new InjectionToken<Locale | undefined>('EVENT7_DATE_FNS_LOCALE');

export function provideDateFnsLocale(): Provider {
  return {
    provide: token,
    useFactory: (route: ActivatedRoute) => {
      const data = route.snapshot.data;

      if (!data || !data[resolverKey]) return;

      return data[resolverKey] as Locale | undefined;
    },
    deps: [ActivatedRoute],
  };
}

export function injectDateFnsLocale() {
  return inject(token, { optional: true }) ?? undefined;
}
