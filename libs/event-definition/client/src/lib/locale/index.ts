import { registerLocale } from '@e7/common/locale';
import en from './event-definition.namespace';

export const { injectNamespaceT, resolveNamespaceTranslation } = registerLocale(
  en,
  {
    'sl-SI': () =>
      import('./event-definition.locale.sl').then((m) => m.default),
  },
);
