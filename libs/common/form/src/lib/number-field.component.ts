import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import {
  FloatLabelType,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldAppearance,
  MatFormFieldModule,
  SubscriptSizing,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { injectSharedT, SharedTranslator } from '@e7/common/locale';
import { DerivedSignal } from '@e7/common/reactivity';
import {
  CreateFormControlOptions,
  formControl,
  FormControlSignal,
} from './state';
import {
  numberValidator,
  NumberValidatorOptions,
  ProvidedErrorDirective,
} from './validation';

export type NumberStateOptions = Omit<
  CreateFormControlOptions<number | null>,
  'validator' | 'required'
> & {
  autocomplete?: () => HTMLInputElement['autocomplete'];
  placeholder?: () => string;
  validation?: () => NumberValidatorOptions;
};

export type NumberState<TParent = undefined> = FormControlSignal<
  number | null,
  TParent
> & {
  autocomplete: Signal<HTMLInputElement['autocomplete']>;
  placeholder: Signal<string>;
  type: 'number';
};

export function createNumberState<TParent = undefined>(
  value: number | null | DerivedSignal<TParent, number | null>,
  t: SharedTranslator,
  opt?: NumberStateOptions,
): NumberState<TParent> {
  const validation = computed(() => opt?.validation?.() ?? {});

  const state = formControl<number | null, TParent>(value, {
    ...opt,
    validator: () => numberValidator(validation(), t),
    required: () => validation().required === true,
  }) as FormControlSignal<number | null, TParent>;

  return {
    ...state,
    autocomplete: computed(() => opt?.autocomplete?.() ?? 'off'),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    type: 'number',
  };
}

export function injectCreateNumberState<TParent = undefined>(
  value: number | null | DerivedSignal<TParent, number | null>,
  opt?: NumberStateOptions,
  t = injectSharedT(),
): NumberState<TParent> {
  return createNumberState(value, t, opt);
}

@Component({
  selector: 'app-number-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-number-field]': 'true',
  },
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ProvidedErrorDirective,
  ],
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [hideRequiredMarker]="hideRequiredMarker()"
      [subscriptSizing]="subscriptSizing()"
    >
      @if (state().label()) {
        <mat-label>{{ state().label() }}</mat-label>
      }
      <input
        matInput
        type="number"
        [(ngModel)]="state().value"
        [autocomplete]="state().autocomplete()"
        [placeholder]="state().placeholder()"
        [disabled]="state().disabled()"
        [required]="state().required()"
        [readonly]="state().readonly()"
        [appProvidedError]="state().error()"
        (blur)="state().markAsTouched()"
      />

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .app-number-field {
      display: contents;
    }
  `,
})
export class NumberFieldComponent<TParent = undefined> {
  readonly state = input.required<NumberState<TParent>>();
  readonly appearance = input<MatFormFieldAppearance>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.appearance ??
      'outline',
  );

  readonly floatLabel = input<FloatLabelType>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })?.floatLabel ??
      'auto',
  );

  readonly subscriptSizing = input<SubscriptSizing>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })
      ?.subscriptSizing ?? 'fixed',
  );

  readonly hideRequiredMarker = input<boolean>(
    inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true })
      ?.hideRequiredMarker ?? false,
  );

  private readonly model = viewChild.required(NgModel);

  constructor() {
    effect(() => {
      if (!this.state().touched()) return;
      this.model().control.markAsTouched();
    });
  }
}
