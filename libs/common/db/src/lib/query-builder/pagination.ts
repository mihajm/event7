import { PgSelect } from 'drizzle-orm/pg-core';

export type PaginationOptions = {
  limit?: number;
  offset?: number;
};

export function addPagination<T extends PgSelect>(
  qb: T,
  opt?: PaginationOptions,
) {
  if (opt?.limit) qb.limit(opt.limit);
  if (opt?.offset) qb.offset(opt.offset);
  return qb;
}
