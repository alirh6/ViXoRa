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
//  * دریافت تمام آیتم‌های یک ابزار برای کاربر لاگین شده
//  * @param {string} toolName - نام ابزار مثلا 'notes' یا 'todos'
//  */
// export async function getToolData(toolName) {
//   const user = getActiveUser();
//   return user.tools?.[toolName] || [];
// }

// /**
//  * ایجاد یک آیتم جدید داخل ابزار
//  */
// export async function createToolItem(toolName, itemPayload) {
//   const user = getActiveUser();
  
//   const newItem = {
//     id: `${toolName}-${Date.now()}`,
//     createdAt: new Date().toISOString(),
//     ...itemPayload
//   };

//   updateUserInDatabase(user.id, (current) => {
//     if (!current.tools) current.tools = {};
//     if (!Array.isArray(current.tools[toolName])) current.tools[toolName] = [];
    
//     current.tools[toolName].unshift(newItem); // اضافه به ابتدای لیست
//     return current;
//   });

//   return newItem;
// }

// /**
//  * ویرایش یک آیتم از ابزار بر اساس ID
//  */
// export async function updateToolItem(toolName, itemId, updatedFields) {
//   const user = getActiveUser();
//   let updatedItem = null;

//   updateUserInDatabase(user.id, (current) => {
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
//  * حذف یک آیتم از ابزار بر اساس ID
//  */
// export async function deleteToolItem(toolName, itemId) {
//   const user = getActiveUser();

//   updateUserInDatabase(user.id, (current) => {
//     if (!current.tools) current.tools = {};
//     const list = current.tools[toolName] || [];
//     current.tools[toolName] = list.filter((item) => String(item.id) !== String(itemId));
//     return current;
//   });

//   return true;
// }


// src/core/actions/tools-service.js
import { getAppState } from '../state/app-state.js';
import { selectCurrentUser } from '../state/selectors.js';
import { findUserById, updateUserInDatabase } from '../storage/db-client.js';

/**
 * دریافت امن کاربر لاگین شده
 */
function getActiveUser() {
  const state = getAppState();
  const authUser = selectCurrentUser(state);

  if (!authUser || !authUser.id) {
    throw new Error('[ToolsService] No authenticated user found.');
  }

  const fullUserData = findUserById(authUser.id);
  if (!fullUserData) {
    throw new Error(`[ToolsService] User with id ${authUser.id} does not exist in DB.`);
  }

  return fullUserData;
}

/**
 * دریافت دیتای یک ابزار
 */
export async function getToolData(toolName) {
  const user = getActiveUser();
  return user.tools?.[toolName] || [];
}

/**
 * ایجاد آیتم جدید
 */
export async function createToolItem(toolName, itemPayload) {
  const user = getActiveUser();
  
  const newItem = {
    id: `${toolName}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...itemPayload
  };

  await updateUserInDatabase(user.id, (current) => {
    if (!current.tools) current.tools = {};
    if (!Array.isArray(current.tools[toolName])) current.tools[toolName] = [];
    
    current.tools[toolName].unshift(newItem);
    return current;
  });

  return newItem;
}

/**
 * ویرایش آیتم
 */
export async function updateToolItem(toolName, itemId, updatedFields) {
  const user = getActiveUser();
  let updatedItem = null;

  await updateUserInDatabase(user.id, (current) => {
    const list = current.tools?.[toolName] || [];
    const index = list.findIndex((item) => String(item.id) === String(itemId));

    if (index === -1) {
      throw new Error(`[ToolsService] Item ${itemId} not found in ${toolName}`);
    }

    list[index] = {
      ...list[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    updatedItem = list[index];
    return current;
  });

  return updatedItem;
}

/**
 * حذف آیتم
 */
export async function deleteToolItem(toolName, itemId) {
  const user = getActiveUser();

  await updateUserInDatabase(user.id, (current) => {
    if (!current.tools) current.tools = {};
    const list = current.tools[toolName] || [];
    current.tools[toolName] = list.filter((item) => String(item.id) !== String(itemId));
    return current;
  });

  return true;
}
