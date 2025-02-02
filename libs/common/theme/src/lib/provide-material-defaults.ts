import { STEPPER_GLOBAL_OPTIONS, StepperOptions } from '@angular/cdk/stepper';
import { Provider } from '@angular/core';
import {
  MAT_FAB_DEFAULT_OPTIONS,
  MatFabDefaultOptions,
} from '@angular/material/button';
import { MAT_CARD_CONFIG, MatCardConfig } from '@angular/material/card';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckboxDefaultOptions,
} from '@angular/material/checkbox';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import {
  MAT_ICON_DEFAULT_OPTIONS,
  MatIconDefaultOptions,
} from '@angular/material/icon';
import {
  MAT_PROGRESS_BAR_DEFAULT_OPTIONS,
  MatProgressBarDefaultOptions,
} from '@angular/material/progress-bar';
import {
  MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS,
  MatProgressSpinnerDefaultOptions,
} from '@angular/material/progress-spinner';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioDefaultOptions,
} from '@angular/material/radio';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleDefaultOptions,
} from '@angular/material/slide-toggle';

export function provideMaterialDefaults(): Provider[] {
  return [
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {
        fontSet: 'material-icons-outlined',
      } satisfies MatIconDefaultOptions,
    },
    {
      provide: MAT_CARD_CONFIG,
      useValue: {
        appearance: 'outlined',
      } satisfies MatCardConfig,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        color: 'primary',
      } satisfies MatFormFieldDefaultOptions,
    },
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
      } satisfies MatSlideToggleDefaultOptions,
    },
    {
      provide: MAT_CHECKBOX_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
      } satisfies MatCheckboxDefaultOptions,
    },
    {
      provide: MAT_FAB_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
      } satisfies MatFabDefaultOptions,
    },
    {
      provide: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
      } satisfies MatProgressSpinnerDefaultOptions,
    },
    {
      provide: MAT_PROGRESS_BAR_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
        mode: 'indeterminate',
      } satisfies MatProgressBarDefaultOptions,
    },
    {
      provide: MAT_RADIO_DEFAULT_OPTIONS,
      useValue: {
        color: 'primary',
      } satisfies MatRadioDefaultOptions,
    },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: {
        displayDefaultIndicatorType: false,
      } satisfies StepperOptions,
    },
  ];
}
