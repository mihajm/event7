import { DOCUMENT } from '@angular/common';
import { computed, Directive, effect, inject } from '@angular/core';
import { provideMaterialDefaults } from './provide-material-defaults';
import { ThemeStore } from './theme.store';

@Directive({
  selector: '[appTheme]',
  providers: [provideMaterialDefaults()],
})
export class ThemeDirective {
  constructor() {
    const store = inject(ThemeStore);
    const document = inject(DOCUMENT);

    const mode = computed(() => store.theme().mode);

    effect(() => {
      if (mode() === 'auto') document.body.removeAttribute('style');
      else document.body.setAttribute('style', `color-scheme: ${mode()}`);
    });
  }
}
