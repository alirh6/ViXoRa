// // src/core/storage/db-client.js
// import initialDb from '../../db/db.json';
// import { createLocalStorageAdapter } from '../../utilities/storage.js';

// const storage = createLocalStorageAdapter();
// const DB_KEY = 'ViXoRa:database';

// /**
//  * دریافت کل دیتابیس (با پشتیبانی از دیتای اولیه db.json)
//  */
// export function getDatabase() {
//   const db = storage.get(DB_KEY, null);
//   if (!db || !Array.isArray(db.users)) {
//     storage.set(DB_KEY, initialDb);
//     return structuredClone(initialDb);
//   }
//   return db;
// }

// /**
//  * ذخیره دیتابیس در LocalStorage
//  */
// export function saveDatabase(db) {
//   return storage.set(DB_KEY, db);
// }

// /**
//  * پیدا کردن یک کاربر با آیدی
//  */
// export function findUserById(userId) {
//   const db = getDatabase();
//   return db.users.find((u) => String(u.id) === String(userId)) || null;
// }

// /**
//  * آپدیت اطلاعات یک کاربر مشخص در دیتابیس
//  */
// export function updateUserInDatabase(userId, updaterFn) {
//   const db = getDatabase();
//   const index = db.users.findIndex((u) => String(u.id) === String(userId));

//   if (index === -1) {
//     throw new Error(`[DB] User with id "${userId}" not found.`);
//   }

//   const currentUser = db.users[index];
//   const updatedUser = updaterFn(currentUser);

//   db.users[index] = updatedUser;
//   saveDatabase(db);

//   return updatedUser;
// }






// // src/core/storage/db-client.js
// import initialDbData from "../../db/db.json";

// const DB_KEY = "ViXoRa:database";
// const API_BASE_URL = "http://localhost:3001";

// /**
//  * مدیریت دیتابیس لوکال و همگام‌سازی با json-server
//  */
// class DbClient {
//   constructor() {
//     this.init();
//   }

//   // مقداردهی اولیه و همگام‌سازی با سرور
//   async init() {
//     const local = localStorage.getItem(DB_KEY);
//     if (!local) {
//       this._saveLocal(initialDbData);
//     }
    
//     // تلاش برای دریافت آخرین دیتا از json-server در پس‌زمینه
//     await this.syncFromServer();
//   }

//   _getLocal() {
//     try {
//       const data = localStorage.getItem(DB_KEY);
//       return data ? JSON.parse(data) : initialDbData;
//     } catch (e) {
//       console.error("[DbClient] Failed to read local storage", e);
//       return initialDbData;
//     }
//   }

//   _saveLocal(data) {
//     try {
//       localStorage.setItem(DB_KEY, JSON.stringify(data));
//     } catch (e) {
//       console.error("[DbClient] Failed to save to local storage", e);
//     }
//   }

//   // سینک کردن لوکال‌استوریج با اطلاعات فایل db.json سرور
//   async syncFromServer() {
//     try {
//       const res = await fetch(`${API_BASE_URL}/users`);
//       if (res.ok) {
//         const users = await res.json();
//         const currentData = this._getLocal();
//         currentData.users = users;
//         this._saveLocal(currentData);
//       }
//     } catch {
//       // سرور روشن نباشد، دیتای لوکال استفاده می‌شود
//     }
//   }

//   // دریافت همه کاربران
//   getAllUsers() {
//     return this._getLocal().users || [];
//   }

//   // دریافت اطلاعات یک کاربر
//   getUserById(userId) {
//     const users = this.getAllUsers();
//     return users.find((u) => String(u.id) === String(userId)) || null;
//   }

//   // آپدیت ابزارهای کاربر (نوشتن همزمان در LocalStorage و فایل db.json)
//   async updateUserTools(userId, toolName, newItems) {
//     const data = this._getLocal();
//     const userIndex = data.users.findIndex((u) => String(u.id) === String(userId));

//     if (userIndex === -1) {
//       throw new Error(`User with ID ${userId} not found.`);
//     }

//     // ۱. اطمینان از وجود ساختار tools
//     if (!data.users[userIndex].tools) {
//       data.users[userIndex].tools = {};
//     }

//     // ۲. به‌روزرسانی ابزار مشخص شده
//     data.users[userIndex].tools[toolName] = newItems;

//     // ۳. ذخیره در LocalStorage
//     this._saveLocal(data);

//     // ۴. ارسال به json-server برای ذخیره فیزیکی روی فایل db.json
//     try {
//       const targetUser = data.users[userIndex];
//       const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(targetUser),
//       });

//       if (!res.ok) {
//         console.warn(`[DbClient] Server update failed: ${res.statusText}`);
//       }
//     } catch (err) {
//       console.warn("[DbClient] Server is offline, saved locally only.", err.message);
//     }

//     return data.users[userIndex].tools[toolName];
//   }
// }

// export const dbClient = new DbClient();

// src/core/storage/db-client.js
import initialDb from '../../db/db.json';
import { createLocalStorageAdapter } from '../../utilities/storage.js';

const storage = createLocalStorageAdapter();
const DB_KEY = 'ViXoRa:database';
const API_BASE_URL = 'http://localhost:3001';

/**
 * همگام‌سازی دیتابیس لوکال با json-server
 */
export async function syncDatabaseWithServer() {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (res.ok) {
      const users = await res.json();
      const db = getDatabase();
      db.users = users;
      saveDatabase(db);
    }
  } catch {
    // اگر سرور خاموش بود، با دیتای لوکال ادامه می‌دهد
  }
}

/**
 * دریافت کل دیتابیس
 */
export function getDatabase() {
  const db = storage.get(DB_KEY, null);
  if (!db || !Array.isArray(db.users)) {
    storage.set(DB_KEY, initialDb);
    return structuredClone(initialDb);
  }
  return db;
}

/**
 * ذخیره دیتابیس در LocalStorage
 */
export function saveDatabase(db) {
  return storage.set(DB_KEY, db);
}

/**
 * پیدا کردن کاربر با آیدی
 */
export function findUserById(userId) {
  const db = getDatabase();
  return db.users?.find((u) => String(u.id) === String(userId)) || null;
}

/**
 * به‌روزرسانی اطلاعات کاربر همزمان در LocalStorage و فایل db.json
 */
export async function updateUserInDatabase(userId, updaterFn) {
  const db = getDatabase();
  const index = db.users.findIndex((u) => String(u.id) === String(userId));

  if (index === -1) {
    throw new Error(`[DB] User with id "${userId}" not found.`);
  }

  // ۱. آپدیت دیتای کاربر با تابع تبدیل
  const currentUser = db.users[index];
  const updatedUser = updaterFn(currentUser);
  db.users[index] = updatedUser;

  // ۲. ذخیره فوری در LocalStorage
  saveDatabase(db);

  // ۳. ذخیره در سرور json-server (نوشتن روی فایل واقعی db.json)
  try {
    await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
    });
  } catch {
    console.warn('[DB] json-server is offline, saved locally only.');
  }

  return updatedUser;
}
