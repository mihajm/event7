import { inject, LOCALE_ID } from '@angular/core';
import {
  DEFAULT_LOCALE,
  SUPPORETED_LOCALES,
  SupportedLocale,
} from './locale.type';

export function isSupportedLocale(
  locale: string | null,
): locale is SupportedLocale {
  if (!locale) return false;
  return (SUPPORETED_LOCALES as readonly string[]).includes(locale);
}

export function injectSupportedLocale(): SupportedLocale {
  const locale = inject(LOCALE_ID);
  if (isSupportedLocale(locale)) return locale;
  return DEFAULT_LOCALE;
}
