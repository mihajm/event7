import { asc, desc } from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';

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

export type ColumnName<TDef extends PgColumn> = TDef['name'];

export type SortParameter<T extends string> = T | `-${T}`;

export type FindManyOptions<T, TDef extends PgColumn> = {
  pagination?: PaginationOptions;
  filters?: BaseFilters<T> & NotFilters<T>;
  sort?: SortParameter<ColumnName<TDef>>[];
};

function buildPagination<T extends PgSelect>(qb: T, opt?: PaginationOptions) {
  if (opt?.limit) qb.limit(opt.limit);
  if (opt?.offset) qb.offset(opt.offset);
  return qb;
}

export function addSort<T extends PgSelect, TDefs extends PgColumn[]>(
  qb: T,
  defs: TDefs,
  sort?: SortParameter<ColumnName<TDefs[number]>>[],
) {
  if (!sort || sort.length === 0) return qb;

  const cmds = sort
    .map((s) => {
      const wrapper = s.startsWith('-') ? desc : asc;
      const colName = s.replace('-', '') as ColumnName<TDefs[number]>;

      const col = defs.find((d) => d.name === colName);
      return col ? wrapper(col) : null;
    })
    .filter((cmd) => cmd !== null);

  if (cmds.length === 0) return qb;

  if (cmds.length === 1) return qb.orderBy(cmds[0]);

  return qb.orderBy(...cmds);
}

export function buildFindMany<
  T,
  TSelect extends PgSelect,
  TDef extends PgColumn,
>(qb: TSelect, defs: TDef[], opt?: FindManyOptions<T, TDef>) {
  if (!opt) return qb;
  qb = buildPagination(qb, opt.pagination);
  qb = addSort(qb, defs, opt.sort);
  return qb;
}
