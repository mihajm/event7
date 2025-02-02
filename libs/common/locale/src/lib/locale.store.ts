import { entries } from './entries';
import { SupportedLocale } from './locale.type';

type LocaleStore = {
  readonly translations: Record<SupportedLocale, Record<string, string>>;
  register: (
    flat: Partial<Record<SupportedLocale, Record<string, string>>>,
  ) => void;
};

let store: LocaleStore | null;

export function injectLocaleStore(): LocaleStore {
  if (!store) {
    let translations = {} as Record<SupportedLocale, Record<string, string>>;
    store = {
      get translations() {
        return translations;
      },
      register: (
        flat: Partial<Record<SupportedLocale, Record<string, string>>>,
      ) => {
        translations = entries(flat).reduce(
          (acc, [locale, translation]) => {
            const localeTranslation = acc[locale] ?? {};

            acc[locale] = {
              ...localeTranslation,
              ...translation,
            };

            return acc;
          },
          { ...translations },
        );
      },
    };
  }

  return store;
}
