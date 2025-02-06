import { SQL } from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { createAddFilters, FilterEntry } from './filters';
import { addPagination, PaginationOptions } from './pagination';
import { createAddSort, SortParameter } from './sort';

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

export function createFindMany<TSelect extends PgSelect, TDef extends PgColumn>(
  provider: () => TSelect,
  defMap: Map<string, TDef>,
  resolveSearch?: (search?: string) => SQL<unknown> | null,
) {
  const filters = createAddFilters(defMap, resolveSearch ?? (() => null));
  const sort = createAddSort(defMap);
  return (opt?: FindManyOptions<TDef>) => {
    let qb = provider();
    if (!opt) return qb;
    qb = addPagination(qb, opt.pagination);
    qb = filters(qb, opt.filters, opt.search);
    qb = sort(qb, opt.sort);
    return qb;
  };
}

const MAX_COUNT = 10000;

export function resolveMaxCountLimit(
  pagination?: PaginationOptions,
  maxLimit = MAX_COUNT,
): Required<PaginationOptions> {
  const request = {
    limit: pagination?.limit ?? 10,
    offset: pagination?.offset ?? 0,
  };

  if (request.offset + request.limit < maxLimit) {
    return {
      offset: 0,
      limit: maxLimit,
    };
  }

  return {
    offset: 0,
    limit: request.offset + request.limit + 1,
  };
}
