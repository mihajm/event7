import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { injectDisableTooltips } from '@e7/common/settings';
import { ThemeStore } from './theme.store';
import { Theme } from './theme.type';

export type ThemeOption = {
  label: string;
  value: Theme['mode'];
  icon: string;
};

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
  ],
  template: `
    <button
      type="button"
      mat-icon-button
      [matMenuTriggerFor]="menu"
      [matTooltip]="selectedOption().label"
      [matTooltipDisabled]="disableTooltips()"
    >
      <mat-icon>{{ selectedOption().icon }}</mat-icon>
    </button>

    <mat-menu #menu>
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          mat-menu-item
          (click)="store.changeMode(opt.value)"
          [class.active]="opt.value === selectedOption().value"
        >
          <mat-icon>{{ opt.icon }}</mat-icon>
          <span>{{ opt.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: `
    .active,
    .active mat-icon {
      color: var(--mat-sys-primary);
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly store = inject(ThemeStore);
  protected readonly disableTooltips = injectDisableTooltips();
  readonly options = input.required<ThemeOption[]>();

  protected readonly selectedOption = computed(
    () =>
      this.options().find((o) => o.value === this.store.theme().mode) ??
      this.options()[2],
  );
}
