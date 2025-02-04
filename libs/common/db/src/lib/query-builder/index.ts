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
};

export function buildFindMany<TSelect extends PgSelect, TDef extends PgColumn>(
  qb: TSelect,
  defMap: Map<string, TDef>,
  opt?: FindManyOptions<TDef>,
) {
  if (!opt) return qb;
  qb = addPagination(qb, opt.pagination);
  qb = addSort(qb, defMap, opt.sort);
  qb = addFilters(qb, defMap, opt.filters);
  return qb;
}
