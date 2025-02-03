import { createNamespace } from '../compile-locale';

const ns = createNamespace('shared', {
  themeMode: {
    auto: 'Auto',
    dark: 'Dark',
    light: 'Light',
  },
  settings: {
    showTooltips: 'Show tooltips',
  },
  close: 'Close',
  confirm: 'Confirm',
  clear: 'Clear',
  noItemsFound: 'No {items} found',
  results: 'results',
  areYouSure: 'Are you sure?',
  editItem: 'Edit {item}',
  table: {
    pagination: {
      firstPage: 'First page',
      lastPage: 'Last page',
      nextPage: 'Next page',
      prevPage: 'Previous page',
      fromTo: '{range} of {total}',
      perPage: '{items} per page',
    },
  },
  validation: {
    general: {
      required: 'Field is required',
      mustBe: 'Must be {value}',
      mustBeOneOf: 'Must be one of {values}',
      mustBeEmpty: 'Must be empty',
    },
    string: {
      minLength: 'Must be at least {min} characters long',
      maxLength: 'Must be at most {max} characters long',
      pattern: 'Must match {pattern}',
      blanks: 'Avoid leading/traling blanks',
      string: 'Must be a string',
    },
    date: {
      date: 'Must be a date',
    },
    number: {
      min: 'Must be at least {min}',
      max: 'Must be at most {max}',
      integer: 'Must be an integer',
      number: 'Must be a number',
      multipleOf: 'Must be a multiple of {value}',
    },
  },
} as const);

export default ns.translation;

export const createSharedTranslation = ns.createTranslation;
