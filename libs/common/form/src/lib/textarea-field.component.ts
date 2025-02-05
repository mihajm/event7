import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
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
import { StringState } from './string-field.component';
import { ProvidedErrorDirective } from './validation';

@Component({
  selector: 'app-textarea-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-textarea-field]': 'true',
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
      <textarea
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
        [rows]="rows()"
      >
      </textarea>

      <mat-error>{{ state().error() }}</mat-error>

      @if (state().hint()) {
        <mat-hint>{{ state().hint() }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: `
    .app-textarea-field {
      display: contents;
      &.right {
        mat-label {
          padding-left: 1rem;
        }
      }
    }
  `,
})
export class TextareaFieldComponent<TParent = undefined> {
  readonly state = input.required<StringState<TParent>>();
  readonly rows = input(3, { transform: numberAttribute });
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
