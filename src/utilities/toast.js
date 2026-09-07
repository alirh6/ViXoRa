// src/utilities/toast.js

/**
 * ViXoRa Toast — اعلان‌های سبک و قابل دسترس
 * ------------------------------------------------------------------
 * بدون وابستگی به CSS خارجی: استایل در اولین استفاده تزریق می‌شود.
 *
 *   import { showToast, createToast } from '../../utilities/toast.js';
 *   showToast('یادداشت ذخیره شد', 'success');
 *
 *   const toast = createToast();   // اینستنس مستقل (برای تست)
 *   toast.show('...', 'info', { duration: 4000 });
 *   toast.destroy();
 */

import { injectScopedCss } from './css-scope.js';
import { escapeHtml } from './dom-utils.js';

const TOAST_CSS = `
.vx-toast-root{position:fixed;inset-inline-end:20px;bottom:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:min(92vw,380px)}
.vx-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:14px;font-size:13.5px;line-height:1.7;color:#e7ecf5;background:linear-gradient(160deg,rgba(23,28,44,.97),rgba(15,18,30,.97));border:1px solid rgba(255,255,255,.09);box-shadow:0 18px 40px -18px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.02) inset;backdrop-filter:blur(14px);transform:translateY(14px) scale(.97);opacity:0;transition:transform .28s cubic-bezier(.2,.9,.25,1),opacity .28s ease;animation:vx-toast-in .3s cubic-bezier(.2,.9,.25,1) forwards}
.vx-toast.is-leaving{animation:vx-toast-out .22s ease forwards}
@keyframes vx-toast-in{to{transform:translateY(0) scale(1);opacity:1}}
@keyframes vx-toast-out{to{transform:translateY(8px) scale(.96);opacity:0}}
.vx-toast__icon{flex:0 0 auto;width:22px;height:22px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:800;color:#06121b;background:#5ce1ff;box-shadow:0 0 16px rgba(92,225,255,.45)}
.vx-toast--success .vx-toast__icon{background:#3ddc97}
.vx-toast--error .vx-toast__icon{background:#ff5d7a}
.vx-toast--warning .vx-toast__icon{background:#ffc44d}
.vx-toast--info .vx-toast__icon{background:#7aa8ff}
.vx-toast__body{flex:1 1 auto;min-width:0}
.vx-toast__title{font-weight:700;margin-bottom:2px}
.vx-toast__desc{color:#9aa6bd;font-size:12.5px;word-break:break-word}
.vx-toast__close{flex:0 0 auto;border:0;background:transparent;color:#8b97ad;font-size:16px;line-height:1;cursor:pointer;padding:0 2px;border-radius:6px;transition:color .18s,background .18s}
.vx-toast__close:hover{color:#fff;background:rgba(255,255,255,.08)}
.vx-toast__bar{position:absolute;inset-inline:0;bottom:0;height:2px;border-radius:0 0 14px 14px;background:linear-gradient(90deg,#5ce1ff,#9a7bff);opacity:.7;transform-origin:right;animation:vx-toast-bar linear forwards}
@keyframes vx-toast-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.vx-toast{position:relative;overflow:hidden}
@media (prefers-reduced-motion:reduce){.vx-toast{animation:none;transform:none;opacity:1}.vx-toast__bar{display:none}}
@media (max-width:520px){.vx-toast-root{inset-inline:12px;bottom:12px;max-width:none}}
`;

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

export function createToast({ container = null, maxVisible = 4 } = {}) {
  let root = container;
  let releaseCss = null;
  const active = new Set();

  function ensureRoot() {
    if (root && root.isConnected) return root;

    if (!releaseCss) releaseCss = injectScopedCss(TOAST_CSS, 'toast');

    root = document.createElement('div');
    root.className = 'vx-toast-root';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'اعلان‌ها');
    document.body.appendChild(root);

    return root;
  }

  /**
   * حذف هندل‌هایی که المنتشان از DOM جدا شده است
   * (مثلاً وقتی کل ریشهٔ toast توسط کد بیرونی remove می‌شود).
   * بدون این پاک‌سازی، enforceLimit روی هندل‌های مرده حلقهٔ بی‌پایان می‌زند.
   */
  function pruneDetached() {
    for (const handle of [...active]) {
      if (!handle.element?.isConnected) active.delete(handle);
    }
  }

  function enforceLimit() {
    pruneDetached();

    let guard = 0;

    while (active.size > maxVisible && guard < active.size + maxVisible + 1) {
      guard += 1;

      const oldest = active.values().next().value;
      if (!oldest) break;

      active.delete(oldest);
      oldest.dismiss();
    }
  }

  function show(message, type = 'info', options = {}) {
    const {
      title = null,
      description = null,
      duration = 4200,
      dismissible = true,
      action = null,
    } = options;

    const host = ensureRoot();

    const element = document.createElement('div');
    element.className = `vx-toast vx-toast--${type}`;
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
    element.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const icon = document.createElement('span');
    icon.className = 'vx-toast__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ICONS[type] || ICONS.info;

    const body = document.createElement('div');
    body.className = 'vx-toast__body';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'vx-toast__title';
      titleEl.textContent = title;
      body.appendChild(titleEl);
    }

    const messageEl = document.createElement('div');
    messageEl.className = title ? 'vx-toast__desc' : 'vx-toast__title';
    messageEl.innerHTML = escapeHtml(message ?? '');
    body.appendChild(messageEl);

    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'vx-toast__desc';
      descEl.textContent = description;
      body.appendChild(descEl);
    }

    if (action && typeof action.onClick === 'function') {
      const actionButton = document.createElement('button');
      actionButton.type = 'button';
      actionButton.className = 'vx-toast__close';
      actionButton.textContent = action.label || 'انجام';
      actionButton.addEventListener('click', () => {
        action.onClick();
        dismiss();
      });
      body.appendChild(actionButton);
    }

    element.appendChild(icon);
    element.appendChild(body);

    let closeTimer = null;

    function dismiss() {
      if (!element.isConnected) return;

      if (closeTimer) clearTimeout(closeTimer);

      element.classList.add('is-leaving');
      active.delete(handle);

      const remove = () => element.remove();
      element.addEventListener('animationend', remove, { once: true });
      setTimeout(remove, 320);
    }

    if (dismissible) {
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'vx-toast__close';
      closeButton.setAttribute('aria-label', 'بستن اعلان');
      closeButton.textContent = '×';
      closeButton.addEventListener('click', dismiss);
      element.appendChild(closeButton);
    }

    if (duration > 0) {
      const bar = document.createElement('span');
      bar.className = 'vx-toast__bar';
      bar.style.animationDuration = `${duration}ms`;
      element.appendChild(bar);

      closeTimer = setTimeout(dismiss, duration);
    }

    host.appendChild(element);

    const handle = { element, dismiss };
    active.add(handle);
    enforceLimit();

    return handle;
  }

  function destroy() {
    for (const handle of [...active]) {
      if (handle.element?.isConnected) handle.dismiss();
      else handle.element?.remove();
    }
    active.clear();

    if (releaseCss) releaseCss();
    releaseCss = null;

    root?.remove();
    root = null;
  }

  return {
    show,
    success: (message, options) => show(message, 'success', options),
    error: (message, options) => show(message, 'error', options),
    warning: (message, options) => show(message, 'warning', options),
    info: (message, options) => show(message, 'info', options),
    destroy,
  };
}

/* ---------------- اینستنس سراسری ---------------- */

let globalToast = null;

export function getToast() {
  if (!globalToast) globalToast = createToast();
  return globalToast;
}

export function showToast(message, type = 'info', options) {
  return getToast().show(message, type, options);
}

export const toast = {
  show: (message, options) => showToast(message, 'info', options),
  success: (message, options) => showToast(message, 'success', options),
  error: (message, options) => showToast(message, 'error', options),
  warning: (message, options) => showToast(message, 'warning', options),
  info: (message, options) => showToast(message, 'info', options),
  /** بستن همهٔ toastهای باز و آزادکردن CSS — برای تست و unmount صفحه */
  destroyAll: () => getToast().destroy(),
};
