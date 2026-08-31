export function interceptNavigationClicks(onNavigate) {
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

    const anchor = event.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    if (anchor.target && anchor.target !== '_self') {
      return;
    }

    // کنترل دامنه یکسان (Same Origin)
    const targetUrl = new URL(anchor.href, window.location.href);
    
    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    const destination = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    onNavigate(destination);
  }

  document.addEventListener('click', handleClick);

  return function stopIntercepting() {
    document.removeEventListener('click', handleClick);
  };
}
