import { asc, desc } from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { ColumnName } from '.';

export type SortParameter<T extends string> = T | `-${T}`;

export function createAddSort<TDef extends PgColumn>(
  defMap: Map<string, TDef>,
) {
  return <T extends PgSelect>(
    qb: T,
    sort?: SortParameter<ColumnName<TDef>>[],
  ) => {
    if (!sort || sort.length === 0) return qb;

    const cmds = sort
      .map((s) => {
        const wrapper = s.startsWith('-') ? desc : asc;
        const colName = s.replace('-', '') as ColumnName<TDef>;

        const col = defMap.get(colName);
        return col ? wrapper(col) : null;
      })
      .filter((cmd) => cmd !== null);

    if (cmds.length === 0) return qb;

    if (cmds.length === 1) return qb.orderBy(cmds[0]);

    return qb.orderBy(...cmds);
  };
}
