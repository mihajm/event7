import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  SubscriptSizing,
} from '@angular/material/form-field';
import { DateFieldComponent, DateState } from './date-field.component';
import { NumberFieldComponent, NumberState } from './number-field.component';
import { SelectFieldComponent, SelectState } from './select-field.component';
import { StringFieldComponent, StringState } from './string-field.component';

export type FieldState<T, TParent = undefined> =
  | StringState<TParent>
  | SelectState<T, TParent>
  | DateState<TParent>
  | NumberState<TParent>;

@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-field]': 'true',
  },
  imports: [
    StringFieldComponent,
    SelectFieldComponent,
    DateFieldComponent,
    NumberFieldComponent,
  ],
  template: `
    @switch (state().type) {
      @case ('string') {
        <app-string-field
          [subscriptSizing]="subscriptSizing()"
          [align]="align()"
          [state]="$any(state())"
        />
      }
      @case ('date') {
        <app-date-field
          [subscriptSizing]="subscriptSizing()"
          [align]="align()"
          [state]="$any(state())"
        />
      }
      @case ('number') {
        <app-number-field
          [subscriptSizing]="subscriptSizing()"
          [align]="align()"
          [state]="$any(state())"
        />
      }
      @case ('select') {
        <app-select-field
          [subscriptSizing]="subscriptSizing()"
          [align]="align()"
          [state]="$any(state())"
        />
      }
    }
  `,
  styles: `
    .app-field {
      display: contents;
    }
  `,
})
export class FieldComponent<T, TParent = undefined> {
  readonly state = input.required<FieldState<T, TParent>>();

  readonly subscriptSizing = input<SubscriptSizing>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })
      ?.subscriptSizing ?? 'fixed',
  );

  readonly align = input<'left' | 'right'>('left');
}
