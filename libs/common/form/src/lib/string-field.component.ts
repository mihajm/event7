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
  ProvidedErrorDirective,
  stringValidator,
  StringValidatorOptions,
} from './validation';

export type StringStateOptions = Omit<
  CreateFormControlOptions<string | null>,
  'validator' | 'required'
> & {
  autocomplete?: () => HTMLInputElement['autocomplete'];
  placeholder?: () => string;
  validation?: () => StringValidatorOptions;
};

export type StringState<TParent = undefined> = FormControlSignal<
  string | null,
  TParent
> & {
  autocomplete: Signal<HTMLInputElement['autocomplete']>;
  placeholder: Signal<string>;
  type: 'string';
};

export function createStringState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  t: SharedTranslator,
  opt?: StringStateOptions,
): StringState<TParent> {
  const validation = computed(() => opt?.validation?.() ?? {});

  const state = formControl<string | null, TParent>(value, {
    ...opt,
    validator: () => stringValidator(validation(), t),
    required: () => validation().required === true,
  });

  return {
    ...state,
    autocomplete: computed(() => opt?.autocomplete?.() ?? 'off'),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    type: 'string',
  } as StringState<TParent>;
}

export function injectCreateStringState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: StringStateOptions,
): StringState<TParent> {
  const t = injectSharedT();
  return createStringState(value, t, opt);
}

@Component({
  selector: 'app-string-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-string-field]': 'true',
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
      <mat-label>{{ state().label() }}</mat-label>

      <input
        matInput
        [(ngModel)]="state().value"
        [autocomplete]="state().autocomplete()"
        [placeholder]="state().placeholder()"
        [disabled]="state().disabled()"
        [required]="state().required()"
        [readonly]="state().readonly()"
        [appProvidedError]="state().error()"
        (blur)="state().markAsTouched()"
      />
    </mat-form-field>
  `,
  styles: `
    .app-string-field {
      display: contents;
    }
  `,
})
export class StringFieldComponent<TParent = undefined> {
  readonly state = input.required<StringState<TParent>>();
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
