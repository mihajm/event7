import { type SharedTranslator } from '@e7/common/locale';
import { exactValidator, oneOfValidator, requiredValidator } from './shared';

export type StringValidatorOptions = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  blanks?: boolean;
  exact?: string | null;
  oneOf?: string[];
};

function minLengthValidator(t: SharedTranslator, min: number) {
  const msg = t('shared.validation.string.minLength', { min });
  return (value: string | null) => {
    if (!value) return '';
    return value.length >= min ? '' : msg;
  };
}

function maxLengthValidator(t: SharedTranslator, max: number) {
  const msg = t('shared.validation.string.maxLength', { max });
  return (value: string | null) => {
    if (!value) return '';
    return value.length <= max ? '' : msg;
  };
}

function isStringValidator(t: SharedTranslator) {
  const msg = t('shared.validation.string.string');
  return (value: string | null) => {
    if (!value) return '';
    return typeof value === 'string' ? '' : msg;
  };
}

function patternValidator(t: SharedTranslator, pattern: string) {
  const msg = t('shared.validation.string.pattern', { pattern });
  const re = new RegExp(pattern);

  return (value: string | null) => {
    if (!value) return '';
    return re.test(value) ? '' : msg;
  };
}

function blanksValidator(t: SharedTranslator) {
  const msg = t('shared.validation.string.blanks');

  return (value: string | null) => {
    if (!value) return '';
    return value.trim() === value ? '' : msg;
  };
}

export function stringValidator(
  opt: StringValidatorOptions,
  t: SharedTranslator,
) {
  const requriedVal = opt.required ? requiredValidator(t) : () => '';
  const minVal =
    opt.minLength !== undefined
      ? minLengthValidator(t, opt.minLength)
      : () => '';
  const maxVal =
    opt.maxLength !== undefined
      ? maxLengthValidator(t, opt.maxLength)
      : () => '';

  const exactVal =
    opt.exact !== undefined ? exactValidator(opt.exact, t) : () => '';

  const oneOfVal =
    opt.oneOf !== undefined
      ? oneOfValidator<string | null>(opt.oneOf, t)
      : () => '';

  const patternVal = opt.pattern ? patternValidator(t, opt.pattern) : () => '';

  const stringVal = isStringValidator(t);
  const blanksVal = opt.blanks ? blanksValidator(t) : () => '';

  return (val: string | null) => {
    const requiredError = requriedVal(val);
    if (requiredError) return requiredError;
    const exactError = exactVal(val);
    if (exactError) return exactError;
    const isStringError = stringVal(val);
    if (isStringError) return isStringError;
    const minError = minVal(val);
    if (minError) return minError;
    const maxError = maxVal(val);
    if (maxError) return maxError;
    const patternError = patternVal(val);
    if (patternError) return patternError;
    const oneOfError = oneOfVal(val);
    if (oneOfError) return oneOfError;
    const blanksError = blanksVal(val);
    if (blanksError) return blanksError;
    return '';
  };
}
