
// // src/core/storage/db-client.js
// import initialDb from '../../db/db.json';
// import { createLocalStorageAdapter } from '../../utilities/storage.js';

// const storage = createLocalStorageAdapter();
// const DB_KEY = 'ViXoRa:database';
// const API_BASE_URL = 'http://localhost:3001';

// /**
//  * همگام‌سازی دیتابیس لوکال با json-server
//  */
// export async function syncDatabaseWithServer() {
//   try {
//     const res = await fetch(`${API_BASE_URL}/users`);
//     if (res.ok) {
//       const users = await res.json();
//       const db = getDatabase();
//       db.users = users;
//       saveDatabase(db);
//     }
//   } catch {
//     // اگر سرور خاموش بود، با دیتای لوکال ادامه می‌دهد
//   }
// }

// /**
//  * دریافت کل دیتابیس
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
//  * پیدا کردن کاربر با آیدی
//  */
// export function findUserById(userId) {
//   const db = getDatabase();
//   return db.users?.find((u) => String(u.id) === String(userId)) || null;
// }

// /**
//  * به‌روزرسانی اطلاعات کاربر همزمان در LocalStorage و فایل db.json
//  */
// export async function updateUserInDatabase(userId, updaterFn) {
//   const db = getDatabase();
//   const index = db.users.findIndex((u) => String(u.id) === String(userId));

//   if (index === -1) {
//     throw new Error(`[DB] User with id "${userId}" not found.`);
//   }

//   // ۱. آپدیت دیتای کاربر با تابع تبدیل
//   const currentUser = db.users[index];
//   const updatedUser = updaterFn(currentUser);
//   db.users[index] = updatedUser;

//   // ۲. ذخیره فوری در LocalStorage
//   saveDatabase(db);

//   // ۳. ذخیره در سرور json-server (نوشتن روی فایل واقعی db.json)
//   try {
//     await fetch(`${API_BASE_URL}/users/${userId}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(updatedUser),
//     });
//   } catch {
//     console.warn('[DB] json-server is offline, saved locally only.');
//   }

//   return updatedUser;
// }





// src/core/storage/db-client.js

const API_BASE_URL = 'http://localhost:3001';

async function parseResponse(response) {
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }
console.log(body);

  return body;
}

function normalizeId(id) {
  return String(id);
}

export async function getUserById(userId, { signal } = {}) {
  if (userId === null || userId === undefined || userId === '') {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}/users/${encodeURIComponent(userId)}`,
    { signal }
  );
  

  if (response.status === 404) {
    return null;
  }


  return parseResponse(response);
}

export async function findUserByCredentials(
  username,
  password,
  { signal } = {}
) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername || !password) {
    return null;
  }

  const query = new URLSearchParams({
    username: normalizedUsername,
  });

  const response = await fetch(
    `${API_BASE_URL}/users?${query.toString()}`,
    { signal }
  );

  const users = await parseResponse(response);

  if (!Array.isArray(users)) {
    throw new Error('[DB] Invalid users response.');
  }

  const user = users.find(
    (candidate) =>
      String(candidate.username).toLowerCase() ===
        normalizedUsername.toLowerCase() &&
      candidate.password === password
  );

  return user || null;
}

export async function findUserByUsername(
  username,
  { signal } = {}
) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    return null;
  }

  const query = new URLSearchParams({
    username: normalizedUsername,
  });

  const response = await fetch(
    `${API_BASE_URL}/users?${query.toString()}`,
    { signal }
  );

  const users = await parseResponse(response);

  if (!Array.isArray(users)) {
    throw new Error('[DB] Invalid users response.');
  }

  return (
    users.find(
      (user) =>
        String(user.username).toLowerCase() ===
        normalizedUsername.toLowerCase()
    ) || null
  );
}

export async function createUser(userData, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
    signal,
  });

  return parseResponse(response);
}

export async function updateUserInDatabase(
  userId,
  updaterFn,
  { signal } = {}
) {
  if (typeof updaterFn !== 'function') {
    throw new TypeError('[DB] updaterFn must be a function.');
  }

  const currentUser = await getUserById(userId, { signal });

  if (!currentUser) {
    throw new Error(
      `[DB] User with id "${userId}" not found.`
    );
  }

  const updatedUser = await updaterFn(structuredClone(currentUser));

  if (!updatedUser || typeof updatedUser !== 'object') {
    throw new TypeError(
      '[DB] updaterFn must return a valid user object.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
      signal,
    }
  );

  return parseResponse(response);
}

export function sanitizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const { password, ...safeUser } = user;
  return structuredClone(safeUser);
}

export function areSameUserId(firstId, secondId) {
  return normalizeId(firstId) === normalizeId(secondId);
}
