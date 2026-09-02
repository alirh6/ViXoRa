// src/core/services/auth-service.js

import {
  createUser,
  findUserByCredentials,
  findUserByUsername,
  getUserById,
  sanitizeUser,
} from '../storage/db-client.js';

import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '../storage/session-storage.js';

import {
  setAuthUser,
  clearAuthUser,
} from '../state/app-state.js';

function validateLoginInput(username, password) {
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    return {
      valid: false,
      message: 'نام کاربری را وارد کنید.',
    };
  }

  if (!password) {
    return {
      valid: false,
      message: 'رمز عبور را وارد کنید.',
    };
  }

  return {
    valid: true,
    username: normalizedUsername,
  };
}

function validateRegisterInput(data) {
  const username = String(data.username || '').trim();
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const password = String(data.password || '');

  if (!name) {
    return {
      valid: false,
      message: 'نام را وارد کنید.',
    };
  }

  if (username.length < 3) {
    return {
      valid: false,
      message: 'نام کاربری باید حداقل ۳ کاراکتر باشد.',
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message:
        'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، _ و - باشد.',
    };
  }

  if (!email || !email.includes('@')) {
    return {
      valid: false,
      message: 'ایمیل معتبر وارد کنید.',
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
    };
  }

  return {
    valid: true,
    data: {
      name,
      username,
      email,
      password,
    },
  };
}

export async function login(username, password) {
  const validation = validateLoginInput(username, password);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    const serverUser = await findUserByCredentials(
      validation.username,
      password
    );

    if (!serverUser) {
      clearStoredUser();
      clearAuthUser();

      return {
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است.',
      };
    }

    const safeUser = sanitizeUser(serverUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return {
      success: true,
      user: safeUser,
    };
  } catch (error) {
    console.error('[Auth] Login failed:', error);

    return {
      success: false,
      message:
        'ارتباط با سرور برقرار نشد. ابتدا json-server را اجرا کنید.',
    };
  }
}

export async function register(registerData) {
  const validation = validateRegisterInput(registerData);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    const existingUser = await findUserByUsername(
      validation.data.username
    );

    if (existingUser) {
      return {
        success: false,
        message: 'این نام کاربری قبلاً ثبت شده است.',
      };
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      username: validation.data.username,
      email: validation.data.email,
      password: validation.data.password,
      role: 'user',
      plan: 'plus',
      tools: {
        notes: [],
        todos: [],
        customerInfo: [],
      },
      createdAt: new Date().toISOString(),
    };

    const createdUser = await createUser(newUser);
    const safeUser = sanitizeUser(createdUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return {
      success: true,
      user: safeUser,
    };
  } catch (error) {
    console.error('[Auth] Registration failed:', error);

    return {
      success: false,
      message:
        'ثبت‌نام انجام نشد. اتصال json-server و اطلاعات ورودی را بررسی کنید.',
    };
  }
}

export async function logout() {
  clearStoredUser();
  clearAuthUser();

  return {
    success: true,
  };
}

export async function restoreSession() {
  const storedUser = getStoredUser();

  if (!storedUser || !storedUser.id) {
    clearAuthUser();

    return {
      authenticated: false,
      reason: 'guest',
    };
  }

  try {
    const freshUser = await getUserById(storedUser.id);

    if (!freshUser) {
      clearStoredUser();
      clearAuthUser();

      return {
        authenticated: false,
        reason: 'invalid-session',
      };
    }

    const safeUser = sanitizeUser(freshUser);

    setStoredUser(safeUser);
    setAuthUser(safeUser);

    return {
      authenticated: true,
      user: safeUser,
    };
  } catch (error) {
    console.error('[Auth] Session validation failed:', error);

    /*
     * سیاست این نسخه:
     * اگر سرور خاموش باشد، session محلی معتبر قبلی را موقتاً حفظ می‌کنیم.
     * در production بهتر است session واقعی سروری داشته باشیم.
     */
    setStoredUser(storedUser);
    setAuthUser(storedUser);

    return {
      authenticated: true,
      user: storedUser,
      offline: true,
    };
  }
}
