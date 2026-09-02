// import { createStore } from '../store/store.js';
// import { createLocalStorageAdapter } from '../../utilities/storage.js';

// const STORAGE_KEY = 'ViXoRa:state';

// const initialState = {
//   auth: {
//     status: 'checking', // 'checking' | 'authenticated' | 'guest'
//     user: null,
//   },
//   ui: {
//     isSidebarOpen: false,
//     theme: 'light', // 'light' | 'dark'
//     language: 'english', // 'english' | 'persian'
//   },
//   app: {
//     isInitialized: false,
//   },
// };

// const storage = createLocalStorageAdapter();


// export const appStore = createStore({initialState, storage, persistKey: STORAGE_KEY})


// function normalizeUser (rawUser) {
//   if (!rawUser || typeof rawUser !== 'object') {return null}

//   const hasValidId = (typeof rawUser.id === 'string' || typeof rawUser.id === 'number') && rawUser.id.trim() !== ''
//   const hasValidRole = rawUser.role === 'admin' || rawUser.role === 'user'
//   const hasValidPlan = rawUser.plan === 'free' || rawUser.plan === 'pro' || rawUser.plan === 'plus' || rawUser.plan === 'go' || rawUser.plan === "gift"

//   if (!hasValidId || !hasValidPlan || !hasValidRole) {
//     return null
//   }

//   return {
//     id: rawUser.id,
//     name: typeof rawUser.name === 'string' ? rawUser.name : 'user',
//     email: typeof rawUser.email === 'string' ? rawUser.email : '',
//     role : rawUser.role,
//     plan: rawUser.plan
//   }
// }

// function normalizeAuthState (rawAuth = {}) {
//   const user = normalizeUser(rawAuth.user)

//   if(!user) {
//     return {
//       status: 'guest',
//       user: null,
//     }
//   }

//   return {
//     status: 'authenticated',
//     user,
//   };
// }

// function normalizeUi (ui) {
//   return ui && typeof ui === 'object' ? ui : {}
// }

// function normalizeUiState (rawUi = {}) {
//   const validTheme = ['light' , 'dark']
//   const validLanguage = ['english' , 'persian' , 'france' , 'spanish' , 'arabic']

//   return {
//     isSidebarOpen: typeof rawUi.isSidebarOpen === 'boolean' ? rawUi.isSidebarOpen : false,
//     theme: validTheme.includes(rawUi.theme) ? rawUi.theme : 'light',
//     language: validLanguage.includes(rawUi.language) ? rawUi.language : 'english'
//   }
// }

// function normalizeState (rawState = {}) {
//   return {
//     auth : normalizeAuthState(rawState.auth),
//     ui: normalizeUiState(normalizeUi(rawState.ui)),
//     app: {
//       isInitialized: true,
//     },
//   }
// }

// export function initializeAppState () {
//   appStore.initialize(normalizeState)
// }

// export function getAppState () {
//   return appStore.getState()
// }

// export function setAuthUser (userData) {
//   const normalizedUser = normalizeUser(userData)

//   if (!normalizedUser) {
//     throw new Error('[AppState] Invalid user data provided for login.');
//   }

//   appStore.setState((current) => ({
//     ...current,
//     auth: {
//       status: 'authenticated',
//       user: normalizedUser,
//     },
//   }));
// }

// export function clearAuthUser() {
//   appStore.setState((current) => ({
//     ...current,
//     auth: {
//       status: 'guest',
//       user: null,
//     },
//   }));
// }

// export function setTheme(theme) {
//   if (theme !== 'light' && theme !== 'dark') return;
//   appStore.setState((current) => ({
//     ...current,
//     ui: {
//       ...current.ui,
//       theme,
//     },
//   }));
// }

// export function toggleSidebar() {
//   appStore.setState((current) => ({
//     ...current,
//     ui: {
//       ...current.ui,
//       isSidebarOpen: !current.ui.isSidebarOpen,
//     },
//   }));
// }








// src/core/state/app-state.js

import { createStore } from '../store/store.js';
import { createLocalStorageAdapter } from '../../utilities/storage.js';

const STORAGE_KEY = 'ViXoRa:state';

const initialState = {
  auth: {
    status: 'checking',
    user: null,
  },

  ui: {
    isSidebarOpen: false,
    theme: 'light',
    language: 'english',
  },

  app: {
    isInitialized: false,
  },
};

const storage = createLocalStorageAdapter();

export const appStore = createStore({
  initialState,
  storage,
  persistKey: STORAGE_KEY,
});

function hasValidId(id) {
  return (
    (typeof id === 'string' || typeof id === 'number') &&
    String(id).trim() !== ''
  );
}

export function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') {
    return null;
  }

  if (!hasValidId(rawUser.id)) {
    return null;
  }

  const user = structuredClone(rawUser);

  delete user.password;

  return {
    ...user,
    id: String(user.id),
    name:
      typeof user.name === 'string'
        ? user.name
        : 'user',

    username:
      typeof user.username === 'string'
        ? user.username
        : '',

    email:
      typeof user.email === 'string'
        ? user.email
        : '',

    role:
      user.role === 'admin' || user.role === 'user'
        ? user.role
        : 'user',

    plan:
      ['plus', 'pro', 'plus', 'go', 'gift'].includes(user.plan)
        ? user.plan
        : 'plus',

    tools:
      user.tools && typeof user.tools === 'object'
        ? user.tools
        : {},
  };
}

function normalizeAuthState(rawAuth = {}) {
  const user = normalizeUser(rawAuth.user);

  if (!user) {
    return {
      status:
        rawAuth.status === 'checking'
          ? 'checking'
          : 'guest',
      user: null,
    };
  }

  return {
    status: 'authenticated',
    user,
  };
}

function normalizeUiState(rawUi = {}) {
  const validThemes = ['light', 'dark'];

  const validLanguages = [
    'english',
    'persian',
    'france',
    'spanish',
    'arabic',
  ];

  return {
    isSidebarOpen:
      typeof rawUi.isSidebarOpen === 'boolean'
        ? rawUi.isSidebarOpen
        : false,

    theme: validThemes.includes(rawUi.theme)
      ? rawUi.theme
      : 'light',

    language: validLanguages.includes(rawUi.language)
      ? rawUi.language
      : 'english',
  };
}

function normalizeState(rawState = {}) {
  return {
    auth: normalizeAuthState(rawState.auth),

    ui: normalizeUiState(rawState.ui),

    app: {
      isInitialized: true,
    },
  };
}

export function initializeAppState() {
  appStore.initialize(normalizeState);
}

export function getAppState() {
  return appStore.getState();
}

export function setAuthChecking() {
  appStore.setState((current) => ({
    ...current,

    auth: {
      status: 'checking',
      user: null,
    },
  }));
}

export function setAuthUser(userData) {
  const normalizedUser = normalizeUser(userData);

  if (!normalizedUser) {
    throw new Error(
      '[AppState] Invalid user data provided.'
    );
  }

  appStore.setState((current) => ({
    ...current,

    auth: {
      status: 'authenticated',
      user: normalizedUser,
    },
  }));
}

export function clearAuthUser() {
  appStore.setState((current) => ({
    ...current,

    auth: {
      status: 'guest',
      user: null,
    },
  }));
}

export function setTheme(theme) {
  if (!['light', 'dark'].includes(theme)) {
    return;
  }

  appStore.setState((current) => ({
    ...current,

    ui: {
      ...current.ui,
      theme,
    },
  }));
}

export function toggleSidebar() {
  appStore.setState((current) => ({
    ...current,

    ui: {
      ...current.ui,
      isSidebarOpen: !current.ui.isSidebarOpen,
    },
  }));
}
