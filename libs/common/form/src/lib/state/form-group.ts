/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, Signal } from '@angular/core';
import { DerivedSignal } from '@e7/common/reactivity';
import {
  CreateFormControlOptions,
  formControl,
  FormControlSignal,
} from './form-control';

export type FormGroup<
  T,
  TDerivations extends Record<string, FormControlSignal<any, T>>,
  TParent = undefined,
> = FormControlSignal<T, TParent> & {
  children: TDerivations;
  ownError: Signal<string>;
};

function values<T extends object>(obj: T): Array<T[keyof T]> {
  if (!obj) return [];
  return Object.values(obj);
}

export function formGroup<
  T,
  TDerivations extends Record<string, FormControlSignal<any, T>>,
  TParent = undefined,
>(
  initial: DerivedSignal<TParent, T> | T,
  children: TDerivations,
  opt?: CreateFormControlOptions<T>,
): FormGroup<T, TDerivations, TParent> {
  const derivationsArray = values(children);

  const ctrl = formControl<T, TParent>(initial, {
    ...opt,
    readonly: () => {
      if (opt?.readonly?.()) return true;
      return (
        !!derivationsArray.length && derivationsArray.every((d) => d.readonly())
      );
    },
    disable: () => {
      if (opt?.disable?.()) return true;
      return (
        !!derivationsArray.length && derivationsArray.every((d) => d.disabled())
      );
    },
  });

  const touched = computed(
    () =>
      ctrl.touched() ||
      (!!derivationsArray.length && derivationsArray.some((d) => d.touched())),
  );

  const dirty = computed(
    () =>
      ctrl.dirty() ||
      (!!derivationsArray.length && derivationsArray.some((d) => d.dirty())),
  );

  const error = computed(() => {
    const ownError = ctrl.error();
    if (ownError) return ownError;
    return !!derivationsArray.length && derivationsArray.some((d) => d.error())
      ? 'INVALID'
      : '';
  });

  const markAllAsTouched = () => {
    ctrl.markAllAsTouched();
    derivationsArray.forEach((d) => d.markAllAsTouched());
  };

  const markAllAsPristine = () => {
    ctrl.markAllAsPristine();
    derivationsArray.forEach((d) => d.markAllAsPristine());
  };

  return {
    ...ctrl,
    children,
    ownError: ctrl.error,
    touched,
    dirty,
    error,
    markAllAsTouched,
    markAllAsPristine,
  } as FormGroup<T, TDerivations, TParent>;
}
