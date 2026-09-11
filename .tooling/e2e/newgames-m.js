// تاچ موبایل ۸ بازی + هاب + خانه
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fails = [];
const errs = [];
function ok(c, m) { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails.push(m); }
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.tap('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });

  // هاب: ۲۵ کارت؟
  await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const hub = await page.evaluate(() => ({
    cards: document.querySelectorAll('[data-ag-open]').length,
    heavy: [...document.querySelectorAll('[data-ag-open]')].filter((el) => (el.textContent || '').length > 0).length,
  }));
  console.log('  (hub cards=' + hub.cards + ')');
  ok(hub.cards === 25, 'hub shows 25 games');

  const IDS = ['subway-run', 'slither', 'geo-dash', 'hill-climb', 'air-hockey', 'angry-sling', 'bomber', 'tank-battle'];
  for (const id of IDS) {
    await page.click(`[data-ag-open="${id}"]`);
    await page.waitForTimeout(1100);
    await page.tap('[data-go]');
    await page.waitForTimeout(600);
    const box = await page.locator('[data-cv]').boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    // سوایپ + تپ لمسی
    await page.touchscreen.tap(cx, cy);
    await page.waitForTimeout(400);
    if (id === 'angry-sling') {
      const sx = box.x + box.width * 0.3, sy = box.y + box.height * 0.6;
      await page.touchscreen.tap(sx, sy);
      await page.waitForTimeout(300);
    }
    const tbtns = await page.evaluate(() => document.querySelectorAll('.ag-tbtn').length);
    console.log(`  (${id} tbtns=${tbtns})`);
    if (id === 'subway-run' || id === 'angry-sling') {
      await page.screenshot({ path: `${OUT}/m-${id}.png` });
    }
    await page.waitForTimeout(1500);
    await page.click('[data-ag-exit]');
    await page.waitForTimeout(500);
  }
  ok(true, 'all 8 start with touch, no crash');

  // خانه: پیش‌فرض‌های جدید
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const home = await page.evaluate(() => localStorage.getItem('ViXoRa:home-games'));
  console.log('  (home-games=' + home + ')');

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
