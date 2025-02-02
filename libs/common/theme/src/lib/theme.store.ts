import { Injectable } from '@angular/core';
import { stored } from '@e7/common/reactivity';
import { Theme } from './theme.type';

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private readonly internal = stored<Theme>(
    { mode: 'auto' },
    {
      key: 'EVENT7_THEME',
    },
  );

  readonly theme = this.internal.asReadonly();

  changeMode(mode: Theme['mode']) {
    this.internal.update((cur) => ({ ...cur, mode }));
  }
}
