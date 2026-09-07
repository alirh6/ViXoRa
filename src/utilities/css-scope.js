// src/utilities/css-scope.js

/**
 * ViXoRa Scoped CSS — بدون build step، بدون فریم‌ورک
 * ==================================================================
 * هر صفحه/کامپوننت CSS اختصاصی خودش را دارد و در destroy پاک می‌شود.
 *
 * نحوه استفاده:
 *
 *   import { injectScopedCss } from '../../utilities/css-scope.js';
 *   import pageCss from './notePage.css?inline';   // Vite
 *   // یا بدون inline: import { cssText } from './notePage.css.js';
 *
 *   const releaseCss = injectScopedCss(pageCss, 'notes');
 *   ...
 *   destroy() { releaseCss(); }
 *
 * اگر پروژه از `?inline` پشتیبانی نمی‌کند، می‌توانید CSS را در
 * `src/pages/.../xxx.css.js` به‌صورت template string بگذارید:
 *   export const cssText = `...`;
 */

const STYLE_ROOT_ID = 'vixora-style-root';
const registry = new Map(); // key -> { element, refCount }

function getStyleRoot() {
  if (typeof document === 'undefined') return null;

  let root = document.getElementById(STYLE_ROOT_ID);

  if (!root) {
    root = document.createElement('div');
    root.id = STYLE_ROOT_ID;
    root.setAttribute('hidden', '');
    (document.head || document.documentElement).appendChild(root);
  }

  return root;
}

/**
 * تزریق CSS با scope اختصاصی.
 * @param {string} cssText محتوای CSS
 * @param {string} key کلید یکتا (معمولاً نام صفحه)
 * @returns {Function} تابع آزادسازی (ref-count aware)
 */
export function injectScopedCss(cssText, key) {
  if (typeof document === 'undefined' || !cssText) {
    return () => {};
  }

  const safeKey = String(key || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '-');
  const styleId = `vixora-style-${safeKey}`;

  const existing = registry.get(styleId);

  if (existing) {
    existing.refCount += 1;
    return createRelease(styleId);
  }

  const root = getStyleRoot();
  if (!root) return () => {};

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.dataset.vixoraScope = safeKey;
  styleElement.textContent = String(cssText);

  root.appendChild(styleElement);
  registry.set(styleId, { element: styleElement, refCount: 1 });

  return createRelease(styleId);
}

function createRelease(styleId) {
  let released = false;

  return function releaseScopedCss() {
    if (released) return;
    released = true;

    const entry = registry.get(styleId);
    if (!entry) return;

    entry.refCount -= 1;

    if (entry.refCount > 0) return;

    registry.delete(styleId);
    entry.element?.remove();
  };
}

/** حذف همهٔ استایل‌های تزریق‌شده (تست / ریست کامل) */
export function clearAllScopedCss() {
  for (const { element } of registry.values()) {
    element?.remove();
  }
  registry.clear();
}

export function hasScopedCss(key) {
  return registry.has(`vixora-style-${String(key).replace(/[^a-zA-Z0-9_-]/g, '-')}`);
}
