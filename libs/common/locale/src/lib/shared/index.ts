import { inferPathParams } from '../locale.type';
import { registerLocale } from '../register-locale';
import en from './shared.namespace';

export type SharedNamespacePath = inferPathParams<typeof en>;

export const {
  injectNamespaceT: injectSharedT,
  resolveNamespaceTranslation: resolveSharedTranslation,
} = registerLocale(en, {
  'sl-SI': () => import('./shared.locale.sl').then((m) => m.default),
});

export type SharedTranslator = ReturnType<typeof injectSharedT>;
