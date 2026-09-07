// src/core/actions/tools-service.js

/**
 * ViXoRa Tools Service — CRUD یکپارچه برای همهٔ ابزارها
 * ==================================================================
 * هر ابزار یک آرایه در `user.tools[toolName]` است.
 * منبع داده: LocalStorage (بدون بک‌اند).
 *
 * هر عملیات:
 *   ۱) کاربر فعال را از state می‌گیرد
 *   ۲) نسخهٔ تازهٔ کاربر را از دیتابیس می‌خواند
 *   ۳) دیتابیس را آپدیت می‌کند
 *   ۴) session و state را همگام می‌کند
 *   ۵) خروجی را با structuredClone برمی‌گرداند (بدون نشتی reference)
 */

import { getAppState, setAuthUser } from '../state/app-state.js';
import { selectCurrentUser } from '../state/selectors.js';
import {
  getUserById,
  updateUserInDatabase,
  sanitizeUser,
} from '../storage/db-client.js';
import { setStoredUser } from '../storage/session-storage.js';

/* ------------------------------------------------------------------ */
/* ابزارهای داخلی                                                      */
/* ------------------------------------------------------------------ */

function getActiveUserFromState() {
  const state = getAppState();
  const user = selectCurrentUser(state);

  if (!user || !user.id) {
    throw new Error('[ToolsService] No authenticated user found.');
  }

  return user;
}

async function getFreshActiveUser({ signal } = {}) {
  const activeUser = getActiveUserFromState();
  const freshUser = await getUserById(activeUser.id, { signal });

  if (!freshUser) {
    throw new Error(`[ToolsService] User ${activeUser.id} does not exist.`);
  }

  return freshUser;
}

function assertToolName(toolName) {
  if (!toolName || typeof toolName !== 'string' || !toolName.trim()) {
    throw new TypeError('[ToolsService] toolName must be a non-empty string.');
  }

  return toolName.trim();
}

function createItemId(toolName) {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${toolName}-${uuid}`;
}

function readToolList(user, toolName) {
  const list = user?.tools?.[toolName];
  return Array.isArray(list) ? list : [];
}

function syncUserEverywhere(updatedUser) {
  const safeUser = sanitizeUser(updatedUser);

  if (safeUser) {
    setStoredUser(safeUser);
    setAuthUser(safeUser);
  }

  return safeUser;
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value ?? null));
  }
}

/* ------------------------------------------------------------------ */
/* خواندن                                                              */
/* ------------------------------------------------------------------ */

/**
 * خواندن لیست یک ابزار — از دیتابیس (تازه‌ترین حالت)
 * @returns {Promise<Array>}
 */
export async function getToolData(toolName, { signal } = {}) {
  assertToolName(toolName);

  const user = await getFreshActiveUser({ signal });

  return clone(readToolList(user, toolName));
}

/** خواندن سریع از state — بدون I/O، مخصوص رندر اولیه */
export function getToolDataFromState(toolName) {
  assertToolName(toolName);

  const state = getAppState();
  const user = selectCurrentUser(state);

  return clone(readToolList(user, toolName));
}

export async function getToolItem(toolName, itemId, { signal } = {}) {
  assertToolName(toolName);

  const list = await getToolData(toolName, { signal });

  return list.find((item) => String(item.id) === String(itemId)) || null;
}

export async function countToolItems(toolName, { signal } = {}) {
  const list = await getToolData(toolName, { signal });
  return list.length;
}

/* ------------------------------------------------------------------ */
/* نوشتن                                                               */
/* ------------------------------------------------------------------ */

export async function createToolItem(toolName, itemPayload, { signal } = {}) {
  assertToolName(toolName);

  const user = await getFreshActiveUser({ signal });

  const newItem = {
    id: createItemId(toolName),
    createdAt: new Date().toISOString(),
    ...(itemPayload || {}),
  };

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];

      return {
        ...currentUser,
        tools: {
          ...tools,
          [toolName]: [newItem, ...list],
        },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return clone(newItem);
}

export async function updateToolItem(toolName, itemId, updatedFields, { signal } = {}) {
  assertToolName(toolName);

  const user = await getFreshActiveUser({ signal });

  let updatedItem = null;

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];

      const index = list.findIndex((item) => String(item.id) === String(itemId));

      if (index === -1) {
        throw new Error(`[ToolsService] Item ${itemId} not found.`);
      }

      updatedItem = {
        ...list[index],
        ...(updatedFields || {}),
        id: list[index].id,
        createdAt: list[index].createdAt,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...list];
      nextList[index] = updatedItem;

      return {
        ...currentUser,
        tools: {
          ...tools,
          [toolName]: nextList,
        },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return clone(updatedItem);
}

export async function deleteToolItem(toolName, itemId, { signal } = {}) {
  assertToolName(toolName);

  const user = await getFreshActiveUser({ signal });

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];

      const exists = list.some((item) => String(item.id) === String(itemId));

      if (!exists) {
        throw new Error(`[ToolsService] Item ${itemId} not found.`);
      }

      return {
        ...currentUser,
        tools: {
          ...tools,
          [toolName]: list.filter((item) => String(item.id) !== String(itemId)),
        },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return true;
}

/* ------------------------------------------------------------------ */
/* عملیات دسته‌جمعی                                                    */
/* ------------------------------------------------------------------ */

export async function setToolItems(toolName, nextList, { signal } = {}) {
  assertToolName(toolName);

  if (!Array.isArray(nextList)) {
    throw new TypeError('[ToolsService] setToolItems requires an array.');
  }

  const user = await getFreshActiveUser({ signal });

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => ({
      ...currentUser,
      tools: {
        ...(currentUser.tools || {}),
        [toolName]: clone(nextList),
      },
    }),
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return clone(nextList);
}

export async function deleteManyToolItems(toolName, itemIds, { signal } = {}) {
  assertToolName(toolName);

  if (!Array.isArray(itemIds) || itemIds.length === 0) return 0;

  const idSet = new Set(itemIds.map((id) => String(id)));
  const user = await getFreshActiveUser({ signal });

  let removedCount = 0;

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];
      const nextList = list.filter((item) => !idSet.has(String(item.id)));

      removedCount = list.length - nextList.length;

      return {
        ...currentUser,
        tools: { ...tools, [toolName]: nextList },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return removedCount;
}

export async function reorderToolItems(toolName, orderedIds, { signal } = {}) {
  assertToolName(toolName);

  if (!Array.isArray(orderedIds)) {
    throw new TypeError('[ToolsService] reorderToolItems requires an array of ids.');
  }

  const user = await getFreshActiveUser({ signal });

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];
      const map = new Map(list.map((item) => [String(item.id), item]));

      const ordered = orderedIds.map((id) => map.get(String(id))).filter(Boolean);
      const remaining = list.filter((item) => !orderedIds.map(String).includes(String(item.id)));

      return {
        ...currentUser,
        tools: { ...tools, [toolName]: [...ordered, ...remaining] },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return true;
}

/** کپی/ایمپورت سریع — برای paste از کلیپ‌بورد یا import JSON */
export async function importToolItems(toolName, items, { signal } = {}) {
  assertToolName(toolName);

  if (!Array.isArray(items) || items.length === 0) return 0;

  const user = await getFreshActiveUser({ signal });
  const now = new Date().toISOString();

  const incoming = items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...item,
      id: createItemId(toolName),
      createdAt: item.createdAt || now,
      importedAt: now,
    }));

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName]) ? tools[toolName] : [];

      return {
        ...currentUser,
        tools: { ...tools, [toolName]: [...incoming, ...list] },
      };
    },
    { signal }
  );

  syncUserEverywhere(updatedUser);

  return incoming.length;
}

export async function exportToolItems(toolName, { signal } = {}) {
  const list = await getToolData(toolName, { signal });

  return {
    tool: toolName,
    exportedAt: new Date().toISOString(),
    count: list.length,
    items: list,
  };
}
