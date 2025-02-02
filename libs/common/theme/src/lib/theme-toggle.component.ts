import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { injectSharedT } from '@e7/common/locale';
import { injectDisableTooltips } from '@e7/common/settings';
import { ThemeStore } from './theme.store';
import { Theme } from './theme.type';

type ThemeOption = {
  label: string;
  value: Theme['mode'];
  icon: string;
};

function injectOptions() {
  const t = injectSharedT();

  return [
    {
      icon: 'light_mode',
      label: t('shared.themeMode.light'),
      value: 'light',
    },
    {
      icon: 'dark_mode',
      label: t('shared.themeMode.dark'),
      value: 'dark',
    },
    {
      icon: 'brightness_4',
      label: t('shared.themeMode.auto'),
      value: 'auto',
    },
  ] satisfies ThemeOption[];
}

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
      @for (opt of options; track opt.value) {
        <button type="button" mat-menu-item>
          <mat-icon>{{ opt.icon }}</mat-icon>
          <span>{{ opt.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: ``,
})
export class ThemeToggleComponent {
  private readonly store = inject(ThemeStore);
  protected readonly disableTooltips = injectDisableTooltips();
  protected readonly options = injectOptions();

  protected readonly selectedOption = computed(
    () =>
      this.options.find((o) => o.value === this.store.theme().mode) ??
      this.options[2],
  );
}
