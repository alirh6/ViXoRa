
// // src/core/actions/tools-service.js
// import { getAppState } from '../state/app-state.js';
// import { selectCurrentUser } from '../state/selectors.js';
// import { findUserById, updateUserInDatabase } from '../storage/db-client.js';

// /**
//  * دریافت امن کاربر لاگین شده
//  */
// function getActiveUser() {
//   const state = getAppState();
//   const authUser = selectCurrentUser(state);

//   if (!authUser || !authUser.id) {
//     throw new Error('[ToolsService] No authenticated user found.');
//   }

//   const fullUserData = findUserById(authUser.id);
//   if (!fullUserData) {
//     throw new Error(`[ToolsService] User with id ${authUser.id} does not exist in DB.`);
//   }

//   return fullUserData;
// }

// /**
//  * دریافت دیتای یک ابزار
//  */
// export async function getToolData(toolName) {
//   const user = getActiveUser();
//   return user.tools?.[toolName] || [];
// }

// /**
//  * ایجاد آیتم جدید
//  */
// export async function createToolItem(toolName, itemPayload) {
//   const user = getActiveUser();
  
//   const newItem = {
//     id: `${toolName}-${Date.now()}`,
//     createdAt: new Date().toISOString(),
//     ...itemPayload
//   };

//   await updateUserInDatabase(user.id, (current) => {
//     if (!current.tools) current.tools = {};
//     if (!Array.isArray(current.tools[toolName])) current.tools[toolName] = [];
    
//     current.tools[toolName].unshift(newItem);
//     return current;
//   });

//   return newItem;
// }

// /**
//  * ویرایش آیتم
//  */
// export async function updateToolItem(toolName, itemId, updatedFields) {
//   const user = getActiveUser();
//   let updatedItem = null;

//   await updateUserInDatabase(user.id, (current) => {
//     const list = current.tools?.[toolName] || [];
//     const index = list.findIndex((item) => String(item.id) === String(itemId));

//     if (index === -1) {
//       throw new Error(`[ToolsService] Item ${itemId} not found in ${toolName}`);
//     }

//     list[index] = {
//       ...list[index],
//       ...updatedFields,
//       updatedAt: new Date().toISOString()
//     };

//     updatedItem = list[index];
//     return current;
//   });

//   return updatedItem;
// }

// /**
//  * حذف آیتم
//  */
// export async function deleteToolItem(toolName, itemId) {
//   const user = getActiveUser();

//   await updateUserInDatabase(user.id, (current) => {
//     if (!current.tools) current.tools = {};
//     const list = current.tools[toolName] || [];
//     current.tools[toolName] = list.filter((item) => String(item.id) !== String(itemId));
//     return current;
//   });

//   return true;
// }










// src/core/actions/tools-service.js

import { getAppState, setAuthUser } from '../state/app-state.js';
import { selectCurrentUser } from '../state/selectors.js';
import {
  getUserById,
  updateUserInDatabase,
  sanitizeUser,
} from '../storage/db-client.js';

import { setStoredUser } from '../storage/session-storage.js';

function getActiveUserFromState() {
  const state = getAppState();
  const user = selectCurrentUser(state);

  if (!user || !user.id) {
    throw new Error(
      '[ToolsService] No authenticated user found.'
    );
  }

  return user;
}

async function getFreshActiveUser() {
  const activeUser = getActiveUserFromState();
  const freshUser = await getUserById(activeUser.id);

  if (!freshUser) {
    throw new Error(
      `[ToolsService] User ${activeUser.id} does not exist.`
    );
  }

  return freshUser;
}

function createItemId(toolName) {
  return `${toolName}-${crypto.randomUUID()}`;
}

export async function getToolData(toolName) {
  if (!toolName || typeof toolName !== 'string') {
    throw new TypeError(
      '[ToolsService] toolName must be a non-empty string.'
    );
  }

  const user = await getFreshActiveUser();

  const list = user.tools?.[toolName];

  return Array.isArray(list)
    ? structuredClone(list)
    : [];
}

export async function createToolItem(toolName, itemPayload) {
  const user = await getFreshActiveUser();

  const newItem = {
    id: createItemId(toolName),
    createdAt: new Date().toISOString(),
    ...(itemPayload || {}),
  };

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName])
        ? tools[toolName]
        : [];

      return {
        ...currentUser,

        tools: {
          ...tools,
          [toolName]: [newItem, ...list],
        },
      };
    }
  );

  const safeUser = sanitizeUser(updatedUser);

  setStoredUser(safeUser);
  setAuthUser(safeUser);

  return structuredClone(newItem);
}

export async function updateToolItem(
  toolName,
  itemId,
  updatedFields
) {
  const user = await getFreshActiveUser();

  let updatedItem = null;

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName])
        ? tools[toolName]
        : [];

      const index = list.findIndex(
        (item) => String(item.id) === String(itemId)
      );

      if (index === -1) {
        throw new Error(
          `[ToolsService] Item ${itemId} not found.`
        );
      }

      updatedItem = {
        ...list[index],
        ...(updatedFields || {}),
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
    }
  );

  const safeUser = sanitizeUser(updatedUser);

  setStoredUser(safeUser);
  setAuthUser(safeUser);

  return structuredClone(updatedItem);
}

export async function deleteToolItem(toolName, itemId) {
  const user = await getFreshActiveUser();

  const updatedUser = await updateUserInDatabase(
    user.id,
    (currentUser) => {
      const tools = currentUser.tools || {};
      const list = Array.isArray(tools[toolName])
        ? tools[toolName]
        : [];

      const exists = list.some(
        (item) => String(item.id) === String(itemId)
      );

      if (!exists) {
        throw new Error(
          `[ToolsService] Item ${itemId} not found.`
        );
      }

      return {
        ...currentUser,

        tools: {
          ...tools,
          [toolName]: list.filter(
            (item) =>
              String(item.id) !== String(itemId)
          ),
        },
      };
    }
  );

  const safeUser = sanitizeUser(updatedUser);

  setStoredUser(safeUser);
  setAuthUser(safeUser);

  return true;
}
