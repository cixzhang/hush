import { useSyncExternalStore } from 'react';

type SetState<T> = (
  partial: Partial<T> | ((prev: T) => Partial<T>),
) => void;
type GetState<T> = () => T;

export interface Store<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T extends object>(
  initializer: (set: SetState<T>, get: GetState<T>) => T,
): Store<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === 'function'
        ? (partial as (prev: T) => Partial<T>)(state)
        : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach((l) => l());
  };

  const getState: GetState<T> = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);

  return { getState, setState, subscribe };
}

export function create<T extends object>(
  initializer: (set: SetState<T>, get: GetState<T>) => T,
) {
  const store = createStore(initializer);

  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U): T | U {
    return useSyncExternalStore(
      store.subscribe,
      () => (selector ? selector(store.getState()) : store.getState()),
      () => (selector ? selector(store.getState()) : store.getState()),
    );
  }

  useStore.getState = store.getState;
  useStore.setState = store.setState;
  useStore.subscribe = store.subscribe;

  return useStore;
}
