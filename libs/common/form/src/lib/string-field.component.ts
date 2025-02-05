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
  }) as FormControlSignal<string | null, TParent>;

  return {
    ...state,
    autocomplete: computed(() => opt?.autocomplete?.() ?? 'off'),
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    type: 'string',
  };
}

export function injectCreateStringState<TParent = undefined>(
  value: string | null | DerivedSignal<TParent, string | null>,
  opt?: StringStateOptions,
  t = injectSharedT(),
): StringState<TParent> {
  return createStringState(value, t, opt);
}

@Component({
  selector: 'app-string-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-string-field]': 'true',
    '[class.right]': 'align() === "right"',
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
      [dir]="directions().formField"
    >
      @if (state().label()) {
        <mat-label>{{ state().label() }}</mat-label>
      }
      <input
        matInput
        [dir]="directions().input"
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
    .app-string-field {
      display: contents;
      &.right {
        mat-label {
          padding-left: 1rem;
        }
      }
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
  readonly align = input<'left' | 'right'>('left');

  protected readonly directions = computed(() => {
    if (this.align() === 'left') {
      return {
        formField: 'auto',
        input: 'auto',
      } as const;
    }

    return {
      formField: 'rtl',
      input: 'ltr',
    } as const;
  });

  constructor() {
    effect(() => {
      if (!this.state().touched()) return;
      this.model().control.markAsTouched();
    });
  }
}
