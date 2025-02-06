/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, Signal, WritableSignal } from '@angular/core';
import { values } from '@e7/common/object';
import { DerivedSignal } from '@e7/common/reactivity';
import {
  CreateFormControlOptions,
  formControl,
  FormControlSignal,
} from './form-control';

export type FormGroupSignal<
  T,
  TDerivations extends Record<string, FormControlSignal<any, T>>,
  TParent = undefined,
> = FormControlSignal<T, TParent> & {
  children: TDerivations;
  ownError: Signal<string>;
};

export function formGroup<
  T,
  TDerivations extends Record<string, FormControlSignal<any, T>>,
  TParent = undefined,
>(
  initial: DerivedSignal<TParent, T> | T | WritableSignal<T>,
  children: TDerivations,
  opt?: CreateFormControlOptions<T>,
): FormGroupSignal<T, TDerivations, TParent> {
  const derivationsArray = values(children);

  const ctrl = formControl<T, TParent>(
    initial as DerivedSignal<TParent, T> | T,
    {
      ...opt,
      readonly: () => {
        if (opt?.readonly?.()) return true;
        return (
          !!derivationsArray.length &&
          derivationsArray.every((d) => d.readonly())
        );
      },
      disable: () => {
        if (opt?.disable?.()) return true;
        return (
          !!derivationsArray.length &&
          derivationsArray.every((d) => d.disabled())
        );
      },
    },
  ) as FormControlSignal<T, TParent>;

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

  const reconcile = (newValue: T) => {
    ctrl.reconcile(newValue, true);
    derivationsArray.forEach((d) => {
      const from = d.from;
      if (!from) return;
      d.reconcile(from(newValue));
    });
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
    reconcile,
  };
}
