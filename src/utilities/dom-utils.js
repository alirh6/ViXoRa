// src/utilities/dom-utils.js

/**
 * ابزارهای کوچک و امن DOM برای همهٔ کامپوننت‌ها و صفحات ViXoRa
 * ------------------------------------------------------------------
 * هدف: حذف innerHTML ناامن، حذف نشتی listener و یکدست‌سازی کد صفحات.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/** امن‌سازی هر مقدار ناشناخته قبل از رفتن داخل HTML */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value).replace(/[&<>"'`]/g, (char) => HTML_ESCAPES[char]);
}

/** حذف تگ‌ها از متن (برای نمایش در input و عنوان‌ها) */
export function stripHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/<[^>]*>/g, '');
}

/** ساخت المنت با attribute و فرزند در یک خط */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  const { className, text, html, attrs = {}, dataset = {}, children = [] } = options;

  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  if (html !== undefined) element.innerHTML = html;

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    element.setAttribute(key, value === true ? '' : String(value));
  }

  for (const [key, value] of Object.entries(dataset)) {
    if (value === null || value === undefined) continue;
    element.dataset[key] = String(value);
  }

  for (const child of children) {
    if (!child) continue;
    element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return element;
}

/** ساخت المنت از رشتهٔ HTML به‌صورت امن (بدون اجرای اسکریپت) */
export function htmlToElement(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = String(htmlString ?? '').trim();
  return template.content.firstElementChild;
}

/**
 * ثبت listener با جمع‌آوری خودکار برای destroy
 * @returns {Function} تابع لغو ثبت همان listener
 */
export function on(target, type, handler, options) {
  if (!target || typeof target.addEventListener !== 'function') {
    return () => {};
  }

  target.addEventListener(type, handler, options);

  return () => target.removeEventListener(type, handler, options);
}

/**
 * Event Delegation روی یک والد
 * @returns {Function} تابع لغو
 */
export function delegate(parent, selector, type, handler, options) {
  if (!parent || typeof parent.addEventListener !== 'function') {
    return () => {};
  }

  const listener = (event) => {
    const match = event.target?.closest?.(selector);
    if (!match || !parent.contains(match)) return;
    handler(event, match);
  };

  parent.addEventListener(type, listener, options);

  return () => parent.removeEventListener(type, listener, options);
}

/** خالی‌کردن یک المنت بدون innerHTML = '' (سریع‌تر و امن‌تر) */
export function clearElement(element) {
  if (!element) return;
  while (element.firstChild) element.removeChild(element.firstChild);
}

/** جایگزینی محتوای المنت با المنت/رشتهٔ جدید */
export function replaceContent(element, content) {
  if (!element) return;

  clearElement(element);

  if (content === null || content === undefined) return;

  if (typeof content === 'string') {
    element.innerHTML = content;
    return;
  }

  element.appendChild(content);
}

/** querySelector ایمن که هیچ‌وقت throw نمی‌کند */
export function query(scope, selector) {
  const root = scope || document;
  try {
    return root.querySelector(selector) || null;
  } catch {
    return null;
  }
}

export function queryAll(scope, selector) {
  const root = scope || document;
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/** مقدار یک input با trim و تبدیل به رشته */
export function inputValue(element) {
  if (!element) return '';
  return String(element.value ?? '').trim();
}

export function setInputValue(element, value) {
  if (!element) return;
  element.value = value ?? '';
}

/** نمایش/مخفی‌سازی با کلاس hidden */
export function setHidden(element, isHidden) {
  if (!element) return;
  element.classList.toggle('hidden', Boolean(isHidden));
  if (isHidden) element.setAttribute('aria-hidden', 'true');
  else element.removeAttribute('aria-hidden');
}

export function setText(element, text) {
  if (!element) return;
  element.textContent = text ?? '';
}

/** دیباونس ساده برای جستجو و تایپ */
export function debounce(fn, delay = 250) {
  let timerId = null;

  const debounced = (...args) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timerId) clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}

export function throttle(fn, limit = 200) {
  let lastCall = 0;
  let timerId = null;

  return (...args) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timerId) {
      timerId = setTimeout(() => {
        lastCall = Date.now();
        timerId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/** خواندن دادهٔ فرم به‌صورت آبجکت */
export function readFormData(form, { trim = true } = {}) {
  const data = {};
  if (!form) return data;

  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    data[key] = trim && typeof value === 'string' ? value.trim() : value;
  }

  return data;
}

/** بازکردن لینک خارجی — در مرورگر و محیط تست هر دو کار می‌کند */
export function openExternal(url, target = '_blank', features = 'noopener') {
  if (!url) return false;

  const opener =
    (typeof globalThis !== 'undefined' && typeof globalThis.open === 'function' && globalThis.open) ||
    (typeof globalThis !== 'undefined' && typeof globalThis.window?.open === 'function' && globalThis.window.open);

  if (!opener) return false;

  try {
    opener(url, target, features);
    return true;
  } catch (error) {
    console.warn('[DOM] Failed to open URL:', error);
    return false;
  }
}

/** فعال/غیرفعال کردن دکمه + حالت loading */
export function setButtonLoading(button, isLoading, loadingText = 'در حال پردازش...') {
  if (!button) return;

  if (isLoading) {
    if (button.dataset.originalText === undefined) {
      button.dataset.originalText = button.innerHTML;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="vx-spinner" aria-hidden="true"></span> ${escapeHtml(loadingText)}`;
    return;
  }

  button.disabled = false;
  button.removeAttribute('aria-busy');
  if (button.dataset.originalText !== undefined) {
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}
