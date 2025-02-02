import { equalsZero, mod, toBigDecimal } from '@e7/common/big';
import { SharedTranslator } from '@e7/common/locale';
import { exactValidator, oneOfValidator, requiredValidator } from './shared';

export function minValidator(t: SharedTranslator, min: number) {
  const msg = t('shared.validation.number.min', { min });

  return (value: number | null) => {
    if (value === null) return '';
    return value >= min ? '' : msg;
  };
}

export function maxValidator(t: SharedTranslator, max: number) {
  const msg = t('shared.validation.number.max', { max });

  return (value: number | null) => {
    if (value === null) return '';
    return value <= max ? '' : msg;
  };
}

function integerValidator(t: SharedTranslator) {
  const msg = t('shared.validation.number.integer');

  return (value: number | null) => {
    if (value === null) return '';
    return Number.isInteger(value) ? '' : msg;
  };
}

function isNumberValidator(t: SharedTranslator) {
  const msg = t('shared.validation.number.number');

  return (value: number | null) => {
    if (value === null) return '';
    return typeof value === 'number' && !Number.isNaN(value) ? '' : msg;
  };
}

function multipleOfValidator(t: SharedTranslator, multipleOf: number) {
  const msg = t('shared.validation.number.multipleOf', { value: multipleOf });

  const bigMultiple = toBigDecimal(multipleOf);

  return (value: number | null) => {
    if (value === null) return '';

    return equalsZero(mod(toBigDecimal(value), bigMultiple)) ? '' : msg;
  };
}

export type NumberValidatorOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  exact?: number | null;
  oneOf?: number[];
  integer?: boolean;
  multipleOf?: number;
};

export function numberValidator(
  opt: NumberValidatorOptions,
  t: SharedTranslator,
) {
  const requiredVal = opt.required ? requiredValidator(t) : () => '';
  const minVal = opt.min !== undefined ? minValidator(t, opt.min) : () => '';
  const maxVal = opt.max !== undefined ? maxValidator(t, opt.max) : () => '';
  const integerVal = opt.integer ? integerValidator(t) : () => '';
  const numberVal = isNumberValidator(t);
  const exactVal =
    opt.exact !== undefined ? exactValidator(opt.exact, t) : () => '';
  const oneOfVal =
    opt.oneOf !== undefined
      ? oneOfValidator<number | null>(opt.oneOf, t)
      : () => '';
  const multipleOfVal =
    opt.multipleOf !== undefined
      ? multipleOfValidator(t, opt.multipleOf)
      : () => '';

  return (value: number | null) => {
    const required = requiredVal(value);
    if (required) return required;
    const min = minVal(value);
    if (min) return min;
    const max = maxVal(value);
    if (max) return max;
    const integer = integerVal(value);
    if (integer) return integer;
    const number = numberVal(value);
    if (number) return number;
    const exact = exactVal(value);
    if (exact) return exact;
    const oneOf = oneOfVal(value);
    if (oneOf) return oneOf;
    const multipleOf = multipleOfVal(value);
    if (multipleOf) return multipleOf;

    return '';
  };
}
