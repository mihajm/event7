import { inject, InjectionToken, Provider } from '@angular/core';
import { injectSharedT } from '@e7/common/locale';

type ProvidedTableLocale = {
  plural: string;
};

const token = new InjectionToken<ProvidedTableLocale>('EVENT7_TABLE_LOCALE');

export function provideTableLocalization(
  fn: () => ProvidedTableLocale,
): Provider {
  return {
    provide: token,
    useFactory: fn,
  };
}

export type Locale = {
  plural: string;
  noItemsFound: string;
  pagination: {
    firstPage: string;
    lastPage: string;
    nextPage: string;
    prevPage: string;
    perPage: string;
  };
};

export function injectTableLocalization(): Locale {
  const t = injectSharedT();
  const provided = inject(token, { optional: true }) ?? {
    plural: t('shared.results'),
  };

  return {
    ...provided,
    noItemsFound: t('shared.noItemsFound', { items: provided.plural }),
    pagination: {
      firstPage: t('shared.table.pagination.firstPage'),
      lastPage: t('shared.table.pagination.lastPage'),
      nextPage: t('shared.table.pagination.nextPage'),
      prevPage: t('shared.table.pagination.prevPage'),
      perPage: t('shared.table.pagination.perPage', { items: provided.plural }),
    },
  };
}
