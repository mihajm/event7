/* eslint-disable @typescript-eslint/no-explicit-any */

import { isDevMode } from '@angular/core';
import type { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { entries, keys } from '@e7/common/object';
import { LOCALE_DELIM } from './flatten-locale';
import {
  injectSupportedLocale,
  isSupportedLocale,
} from './inject-supported-locale';
import { injectLocaleStore } from './locale.store';
import {
  CompiledTranslation,
  DefaultLocale,
  inferPathParams,
  inferTranslation,
  OtherLocale,
} from './locale.type';
import { SharedNamespacePath } from './shared';

export function registerLocale<
  TDefault extends CompiledTranslation<any, DefaultLocale>,
  TOther extends CompiledTranslation<inferTranslation<TDefault>, OtherLocale>,
>(
  { locale: defaultLocale, flat }: TDefault,
  otherTranslations: Record<OtherLocale, () => Promise<TOther>>,
) {
  type NamespacePath = inferPathParams<TDefault> | SharedNamespacePath;

  const injectTranslator = () => {
    const locale = injectSupportedLocale();
    const store = injectLocaleStore();

    return <TPath extends NamespacePath>(...args: TPath) => {
      const [path, params] = args;

      const flatPath = path.replaceAll('.', LOCALE_DELIM);

      const found =
        store.translations[locale]?.[flatPath] ??
        store.translations[defaultLocale]?.[flatPath] ??
        '';

      if (
        !found.length ||
        !params ||
        !found.includes('{') ||
        !keys(params).length
      ) {
        return found;
      }

      return entries(params).reduce((acc, [key, value]) => {
        return acc.replaceAll(`{${key}}`, value);
      }, found);
    };
  };

  const resolver: ResolveFn<void> = async (route: ActivatedRouteSnapshot) => {
    const activatedLocale = route.paramMap.get('locale');

    const locale = isSupportedLocale(activatedLocale)
      ? activatedLocale
      : defaultLocale;

    const store = injectLocaleStore();

    store.register({
      [defaultLocale]: flat,
    });

    if (locale === defaultLocale) return;

    const promise = otherTranslations[locale];
    if (!promise && isDevMode()) {
      return console.warn(`No translation found for locale: ${locale}`);
    }

    try {
      const translation = await promise();

      if (translation.locale !== locale && isDevMode()) {
        return console.warn(
          `Expected locale to be ${locale} but got ${translation.locale}`,
        );
      }

      store.register({
        [locale]: translation.flat,
      });
    } catch {
      if (isDevMode()) {
        console.warn(`Failed to load translation for locale: ${locale}`);
      }
    }
  };

  return {
    injectNamespaceT: injectTranslator,
    resolveNamespaceTranslation: resolver,
  };
}
