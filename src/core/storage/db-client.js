// src/core/storage/db-client.js

/**
 * ViXoRa Data Layer — LocalStorage-First Database Client
 * ==================================================================
 * ⚠️ این پروژه بک‌اند ندارد.
 *
 * منبع اصلی حقیقت (Source of Truth) = LocalStorage
 *   کلید:  ViXoRa:users
 *   شکل:   { users: [...] }
 *
 * حالت‌ها:
 *   'local'  (پیش‌فرض)  → همه‌چیز فقط روی LocalStorage
 *   'remote'            → LocalStorage + آینه‌سازی روی json-server
 *                           (بدون بلاک‌کردن UI و بدون شکستن برنامه
 *                            در صورت خاموش بودن سرور)
 *
 * همهٔ توابع async هستند تا اگر روزی بک‌اند واقعی اضافه شد،
 * هیچ فایلی در پروژه نیاز به تغییر نداشته باشد.
 */

import { createLocalStorageAdapter } from '../../utilities/storage.js';
import {
  API_BASE_URL,
  DEFAULT_DB_MODE,
  STORAGE_KEYS,
  USER_PLANS,
  USER_ROLES,
} from '../../config/app-config.js';

const storage = createLocalStorageAdapter();

/** دادهٔ اولیه — دقیقاً همان ساختار db.json پروژه */
const SEED_USERS = [
  {
    id: '1',
    name: 'ali',
    lastName: 'rh',
    username: 'alirh',
    password: 'ali12345',
    email: 'ali@gmail.com',
    phoneNumber: '09397988728',
    nationalCode: '0440242442',
    birthDate: '25/2/1994',
    age: 33,
    role: 'admin',
    plan: 'pro',
    avatar: 'https://cdn.imgurl.ir/uploads/872840_me2.png',
    address: 'pasdaran golestan4',
    city: 'tehran',
    country: 'iran',
    jobTitle: 'developer',
    inventory: 12458000,
    about: [],
    tickets: [],
    messages: [],
    invitedFriends: [],
    totalExpenditure: [],
    security: {
      firstLoginIp: '',
      firstLoginUserAgent: '',
      lastLoginIp: '',
      lastLoginUserAgent: '',
    },
    memberSince: '2026-01-11T09:00:00.000Z',
    createdAt: '2026-01-11T09:00:00.000Z',
    profileIsComplete: false,
    tools: { notes: [], todos: [], customerInfo: [] },
  },
  {
    id: '2',
    name: 'zahra',
    lastName: '',
    username: 'zahra',
    password: 'zahra123',
    email: 'zahra@gmail.com',
    role: 'user',
    plan: 'free',
    avatar: '',
    createdAt: '2026-02-02T09:00:00.000Z',
    profileIsComplete: false,
    tools: { notes: [], todos: [], customerInfo: [] },
  },
];

let dbMode = null;
let seedPromise = null;

/* ------------------------------------------------------------------ */
/* حالت پایگاه داده                                                    */
/* ------------------------------------------------------------------ */

export function getDbMode() {
  if (dbMode) return dbMode;

  const override = storage.get(STORAGE_KEYS.dbMode, null);
  dbMode = override === 'remote' || override === 'local' ? override : DEFAULT_DB_MODE;

  return dbMode;
}

export function setDbMode(mode) {
  if (mode !== 'local' && mode !== 'remote') {
    throw new TypeError('[DB] dbMode must be "local" or "remote".');
  }

  dbMode = mode;
  storage.set(STORAGE_KEYS.dbMode, mode);

  return mode;
}

export function isRemoteEnabled() {
  return getDbMode() === 'remote';
}

/* ------------------------------------------------------------------ */
/* ابزارهای داخلی                                                      */
/* ------------------------------------------------------------------ */

function normalizeId(id) {
  return id === null || id === undefined ? '' : String(id).trim();
}

function createUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readUsersTable() {
  const table = storage.get(STORAGE_KEYS.users, null);

  if (table && Array.isArray(table.users)) {
    return table.users.filter((user) => user && typeof user === 'object');
  }

  return [];
}

function writeUsersTable(users) {
  const safeUsers = Array.isArray(users) ? users : [];

  storage.set(STORAGE_KEYS.users, {
    users: safeUsers,
    updatedAt: new Date().toISOString(),
  });

  return safeUsers;
}

function cloneUser(user) {
  if (!user || typeof user !== 'object') return null;

  try {
    return structuredClone(user);
  } catch {
    return JSON.parse(JSON.stringify(user));
  }
}

/** پرکردن فیلدهای غایب کاربر تا ساختار همیشه یکدست باشد */
export function normalizeUserRecord(rawUser = {}) {
  const user = { ...rawUser };

  user.id = normalizeId(user.id) || createUserId();
  user.name = typeof user.name === 'string' ? user.name : '';
  user.lastName = typeof user.lastName === 'string' ? user.lastName : '';
  user.username = typeof user.username === 'string' ? user.username.trim() : '';
  user.email = typeof user.email === 'string' ? user.email.trim() : '';
  user.password = typeof user.password === 'string' ? user.password : '';
  user.avatar = typeof user.avatar === 'string' ? user.avatar : '';
  user.phoneNumber = typeof user.phoneNumber === 'string' ? user.phoneNumber : '';
  user.jobTitle = typeof user.jobTitle === 'string' ? user.jobTitle : '';
  user.address = typeof user.address === 'string' ? user.address : '';
  user.city = typeof user.city === 'string' ? user.city : '';
  user.country = typeof user.country === 'string' ? user.country : 'iran';
  user.nationalCode = typeof user.nationalCode === 'string' ? user.nationalCode : '';
  user.birthDate = typeof user.birthDate === 'string' ? user.birthDate : '';
  user.cardNumber = typeof user.cardNumber === 'string' ? user.cardNumber : '';
  user.shabaNumber = typeof user.shabaNumber === 'string' ? user.shabaNumber : '';
  user.inventory = Number.isFinite(Number(user.inventory)) ? Number(user.inventory) : 0;
  user.role = USER_ROLES.includes(user.role) ? user.role : 'user';
  user.plan = USER_PLANS.includes(user.plan) ? user.plan : 'plus';
  user.profileIsComplete =
    user.profileIsComplete === true || user.profileIsComplete === 'true';

  user.about = Array.isArray(user.about) ? user.about : [];
  user.tickets = Array.isArray(user.tickets) ? user.tickets : [];
  user.messages = Array.isArray(user.messages) ? user.messages : [];
  user.invitedFriends = Array.isArray(user.invitedFriends) ? user.invitedFriends : [];
  user.totalExpenditure = Array.isArray(user.totalExpenditure) ? user.totalExpenditure : [];

  user.security = {
    firstLoginIp: '',
    firstLoginUserAgent: '',
    lastLoginIp: '',
    lastLoginUserAgent: '',
    ...(user.security && typeof user.security === 'object' ? user.security : {}),
  };

  user.tools =
    user.tools && typeof user.tools === 'object' && !Array.isArray(user.tools)
      ? {
          notes: Array.isArray(user.tools.notes) ? user.tools.notes : [],
          todos: Array.isArray(user.tools.todos) ? user.tools.todos : [],
          customerInfo: Array.isArray(user.tools.customerInfo) ? user.tools.customerInfo : [],
          ...user.tools,
        }
      : { notes: [], todos: [], customerInfo: [] };

  user.createdAt = typeof user.createdAt === 'string' && user.createdAt
    ? user.createdAt
    : new Date().toISOString();

  user.lastUpdated = typeof user.lastUpdated === 'string' ? user.lastUpdated : '';
  user.memberSince = typeof user.memberSince === 'string' ? user.memberSince : '';
  user.lastLoginAt = typeof user.lastLoginAt === 'string' ? user.lastLoginAt : '';

  return user;
}

/** حذف رمز عبور قبل از دادن کاربر به UI / Storage */
export function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  const safeUser = cloneUser(user);
  if (!safeUser) return null;

  delete safeUser.password;

  return safeUser;
}

export function areSameUserId(firstId, secondId) {
  const a = normalizeId(firstId);
  const b = normalizeId(secondId);

  return a !== '' && a === b;
}

/* ------------------------------------------------------------------ */
/* آینه‌سازی اختیاری روی json-server                                    */
/* ------------------------------------------------------------------ */

async function remoteRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed with status ${response.status}`);
  }

  return body;
}

/** هرگز throw نمی‌کند — فقط لاگ می‌زند */
function mirrorToRemote(updater) {
  if (!isRemoteEnabled()) return Promise.resolve();

  return Promise.resolve()
    .then(updater)
    .catch((error) => {
      console.warn('[DB] Remote mirror skipped (json-server unreachable):', error?.message || error);
    });
}

/* ------------------------------------------------------------------ */
/* آماده‌سازی                                                          */
/* ------------------------------------------------------------------ */

/**
 * اولین اجرا: جدول کاربران را در LocalStorage می‌سازد.
 * چندبار صدا زده شود هم امن است (idempotent).
 */
export function ensureDatabaseReady() {
  if (seedPromise) return seedPromise;

  seedPromise = Promise.resolve().then(() => {
    const existing = storage.get(STORAGE_KEYS.users, null);

    if (existing && Array.isArray(existing.users) && existing.users.length > 0) {
      return existing.users.length;
    }

    const seeded = SEED_USERS.map((user) => normalizeUserRecord(cloneUser(user)));
    writeUsersTable(seeded);
    storage.set(STORAGE_KEYS.seed, new Date().toISOString());

    return seeded.length;
  });

  return seedPromise;
}

/** بازنشانی کامل دیتابیس به حالت اولیه */
export function resetDatabase() {
  seedPromise = null;
  storage.remove(STORAGE_KEYS.users);
  storage.remove(STORAGE_KEYS.seed);

  return ensureDatabaseReady();
}

/* ------------------------------------------------------------------ */
/* خواندن                                                              */
/* ------------------------------------------------------------------ */

export async function getAllUsers({ signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  return readUsersTable().map(cloneUser);
}

export async function getUserById(userId, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const id = normalizeId(userId);
  if (!id) return null;

  const user = readUsersTable().find((candidate) => areSameUserId(candidate.id, id));

  return user ? cloneUser(user) : null;
}

export async function findUserByUsername(username, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const normalized = String(username || '').trim().toLowerCase();
  if (!normalized) return null;

  const user = readUsersTable().find(
    (candidate) => String(candidate.username || '').toLowerCase() === normalized
  );

  return user ? cloneUser(user) : null;
}

export async function findUserByEmail(email, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const user = readUsersTable().find(
    (candidate) => String(candidate.email || '').toLowerCase() === normalized
  );

  return user ? cloneUser(user) : null;
}

export async function findUserByCredentials(username, password, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername || !password) return null;

  const user = await findUserByUsername(normalizedUsername, { signal });
  if (!user) return null;

  return user.password === String(password) ? user : null;
}

export async function searchUsers(query, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return [];

  return readUsersTable()
    .filter((user) =>
      [user.name, user.lastName, user.username, user.email, user.phoneNumber, user.jobTitle]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized))
    )
    .map(cloneUser);
}

/* ------------------------------------------------------------------ */
/* نوشتن                                                               */
/* ------------------------------------------------------------------ */

export async function createUser(userData, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  if (!userData || typeof userData !== 'object') {
    throw new TypeError('[DB] createUser requires a user object.');
  }

  const users = readUsersTable();
  const newUser = normalizeUserRecord(userData);

  const usernameTaken = users.some(
    (user) => String(user.username || '').toLowerCase() === newUser.username.toLowerCase()
  );

  if (newUser.username && usernameTaken) {
    throw new Error('[DB] Username already exists.');
  }

  const emailTaken =
    Boolean(newUser.email) &&
    users.some(
      (user) => String(user.email || '').toLowerCase() === newUser.email.toLowerCase()
    );

  if (emailTaken) {
    throw new Error('[DB] Email already exists.');
  }

  writeUsersTable([newUser, ...users]);

  mirrorToRemote(() =>
    remoteRequest('/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
      signal,
    })
  );

  return cloneUser(newUser);
}

export async function updateUserInDatabase(userId, updaterFn, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  if (typeof updaterFn !== 'function') {
    throw new TypeError('[DB] updaterFn must be a function.');
  }

  const id = normalizeId(userId);
  const users = readUsersTable();
  const index = users.findIndex((user) => areSameUserId(user.id, id));

  if (index === -1) {
    throw new Error(`[DB] User with id "${id}" not found.`);
  }

  const currentUser = cloneUser(users[index]);
  const updatedUser = await updaterFn(currentUser);

  if (!updatedUser || typeof updatedUser !== 'object' || Array.isArray(updatedUser)) {
    throw new TypeError('[DB] updaterFn must return a valid user object.');
  }

  const nextRecord = normalizeUserRecord({ ...currentUser, ...updatedUser, id: currentUser.id });
  nextRecord.lastUpdated = new Date().toISOString();

  const nextUsers = [...users];
  nextUsers[index] = nextRecord;
  writeUsersTable(nextUsers);

  mirrorToRemote(() =>
    remoteRequest(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(nextRecord),
      signal,
    })
  );

  return cloneUser(nextRecord);
}

export async function patchUserInDatabase(userId, partialData, { signal } = {}) {
  if (!partialData || typeof partialData !== 'object') {
    throw new TypeError('[DB] patchUserInDatabase requires an object.');
  }

  return updateUserInDatabase(
    userId,
    (currentUser) => ({ ...currentUser, ...partialData }),
    { signal }
  );
}

export async function deleteUser(userId, { signal } = {}) {
  await ensureDatabaseReady();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const id = normalizeId(userId);
  const users = readUsersTable();
  const nextUsers = users.filter((user) => !areSameUserId(user.id, id));

  if (nextUsers.length === users.length) {
    throw new Error(`[DB] User with id "${id}" not found.`);
  }

  writeUsersTable(nextUsers);

  mirrorToRemote(() =>
    remoteRequest(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      signal,
    })
  );

  return true;
}

/* ------------------------------------------------------------------ */
/* آمار سبک                                                            */
/* ------------------------------------------------------------------ */

export async function countUsers() {
  await ensureDatabaseReady();
  return readUsersTable().length;
}
