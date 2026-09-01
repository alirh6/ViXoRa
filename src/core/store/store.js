export function createStore({ initialState = {}, storage = null, persistKey = null }) {
  let state = structuredClone(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function persist() {
    if (storage && persistKey) {
      storage.set(persistKey, state);
    }
  }

  function notify(payload) {
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error('[Store] Error in listener execution:', error);
      }
    });
  }

  function setState(updater) {
    const previousState = state;
    const nextState = 
      typeof updater === 'function' 
        ? updater(previousState) 
        : { ...previousState, ...updater };

    if (!nextState || typeof nextState !== 'object' || Array.isArray(nextState)) {
      throw new TypeError('[Store] setState must produce a valid state object');
    }

    state = nextState;
    persist();
    notify({ previousState, currentState: state });
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('[Store] subscribe requires a function listener');
    }

    listeners.add(listener);

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function initialize(normalizer) {
    if (!persistKey || !storage) return;

    const savedState = storage.get(persistKey, null);
    const previousState = state;

    let mergedState = {
      ...initialState,
      ...(savedState && typeof savedState === 'object' ? savedState : {})
    };

    if (typeof normalizer === 'function') {
      mergedState = normalizer(mergedState);
    }

    state = mergedState;
    persist();
    notify({ previousState, currentState: state });
  }

  function reset(nextState = initialState) {
    const previousState = state;
    state = structuredClone(nextState);
    persist();
    notify({ previousState, currentState: state });
  }

  return {
    getState,
    setState,
    subscribe,
    initialize,
    reset
  };
}
