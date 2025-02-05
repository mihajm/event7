import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Signal,
  untracked,
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
import { MAT_SELECT_CONFIG, MatSelectModule } from '@angular/material/select';
import { injectSharedT, SharedTranslator } from '@e7/common/locale';
import { DerivedSignal } from '@e7/common/reactivity';
import {
  CreateFormControlOptions,
  formControl,
  FormControlSignal,
} from './state';
import { ProvidedErrorDirective, requiredValidator } from './validation';

export type SelectOption<T> = {
  value: T;
  id: string;
  label: Signal<string>;
  disabled: Signal<boolean>;
};

export type SelectStateOpt<T> = Omit<
  CreateFormControlOptions<T | null>,
  'equal'
> & {
  placeholder?: () => string;
  identify?: () => (value: NoInfer<T> | null) => string;
  display?: () => (value: NoInfer<T> | null) => string;
  disableOption?: () => (value: NoInfer<T> | null) => boolean;
  options: () => T[];
  noClear?: () => boolean;
  panelWidth?: () => string | number | null;
};

export type SelectState<T, TParent = undefined> = FormControlSignal<
  T | null,
  TParent
> & {
  placeholder: Signal<string>;
  options: Signal<SelectOption<T>[]>;
  valueLabel: Signal<string>;
  valueId: Signal<string | null>;
  equal: (a: T | null, b: T | null) => boolean;
  noClear: Signal<boolean>;
  panelWidth: Signal<string | number | null>;
  type: 'select';
};

function stringify(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  return String(val);
}

export function createSelectState<T, TParent = undefined>(
  value: T | null | DerivedSignal<TParent, T | null>,
  t: SharedTranslator,
  opt: SelectStateOpt<T>,
): SelectState<T, TParent> {
  const validator = computed(() => {
    if (opt.validator) return opt.validator();
    if (opt.required?.()) return requiredValidator(t);
    return () => '';
  });

  const identify = opt.identify ?? (() => stringify);

  const equal = (a: T | null, b: T | null) =>
    untracked(identify)(a) === untracked(identify)(b);

  const display = opt.display ?? (() => stringify);
  const disable = opt.disableOption ?? (() => () => false);

  const providedOptions = computed(() => {
    const id = identify();
    return opt.options().map((v) => {
      return {
        value: v,
        id: id(v),
      };
    });
  });

  const state = formControl<T | null, TParent>(value, {
    ...opt,
    equal,
    validator,
    required: opt.required,
  }) as FormControlSignal<T | null, TParent>;

  const valueLabel = computed(() => display()(state.value()));

  const filledOptions = computed(() => {
    const value = state.value();
    const opt = providedOptions();
    if (!value) return opt;
    const id = identify()(value);
    if (opt.some((o) => o.id === id)) return opt;

    return [{ value, id }, ...opt];
  });

  const options = computed((): SelectOption<T>[] =>
    filledOptions().map((o) => ({
      ...o,
      label: computed(() => display()(o.value)),
      disabled: computed(() => disable()(o.value)),
    })),
  );

  return {
    ...state,
    placeholder: computed(() => opt.placeholder?.() ?? ''),
    type: 'select',
    equal,
    options,
    valueLabel,
    noClear: computed(() => opt?.noClear?.() ?? false),
    valueId: computed(() => {
      const val = state.value();
      if (!val) return null;
      return identify()(val);
    }),
    panelWidth: computed(() => {
      const provided = opt.panelWidth?.();
      if (provided === 'auto') return null;
      return provided ?? null;
    }),
  };
}

export function injectCreateSelectState<T, TParent = undefined>(
  value: T | null | DerivedSignal<TParent, T | null>,
  opt: SelectStateOpt<T>,
  t = injectSharedT(),
): SelectState<T, TParent> {
  return createSelectState(value, t, opt);
}

@Component({
  selector: 'app-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ProvidedErrorDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-select-field]': 'true',
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
      <mat-select
        [dir]="directions().input"
        [class.readOnly]="state().readonly()"
        [(ngModel)]="state().value"
        (closed)="state().markAsTouched()"
        [required]="state().required()"
        [appProvidedError]="state().error()"
        [panelWidth]="state().panelWidth()"
        [disabled]="state().disabled()"
        [compareWith]="state().equal"
        [placeholder]="state().placeholder()"
        [disableOptionCentering]="disableOptionCentering()"
        [hideSingleSelectionIndicator]="hideSingleSelectionIndicator()"
      >
        <mat-select-trigger>
          {{ state().valueLabel() }}
        </mat-select-trigger>

        @if (showClear()) {
          <mat-option [value]="null" [disabled]="state().readonly()">
            {{ clearLabel }}
          </mat-option>
        }

        @for (opt of state().options(); track opt.id) {
          <mat-option
            [value]="opt.value"
            [disabled]="opt.disabled() || state().readonly()"
          >
            {{ opt.label() }}
          </mat-option>
        }
      </mat-select>

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .app-select-field {
      display: contents;
      &.right {
        mat-label {
          padding-left: 1rem;
        }

        mat-select {
          position: relative;
          left: 1rem;
        }
      }
    }
  `,
})
export class SelectFieldComponent<T, TParent = undefined> {
  readonly state = input.required<SelectState<T, TParent>>();

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

  readonly disableOptionCentering = input(
    inject(MAT_SELECT_CONFIG, { optional: true })?.disableOptionCentering ??
      false,
    { transform: booleanAttribute },
  );

  readonly hideSingleSelectionIndicator = input(
    inject(MAT_SELECT_CONFIG, { optional: true })
      ?.hideSingleSelectionIndicator ?? false,
    { transform: booleanAttribute },
  );

  readonly overlayPanelClass = input(
    inject(MAT_SELECT_CONFIG, { optional: true })?.overlayPanelClass ?? '',
  );

  readonly panelWidth = input(
    inject(MAT_SELECT_CONFIG, { optional: true })?.panelWidth ?? null,
  );

  private readonly t = injectSharedT();
  protected readonly clearLabel = this.t('shared.clear');

  protected readonly showClear = computed(
    () =>
      !this.state().required() &&
      !!this.state().value() &&
      !this.state().noClear(),
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
