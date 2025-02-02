import { computed, inject, Injectable } from '@angular/core';
import { stored } from '@e7/common/reactivity';

export type Settings = {
  showTooltips: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsStore {
  private readonly internal = stored<Settings>(
    {
      showTooltips: true,
    },
    {
      key: 'EVENT7_SETTINGS',
    },
  );

  readonly settings = this.internal.asReadonly();

  change(settings: Partial<Settings>) {
    this.internal.update((cur) => ({ ...cur, ...settings }));
  }
}

export function injectDisableTooltips() {
  const store = inject(SettingsStore);

  return computed(() => !store.settings().showTooltips);
}
