// src/core/router/link-interceptor.js

/**
 * رهگیری کلیک روی لینک‌های داخلی و تبدیل آن‌ها به ناوبری SPA
 */

/** location معتبر در هر محیط اجرایی */
function resolveLocation() {
  if (typeof window !== 'undefined' && window?.location) return window.location;
  return typeof globalThis !== 'undefined' ? globalThis.location : null;
}
export function interceptNavigationClicks(onNavigate) {
  if (typeof document === 'undefined' || typeof onNavigate !== 'function') {
    return () => {};
  }

  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;

    if (anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external') {
      return;
    }

    if (anchor.dataset.vixoraExternal === 'true') return;

    const href = anchor.getAttribute('href');

    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    if (anchor.target && anchor.target !== '_self') return;

    let targetUrl;
    try {
      targetUrl = new URL(anchor.href, resolveLocation()?.href || 'http://localhost');
    } catch {
      return;
    }

    if (targetUrl.origin !== resolveLocation().origin) return;

    event.preventDefault();

    const destination = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    onNavigate(destination);
  }

  document.addEventListener('click', handleClick);

  return function stopIntercepting() {
    document.removeEventListener('click', handleClick);
  };
}
