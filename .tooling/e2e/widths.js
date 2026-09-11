const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const fails = [];
function ok(c, m) { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails.push(m); }
(async () => {
  const browser = await chromium.launch();
  for (const w of [390, 768, 800, 900, 901, 1024, 1180, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w <= 900, hasTouch: w <= 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', 'alirh');
    await page.fill('input[name="password"]', 'ali12345');
    await page.click('[data-submit-button]');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
    for (const t of ['note', 'customerInfo']) {
      await page.goto(BASE + '/tools/' + t, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        window.scrollTo(0, 300);
        const y = window.scrollY; window.scrollTo(0, 0);
        const vis = (id) => { const el = document.getElementById(id); return el ? getComputedStyle(el).display !== 'none' : null; };
        return { docSH: de.scrollHeight, scrolled: y, hOver: de.scrollWidth - window.innerWidth, burger: vis('vcrBurger'), bnav: vis('vcrBottomNav') };
      });
      const mob = w <= 900;
      console.log(`[w=${w}/${t}] scrolled=${r.scrolled} hOver=${r.hOver} burger=${r.burger} bnav=${r.bnav}`);
      ok(r.scrolled > 100, `w=${w}/${t} scrolls`);
      ok(r.hOver <= 1, `w=${w}/${t} no h-overflow (${r.hOver})`);
      ok(r.burger === mob && r.bnav === mob, `w=${w}/${t} mobile chrome ${mob ? 'on' : 'off'}`);
    }
    if (w === 800) {
      await page.goto(BASE + '/tools/customerInfo', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await page.click('#vcrBurger');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/home/user/.tooling/e2e/shots/tablet-800-drawer.png' });
      const nav = await page.evaluate(() => document.querySelector('.vcr-layout').classList.contains('vcr-mnav-open'));
      ok(nav === true, 'w=800 drawer opens via burger');
      await page.click('.vcr-sidebar a[href="/tools/music"]');
      await page.waitForTimeout(900);
      ok(page.url().endsWith('/tools/music'), 'w=800 drawer link navigates');
      await page.screenshot({ path: '/home/user/.tooling/e2e/shots/tablet-800-after.png' });
    }
    await ctx.close();
  }
  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  await browser.close();
  process.exit(fails.length ? 2 : 0);
})();
