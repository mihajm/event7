import { PgSelect } from 'drizzle-orm/pg-core';

type PaginationOptions = {
  limit?: number;
  offset?: number;
};

type BaseFilters<T> = {
  [K in keyof T]?: T[K];
};

type NotKey<T extends PropertyKey> = T extends string ? `${T}.not` : never;

type NotFilters<T> = {
  [K in keyof T as NotKey<K>]?: T[K];
};

export type FindManyOptions<T> = {
  pagination?: PaginationOptions;
  filters?: BaseFilters<T> & NotFilters<T>;
};

function buildPagination<T extends PgSelect>(qb: T, opt?: PaginationOptions) {
  if (opt?.limit) qb.limit(opt.limit);
  if (opt?.offset) qb.offset(opt.offset);
  return qb;
}

export function buildFindMany<T, TSelect extends PgSelect>(
  qb: TSelect,
  opt?: FindManyOptions<T>,
  noPagination = false,
) {
  if (!opt) return qb;
  return noPagination ? qb : buildPagination(qb, opt.pagination);
}
