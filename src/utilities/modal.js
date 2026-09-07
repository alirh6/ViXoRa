// src/utilities/modal.js

/**
 * ViXoRa Modal — دیالوگ مدال با focus trap، Esc، کلیک روی overlay
 * ------------------------------------------------------------------
 *   const modal = createModal({ title: '...', bodyHtml: '...', actions: [...] });
 *   modal.open();
 *   modal.close();
 *
 *   const ok = await confirmDialog({ title: 'حذف', message: '...' });
 */

import { injectScopedCss } from './css-scope.js';
import { escapeHtml } from './dom-utils.js';

const MODAL_CSS = `
.vx-modal-overlay{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;padding:18px;background:rgba(4,7,15,.72);backdrop-filter:blur(6px);animation:vx-fade .2s ease}
.vx-modal-overlay.is-closing{animation:vx-fade-out .18s ease forwards}
@keyframes vx-fade{from{opacity:0}to{opacity:1}}
@keyframes vx-fade-out{to{opacity:0}}
.vx-modal{width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;color:#e7ecf5;background:linear-gradient(165deg,#171c2c,#0e1120);border:1px solid rgba(255,255,255,.09);box-shadow:0 40px 90px -40px rgba(0,0,0,.9);animation:vx-pop .26s cubic-bezier(.2,.9,.25,1)}
.vx-modal--wide{width:min(920px,100%)}
@keyframes vx-pop{from{transform:translateY(14px) scale(.97);opacity:0}to{transform:none;opacity:1}}
.vx-modal__header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.07)}
.vx-modal__title{margin:0;font-size:15.5px;font-weight:700}
.vx-modal__close{border:0;background:rgba(255,255,255,.05);color:#9aa6bd;width:30px;height:30px;border-radius:9px;font-size:17px;line-height:1;cursor:pointer;transition:.18s}
.vx-modal__close:hover{background:rgba(255,255,255,.12);color:#fff}
.vx-modal__body{padding:18px;overflow:auto;font-size:13.5px;line-height:1.9;color:#c4cddd}
.vx-modal__footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 18px;border-top:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.vx-modal__btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#dbe3f0;padding:9px 18px;border-radius:11px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:.18s}
.vx-modal__btn:hover{background:rgba(255,255,255,.1)}
.vx-modal__btn--primary{border-color:transparent;background:linear-gradient(135deg,#00d0ff,#7a5cff);color:#04121b}
.vx-modal__btn--primary:hover{filter:brightness(1.08)}
.vx-modal__btn--danger{border-color:rgba(255,93,122,.4);background:rgba(255,93,122,.14);color:#ffb3c1}
.vx-modal__btn--danger:hover{background:rgba(255,93,122,.24)}
.vx-modal__btn[disabled]{opacity:.55;cursor:not-allowed}
@media (prefers-reduced-motion:reduce){.vx-modal,.vx-modal-overlay{animation:none}}
`;

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function createModal({
  title = '',
  bodyHtml = '',
  actions = [],
  size = 'default',
  closeOnOverlay = true,
  closeOnEscape = true,
  onOpen = null,
  onClose = null,
  contentNode = null,
} = {}) {
  let releaseCss = null;
  let overlay = null;
  let dialog = null;
  let lastFocused = null;
  let isOpen = false;

  const cleanups = [];

  function on(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  function build() {
    releaseCss = injectScopedCss(MODAL_CSS, 'modal');

    overlay = document.createElement('div');
    overlay.className = 'vx-modal-overlay';

    dialog = document.createElement('div');
    dialog.className = `vx-modal${size === 'wide' ? ' vx-modal--wide' : ''}`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', String(title || 'پنجره'));

    const header = document.createElement('div');
    header.className = 'vx-modal__header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'vx-modal__title';
    titleEl.textContent = String(title || '');

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'vx-modal__close';
    closeButton.setAttribute('aria-label', 'بستن');
    closeButton.textContent = '×';
    on(closeButton, 'click', () => close('dismiss'));

    header.append(titleEl, closeButton);

    const body = document.createElement('div');
    body.className = 'vx-modal__body';

    if (contentNode) body.appendChild(contentNode);
    else body.innerHTML = String(bodyHtml || '');

    dialog.append(header, body);

    if (actions.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'vx-modal__footer';

      for (const action of actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `vx-modal__btn${action.variant ? ` vx-modal__btn--${action.variant}` : ''}`;
        button.innerHTML = escapeHtml(action.label || '');
        button.dataset.actionId = String(action.id || '');

        on(button, 'click', async () => {
          if (typeof action.onClick !== 'function') {
            close(action.id || 'dismiss');
            return;
          }

          const result = await action.onClick({ close, dialog, button });
          if (result !== false) close(action.id || 'confirm');
        });

        footer.appendChild(button);
      }

      dialog.appendChild(footer);
    }

    overlay.appendChild(dialog);

    on(overlay, 'mousedown', (event) => {
      if (event.target === overlay && closeOnOverlay) close('dismiss');
    });

    on(document, 'keydown', (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        close('dismiss');
        return;
      }

      if (event.key === 'Tab') {
        trapFocus(event);
      }
    });
  }

  function trapFocus(event) {
    const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null || element === document.activeElement
    );

    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus?.();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open() {
    if (isOpen) return api;

    lastFocused = document.activeElement;

    build();
    document.body.appendChild(overlay);
    document.documentElement.classList.add('vx-modal-open');

    isOpen = true;

    const firstFocusable = dialog.querySelector(FOCUSABLE);
    setTimeout(() => (firstFocusable || dialog).focus?.(), 30);

    if (typeof onOpen === 'function') onOpen(api);

    return api;
  }

  function close(reason = 'dismiss') {
    if (!isOpen) return;

    isOpen = false;

    overlay?.classList.add('is-closing');
    document.documentElement.classList.remove('vx-modal-open');

    const finish = () => {
      overlay?.remove();
      overlay = null;
      dialog = null;

      for (const cleanup of cleanups.splice(0)) {
        try {
          cleanup();
        } catch {
          /* ignore */
        }
      }

      if (releaseCss) releaseCss();
      releaseCss = null;

      lastFocused?.focus?.();

      if (typeof onClose === 'function') onClose(reason);
    };

    setTimeout(finish, 190);
  }

  const api = {
    open,
    close,
    get isOpen() {
      return isOpen;
    },
    get element() {
      return dialog;
    },
    get bodyElement() {
      return dialog?.querySelector('.vx-modal__body') || null;
    },
  };

  return api;
}

/**
 * دیالوگ تأیید — Promise<boolean>
 */
export function confirmDialog({
  title = 'آیا مطمئن هستید؟',
  message = '',
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    let settled = false;

    const modal = createModal({
      title,
      bodyHtml: `<p style="margin:0">${escapeHtml(message)}</p>`,
      onClose: (reason) => {
        if (settled) return;
        settled = true;
        resolve(reason === 'confirm');
      },
      actions: [
        { id: 'cancel', label: cancelLabel, variant: '' },
        { id: 'confirm', label: confirmLabel, variant: danger ? 'danger' : 'primary' },
      ],
    });

    modal.open();
  });
}

/**
 * دیالوگ پیام ساده — Promise<void>
 */
export function alertDialog({ title = 'توجه', message = '', confirmLabel = 'باشه' } = {}) {
  return new Promise((resolve) => {
    const modal = createModal({
      title,
      bodyHtml: `<p style="margin:0">${escapeHtml(message)}</p>`,
      onClose: () => resolve(),
      actions: [{ id: 'confirm', label: confirmLabel, variant: 'primary' }],
    });

    modal.open();
  });
}
