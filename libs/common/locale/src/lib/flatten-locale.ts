import { entries } from '@e7/common/object';

export const LOCALE_DELIM = '::LOCALE_DELIM::';

export function flattenLocale<T extends object>(
  obj: T,
): Record<string, string> {
  const flat: Record<string, string> = {};

  const recurse = (cur: string | object, prevPath = '') => {
    if (!cur) return;

    if (typeof cur === 'string') {
      flat[prevPath] = cur;
      return;
    }

    entries(cur).forEach(([key, value]) =>
      recurse(value, prevPath ? `${prevPath}${LOCALE_DELIM}${key}` : key),
    );
  };

  recurse(obj);
  return flat;
}
