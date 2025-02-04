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
