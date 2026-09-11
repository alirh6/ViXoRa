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
    document.querySelectorAll('i').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > W + 2) {
        const chain = [];
        let p = el;
        for (let d = 0; d < 5 && p; d++) { chain.push(p.tagName.toLowerCase() + (p.id ? '#' + p.id : '') + '.' + String(p.className).split(' ').slice(0, 2).join('.')); p = p.parentElement; }
        out.push({ rect: [Math.round(r.left), Math.round(r.right)], chain, html: el.outerHTML.slice(0, 120) });
      }
    });
    return out;
  });
  console.log(JSON.stringify(bad, null, 1));
  await browser.close();
})();
