import {
  computed,
  CreateSignalOptions,
  effect,
  signal,
  untracked,
} from '@angular/core';

type Store = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type StoredOptions<T> = CreateSignalOptions<T> & {
  key: (() => string) | string;
  storage?: Store;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

const { parse, stringify } = JSON;

function get<T>(
  key: string,
  fallback: T,
  store: Store,
  deserialize: (value: string) => T,
) {
  const val = store.getItem(key);

  try {
    return val === null ? fallback : deserialize(val);
  } catch {
    return fallback;
  }
}

function store<T>(
  key: string,
  value: T,
  store: Store,
  serialize: (value: T) => string,
) {
  if (value === undefined || value === null) return store.removeItem(key);
  try {
    store.setItem(key, serialize(value));
  } catch {
    store.removeItem(key);
  }
}

export function stored<T>(
  fallback: T,
  {
    key,
    storage = localStorage,
    serialize = stringify,
    deserialize = parse,
  }: StoredOptions<T>,
) {
  const keySig =
    typeof key === 'string' ? computed(() => key) : computed(() => key());

  const valueSig = signal(
    get<T>(untracked(keySig), fallback, storage, deserialize),
  );

  let lastKey = untracked(keySig);

  effect(() => store(lastKey, valueSig(), storage, serialize));

  effect(() => {
    const key = keySig();
    if (key === lastKey) return;
    valueSig.update((cur) => get(key, cur, storage, deserialize));
    storage.removeItem(lastKey);
    lastKey = key;
  });

  return valueSig;
}
