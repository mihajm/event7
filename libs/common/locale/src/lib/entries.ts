export function entries<T extends object>(obj: T) {
  if (!obj) return [];

  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
