import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { injectSupportedLocale } from './inject-supported-locale';
import {
  DEFAULT_LOCALE,
  type CompiledTranslation,
  type DefaultLocale,
  type inferPathParams,
} from './locale.type';
import { injectSharedT, SharedNamespacePath } from './shared';
import type en from './shared/shared.namespace';

type inferTPath<TTranslation extends CompiledTranslation<any, DefaultLocale>> =
  | inferPathParams<TTranslation>
  | SharedNamespacePath;

type NonParamTranslations<
  TTranslation extends CompiledTranslation<any, DefaultLocale>,
  TPath extends
    | inferPathParams<TTranslation>
    | SharedNamespacePath = inferTPath<TTranslation>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = TPath extends [string, any] ? never : TPath[0];

@Directive()
export abstract class LocalizeDirective<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TTranslation extends CompiledTranslation<any, DefaultLocale>,
> {
  abstract readonly t: <
    TPath extends inferPathParams<TTranslation> | SharedNamespacePath,
  >(
    ...args: TPath
  ) => string;

  readonly localize = input.required<NonParamTranslations<TTranslation>>();

  constructor() {
    const locale = injectSupportedLocale();
    if (locale === DEFAULT_LOCALE) return;

    const renderer = inject(Renderer2);
    const el = inject<ElementRef<HTMLElement>>(ElementRef);

    effect((cleanup) => {
      const prev = el.nativeElement.textContent;

      const path = this.localize() as unknown as inferTPath<TTranslation>;

      renderer.setProperty(el.nativeElement, 'textContent', this.t(...path));

      cleanup(() => {
        renderer.setProperty(el.nativeElement, 'textContent', prev);
      });
    });
  }
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[localize]',
})
export class SharedLocalizeDirective extends LocalizeDirective<typeof en> {
  readonly t = injectSharedT();
}
