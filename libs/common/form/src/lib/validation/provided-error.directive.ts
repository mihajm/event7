import { Directive, effect, input } from '@angular/core';
import { NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[ngModel][appProvidedError]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: ProvidedErrorDirective,
      multi: true,
    },
  ],
})
export class ProvidedErrorDirective implements Validator {
  readonly appProvidedError = input.required<string>();
  private onChange = () => {
    //noop
  };

  constructor() {
    effect(() => {
      this.appProvidedError();
      this.onChange();
    });
  }

  validate() {
    return this.appProvidedError() ? { providedError: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onChange = fn;
  }
}
