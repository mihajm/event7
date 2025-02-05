/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */

import { EmptyObject } from '@e7/common/object';

export const DEFAULT_LOCALE = 'en-US' as const;

export type DefaultLocale = typeof DEFAULT_LOCALE;

export const OTHER_LOCALES = ['sl-SI'] as const;

export type OtherLocale = (typeof OTHER_LOCALES)[number];

export const SUPPORETED_LOCALES = [DEFAULT_LOCALE, ...OTHER_LOCALES] as const;

export const SUPPORTED_LOCALE_LABELS = {
  'en-US': 'English',
  'sl-SI': 'Slovenščina',
} satisfies Record<SupportedLocale, string>;

export type SupportedLocale = (typeof SUPPORETED_LOCALES)[number];

export type StringPath<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : StringPath<T[K]> extends infer P
          ? P extends string
            ? `${K}.${P}`
            : never
          : never;
    }[keyof T & string];

export type StringPathPair<T> = T extends string
  ? [string, T]
  : {
      [K in keyof T & string]: T[K] extends string
        ? [K, T[K]]
        : StringPathPair<T[K]> extends infer P
          ? P extends [string, any]
            ? [`${K}.${P[0]}`, P[1]]
            : never
          : never;
    }[keyof T & string];

type mergeObject<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type StringLike = string | number | boolean;

type extractAllVariables<T extends string> =
  T extends `${string}{${infer VariableName}}${string}`
    ? VariableName extends string
      ? {
          [K in VariableName]: StringLike;
        } & (T extends `${string}{${VariableName}}${infer Rest}`
          ? extractAllVariables<Rest> extends EmptyObject
            ? {}
            : extractAllVariables<Rest>
          : never)
      : never
    : {};

export type inferTranslationParams<TPairs extends StringPathPair<any>> =
  TPairs extends [infer K, infer V]
    ? extractAllVariables<V & string> extends Record<string, never>
      ? [K]
      : [K, mergeObject<extractAllVariables<V & string>>]
    : never;

export type CompiledTranslation<
  T extends object,
  TLocale extends SupportedLocale = typeof DEFAULT_LOCALE,
> = {
  flat: Record<string, string>;
  locale: TLocale;
  namespace: keyof T;
  internal: {
    translationObject: T;
    pairs: StringPathPair<T>;
  };
};

export type inferPathPairs<T extends CompiledTranslation<any, any>> =
  T['internal']['pairs'];

export type inferTranslation<T extends CompiledTranslation<any, any>> =
  T['internal']['translationObject'];

export type inferTranslatable<T extends object> = {
  [K in keyof T]: T[K] extends object ? inferTranslatable<T[K]> : string;
};

export type inferPathParams<T extends CompiledTranslation<any, any>> =
  inferTranslationParams<inferPathPairs<T>>;
