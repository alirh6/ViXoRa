// src/core/store/store.js

/**
 * ViXoRa Store — Minimal, dependency-free, immutable state container
 * ------------------------------------------------------------------
 * API: { getState, setState, subscribe, initialize, reset, select }
 *
 * قابلیت‌ها:
 *  - setState با updater یا partial object
 *  - persistence اختیاری (localStorage adapter + persistKey)
 *  - subscribe با payload { previousState, currentState }
 *  - syncAcrossTabs: همگام‌سازی state بین تب‌های باز
 *  - select: خواندن slice بدون subscribe
 */

export function createStore({
  initialState = {},
  storage = null,
  persistKey = null,
  syncAcrossTabs = true,
  onChange = null,
} = {}) {
  let state = structuredClone(initialState);

  const listeners = new Set();
  const cleanups = [];

  function clone(value) {
    try {
      return structuredClone(value);
    } catch {
      return JSON.parse(JSON.stringify(value ?? null));
    }
  }

  function getState() {
    return state;
  }

  function select(selector) {
    if (typeof selector !== 'function') return state;
    return selector(state);
  }

  function persist() {
    if (storage && persistKey) {
      storage.set(persistKey, state);
    }
  }

  function notify(previousState) {
    const payload = { previousState, currentState: state };

    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error('[Store] Error in listener execution:', error);
      }
    }

    if (typeof onChange === 'function') {
      try {
        onChange(payload);
      } catch (error) {
        console.error('[Store] Error in onChange handler:', error);
      }
    }
  }

  function assertValidState(nextState) {
    if (!nextState || typeof nextState !== 'object' || Array.isArray(nextState)) {
      throw new TypeError('[Store] setState must produce a valid state object.');
    }
  }

  function setState(updater) {
    const previousState = state;

    const nextState =
      typeof updater === 'function' ? updater(previousState) : { ...previousState, ...updater };

    assertValidState(nextState);

    if (nextState === previousState) return state;

    state = nextState;
    persist();
    notify(previousState);

    return state;
  }

  /** آپدیت جزئی و عمیق‌تر یک slice بدون بازنویسی دستی کل state */
  function patch(path, value) {
    const keys = Array.isArray(path) ? path : String(path).split('.');

    return setState((current) => {
      let cursor = current;

      for (const key of keys.slice(0, -1)) {
        const nextValue =
          cursor && typeof cursor[key] === 'object' && cursor[key] !== null ? cursor[key] : {};

        cursor = cursor === current ? { ...current } : { ...cursor };
        cursor[key] = nextValue;
        cursor = cursor[key];
      }

      const lastKey = keys[keys.length - 1];
      const shallow = cursor === current ? { ...current } : cursor;
      shallow[lastKey] = value;

      return shallow;
    });
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('[Store] subscribe requires a function listener.');
    }

    listeners.add(listener);

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  /** subscribe که فقط وقتی مقدار انتخابی تغییر کند صدا زده می‌شود */
  function watch(selector, listener) {
    let lastValue = selector(state);

    return subscribe(({ previousState, currentState }) => {
      const nextValue = selector(currentState);
      if (nextValue === lastValue) return;

      const previousValue = selector(previousState);
      lastValue = nextValue;

      listener({ value: nextValue, previousValue, previousState, currentState });
    });
  }

  function initialize(normalizer) {
    const previousState = state;

    let mergedState = { ...initialState };

    if (persistKey && storage) {
      const savedState = storage.get(persistKey, null);

      if (savedState && typeof savedState === 'object' && !Array.isArray(savedState)) {
        mergedState = { ...mergedState, ...savedState };
      }
    }

    if (typeof normalizer === 'function') {
      const normalized = normalizer(mergedState);
      assertValidState(normalized);
      mergedState = normalized;
    }

    state = mergedState;
    persist();
    notify(previousState);

    if (syncAcrossTabs && typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
      const onStorageEvent = (event) => {
        if (event.key !== persistKey || event.newValue === null) return;

        try {
          const externalState = JSON.parse(event.newValue);
          if (!externalState || typeof externalState !== 'object') return;

          const beforeTabSync = state;
          state = typeof normalizer === 'function' ? normalizer(externalState) : externalState;
          notify(beforeTabSync);
        } catch (error) {
          console.warn('[Store] Failed to sync state from another tab.', error);
        }
      };

      globalThis.addEventListener('storage', onStorageEvent);
      cleanups.push(() => globalThis.removeEventListener('storage', onStorageEvent));
    }

    return state;
  }

  function reset(nextState = initialState) {
    const previousState = state;

    state = clone(nextState);
    persist();
    notify(previousState);

    return state;
  }

  function destroy() {
    listeners.clear();

    for (const cleanup of cleanups.splice(0)) {
      try {
        cleanup();
      } catch {
        /* ignore */
      }
    }
  }

  return {
    getState,
    setState,
    patch,
    select,
    subscribe,
    watch,
    initialize,
    reset,
    destroy,
  };
}
