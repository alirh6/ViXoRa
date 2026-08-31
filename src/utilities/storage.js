
export function createLocalStorageAdapter() {
  function get(key, fallback = null) {
    try {
      const rawValue = window.localStorage.getItem(key);
      if (rawValue === null) {
        return fallback;
      }
      return JSON.parse(rawValue);
    } catch (error) {
      console.error(`[StorageAdapter] Failed to parse key: "${key}"`, error);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[StorageAdapter] Failed to save key: "${key}"`, error);
      return false;
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[StorageAdapter] Failed to remove key: "${key}"`, error);
      return false;
    }
  }

  return {
    get,
    set,
    remove,
  };
}
