import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { RouterStore } from '@e7/common/router';
import { SettingsStore } from '@e7/common/settings';
import { ThemeOption, ThemeToggleComponent } from '@e7/common/theme';
import { map } from 'rxjs';
import {
  DEFAULT_LOCALE,
  SUPPORETED_LOCALES,
  SUPPORTED_LOCALE_LABELS,
} from './locale.type';
import { injectSharedT } from './shared';

function injectOptions() {
  const t = injectSharedT();

  return computed(
    () =>
      [
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
      ] satisfies ThemeOption[],
  );
}

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatIcon,
    MatMenuModule,
    MatDivider,
    ThemeToggleComponent,
  ],
  template: `
    <div class="settings">
      <button
        mat-icon-button
        type="button"
        [matMenuTriggerFor]="langaugeMenu"
        aria-label="Language"
      >
        <mat-icon>language</mat-icon>
      </button>
      <app-theme-toggle [options]="themes()" />
      <mat-divider vertical />
      <button
        mat-icon-button
        type="button"
        [matMenuTriggerFor]="settingsMenu"
        #trigger="matMenuTrigger"
        [class.active]="trigger.menuOpen"
      >
        <mat-icon>settings</mat-icon>
      </button>
    </div>

    <mat-menu #langaugeMenu>
      @for (loc of locales(); track loc.value) {
        <a
          [href]="loc.url"
          mat-menu-item
          [class.active]="currentLocale() === loc.value"
        >
          {{ loc.label }}
        </a>
      }
    </mat-menu>

    <mat-menu #settingsMenu>
      <button type="button" mat-menu-item (click)="toggleTooltips()">
        {{ showHideTooltipsLabel() }}
      </button>
    </mat-menu>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 1rem 1rem 0 1rem;

      div.settings {
        display: flex;
        align-items: center;
        background-color: var(
          --mdc-outlined-card-container-color,
          var(--mat-app-surface)
        );
        border-radius: var(
          --mdc-outlined-card-container-shape,
          var(--mat-app-corner-medium)
        );
        border-width: var(--mdc-outlined-card-outline-width);
        border-color: var(
          --mdc-outlined-card-outline-color,
          var(--mat-app-outline-variant)
        );
        box-shadow: var(
          --mdc-outlined-card-container-elevation,
          var(--mat-app-level0)
        );
        border-style: solid;

        mat-divider {
          height: 1rem;
        }
      }

      button[mat-icon-button] {
        mat-icon {
          transition: rotate 0.2s;
        }
        &.active mat-icon {
          rotate: 30deg;
        }
      }
    }

    a[mat-menu-item].active {
      color: var(--mat-sys-primary);
    }
  `,
})
export class ToolbarComponent {
  private readonly t = injectSharedT();
  private readonly route = inject(ActivatedRoute);
  private readonly translatedLocales = SUPPORETED_LOCALES.map((loc) => ({
    value: loc,
    label: SUPPORTED_LOCALE_LABELS[loc] ?? loc,
  }));

  protected readonly themes = injectOptions();

  protected readonly routerStore = inject(RouterStore);

  protected readonly currentLocale = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('locale') ?? DEFAULT_LOCALE),
    ),
    {
      initialValue:
        this.route.snapshot.paramMap.get('locale') ?? DEFAULT_LOCALE,
    },
  );

  protected readonly locales = computed(() => {
    const url = this.routerStore.url();
    const currentLocale = this.currentLocale();
    return this.translatedLocales.map((loc) => {
      if (loc.value === currentLocale) return { ...loc, url };

      return {
        ...loc,
        url: url.replace(currentLocale, loc.value),
      };
    });
  });

  protected readonly settingsStore = inject(SettingsStore);
  protected readonly showHideTooltipsLabel = computed(() =>
    this.settingsStore.settings().showTooltips
      ? this.t('shared.settings.hideTooltips')
      : this.t('shared.settings.showTooltips'),
  );

  protected toggleTooltips() {
    this.settingsStore.change({
      showTooltips: !untracked(this.settingsStore.settings).showTooltips,
    });
  }
}
