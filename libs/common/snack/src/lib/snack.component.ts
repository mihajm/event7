import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatSnackBar,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { ReplaySubject } from 'rxjs';

type SnackbarAction = {
  label: string;
  action: () => void;
};

export type SnackbarData = {
  message: string;
  type: 'error' | 'info';
  actions?: SnackbarAction[];
};

@Component({
  selector: 'lib-snack',
  imports: [
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarActions,
    MatButtonModule,
  ],
  template: `
    <span
      class="app-snack-label"
      [class.error]="data.type === 'error'"
      matSnackBarLabel
    >
      {{ data.message }}
    </span>
    <span matSnackBarActions>
      @for (action of actions; track action.label) {
        <button
          mat-button
          matSnackBarAction
          (click)="action.action(); ref.dismiss()"
          style="color: var(--mat-sys-inverse-primary)"
        >
          {{ action.label }}
        </button>
      }
    </span>
  `,
  styles: ``,
})
export class SnackComponent {
  protected readonly ref = inject(MatSnackBarRef);
  protected readonly data = inject<SnackbarData>(MAT_SNACK_BAR_DATA);

  protected readonly actions = this.data.actions ?? [
    { label: 'OK', action: (() => this.ref.dismiss()).bind(this) },
  ];
}

@Injectable({
  providedIn: 'root',
})
export class SnackService {
  private readonly snack = inject(MatSnackBar);
  private readonly duration =
    inject(MAT_SNACK_BAR_DEFAULT_OPTIONS, { optional: true })?.duration || 2500;
  readonly snack$ = new ReplaySubject<SnackbarData & { duration?: number }>(1);

  open(data: SnackbarData, duration?: number) {
    this.snack.openFromComponent(SnackComponent, {
      data,
      duration: duration ?? this.duration,
    });
  }
}
