

/**
 * گارد تنظیم تایتل صفحه مرورگر
 * @param {string} appName - نام پیش‌فرض برنامه
 * @returns {Function} تابع گارد ناوبری
 */
export function createTitleGuard(appName = 'ViXoRa') {
  return function titleGuard({ to }) {
    const pageTitle = to.meta?.title;
    document.title = pageTitle ? `${appName} | ${pageTitle}` : appName;
    return true;
  };
}
