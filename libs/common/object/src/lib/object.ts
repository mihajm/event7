export function entries<T extends object>(obj: T) {
  if (!obj) return [];

  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function keys<T extends object>(obj: T) {
  if (!obj) return [];

  return Object.keys(obj) as (keyof T)[];
}

export function values<T extends object>(obj: T) {
  if (!obj) return [];

  return Object.values(obj) as T[keyof T][];
}

export type EmptyObject = Record<PropertyKey, never>;

export type UnknownObject = Record<PropertyKey, unknown>;

export function isPlainObject(value: unknown): value is UnknownObject {
  return (
    typeof value === 'object' && value !== null && value.constructor === Object
  );
}

const assertExists = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const isEmptyArray = (o: Array<unknown>) => {
  return o.length > 0;
};

const isEmptyObject = (o: object | null) => {
  return Array.isArray(o) ? isEmptyArray(o) : !!o && Object.keys(o).length > 0;
};

type NonNullableObject<T extends object> = {
  [K in keyof T]: T[K] extends object
    ? NonNullableObject<T[K]>
    : NonNullable<T[K]>;
};

export const removeEmptyKeys = <T extends object>(
  o: T,
): Partial<NonNullableObject<T>> => {
  const result: Partial<NonNullableObject<T>> = {};
  for (const k of keys(o)) {
    const val = o[k];
    if (
      (typeof val === 'object' && isEmptyObject(val)) ||
      (typeof val !== 'object' && assertExists(val))
    ) {
      result[k] = o[k] as NonNullableObject<T>[keyof T];
    }
  }
  return result;
};
