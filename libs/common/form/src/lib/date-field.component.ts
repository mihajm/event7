import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  LOCALE_ID,
  Signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
  dateValidator,
  DateValidatorOptions,
  ProvidedErrorDirective,
} from './validation';

type DateStateOptions = Omit<
  CreateFormControlOptions<Date | null>,
  'validator' | 'required'
> & {
  validation?: () => DateValidatorOptions;
  placeholder?: () => string;
};

export type DateState<TParent = undefined> = FormControlSignal<
  Date | null,
  TParent
> & {
  placeholder: Signal<string>;
  min: Signal<Date | null>;
  max: Signal<Date | null>;
  type: 'date';
};

export function createDateState<TParent = undefined>(
  value: Date | null | DerivedSignal<TParent, Date | null>,
  locale: string,
  t: SharedTranslator,
  opt?: DateStateOptions,
): DateState<TParent> {
  const validation = computed(() => opt?.validation?.() ?? {});

  const state = formControl<Date | null, TParent>(value, {
    ...opt,
    validator: () => dateValidator(validation(), locale, t),
    required: () => validation().required === true,
  }) as FormControlSignal<Date | null, TParent>;

  const min = computed(() => {
    const minValue = validation().min;
    if (!minValue) return null;
    return new Date(minValue);
  });

  const max = computed(() => {
    const maxValue = validation().max;
    if (!maxValue) return null;
    return new Date(maxValue);
  });

  return {
    ...state,
    placeholder: computed(() => opt?.placeholder?.() ?? ''),
    min,
    max,
    type: 'date',
  };
}

export function injectCreateDateState<TParent = undefined>(
  value: Date | null | DerivedSignal<TParent, Date | null>,
  opt?: DateStateOptions,
  locale = inject(LOCALE_ID),
  t = injectSharedT(),
): DateState<TParent> {
  return createDateState(value, locale, t, opt);
}

@Component({
  selector: 'app-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ProvidedErrorDirective,
    MatDateFnsModule,
    MatDatepickerModule,
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-date-field]': 'true',
    '[class.right]': 'align() === "right"',
  },
  template: `
    <mat-form-field
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [subscriptSizing]="subscriptSizing()"
      [hideRequiredMarker]="hideRequiredMarker()"
      [dir]="directions().formField"
    >
      @if (state().label()) {
        <mat-label>{{ state().label() }}</mat-label>
      }
      <input
        matInput
        [dir]="directions().input"
        [(ngModel)]="state().value"
        [disabled]="state().disabled()"
        [readonly]="state().readonly()"
        [required]="state().required()"
        (blur)="state().markAsTouched()"
        [placeholder]="state().placeholder()"
        [appProvidedError]="state().error()"
        [matDatepicker]="picker"
        [min]="state().min()"
        [max]="state().max()"
      />

      <mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
        [disabled]="state().disabled() || state().readonly()"
      />
      <mat-datepicker #picker (closed)="state().markAsTouched()" />

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .app-date-field {
      display: contents;
      &.right {
        mat-label {
          padding-left: 1rem;
        }
      }
    }
  `,
})
export class DateFieldComponent<TParent = undefined> {
  readonly state = input.required<DateState<TParent>>();

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
