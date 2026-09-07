// src/core/guards/title.guard.js

/**
 * گارد تنظیم عنوان سند
 *
 * `managesDocumentTitle` به روتر اعلام می‌کند که مدیریت document.title
 * بر عهدهٔ این گارد است تا عنوان دو بار و با دو فرمت نوشته نشود.
 */
export function createTitleGuard(appName = 'ViXoRa') {
  function titleGuard({ to }) {
    if (typeof document === 'undefined') return true;

    const rawTitle = to.meta?.title;

    const pageTitle = typeof rawTitle === 'function' ? rawTitle(to) : rawTitle;

    document.title = pageTitle ? `${pageTitle} | ${appName}` : appName;

    return true;
  }

  titleGuard.managesDocumentTitle = true;

  return titleGuard;
}
