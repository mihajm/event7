import { formatDate } from '@angular/common';
import { SharedTranslator } from '@e7/common/locale';
import { maxValidator, minValidator } from './number';
import { exactValidator, oneOfValidator, requiredValidator } from './shared';

function minDateValidator(t: SharedTranslator, min: string | Date) {
  const minTime = new Date(min).getTime();
  const minVal = minValidator(t, minTime);

  return (val: string | Date | null) => {
    return minVal(val === null ? null : new Date(val).getTime());
  };
}

function maxDateValidator(t: SharedTranslator, max: string | Date) {
  const maxTime = new Date(max).getTime();
  const maxVal = maxValidator(t, maxTime);

  return (val: string | Date | null) => {
    return maxVal(val === null ? null : new Date(val).getTime());
  };
}

function isDateValidator(t: SharedTranslator) {
  const msg = t('shared.validation.date.date');

  return (val: unknown) => {
    if (!val) return '';
    return typeof val === 'object' && val instanceof Date ? '' : msg;
  };
}

function exactDateValidator(
  exact: string | Date | null | undefined,
  t: SharedTranslator,
  locale: string,
): (value: string | Date | null) => string {
  if (exact === undefined) return () => '';
  if (exact === null) return exactValidator<string | Date | null>(null, t);
  const value = new Date(exact);
  const label = formatDate(value, 'medium', locale);

  return exactValidator<string | Date | null>(value, t, label, (a, b) => {
    if (a === null || b === null) return a === b;
    if (typeof a === 'string' && typeof b === 'string') return a === b;

    const aDate = new Date(a);
    const bDate = new Date(b);

    return aDate.getTime() === bDate.getTime();
  });
}

export type DateValidatorOptions = {
  required?: boolean;
  min?: string | Date;
  max?: string | Date;
  exact?: string | Date | null;
  oneOf?: (string | Date)[];
};

export function dateValidator(
  opt: DateValidatorOptions,
  locale: string,
  t: SharedTranslator,
) {
  const requiredVal = opt.required ? requiredValidator(t) : () => '';
  const minVal =
    opt.min !== undefined ? minDateValidator(t, opt.min) : () => '';
  const maxVal =
    opt.max !== undefined ? maxDateValidator(t, opt.max) : () => '';
  const isDate = isDateValidator(t);

  const exactVal = exactDateValidator(opt.exact, t, locale);

  const oneOfVal =
    opt.oneOf !== undefined
      ? oneOfValidator<string | Date | null>(
          opt.oneOf,
          t,
          (v) => (v ? formatDate(new Date(v), 'medium', locale) : ''),
          (a: string | Date | null) => {
            if (!a) return '';
            return new Date(a).getTime();
          },
        )
      : () => '';

  return (value: string | Date | null) => {
    const required = requiredVal(value);
    if (required) return required;
    const min = minVal(value);
    if (min) return min;
    const max = maxVal(value);
    if (max) return max;
    const date = isDate(value);
    if (date) return date;
    const exact = exactVal(value);
    if (exact) return exact;
    const oneOf = oneOfVal(value);
    if (oneOf) return oneOf;

    return '';
  };
}
