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
  const bad = await page.evaluate(() => {
    const W = window.innerWidth;
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > W + 2 || r.left < -200)) {
        const kids = [...el.children].filter((c) => { const cr = c.getBoundingClientRect(); return cr.right > W + 2; });
        if (!kids.length) out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0,2).join('.') + ' L=' + Math.round(r.left) + ' R=' + Math.round(r.right) + ' W=' + Math.round(r.width));
      }
    });
    return { W, docSW: document.documentElement.scrollWidth, bad: out.slice(0, 12) };
  });
  console.log(JSON.stringify(bad, null, 1));
  await browser.close();
})();
