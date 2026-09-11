const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/note', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  // پیدا کردن دکمه‌های ... داخل کارت فیلترها
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim() === '•••' || (b.textContent || '').trim() === '...');
    return els.slice(0, 3).map((b) => {
      const r = b.getBoundingClientRect();
      const card = b.closest('section,div[class*="card"],div[class*="panel"],aside');
      const cr = card ? card.getBoundingClientRect() : null;
      return { btn: [Math.round(r.left), Math.round(r.right)], card: cr ? [Math.round(cr.left), Math.round(cr.right)] : null, cls: b.className.slice(0, 60) };
    });
  });
  console.log(JSON.stringify(info, null, 1));
  const first = page.locator('button').filter({ hasText: /^•••$|^\.\.\.$/ }).first();
  if (await first.count()) {
    await first.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await first.screenshot({ path: '/home/user/.tooling/e2e/shots/note-dots-btn.png' });
  } else console.log('no dots buttons found');
  await browser.close();
})();
