import { flattenLocale } from './flatten-locale';
import {
  CompiledTranslation,
  DEFAULT_LOCALE,
  DefaultLocale,
  inferTranslatable,
  OtherLocale,
} from './locale.type';

export function createNamespace<TNS extends string, T extends object>(
  ns: TNS,
  translation: T,
) {
  type TranslationObject = { [K in TNS]: T };
  type TranslationPairs = CompiledTranslation<
    TranslationObject,
    DefaultLocale
  >['internal']['pairs'];

  type OtherTranslation = inferTranslatable<T>;

  const createTranslation = <TLocale extends OtherLocale = OtherLocale>(
    locale: TLocale,
    translation: OtherTranslation,
  ) => {
    return {
      flat: flattenLocale({ [ns]: translation }),
      locale,
      namespace: ns,
      internal: {
        translationObject: {} as TranslationObject,
        pairs: null as unknown as TranslationPairs,
      },
    };
  };

  return {
    createTranslation,
    translation: {
      flat: flattenLocale({ [ns]: translation }),
      locale: DEFAULT_LOCALE,
      namespace: ns,
      internal: {
        translationObject: {} as TranslationObject,
        pairs: null as unknown as TranslationPairs,
      },
    },
  } as const;
}
