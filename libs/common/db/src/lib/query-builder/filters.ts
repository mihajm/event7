import {
  and,
  BinaryOperator,
  eq,
  gt,
  gte,
  ilike,
  lt,
  lte,
  ne,
  notIlike,
  or,
  SQL,
} from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import type { Request as ExpressRequest } from 'express';

const GENERAL_FILTER_TYPES = ['eq', 'neq'] as const;

const STRING_FILTER_TYPES = ['ilike', 'nilike'] as const;

const NUMBER_FILTER_TYPES = ['gt', 'gte', 'lt', 'lte'] as const;

const DATE_FILTER_TYPES = [...NUMBER_FILTER_TYPES, 'eqd', 'neqd'] as const;

const GENERAL_FILTER_FNS = {
  eq: eq,
  neq: ne,
} satisfies Record<(typeof GENERAL_FILTER_TYPES)[number], BinaryOperator>;

const STRING_FILTER_FNS = {
  ilike: (col: PgColumn, val: string) => ilike(col, `%${val}%`),
  nilike: (col: PgColumn, val: string) => notIlike(col, `%${val}%`),
} satisfies Record<
  (typeof STRING_FILTER_TYPES)[number],
  (col: PgColumn, val: string) => SQL
>;

const NUMBER_FILTER_FNS = {
  gt: (col: PgColumn, val: number) => gt(col, val),
  gte: (col: PgColumn, val: number) => gte(col, val),
  lt: (col: PgColumn, val: number) => lt(col, val),
  lte: (col: PgColumn, val: number) => lte(col, val),
} satisfies Record<
  (typeof NUMBER_FILTER_TYPES)[number],
  (col: PgColumn, val: number) => SQL
>;

function toDayRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return [startOfDay, endOfDay];
}

function toEqualSameDayRangeFilter<T extends PgColumn>(
  col: T,
  date: Date,
): SQL | null {
  const [start, end] = toDayRange(date);
  return and(gte(col, start), lte(col, end)) ?? null;
}

const DATE_FILTER_FNS = {
  gt: (col: PgColumn, val: Date) => gt(col, val),
  gte: (col: PgColumn, val: Date) => gte(col, val),
  lt: (col: PgColumn, val: Date) => lt(col, val),
  lte: (col: PgColumn, val: Date) => lte(col, val),
  eqd: (col: PgColumn, val: Date) => toEqualSameDayRangeFilter(col, val),
  neqd: (col: PgColumn, val: Date) => {
    const [start, end] = toDayRange(val);
    return or(lt(col, start), gt(col, end)) ?? null;
  },
} satisfies Record<
  (typeof DATE_FILTER_TYPES)[number],
  (col: PgColumn, val: Date) => SQL | null
>;

const KNOWN_FILTER_TYPES = [
  ...GENERAL_FILTER_TYPES,
  ...STRING_FILTER_TYPES,
  ...NUMBER_FILTER_TYPES,
  ...DATE_FILTER_TYPES,
] as const;

type KnownFilterType = (typeof KNOWN_FILTER_TYPES)[number];

const KNOWN_SET = new Set<string>(KNOWN_FILTER_TYPES);

type FilterParam<T extends string> = `${T}.${KnownFilterType}`;

export type FilterEntry<T extends string> = [FilterParam<T>, string | string[]];

function addNumberFilters<T extends PgColumn>(
  col: T,
  filter: FilterEntry<T['name']>,
): SQL<unknown> | null {
  const [key, val] = filter;

  const values = (Array.isArray(val) ? val.map(Number) : [Number(val)]).filter(
    (v) => !isNaN(v),
  );

  if (!values.length) return null;

  const fn =
    NUMBER_FILTER_FNS[key as keyof typeof NUMBER_FILTER_FNS] ??
    GENERAL_FILTER_FNS[key as keyof typeof GENERAL_FILTER_FNS];

  if (!fn) return null;

  return or(...values.map((v) => fn(col, v))) ?? null;
}

function addDateFilters<T extends PgColumn>(
  col: T,
  filter: FilterEntry<T['name']>,
): SQL<unknown> | null {
  const [key, val] = filter;

  const values = (
    Array.isArray(val) ? val.map((v) => new Date(v)) : [new Date(val)]
  ).filter((v) => !isNaN(v.getTime()));

  if (!values.length) return null;

  const fn =
    DATE_FILTER_FNS[key as keyof typeof DATE_FILTER_FNS] ??
    GENERAL_FILTER_FNS[key as keyof typeof GENERAL_FILTER_FNS];

  if (!fn) return null;

  const filtered = values.map((v) => fn(col, v)).filter((v) => v !== null);

  if (!filtered.length) return null;

  return or(...filtered) ?? null;
}

function addStringFilters<T extends PgColumn>(
  col: T,
  filter: FilterEntry<T['name']>,
) {
  const [key, val] = filter;

  const values = Array.isArray(val) ? val : [val];

  if (!values.length) return null;

  const fn =
    STRING_FILTER_FNS[key as keyof typeof STRING_FILTER_FNS] ??
    GENERAL_FILTER_FNS[key as keyof typeof GENERAL_FILTER_FNS];

  if (!fn) return null;

  return or(...values.map((v) => fn(col, v))) ?? null;
}

function addGeneralFilters<T extends PgColumn>(
  col: T,
  filter: FilterEntry<T['name']>,
) {
  const [key, val] = filter;

  const values = Array.isArray(val) ? val : [val];

  if (!values.length) return null;

  const fn = GENERAL_FILTER_FNS[key as keyof typeof GENERAL_FILTER_FNS];

  if (!fn) return null;

  return or(...values.map((v) => fn(col, v))) ?? null;
}

export function createAddFilters<TDef extends PgColumn>(
  defMap: Map<string, TDef>,
  resolveSearch: (search?: string) => SQL<unknown> | null,
) {
  return <T extends PgSelect>(
    qb: T,
    filters?: FilterEntry<TDef['name']>[],
    searchValue?: string,
  ) => {
    const search = resolveSearch(searchValue);

    const filteredParams = filters?.filter(([key]) => key.includes('.')) ?? [];
    if (!filteredParams.length && !search) return qb;

    const arr = filteredParams
      .map(([key, val]) => {
        const [colName, filterType] = key.split('.');
        if (!colName || !filterType) return null;
        const col = defMap.get(colName);
        if (!col) return null;

        switch (col.dataType) {
          case 'number':
            return addNumberFilters(col, [
              filterType as FilterParam<typeof col.name>,
              val,
            ]);
          case 'date': {
            const sql = addDateFilters(col, [
              filterType as FilterParam<typeof col.name>,
              val,
            ]);

            return sql;
          }

          case 'string':
            return addStringFilters(col, [
              filterType as FilterParam<typeof col.name>,
              val,
            ]);
          default:
            return addGeneralFilters(col, [
              filterType as FilterParam<typeof col.name>,
              val,
            ]);
        }
      })
      .filter((v) => v !== null);

    if (search) arr.push(search);

    if (!arr.length) return qb;

    return qb.where(and(...arr));
  };
}

function isStringOrStringArray(value: unknown): value is string | string[] {
  if (typeof value === 'string') return true;
  if (
    typeof value === 'object' &&
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === 'string')
  )
    return true;

  return false;
}

function isKnownFilter<TDef extends PgColumn>(
  defMap: Map<string, TDef>,
  entry: [string, string | string[]],
): entry is FilterEntry<TDef['name']> {
  const [name, type] = entry[0].split('.');
  if (!name || !type) return false;
  return KNOWN_SET.has(type) && defMap.has(name);
}

export function toFilterEntries<TDef extends PgColumn>(
  defMap: Map<string, TDef>,
  query?: ExpressRequest['query'],
) {
  if (!query) return [];
  return Object.entries(query).filter((e): e is FilterEntry<TDef['name']> => {
    const [key, value] = e;
    if (!key.includes('.') || !isStringOrStringArray(value)) return false;
    return isKnownFilter(defMap, [key, value]);
  });
}
