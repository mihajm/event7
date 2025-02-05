import { SQL } from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { addFilters, FilterEntry } from './filters';
import { addPagination, PaginationOptions } from './pagination';
import { addSort, SortParameter } from './sort';

export type ColumnName<TDef extends PgColumn> = TDef['name'];

export * from './filters';
export * from './pagination';
export * from './sort';

export type FindManyOptions<TDef extends PgColumn> = {
  pagination?: PaginationOptions;
  sort?: SortParameter<ColumnName<TDef>>[];
  filters?: FilterEntry<TDef['name']>[];
  search?: string;
};

export function buildFindMany<TSelect extends PgSelect, TDef extends PgColumn>(
  qb: TSelect,
  defMap: Map<string, TDef>,
  opt?: Omit<FindManyOptions<TDef>, 'search'> & {
    search?: SQL<unknown>;
  },
) {
  if (!opt) return qb;
  qb = addPagination(qb, opt.pagination);
  qb = addSort(qb, defMap, opt.sort);
  qb = addFilters(qb, defMap, opt.filters, opt.search);
  return qb;
}
