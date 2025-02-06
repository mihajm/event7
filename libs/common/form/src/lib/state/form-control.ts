import {
  computed,
  CreateSignalOptions,
  isSignal,
  signal,
  Signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { DerivedSignal } from '@e7/common/reactivity';
import { v7 } from 'uuid';

export type FormControlSignal<T, TParent = undefined> = {
  id: string;
  value: WritableSignal<T>;
  dirty: Signal<boolean>;
  touched: Signal<boolean>;
  error: Signal<string>;
  disabled: Signal<boolean>;
  readonly: Signal<boolean>;
  required: Signal<boolean>;
  label: Signal<string>;
  hint: Signal<string>;
  markAsTouched: () => void;
  markAllAsTouched: () => void;
  markAsPristine: () => void;
  markAllAsPristine: () => void;
  reconcile: (newValue: T, noSet?: boolean) => void;
  from?: DerivedSignal<TParent, T>['from'];
};

export type CreateFormControlOptions<T> = CreateSignalOptions<T> & {
  validator?: () => (value: T) => string;
  onTouched?: () => void;
  disable?: () => boolean;
  readonly?: () => boolean;
  required?: () => boolean;
  label?: () => string;
  id?: () => string;
  hint?: () => string;
};

export function formControl<T, TParent = undefined>(
  initial: DerivedSignal<TParent, T> | T,
  opt?: CreateFormControlOptions<T>,
): FormControlSignal<T> {
  const value = isSignal(initial) ? initial : signal(initial, opt);
  const initialValue = signal(untracked(value));
  const eq = opt?.equal ?? Object.is;

  const disabled = computed(() => opt?.disable?.() ?? false);
  const readonly = computed(() => opt?.readonly?.() ?? false);

  const dirty = computed(() => !eq(value(), initialValue()));

  const touched = signal(false);

  const validator = computed(() => opt?.validator?.() ?? (() => ''));

  const error = computed(() => {
    if (disabled() || readonly()) return '';
    return validator()(value());
  });

  const markAsTouched = () => touched.set(true);
  const markAllAsTouched = markAsTouched;

  const markAsPristine = () => touched.set(false);
  const markAllAsPristine = markAsPristine;

  const label = computed(() => opt?.label?.() ?? '');
  return {
    id: opt?.id?.() ?? v7(),
    value,
    dirty,
    touched,
    error,
    label,
    required: computed(() => opt?.required?.() ?? false),
    disabled,
    readonly,
    hint: computed(() => opt?.hint?.() ?? ''),
    markAsTouched,
    markAllAsTouched,
    markAsPristine,
    markAllAsPristine,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (isSignal(initial) ? initial.from : undefined) as any,
    reconcile: (newValue: T, noSet = false) => {
      if (newValue === untracked(value)) return;
      const wasDirty = untracked(dirty);

      setTimeout(() => {
        console.log(wasDirty, untracked(label));
        initialValue.set(newValue);
        markAsTouched();

        if (!wasDirty && !noSet) value.set(newValue);
      });
    },
  };
}
