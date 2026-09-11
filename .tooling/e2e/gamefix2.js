// راستی‌آزمایی ریسر جدید + سلامت پک‌من با هوک موقعیت
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/user/.tooling/e2e/shots';
const fails = [];
const errs = [];
function ok(c, m) { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails.push(m); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="username"]', 'alirh');
  await page.fill('input[name="password"]', 'ali12345');
  await page.click('[data-submit-button]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 });
  await page.goto(BASE + '/tools/entertainment', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  // ---- ریسر ----
  await page.click('[data-ag-open="neon-racer"]');
  await page.waitForTimeout(1200);
  const intro = await page.evaluate(() => !!document.querySelector('[data-go]'));
  ok(intro, 'racer shows intro with start button');
  await page.screenshot({ path: OUT + '/fix2-racer-intro.png' });
  await page.click('[data-go]');
  await page.waitForTimeout(3600);
  const cdGone = await page.evaluate(() => !document.querySelector('[data-go]'));
  ok(cdGone, 'racer starts after tap');
  // رانندگی: بیشتر مستقیم برای دیدن جاده و پیچ
  for (let i = 0; i < 24; i++) {
    if (i % 6 < 4) { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(450); await page.keyboard.up('ArrowRight'); }
    else { await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(450); await page.keyboard.up('ArrowLeft'); }
    if (i === 11) await page.screenshot({ path: OUT + '/fix2-racer-mid.png' });
  }
  const rst = await page.evaluate(() => ({
    s: document.querySelector('[data-s]')?.textContent,
    t: document.querySelector('[data-t]')?.textContent,
    v: document.querySelector('[data-v]')?.textContent,
  }));
  console.log('  (racer hud=' + JSON.stringify(rst) + ')');
  await page.screenshot({ path: OUT + '/fix2-racer-end.png' });
  await page.click('[data-ag-exit]');
  await page.waitForTimeout(500);

  // ---- پک‌من: نمونه‌برداری موقعیت ----
  await page.click('[data-ag-open="pacman"]');
  await page.waitForTimeout(2500);
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  let wallHits = 0, samples = 0, moved = 0, lastX = -1, lastY = -1, dots0 = -1, dots1 = -1, lives0 = -1, lives1 = -1;
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press(keys[(Math.random() * 4) | 0]);
    await page.waitForTimeout(350);
    const p = await page.evaluate(() => window.__pacdbg ? window.__pacdbg() : null);
    if (!p) continue;
    samples++;
    if (i === 2) { dots0 = p.dots; lives0 = p.lives; }
    dots1 = p.dots; lives1 = p.lives;
    if (p.wall !== 0) wallHits++;
    if (Math.abs(p.x - lastX) + Math.abs(p.y - lastY) > 0.05) moved++;
    lastX = p.x; lastY = p.y;
    if (p.over) break;
  }
  console.log(`  (pacman samples=${samples} wallHits=${wallHits} moved=${moved} dots=${dots0}->${dots1} lives=${lives0}->${lives1})`);
  ok(wallHits === 0, `pacman never inside wall (${wallHits} hits)`);
  ok(moved > samples * 0.5, `pacman moves freely (${moved}/${samples})`);
  ok(dots1 < dots0, `pacman eats dots (${dots0}->${dots1})`);
  await page.screenshot({ path: OUT + '/fix2-pacman.png' });
  await page.click('[data-ag-exit]');

  console.log(`\n==== FAILS: ${fails.length} ====`);
  fails.forEach((f) => console.log('FAIL: ' + f));
  console.log(`==== ERRORS: ${errs.length} ====`);
  [...new Set(errs)].slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(fails.length || errs.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
