const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/note', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const res = await page.evaluate(() => {
    const out = { base: document.documentElement.scrollWidth };
    for (const sel of ['.vcr-ambient', '.vcr-header', '.vcr-body', '.vcr-statusbar', '#page-content', '.vcr-bottomnav', '.vcr-toasts', '.vcr-flash']) {
      const el = document.querySelector(sel);
      if (!el) { out[sel] = 'missing'; continue; }
      const d = el.style.display;
      el.style.display = 'none';
      out[sel] = document.documentElement.scrollWidth;
      el.style.display = d;
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})();
