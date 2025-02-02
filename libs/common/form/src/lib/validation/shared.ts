import { ValueEqualityFn } from '@angular/core';
import { SharedTranslator } from '@e7/common/locale';

export function requiredValidator<T = unknown>(t: SharedTranslator) {
  const msg = t('shared.validation.general.required');
  return (value: T) => {
    return value ? '' : msg;
  };
}

export function exactValidator<T = unknown>(
  exact: T,
  t: SharedTranslator,
  valueLabel?: string,
  equal?: ValueEqualityFn<T>,
) {
  const value = valueLabel ?? `${exact}`;
  const msg =
    value === null || value === undefined
      ? t('shared.validation.general.mustBeEmpty')
      : t('shared.validation.general.mustBe', { value });
  const eq = equal ?? Object.is;

  return (value: T) => {
    return eq(value, exact) ? '' : msg;
  };
}

export function oneOfValidator<T>(
  values: T[] | undefined,
  t: SharedTranslator,
  toString?: (value: T) => string,
  identify?: (value: T) => string | number,
) {
  if (values === undefined) return () => '';

  if (!values.length) {
    const msg = t('shared.validation.general.mustBeEmpty');
    return (val: T) => {
      if (val) return msg;
      return '';
    };
  }

  const identityFn = identify ?? ((v) => `${v}`);
  const toStringFn = toString ?? ((v) => `${v}`);

  const msg = t('shared.validation.general.mustBeOneOf', {
    values: values.map(toStringFn).join(', '),
  });

  const idSet = new Set(values.map(identityFn));

  return (value: T) => {
    return idSet.has(identityFn(value)) ? '' : msg;
  };
}
