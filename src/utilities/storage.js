// src/utilities/storage.js

/**
 * آداپتورهای ذخیره‌سازی ViXoRa
 * ------------------------------------------------------------------
 * سه آداپتور با یک قرارداد مشترک:  { get, set, remove, has, keys }
 *
 *  - createLocalStorageAdapter  : localStorage واقعی مرورگر
 *  - createMemoryAdapter        : حافظهٔ موقت (تست / SSR / حالت خصوصی)
 *  - createSafeStorageAdapter   : هر محیطی، بدون پرتاب خطا
 */

function safeParse(rawValue, fallback) {
  if (rawValue === null || rawValue === undefined) return fallback;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn('[StorageAdapter] Invalid JSON value, fallback used.', error);
    return fallback;
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[StorageAdapter] Value is not serializable.', error);
    return null;
  }
}

/**
 * درایور را در هر فراخوانی حل می‌کند (نه در زمان ساخت ماژول).
 * دلیل: در بعضی محیط‌ها localStorage بعد از لود ماژول در دسترس قرار می‌گیرد
 * (مثلاً بعد از راه‌اندازی DOM در تست‌ها) و گرفتن ارجاع زودهنگام
 * باعث می‌شود همه‌چیز به‌صورت خاموش در حافظهٔ موقت نوشته شود.
 */
function resolveDriver(driverOrResolver) {
  if (typeof driverOrResolver === 'function') {
    try {
      return driverOrResolver();
    } catch {
      return null;
    }
  }

  return driverOrResolver || null;
}

function createAdapterDriver(driverOrResolver, label) {
  const resolve = () => resolveDriver(driverOrResolver);

  function get(key, fallback = null) {
    if (!key) return fallback;

    const driver = resolve();
    if (!driver) return fallback;

    try {
      const rawValue = driver.getItem(key);
      if (rawValue === null || rawValue === undefined) return fallback;
      return safeParse(rawValue, fallback);
    } catch (error) {
      console.error(`[StorageAdapter:${label}] read failed for "${key}".`, error);
      return fallback;
    }
  }

  function set(key, value) {
    if (!key) return false;

    const serialized = safeStringify(value);
    if (serialized === null) return false;

    const driver = resolve();
    if (!driver) return false;

    try {
      driver.setItem(key, serialized);
      return true;
    } catch (error) {
      // QuotaExceededError و موارد مشابه
      console.error(`[StorageAdapter:${label}] write failed for "${key}".`, error);
      return false;
    }
  }

  function remove(key) {
    if (!key) return false;

    const driver = resolve();
    if (!driver) return false;

    try {
      driver.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[StorageAdapter:${label}] remove failed for "${key}".`, error);
      return false;
    }
  }

  function has(key) {
    const driver = resolve();
    if (!driver) return false;

    try {
      return driver.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  function keys() {
    const driver = resolve();
    if (!driver) return [];

    try {
      return Object.keys(driver);
    } catch {
      return [];
    }
  }

  return { get, set, remove, has, keys };
}

export function createLocalStorageAdapter() {
  let warned = false;

  return createAdapterDriver(() => {
    const candidate = typeof globalThis !== 'undefined' ? globalThis.localStorage : null;

    if (!candidate) {
      if (!warned) {
        warned = true;
        console.warn('[StorageAdapter] localStorage is not available — writes are dropped.');
      }
      return null;
    }

    return candidate;
  }, 'localStorage');
}

export function createMemoryAdapter() {
  const store = new Map();

  const driver = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
  };

  return createAdapterDriver(driver, 'memory');
}

/** آداپتور ایمن: اگر درایور پرتاب خطا کند هم برنامه نمی‌شکند */
export function createSafeStorageAdapter(customDriver) {
  if (customDriver) return createAdapterDriver(customDriver, 'safe');

  return createAdapterDriver(
    () => (typeof globalThis !== 'undefined' ? globalThis.localStorage || null : null),
    'safe'
  );
}
