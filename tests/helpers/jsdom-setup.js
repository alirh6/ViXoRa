// tests/helpers/jsdom-setup.js

/**
 * محیط تست: jsdom + localStorage + crypto
 * این فایل فقط برای تست است و وارد پروژه نمی‌شود.
 */

import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';

export function setupDom({ url = 'http://localhost:5173/tools/dashboard' } = {}) {
  const dom = new JSDOM(
    `<!doctype html>
     <html lang="fa" dir="rtl">
       <head><title>ViXoRa</title></head>
       <body><div id="app"></div></body>
     </html>`,
    {
      url,
      pretendToBeVisual: true,
      runScripts: 'outside-only',
    }
  );

  const { window } = dom;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.location = window.location;
  globalThis.history = window.history;
  globalThis.navigator = window.navigator;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Element = window.Element;
  globalThis.Node = window.Node;
  globalThis.DocumentFragment = window.DocumentFragment;
  globalThis.Event = window.Event;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.KeyboardEvent = window.KeyboardEvent;
  globalThis.Blob = window.Blob;
  globalThis.File = window.File;
  globalThis.FileReader = window.FileReader;
  globalThis.FormData = window.FormData;
  globalThis.URL = window.URL;
  globalThis.URLSearchParams = window.URLSearchParams;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.DOMException = window.DOMException;
  globalThis.AbortController = globalThis.AbortController || window.AbortController;

  if (!globalThis.crypto) globalThis.crypto = webcrypto;
  if (!window.crypto) window.crypto = webcrypto;

  // jsdom این دو API را ندارد؛ برای تست دانلود فایل لازم‌اند
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:vixora-test';
    window.URL.revokeObjectURL = () => {};
  }

  // jsdom پیاده‌سازی scrollIntoView ندارد
  if (!window.Element.prototype.scrollIntoView) {
    window.Element.prototype.scrollIntoView = function scrollIntoViewStub() {};
  }

  return dom;
}

export function resetDom() {
  globalThis.window?.localStorage?.clear();

  if (globalThis.document?.body) {
    globalThis.document.body.innerHTML = '<div id="app"></div>';
  }

  if (globalThis.document?.documentElement) {
    globalThis.document.documentElement.innerHTML =
      '<head><title>ViXoRa</title></head><body><div id="app"></div></body>';
  }
}

export function getAppRoot() {
  return globalThis.document.getElementById('app');
}

export function setPathname(pathname) {
  globalThis.window.history.replaceState(null, '', pathname);
}

export function click(element) {
  element.dispatchEvent(
    new globalThis.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
  );
}

export function type(element, value) {
  element.value = value;
  element.dispatchEvent(new globalThis.window.Event('input', { bubbles: true }));
}

export function pressKey(element, key, options = {}) {
  element.dispatchEvent(
    new globalThis.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  );
}

/** یک tick کامل برای flush شدن همهٔ microtask ها */
export function flush(times = 4) {
  let chain = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    chain = chain.then(() => new Promise((resolve) => setTimeout(resolve, 0)));
  }
  return chain;
}
